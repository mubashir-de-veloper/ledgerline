import { db } from "@/db";
import { invoices, invoiceItems, clients, payments, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateLong } from "@/lib/format";
import { Chip, Hairline } from "@/components/ui";
import { InvoiceActions } from "./actions";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const ownerId = session.userId;
  const { id } = await params;

  // Reject malformed UUIDs before querying PostgreSQL.
  const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
  notFound();
  }

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.ownerId, ownerId)))
    .limit(1);
  if (!invoice) notFound();

  const [client] = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));
  const invoicePayments = await db.select().from(payments).where(eq(payments.invoiceId, invoice.id));
  const [owner] = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);

  const total = parseFloat(invoice.total);
  const paid = parseFloat(invoice.paidAmount);
  const remaining = +(total - paid).toFixed(2);

  const statusTone: "success" | "signal" | "accent" | "muted" | "ink" =
    invoice.status === "paid"
      ? "success"
      : invoice.status === "overdue"
        ? "signal"
        : invoice.status === "void"
          ? "muted"
          : "accent";

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/invoices" className="label text-ink-muted hover:text-ink">
          ← Invoices
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="label eyebrow text-accent">{invoice.number}</div>
          <h1
            className="mt-4 text-[clamp(1.8rem,4vw,2.6rem)] tracking-[-0.03em] leading-[1]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
          >
            Invoice for {client?.name || "—"}.
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <Chip tone={statusTone}>{invoice.status}</Chip>
            <span className="text-[14px] text-ink-muted">
              Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
            </span>
          </div>
        </div>
        <InvoiceActions
          invoiceId={invoice.id}
          status={invoice.status}
          remaining={remaining}
        />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice document */}
        <div className="lg:col-span-2 card-quiet">
          <div className="grid grid-cols-2 gap-8 pb-6 border-b border-line">
            <div>
              <div className="label text-ink-muted">From</div>
              <div className="mt-2 text-[15px] font-semibold">{owner?.companyName}</div>
              <div className="text-[13px] text-ink-muted">{owner?.email}</div>
            </div>
            <div>
              <div className="label text-ink-muted">Bill to</div>
              <div className="mt-2 text-[15px] font-semibold">{client?.name}</div>
              {client?.company ? (
                <div className="text-[13px] text-ink-muted">{client.company}</div>
              ) : null}
              <div className="text-[13px] text-ink-muted">{client?.email}</div>
              {client?.address ? (
                <div className="text-[12px] text-ink-muted mt-1">{client.address}</div>
              ) : null}
            </div>
          </div>

          <table className="w-full text-left mt-6">
            <thead>
              <tr className="border-b border-line text-[11px] label text-ink-muted">
                <th className="py-3">Description</th>
                <th className="py-3 text-right">Qty</th>
                <th className="py-3 text-right">Unit</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-line last:border-0">
                  <td className="py-4 text-[15px]">{it.description}</td>
                  <td className="py-4 text-right font-mono text-[14px]">
                    {parseFloat(it.quantity).toFixed(2)}
                  </td>
                  <td className="py-4 text-right font-mono text-[14px]">
                    {formatCurrency(it.unitPrice)}
                  </td>
                  <td className="py-4 text-right font-mono text-[14px]">
                    {formatCurrency(it.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 max-w-[320px] ml-auto space-y-2">
            <div className="flex justify-between text-[14px]">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-ink-muted">
                Tax ({parseFloat(invoice.taxRate)}%)
              </span>
              <span className="font-mono">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            <Hairline />
            <div className="flex justify-between text-[18px] font-semibold">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-[14px] text-ink-muted">
              <span>Paid</span>
              <span className="font-mono">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div
              className="flex justify-between text-[16px] font-semibold"
              style={{ color: remaining > 0 ? "var(--color-signal)" : "var(--color-success)" }}
            >
              <span>{remaining > 0 ? "Remaining" : "Settled"}</span>
              <span className="font-mono">
                {formatCurrency(Math.max(0, remaining))}
              </span>
            </div>
          </div>

          {invoice.notes ? (
            <div className="mt-8 pt-6 border-t border-line">
              <div className="label text-ink-muted">Notes</div>
              <p className="mt-2 text-[15px] leading-[1.6] max-w-[65ch]">
                {invoice.notes}
              </p>
            </div>
          ) : null}
        </div>

        {/* Side: payments + activity */}
        <div className="space-y-6">
          <div className="card-quiet">
            <div className="label text-ink-muted mb-4">Payments recorded</div>
            {invoicePayments.length === 0 ? (
              <div className="text-[14px] text-ink-muted">
                No payments yet. Use "Record payment" to log one.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {invoicePayments.map((p) => (
                  <li key={p.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[14px]">
                        {formatCurrency(p.amount)}
                      </span>
                      <span className="text-[12px] text-ink-muted">
                        {formatDate(p.recordedAt)}
                      </span>
                    </div>
                    <div className="text-[12px] text-ink-muted mt-1 font-mono">
                      {p.reference} · {p.method}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-quiet">
            <div className="label text-ink-muted mb-3">Illustrative data</div>
            <p className="text-[14px] text-ink-muted leading-[1.6]">
              Every payment recorded here is simulated. No card data is stored
              and no external payment processor is contacted.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
