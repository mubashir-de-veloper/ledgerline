import { SectionHead, EmptyState, Chip } from "@/components/ui";
import { db } from "@/db";
import { payments, invoices, clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ownerId = session.userId;

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

  return (
    <>
      <SectionHead
        eyebrow="Payments"
        title="Every payment, recorded."
        lede="A timeline of all the payments recorded against your invoices. Each one is simulated — no real money moves here."
      />

      {list.length === 0 ? (
        <div className="mt-14">
          <EmptyState
            eyebrow="No payments"
            title="Payments will appear here."
            description="When you record a payment on an invoice, it shows up in this timeline with the amount, method, and reference."
          />
        </div>
      ) : (
        <div className="mt-14 card-quiet overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-line text-[12px] label text-ink-muted">
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr
                  key={row.payment.id}
                  className="border-b border-line last:border-0 row-hover"
                >
                  <td className="py-4 px-4">
                    <Link
                      href={`/invoices/${row.invoice?.id}`}
                      className="text-[15px] font-semibold hover:underline font-mono"
                    >
                      {row.invoice?.number || "—"}
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-[15px]">
                    {row.client?.name || "—"}
                  </td>
                  <td className="py-4 px-4 font-mono text-[14px]">
                    {formatCurrency(row.payment.amount)}
                  </td>
                  <td className="py-4 px-4 text-[14px] capitalize">
                    {row.payment.method.replace(/_/g, " ")}
                  </td>
                  <td className="py-4 px-4 font-mono text-[12px] text-ink-muted">
                    {row.payment.reference}
                  </td>
                  <td className="py-4 px-4 text-[13px] text-ink-muted">
                    {formatDate(row.payment.recordedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 card-quiet max-w-[600px]">
        <div className="label text-ink-muted mb-3">About this page</div>
        <p className="text-[15px] text-ink-muted leading-[1.6]">
          Every payment in Ledgerline is simulated. No card data is stored, no
          external payment processor is contacted, and no real money moves.
          Stripe test mode integration is documented as a stretch goal on the
          audit page.
        </p>
      </div>
    </>
  );
}
