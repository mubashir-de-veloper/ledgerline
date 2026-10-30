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

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    // Validate client ID
    if (
      typeof input.clientId !== "string" ||
      !input.clientId.trim()
    ) {
      return NextResponse.json(
        { error: "Pick a client from your workspace." },
        { status: 400 },
      );
    }

    const clientId = input.clientId.trim();

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
        { error: "Pick a client from your workspace." },
        { status: 400 },
      );
    }

    // Validate plan name
    if (typeof input.planName !== "string") {
      return NextResponse.json(
        { error: "A plan name is required." },
        { status: 400 },
      );
    }

    const planName = input.planName.trim();

    if (!planName) {
      return NextResponse.json(
        { error: "A plan name is required." },
        { status: 400 },
      );
    }

    // Validate amount
    const amount =
      typeof input.amount === "number" ||
      typeof input.amount === "string"
        ? Number(input.amount)
        : Number.NaN;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number." },
        { status: 400 },
      );
    }

    // Validate billing interval against the database enum
    const allowedIntervals = [
      "monthly",
      "quarterly",
      "yearly",
    ] as const;

    if (
      input.interval !== undefined &&
      (typeof input.interval !== "string" ||
        !allowedIntervals.includes(
          input.interval as (typeof allowedIntervals)[number],
        ))
    ) {
      return NextResponse.json(
        { error: "Pick a valid billing interval." },
        { status: 400 },
      );
    }

    const interval: (typeof allowedIntervals)[number] =
      typeof input.interval === "string" &&
      allowedIntervals.includes(
        input.interval as (typeof allowedIntervals)[number],
      )
        ? (input.interval as (typeof allowedIntervals)[number])
        : "monthly";

    // Validate next billing date
    const nextBillingDate =
      typeof input.nextBillingDate === "string" &&
      input.nextBillingDate.trim()
        ? new Date(input.nextBillingDate)
        : null;

    if (
      !nextBillingDate ||
      Number.isNaN(nextBillingDate.getTime())
    ) {
      return NextResponse.json(
        { error: "Pick a valid next billing date." },
        { status: 400 },
      );
    }

    // Validate subscription status against the database enum
    const allowedStatuses = [
      "active",
      "trial",
      "paused",
      "cancelled",
    ] as const;

    if (
      input.status !== undefined &&
      (typeof input.status !== "string" ||
        !allowedStatuses.includes(
          input.status as (typeof allowedStatuses)[number],
        ))
    ) {
      return NextResponse.json(
        { error: "Pick a valid subscription status." },
        { status: 400 },
      );
    }

    const status: (typeof allowedStatuses)[number] =
      typeof input.status === "string" &&
      allowedStatuses.includes(
        input.status as (typeof allowedStatuses)[number],
      )
        ? (input.status as (typeof allowedStatuses)[number])
        : "active";

    // Insert only after all validation succeeds
    const [created] = await db
      .insert(subscriptions)
      .values({
        ownerId,
        clientId,
        planName,
        amount: amount.toFixed(2),
        interval,
        status,
        nextBillingDate,
      })
      .returning();

    return NextResponse.json({ subscription: created });
  } catch (err) {
    if (err instanceof Response) return err;

    console.error(err);

    return NextResponse.json(
      { error: "Couldn't save the subscription." },
      { status: 500 },
    );
  }
}
