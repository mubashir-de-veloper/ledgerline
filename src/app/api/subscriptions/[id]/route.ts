import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOwner } from "@/lib/require-owner";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const ownerId = await requireOwner();
    const { id } = await ctx.params;
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.ownerId, ownerId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }
    const body = await req.json();
    const validStatuses = ["active", "paused", "cancelled", "trial"];
    const nextStatus = body.status;
    if (!validStatuses.includes(nextStatus)) {
      return NextResponse.json({ error: "Pick a valid status." }, { status: 400 });
    }
    const [updated] = await db
      .update(subscriptions)
      .set({ status: nextStatus })
      .where(eq(subscriptions.id, id))
      .returning();
    return NextResponse.json({ subscription: updated });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't update the subscription." }, { status: 500 });
  }
}
