import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { clients, invoices, subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireOwner } from "@/lib/require-owner";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ownerId = await requireOwner();
    const list = await db
      .select()
      .from(clients)
      .where(eq(clients.ownerId, ownerId))
      .orderBy(desc(clients.createdAt));
    return NextResponse.json({ clients: list });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't load clients." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ownerId = await requireOwner();
    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    if (!name || !email) {
      return NextResponse.json(
        { error: "A name and email are required." },
        { status: 400 },
      );
    }
    const [created] = await db
      .insert(clients)
      .values({
        ownerId,
        name,
        email,
        company: body.company?.trim() || null,
        address: body.address?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .returning();
    return NextResponse.json({ client: created });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't save the client." }, { status: 500 });
  }
}
