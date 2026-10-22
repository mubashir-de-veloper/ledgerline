import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, invoices, clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireOwner } from "@/lib/require-owner";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ownerId = await requireOwner();
    const list = await db
      .select({
        payment: payments,
        invoice: { id: invoices.id, number: invoices.number },
        client: { id: clients.id, name: clients.name, company: clients.company },
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(payments.ownerId, ownerId))
      .orderBy(desc(payments.recordedAt));
    return NextResponse.json({ payments: list });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't load payments." }, { status: 500 });
  }
}
