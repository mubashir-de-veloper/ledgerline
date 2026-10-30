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
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

        if (
      typeof input.name !== "string" ||
      typeof input.email !== "string"
    ) {
      return NextResponse.json(
        { error: "Name and email must be text values." },
        { status: 400 },
      );
    }

    const name = input.name.trim();
    const email = input.email.trim();
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
        company:
          typeof input.company === "string" ? input.company.trim() || null : null,
        address:
          typeof input.address === "string" ? input.address.trim() || null : null,
        notes:
          typeof input.notes === "string" ? input.notes.trim() || null : null,
      })
      .returning();
    return NextResponse.json({ client: created });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't save the client." }, { status: 500 });
  }
}
