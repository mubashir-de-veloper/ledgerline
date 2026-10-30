
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import {
  invoices,
  invoiceItems,
  clients,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireOwner } from "@/lib/require-owner";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ownerId = await requireOwner();

    const list = await db
      .select({
        invoice: invoices,
        client: {
          id: clients.id,
          name: clients.name,
          company: clients.company,
        },
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.ownerId, ownerId))
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json({ invoices: list });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json(
      { error: "Couldn't load invoices." },
      { status: 500 },
    );
  }
}

function nextInvoiceNumber(year: number, seq: number): string {
  return `INV-${year}-${String(seq).padStart(3, "0")}`;
}

type InvoiceItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export async function POST(req: NextRequest) {
  try {
    const ownerId = await requireOwner();

    // Parse the request body safely.
    let parsedBody: unknown;

    try {
      parsedBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (
      !parsedBody ||
      typeof parsedBody !== "object" ||
      Array.isArray(parsedBody)
    ) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 },
      );
    }

    const body = parsedBody as Record<string, unknown>;

    // Validate the client and confirm ownership.
    const clientId = body.clientId;

    if (typeof clientId !== "string" || !clientId.trim()) {
      return NextResponse.json(
        { error: "Pick a valid client." },
        { status: 400 },
      );
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.ownerId, ownerId),
        ),
      )
      .limit(1);

    if (!client) {
      return NextResponse.json(
        { error: "That client doesn't belong to you." },
        { status: 400 },
      );
    }

    // Validate line items before calculating invoice totals.
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Add at least one line item." },
        { status: 400 },
      );
    }

    const items: InvoiceItemInput[] = [];

    for (const item of body.items) {
      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
      ) {
        return NextResponse.json(
          { error: "Each line item must be an object." },
          { status: 400 },
        );
      }

      const record = item as Record<string, unknown>;
      const description = record.description;
      const quantityInput = record.quantity;
      const unitPriceInput = record.unitPrice;

      if (
        typeof description !== "string" ||
        !description.trim()
      ) {
        return NextResponse.json(
          { error: "Every item needs a description." },
          { status: 400 },
        );
      }

      if (
        (typeof quantityInput !== "string" &&
          typeof quantityInput !== "number") ||
        (typeof unitPriceInput !== "string" &&
          typeof unitPriceInput !== "number")
      ) {
        return NextResponse.json(
          { error: "Quantities and prices must be numbers." },
          { status: 400 },
        );
      }

      const quantity = Number(quantityInput);
      const unitPrice = Number(unitPriceInput);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        return NextResponse.json(
          {
            error:
              "Item quantities must be positive, and prices can't be negative.",
          },
          { status: 400 },
        );
      }

      items.push({
        description: description.trim(),
        quantity,
        unitPrice,
      });
    }

    // Validate tax rate.
    const taxRateInput = body.taxRate ?? "0";

    if (
      typeof taxRateInput !== "string" &&
      typeof taxRateInput !== "number"
    ) {
      return NextResponse.json(
        { error: "Tax rate must be a number between 0 and 100." },
        { status: 400 },
      );
    }

    const taxRate = Number(taxRateInput);

    if (
      !Number.isFinite(taxRate) ||
      taxRate < 0 ||
      taxRate > 100
    ) {
      return NextResponse.json(
        { error: "Tax rate must be 0–100." },
        { status: 400 },
      );
    }

    // Calculate all monetary totals on the server.
    const subtotal = items.reduce(
      (sum, item) =>
        sum + item.quantity * item.unitPrice,
      0,
    );

    const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);

    if (!Number.isFinite(subtotal) || !Number.isFinite(total)) {
      return NextResponse.json(
        { error: "Invoice amounts are outside the supported range." },
        { status: 400 },
      );
    }

    // Validate dates.
    const issueDateInput = body.issueDate;
    const dueDateInput = body.dueDate;

    if (
      (issueDateInput != null &&
        typeof issueDateInput !== "string") ||
      (dueDateInput != null &&
        typeof dueDateInput !== "string")
    ) {
      return NextResponse.json(
        { error: "Invoice dates must be valid date strings." },
        { status: 400 },
      );
    }

    const issueDate = issueDateInput
      ? new Date(issueDateInput)
      : new Date();

    const dueDate = dueDateInput
      ? new Date(dueDateInput)
      : new Date(
          issueDate.getTime() + 14 * 24 * 60 * 60 * 1000,
        );

    if (
      !Number.isFinite(issueDate.getTime()) ||
      !Number.isFinite(dueDate.getTime())
    ) {
      return NextResponse.json(
        { error: "Please provide valid invoice dates." },
        { status: 400 },
      );
    }

    // Notes must be a string when supplied.
    if (body.notes != null && typeof body.notes !== "string") {
      return NextResponse.json(
        { error: "Invoice notes must be text." },
        { status: 400 },
      );
    }

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim() || null
        : null;

    // Generate the next invoice number for this owner and year.
    const year = issueDate.getFullYear();
    const prefix = `INV-${year}-`;

    const latest = await db
      .select({ number: invoices.number })
      .from(invoices)
      .where(
        and(
          eq(invoices.ownerId, ownerId),
          sql`${invoices.number} LIKE ${prefix + "%"}`,
        ),
      )
      .orderBy(desc(invoices.number))
      .limit(1);

    let seq = 1;

    if (latest[0]) {
      const lastSeq = parseInt(
        latest[0].number.replace(prefix, ""),
        10,
      );

      if (Number.isFinite(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    // Save the invoice and its line items together.
    return await db.transaction(async (tx) => {
      const [inv] = await tx
        .insert(invoices)
        .values({
          ownerId,
          clientId,
          number: nextInvoiceNumber(year, seq),
          status: "draft",
          issueDate,
          dueDate,
          subtotal: subtotal.toFixed(2),
          taxRate: taxRate.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),
          paidAmount: "0.00",
          notes,
        })
        .returning();

      await tx.insert(invoiceItems).values(
        items.map((item) => ({
          invoiceId: inv.id,
          description: item.description,
          quantity: item.quantity.toFixed(2),
          unitPrice: item.unitPrice.toFixed(2),
          amount: (
            item.quantity * item.unitPrice
          ).toFixed(2),
        })),
      );

      return NextResponse.json({ invoice: inv });
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);

    return NextResponse.json(
      { error: "Couldn't create the invoice." },
      { status: 500 },
    );
  }
}
