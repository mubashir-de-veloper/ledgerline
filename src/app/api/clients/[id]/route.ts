import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { clients, invoices, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireOwner } from "@/lib/require-owner";

export const runtime = "nodejs";

async function ownedClient(ownerId: string, id: string) {
  const [row] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.ownerId, ownerId)))
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
    const row = await ownedClient(ownerId, id);
    if (!row) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    const clientInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, row.id));
    const clientSubs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.clientId, row.id));
    return NextResponse.json({ client: row, invoices: clientInvoices, subscriptions: clientSubs });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't load client." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const ownerId = await requireOwner();
    const { id } = await ctx.params;
    const existing = await ownedClient(ownerId, id);
    if (!existing) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    const body = await req.json();
    const [updated] = await db
      .update(clients)
      .set({
        name: (body.name ?? existing.name).trim(),
        email: (body.email ?? existing.email).trim(),
        company: body.company?.trim() || null,
        address: body.address?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .where(eq(clients.id, id))
      .returning();
    return NextResponse.json({ client: updated });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't save changes." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const ownerId = await requireOwner();
    const { id } = await ctx.params;
    const existing = await ownedClient(ownerId, id);
    if (!existing) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    // Check for related invoices or subscriptions.
    const [hasInvoices] = await db
      .select({ c: invoices.id })
      .from(invoices)
      .where(eq(invoices.clientId, id))
      .limit(1);
    const [hasSubs] = await db
      .select({ c: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.clientId, id))
      .limit(1);
    if (hasInvoices || hasSubs) {
      return NextResponse.json(
        {
          error:
            "This client has invoices or subscriptions. Archive those first, then remove the client.",
        },
        { status: 409 },
      );
    }
    await db.delete(clients).where(eq(clients.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Couldn't remove the client." }, { status: 500 });
  }
}
