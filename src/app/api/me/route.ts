import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  clients,
  invoices,
  payments,
  subscriptions,
  users,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

/** Helper: returns the signed-in owner's ID, or null. */
async function requireOwnerOrNull(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

export async function GET() {
  try {
    const ownerId = await requireOwnerOrNull();
    if (!ownerId) {
      return NextResponse.json(
        { error: "Please sign in to continue." },
        { status: 401 },
      );
    }

    const [owner] = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);

    const clientList = await db
      .select()
      .from(clients)
      .where(eq(clients.ownerId, ownerId))
      .orderBy(desc(clients.createdAt));

    const invoiceList = await db
      .select()
      .from(invoices)
      .where(eq(invoices.ownerId, ownerId))
      .orderBy(desc(invoices.createdAt));

    const subscriptionList = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.ownerId, ownerId))
      .orderBy(desc(subscriptions.createdAt));

    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.ownerId, ownerId))
      .orderBy(desc(payments.recordedAt));

    return NextResponse.json({
      owner,
      clients: clientList,
      invoices: invoiceList,
      subscriptions: subscriptionList,
      payments: paymentList,
    });
  } catch (err) {
    console.error("me GET error", err);
    return NextResponse.json(
      { error: "Couldn't load your workspace." },
      { status: 500 },
    );
  }
}
