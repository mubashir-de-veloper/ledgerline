import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import {
  invoices,
  invoiceItems,
  clients,
  payments,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOwner } from "@/lib/require-owner";
import { randomReference } from "@/lib/auth";
import { users } from "@/db/schema";

export const runtime = "nodejs";

async function ownedInvoice(ownerId: string, id: string) {
  const [row] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.ownerId, ownerId)))
    .limit(1);
  return row;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const ownerId = await requireOwner();
    const { id } = await ctx.params;
    const inv = await ownedInvoice(ownerId, id);
    if (!inv) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }
    const [client] = await db.select().from(clients).where(eq(clients.id, inv.clientId)).limit(1);
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
    const invoicePayments = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, inv.id));
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, ownerId))
      .limit(1);
    return NextResponse.json({ invoice: inv, client, items, payments: invoicePayments, owner });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't load the invoice." }, { status: 500 });
  }
}

/** Mark an invoice sent (draft → sent). */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const ownerId = await requireOwner();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    const inv = await ownedInvoice(ownerId, id);
    if (!inv) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

    if (action === "send") {
      if (inv.status !== "draft") {
        return NextResponse.json(
          { error: "Only draft invoices can be sent." },
          { status: 409 },
        );
      }
      const [updated] = await db
        .update(invoices)
        .set({ status: "sent", updatedAt: new Date() })
        .where(eq(invoices.id, id))
        .returning();
      return NextResponse.json({ invoice: updated });
    }

    if (action === "void") {
      if (inv.status === "paid") {
        return NextResponse.json(
          { error: "Paid invoices can't be voided." },
          { status: 409 },
        );
      }
      const [updated] = await db
        .update(invoices)
        .set({ status: "void", updatedAt: new Date() })
        .where(eq(invoices.id, id))
        .returning();
      return NextResponse.json({ invoice: updated });
    }

    if (action === "pay") {
      if (inv.status === "paid" || inv.status === "void") {
        return NextResponse.json(
          { error: "This invoice can't take a new payment." },
          { status: 409 },
        );
      }
      const total = parseFloat(inv.total);
      const paidSoFar = parseFloat(inv.paidAmount);
      const remaining = +(total - paidSoFar).toFixed(2);
      const amount = parseFloat(body.amount ?? String(remaining));
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json(
          { error: "Enter a positive amount to record." },
          { status: 400 },
        );
      }
      if (amount > remaining + 0.01) {
        return NextResponse.json(
          { error: "That's more than the remaining balance." },
          { status: 400 },
        );
      }
      const method = body.method || "mock_card";
      const reference = body.reference || randomReference("mock_txn");

      return await db.transaction(async (tx) => {
        const [payment] = await tx
          .insert(payments)
          .values({
            ownerId,
            invoiceId: inv.id,
            amount: amount.toFixed(2),
            method,
            reference,
            simulated: true,
          })
          .returning();

        const newPaid = +(paidSoFar + amount).toFixed(2);
        const nextStatus = newPaid >= total - 0.005 ? "paid" : inv.status;
        const [updated] = await tx
          .update(invoices)
          .set({
            paidAmount: newPaid.toFixed(2),
            status: nextStatus,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, inv.id))
          .returning();
        return NextResponse.json({ payment, invoice: updated });
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't update the invoice." }, { status: 500 });
  }
}
