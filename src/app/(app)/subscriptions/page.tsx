import { SectionHead, EmptyState, LinkButton, Chip } from "@/components/ui";
import { db } from "@/db";
import { subscriptions, clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, relativeTime } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ownerId = session.userId;

  const list = await db
    .select({
      subscription: subscriptions,
      client: { id: clients.id, name: clients.name, company: clients.company },
    })
    .from(subscriptions)
    .leftJoin(clients, eq(subscriptions.clientId, clients.id))
    .where(eq(subscriptions.ownerId, ownerId))
    .orderBy(desc(subscriptions.createdAt));

  return (
    <>
      <SectionHead
        eyebrow="Subscriptions"
        title="Recurring revenue, tracked."
        lede="Monthly, quarterly, or yearly plans. Know what renews next and pause or cancel when you need to."
        action={
          <LinkButton href="/subscriptions/new">New subscription</LinkButton>
        }
      />

      {list.length === 0 ? (
        <div className="mt-14">
          <EmptyState
            eyebrow="No subscriptions"
            title="Start tracking recurring work."
            description="Retainers, hosting, maintenance — anything that bills on a schedule belongs here."
            primary={
              <LinkButton href="/subscriptions/new">New subscription</LinkButton>
            }
          />
        </div>
      ) : (
        <div className="mt-14 card-quiet overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-line text-[12px] label text-ink-muted">
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Interval</th>
                <th className="py-3 px-4">Next billing</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const statusTone: "success" | "signal" | "accent" | "muted" | "ink" =
                  row.subscription.status === "active"
                    ? "success"
                    : row.subscription.status === "trial"
                      ? "accent"
                      : row.subscription.status === "paused"
                        ? "muted"
                        : "muted";
                return (
                  <tr
                    key={row.subscription.id}
                    className="border-b border-line last:border-0 row-hover"
                  >
                    <td className="py-4 px-4">
                      <div className="text-[15px] font-semibold">
                        {row.subscription.planName}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/clients/${row.client?.id}`}
                        className="text-[15px] hover:underline"
                      >
                        {row.client?.name || "—"}
                      </Link>
                      {row.client?.company ? (
                        <div className="text-[12px] text-ink-muted">
                          {row.client.company}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-4 px-4 font-mono text-[14px]">
                      {formatCurrency(row.subscription.amount)}
                    </td>
                    <td className="py-4 px-4 text-[14px] capitalize">
                      {row.subscription.interval}
                    </td>
                    <td className="py-4 px-4 text-[13px] text-ink-muted">
                      {formatDate(row.subscription.nextBillingDate)}
                      <div className="text-[11px]">
                        {relativeTime(row.subscription.nextBillingDate)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Chip tone={statusTone}>{row.subscription.status}</Chip>
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
