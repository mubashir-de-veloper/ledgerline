import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import {
  invoices,
  invoiceItems,
  clients,
  payments,
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
        client: { id: clients.id, name: clients.name, company: clients.company },
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.ownerId, ownerId))
      .orderBy(desc(invoices.createdAt));
    return NextResponse.json({ invoices: list });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't load invoices." }, { status: 500 });
  }
}

function nextInvoiceNumber(year: number, seq: number): string {
  return `INV-${year}-${String(seq).padStart(3, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const ownerId = await requireOwner();
    const body = await req.json();
    const clientId = body.clientId;
    if (!clientId) {
      return NextResponse.json({ error: "Pick a client." }, { status: 400 });
    }
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.ownerId, ownerId)))
      .limit(1);
    if (!client) {
      return NextResponse.json({ error: "That client doesn't belong to you." }, { status: 400 });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "Add at least one line item." }, { status: 400 });
    }
    for (const it of items) {
      if (!it.description?.trim()) {
        return NextResponse.json({ error: "Every item needs a description." }, { status: 400 });
      }
      const qty = parseFloat(it.quantity);
      const unit = parseFloat(it.unitPrice);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unit) || unit < 0) {
        return NextResponse.json(
          { error: "Item quantities must be positive, and prices can't be negative." },
          { status: 400 },
        );
      }
    }

    const taxRate = parseFloat(body.taxRate ?? "0");
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      return NextResponse.json({ error: "Tax rate must be 0–100." }, { status: 400 });
    }

    const subtotal = items.reduce(
      (sum: number, it: { quantity: number | string; unitPrice: number | string }) =>
        sum + parseFloat(String(it.quantity)) * parseFloat(String(it.unitPrice)),
      0,
    );
    const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);

    const issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
    const dueDate = body.dueDate
      ? new Date(body.dueDate)
      : new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Pick next invoice number scoped to this owner.
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
      const lastSeq = parseInt(latest[0].number.replace(prefix, ""), 10);
      if (Number.isFinite(lastSeq)) seq = lastSeq + 1;
    }

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
          notes: body.notes?.trim() || null,
        })
        .returning();

      if (items.length) {
        await tx.insert(invoiceItems).values(
          items.map((it: { description: string; quantity: number | string; unitPrice: number | string }) => {
            const q = parseFloat(String(it.quantity));
            const u = parseFloat(String(it.unitPrice));
            return {
              invoiceId: inv.id,
              description: it.description.trim(),
              quantity: q.toFixed(2),
              unitPrice: u.toFixed(2),
              amount: (q * u).toFixed(2),
            };
          }),
        );
      }

      return NextResponse.json({ invoice: inv });
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't create the invoice." }, { status: 500 });
  }
}
