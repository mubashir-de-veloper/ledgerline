import { AppShell } from "@/components/shell";
import { SectionHead, Stat, Hairline } from "@/components/ui";
import { db } from "@/db";
import { invoices, subscriptions, clients, payments } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, relativeTime } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ownerId = session.userId;

  const [stats] = await db
    .select({
      totalInvoices: sql<number>`count(${invoices.id})`,
      paidInvoices: sql<number>`count(${invoices.id}) filter (where ${invoices.status} = 'paid')`,
      outstanding: sql<string>`coalesce(sum(case when ${invoices.status} in ('sent', 'overdue') then ${invoices.total}::numeric - ${invoices.paidAmount}::numeric else 0 end), 0)`,
      overdue: sql<number>`count(${invoices.id}) filter (where ${invoices.status} = 'overdue')`,
    })
    .from(invoices)
    .where(eq(invoices.ownerId, ownerId));

  const [subStats] = await db
    .select({
      active: sql<number>`count(${subscriptions.id}) filter (where ${subscriptions.status} = 'active')`,
      mrr: sql<string>`coalesce(sum(case when ${subscriptions.status} = 'active' and ${subscriptions.interval} = 'monthly' then ${subscriptions.amount}::numeric else 0 end), 0)`,
    })
    .from(subscriptions)
    .where(eq(subscriptions.ownerId, ownerId));

  const recentInvoices = await db
    .select({
      invoice: invoices,
      client: { name: clients.name },
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.ownerId, ownerId))
    .orderBy(desc(invoices.createdAt))
    .limit(5);

  const upcomingRenewals = await db
    .select({
      subscription: subscriptions,
      client: { name: clients.name },
    })
    .from(subscriptions)
    .leftJoin(clients, eq(subscriptions.clientId, clients.id))
    .where(
      and(
        eq(subscriptions.ownerId, ownerId),
        eq(subscriptions.status, "active"),
      ),
    )
    .orderBy(subscriptions.nextBillingDate)
    .limit(4);

  const outstandingNum = parseFloat(stats?.outstanding || "0");
  const mrrNum = parseFloat(subStats?.mrr || "0");

  return (
    <>
      <SectionHead
        eyebrow="Dashboard"
        title="Your workspace, at a glance."
        lede="A quick view of outstanding invoices, active subscriptions, and recent activity."
      />

      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat
          label="Outstanding"
          value={formatCurrency(outstandingNum)}
          sub={`${stats?.totalInvoices || 0} total invoices`}
          index="01"
        />
        <Stat
          label="Paid"
          value={String(stats?.paidInvoices || 0)}
          sub="Invoices marked paid"
          index="02"
        />
        <Stat
          label="Overdue"
          value={String(stats?.overdue || 0)}
          sub="Past due date"
          index="03"
        />
        <Stat
          label="MRR"
          value={formatCurrency(mrrNum)}
          sub={`${subStats?.active || 0} active subscriptions`}
          index="04"
        />
      </div>

      <Hairline className="my-14" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-[1.5rem] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Recent invoices.
            </h2>
            <Link href="/invoices" className="label text-accent hover:underline">
              See all →
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="card-quiet text-center py-12 text-ink-muted">
              No invoices yet.
            </div>
          ) : (
            <div className="card-quiet divide-y divide-line">
              {recentInvoices.map((row, i) => (
                <Link
                  key={row.invoice.id}
                  href={`/invoices/${row.invoice.id}`}
                  className="flex items-center justify-between py-4 hover:bg-canvas-sunken px-2 -mx-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="text-[15px] font-semibold">
                        {row.invoice.number}
                      </div>
                      <div className="text-[13px] text-ink-muted">
                        {row.client?.name || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[14px]">
                      {formatCurrency(row.invoice.total)}
                    </div>
                    <div className="text-[12px] text-ink-muted">
                      {row.invoice.status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-[1.5rem] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Upcoming renewals.
            </h2>
            <Link href="/subscriptions" className="label text-accent hover:underline">
              See all →
            </Link>
          </div>
          {upcomingRenewals.length === 0 ? (
            <div className="card-quiet text-center py-12 text-ink-muted">
              No active subscriptions.
            </div>
          ) : (
            <div className="card-quiet divide-y divide-line">
              {upcomingRenewals.map((row, i) => (
                <div key={row.subscription.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="text-[15px] font-semibold">
                        {row.subscription.planName}
                      </div>
                      <div className="text-[13px] text-ink-muted">
                        {row.client?.name || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[14px]">
                      {formatCurrency(row.subscription.amount)}
                    </div>
                    <div className="text-[12px] text-ink-muted">
                      {relativeTime(row.subscription.nextBillingDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
