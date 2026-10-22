import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { subscriptions, clients } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireOwner } from "@/lib/require-owner";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ownerId = await requireOwner();
    const list = await db
      .select({
        subscription: subscriptions,
        client: { id: clients.id, name: clients.name, company: clients.company },
      })
      .from(subscriptions)
      .leftJoin(clients, eq(subscriptions.clientId, clients.id))
      .where(eq(subscriptions.ownerId, ownerId))
      .orderBy(desc(subscriptions.createdAt));
    return NextResponse.json({ subscriptions: list });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't load subscriptions." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ownerId = await requireOwner();
    const body = await req.json();
    const clientId = body.clientId;
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.ownerId, ownerId)))
      .limit(1);
    if (!client) {
      return NextResponse.json({ error: "Pick a client from your workspace." }, { status: 400 });
    }
    const planName = (body.planName || "").trim();
    const amount = parseFloat(body.amount);
    const interval = body.interval || "monthly";
    const nextBillingDate = body.nextBillingDate ? new Date(body.nextBillingDate) : null;
    if (!planName) {
      return NextResponse.json({ error: "A plan name is required." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }
    if (!nextBillingDate || Number.isNaN(nextBillingDate.getTime())) {
      return NextResponse.json({ error: "Pick a valid next billing date." }, { status: 400 });
    }
    if (!["monthly", "quarterly", "yearly"].includes(interval)) {
      return NextResponse.json({ error: "Pick a valid billing interval." }, { status: 400 });
    }
    const [created] = await db
      .insert(subscriptions)
      .values({
        ownerId,
        clientId,
        planName,
        amount: amount.toFixed(2),
        interval,
        status: body.status || "active",
        nextBillingDate,
      })
      .returning();
    return NextResponse.json({ subscription: created });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't save the subscription." }, { status: 500 });
  }
}
