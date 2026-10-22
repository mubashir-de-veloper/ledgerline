import { db } from "@/db";
import { clients, invoices, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { Chip, Hairline } from "@/components/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const ownerId = session.userId;
  const { id } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.ownerId, ownerId)))
    .limit(1);

  if (!client) notFound();

  const clientInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, client.id));

  const clientSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.clientId, client.id));

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/clients" className="label text-ink-muted hover:text-ink">
          ← Clients
        </Link>
      </div>
      <h1
        className="text-[clamp(2rem,4vw,2.8rem)] tracking-[-0.03em] leading-[1]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
      >
        {client.name}.
      </h1>
      <div className="mt-4 text-ink-muted text-[16px]">
        {client.company ? `${client.company} · ` : ""}
        {client.email}
      </div>
      {client.address ? (
        <div className="mt-2 text-ink-muted text-[14px]">{client.address}</div>
      ) : null}
      {client.notes ? (
        <div className="mt-4 card-quiet max-w-[600px] text-[15px] text-ink-muted">
          {client.notes}
        </div>
      ) : null}

      <Hairline className="my-10" />

      <div>
        <h2
          className="text-[1.5rem] tracking-[-0.02em] mb-6"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          Invoices ({clientInvoices.length}).
        </h2>
        {clientInvoices.length === 0 ? (
          <div className="card-quiet text-center py-10 text-ink-muted">
            No invoices for this client yet.
          </div>
        ) : (
          <div className="card-quiet divide-y divide-line">
            {clientInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between py-4 hover:bg-canvas-sunken px-2 -mx-2 rounded transition-colors"
              >
                <div>
                  <div className="text-[15px] font-semibold">{inv.number}</div>
                  <div className="text-[13px] text-ink-muted">
                    Issued {formatDate(inv.issueDate)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[14px]">
                    {formatCurrency(inv.total)}
                  </span>
                  <Chip
                    tone={
                      inv.status === "paid"
                        ? "success"
                        : inv.status === "overdue"
                          ? "signal"
                          : "accent"
                    }
                  >
                    {inv.status}
                  </Chip>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Hairline className="my-10" />

      <div>
        <h2
          className="text-[1.5rem] tracking-[-0.02em] mb-6"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          Subscriptions ({clientSubs.length}).
        </h2>
        {clientSubs.length === 0 ? (
          <div className="card-quiet text-center py-10 text-ink-muted">
            No subscriptions for this client.
          </div>
        ) : (
          <div className="card-quiet divide-y divide-line">
            {clientSubs.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <div className="text-[15px] font-semibold">{sub.planName}</div>
                  <div className="text-[13px] text-ink-muted">
                    {sub.interval} · next {formatDate(sub.nextBillingDate)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[14px]">
                    {formatCurrency(sub.amount)}
                  </span>
                  <Chip tone={sub.status === "active" ? "success" : "muted"}>
                    {sub.status}
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
