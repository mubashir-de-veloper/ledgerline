import { SectionHead, EmptyState, LinkButton, Hairline } from "@/components/ui";
import { db } from "@/db";
import { clients, invoices, subscriptions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const ownerId = session.userId;

  const list = await db
    .select({
      client: clients,
      invoiceCount: sql<number>`count(${invoices.id})`,
      subCount: sql<number>`count(${subscriptions.id})`,
    })
    .from(clients)
    .leftJoin(invoices, eq(clients.id, invoices.clientId))
    .leftJoin(subscriptions, eq(clients.id, subscriptions.clientId))
    .where(eq(clients.ownerId, ownerId))
    .groupBy(clients.id)
    .orderBy(desc(clients.createdAt));

  return (
    <>
      <SectionHead
        eyebrow="Clients"
        title="Everyone you work with."
        lede="A directory of your clients, with quick links to their invoices and subscriptions."
        action={
          <LinkButton href="/clients/new">Add client</LinkButton>
        }
      />

      {list.length === 0 ? (
        <div className="mt-14">
          <EmptyState
            eyebrow="No clients yet"
            title="Add your first client."
            description="Clients are the people and companies you invoice. Start with one and add more as you go."
            primary={
              <LinkButton href="/clients/new">Add client</LinkButton>
            }
          />
        </div>
      ) : (
        <div className="mt-14">
          <div className="card-quiet overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[12px] label text-ink-muted">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Invoices</th>
                  <th className="py-3 px-4">Subscriptions</th>
                  <th className="py-3 px-4">Added</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr
                    key={row.client.id}
                    className="border-b border-line last:border-0 row-hover"
                  >
                    <td className="py-4 px-4">
                      <Link
                        href={`/clients/${row.client.id}`}
                        className="text-[15px] font-semibold hover:underline"
                      >
                        {row.client.name}
                      </Link>
                      <div className="text-[13px] text-ink-muted">
                        {row.client.email}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[14px] text-ink-muted">
                      {row.client.company || "—"}
                    </td>
                    <td className="py-4 px-4 font-mono text-[14px]">
                      {row.invoiceCount}
                    </td>
                    <td className="py-4 px-4 font-mono text-[14px]">
                      {row.subCount}
                    </td>
                    <td className="py-4 px-4 text-[13px] text-ink-muted">
                      {formatDate(row.client.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
