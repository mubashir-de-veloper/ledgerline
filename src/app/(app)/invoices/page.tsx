import { SectionHead, EmptyState, LinkButton, Chip } from "@/components/ui";
import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ownerId = session.userId;

  const list = await db
    .select({
      invoice: invoices,
      client: { id: clients.id, name: clients.name, company: clients.company },
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.ownerId, ownerId))
    .orderBy(desc(invoices.createdAt));

  return (
    <>
      <SectionHead
        eyebrow="Invoices"
        title="Every bill you've sent."
        lede="Draft, send, record payments, and track what's outstanding. All the numbers are calculated from line items and tax."
        action={
          <LinkButton href="/invoices/new">New invoice</LinkButton>
        }
      />

      {list.length === 0 ? (
        <div className="mt-14">
          <EmptyState
            eyebrow="No invoices"
            title="Your first invoice is waiting."
            description="Pick a client, add a couple of line items, and send it. The status will move from draft to sent to paid as you record activity."
            primary={
              <LinkButton href="/invoices/new">New invoice</LinkButton>
            }
          />
        </div>
      ) : (
        <div className="mt-14 card-quiet overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-line text-[12px] label text-ink-muted">
                <th className="py-3 px-4">Number</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Issued</th>
                <th className="py-3 px-4">Due</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const total = parseFloat(row.invoice.total);
                const paid = parseFloat(row.invoice.paidAmount);
                const statusTone: "success" | "signal" | "accent" | "muted" | "ink" =
                  row.invoice.status === "paid"
                    ? "success"
                    : row.invoice.status === "overdue"
                      ? "signal"
                      : row.invoice.status === "void"
                        ? "muted"
                        : "accent";
                return (
                  <tr
                    key={row.invoice.id}
                    className="border-b border-line last:border-0 row-hover"
                  >
                    <td className="py-4 px-4">
                      <Link
                        href={`/invoices/${row.invoice.id}`}
                        className="text-[15px] font-semibold hover:underline font-mono"
                      >
                        {row.invoice.number}
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[15px]">{row.client?.name || "—"}</div>
                      {row.client?.company ? (
                        <div className="text-[12px] text-ink-muted">
                          {row.client.company}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-4 px-4 text-[13px] text-ink-muted">
                      {formatDate(row.invoice.issueDate)}
                    </td>
                    <td className="py-4 px-4 text-[13px] text-ink-muted">
                      {formatDate(row.invoice.dueDate)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[14px]">
                      {formatCurrency(total)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[14px] text-ink-muted">
                      {formatCurrency(paid)}
                    </td>
                    <td className="py-4 px-4">
                      <Chip tone={statusTone}>{row.invoice.status}</Chip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
