import "dotenv/config";
import { db } from "@/db";
import {
  users,
  clients,
  invoices,
  invoiceItems,
  subscriptions,
  payments,
  auditLogs,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sql, eq } from "drizzle-orm";

async function seed() {
  console.log("🌱  Seeding Ledgerline demo data...");

  // Clean slate.
  await db.delete(auditLogs);
  await db.delete(payments);
  await db.delete(invoiceItems);
  await db.delete(invoices);
  await db.delete(subscriptions);
  await db.delete(clients);
  await db.delete(users);

  const passwordHash = hashPassword("demo1234");

  const [owner] = await db
    .insert(users)
    .values({
      email: "demo@ledgerline.app",
      name: "Morgan Vance",
      companyName: "Vance Studio",
      passwordHash,
    })
    .returning();

  const now = new Date();
  const daysAgo = (n: number) =>
    new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const daysAhead = (n: number) =>
    new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

  const clientRows = await db
    .insert(clients)
    .values([
      {
        ownerId: owner.id,
        name: "Iris Holloway",
        email: "iris@northwind.co",
        company: "Northwind Trading",
        address: "221 Market St, San Francisco, CA",
        notes: "Prefers net-15. Always pays early.",
      },
      {
        ownerId: owner.id,
        name: "Theo Marchetti",
        email: "theo@bellini.design",
        company: "Bellini Design",
        address: "Via Torino 14, Milano",
        notes: "Retainer client since 2023.",
      },
      {
        ownerId: owner.id,
        name: "Priya Raman",
        email: "priya@canopylabs.io",
        company: "Canopy Labs",
        address: "1 Infinite Loop, Austin, TX",
      },
      {
        ownerId: owner.id,
        name: "Ola Adeyemi",
        email: "ola@tidepool.ng",
        company: "Tidepool",
        address: "12 Marina, Lagos",
      },
      {
        ownerId: owner.id,
        name: "Sasha Belov",
        email: "sasha@meridian.dev",
        company: "Meridian Dev",
        address: "Nevsky 40, Saint Petersburg",
      },
      {
        ownerId: owner.id,
        name: "Juno Park",
        email: "juno@halflight.studio",
        company: "Halflight Studio",
        address: "55 Bogart St, Brooklyn, NY",
      },
      {
        ownerId: owner.id,
        name: "Ren Takahashi",
        email: "ren@kumo.jp",
        company: "Kumo Inc.",
        address: "Shibuya 2-1, Tokyo",
      },
      {
        ownerId: owner.id,
        name: "Nora Ekström",
        email: "nora@fjord.se",
        company: "Fjord Analytics",
        address: "Kungsgatan 8, Stockholm",
      },
    ])
    .returning();

  // Helper to build an invoice + items.
  async function makeInvoice(opts: {
    clientIdx: number;
    number: string;
    status: "draft" | "sent" | "paid" | "overdue" | "void";
    issueOffset: number;
    dueOffset: number;
    items: { description: string; quantity: number; unitPrice: number }[];
    taxRate: number;
    paid?: number;
  }) {
    const client = clientRows[opts.clientIdx];
    if (!client) throw new Error("bad client idx");
    const subtotal = opts.items.reduce(
      (sum, it) => sum + it.quantity * it.unitPrice,
      0,
    );
    const taxAmount = +(subtotal * (opts.taxRate / 100)).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);
    const paidAmount = opts.paid ?? (opts.status === "paid" ? total : 0);

    const [inv] = await db
      .insert(invoices)
      .values({
        ownerId: owner.id,
        clientId: client.id,
        number: opts.number,
        status: opts.status,
        issueDate: daysAgo(-opts.issueOffset),
        dueDate: daysAgo(-opts.dueOffset),
        subtotal: subtotal.toFixed(2),
        taxRate: opts.taxRate.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
      })
      .returning();

    await db.insert(invoiceItems).values(
      opts.items.map((it) => ({
        invoiceId: inv.id,
        description: it.description,
        quantity: it.quantity.toFixed(2),
        unitPrice: it.unitPrice.toFixed(2),
        amount: (it.quantity * it.unitPrice).toFixed(2),
      })),
    );

    return inv;
  }

  // Invoices.
  const inv1 = await makeInvoice({
    clientIdx: 0,
    number: "INV-2026-001",
    status: "paid",
    issueOffset: 42,
    dueOffset: 28,
    taxRate: 8.5,
    items: [
      { description: "Brand identity system", quantity: 1, unitPrice: 6400 },
      { description: "Stationery suite", quantity: 1, unitPrice: 1200 },
    ],
  });

  const inv2 = await makeInvoice({
    clientIdx: 1,
    number: "INV-2026-002",
    status: "paid",
    issueOffset: 36,
    dueOffset: 21,
    taxRate: 0,
    items: [
      { description: "Monthly retainer — design", quantity: 1, unitPrice: 3200 },
    ],
  });

  const inv3 = await makeInvoice({
    clientIdx: 2,
    number: "INV-2026-003",
    status: "sent",
    issueOffset: 7,
    dueOffset: -7,
    taxRate: 7,
    items: [
      {
        description: "Product strategy workshop",
        quantity: 2,
        unitPrice: 1800,
      },
      { description: "Research synthesis report", quantity: 1, unitPrice: 2400 },
    ],
  });

  const inv4 = await makeInvoice({
    clientIdx: 3,
    number: "INV-2026-004",
    status: "overdue",
    issueOffset: 30,
    dueOffset: 2,
    taxRate: 0,
    items: [
      { description: "Mobile app design (phase 1)", quantity: 1, unitPrice: 8400 },
    ],
  });

  const inv5 = await makeInvoice({
    clientIdx: 4,
    number: "INV-2026-005",
    status: "draft",
    issueOffset: 1,
    dueOffset: -14,
    taxRate: 5,
    items: [
      { description: "Engineering audit", quantity: 8, unitPrice: 220 },
      { description: "Written findings report", quantity: 1, unitPrice: 900 },
    ],
  });

  const inv6 = await makeInvoice({
    clientIdx: 5,
    number: "INV-2026-006",
    status: "paid",
    issueOffset: 60,
    dueOffset: 45,
    taxRate: 8.875,
    items: [
      { description: "Website redesign", quantity: 1, unitPrice: 12800 },
      { description: "CMS migration", quantity: 1, unitPrice: 2200 },
    ],
  });

  const inv7 = await makeInvoice({
    clientIdx: 6,
    number: "INV-2026-007",
    status: "sent",
    issueOffset: 3,
    dueOffset: -11,
    taxRate: 10,
    items: [
      { description: "Design system tokens", quantity: 1, unitPrice: 4800 },
    ],
  });

  // A partial payment on inv7 to show partial paid.
  await db.insert(payments).values({
    ownerId: owner.id,
    invoiceId: inv7.id,
    amount: "2000.00",
    method: "mock_card",
    reference: "mock_txn_" + Math.random().toString(36).slice(2, 10),
    simulated: true,
  });

  // Paid invoice records.
  await db.insert(payments).values([
    {
      ownerId: owner.id,
      invoiceId: inv1.id,
      amount: inv1.total,
      method: "mock_bank",
      reference: "mock_txn_8821a1",
      simulated: true,
      recordedAt: daysAgo(27),
    },
    {
      ownerId: owner.id,
      invoiceId: inv2.id,
      amount: inv2.total,
      method: "mock_stripe_test",
      reference: "mock_txn_9912b2",
      simulated: true,
      recordedAt: daysAgo(20),
    },
    {
      ownerId: owner.id,
      invoiceId: inv6.id,
      amount: inv6.total,
      method: "mock_bank",
      reference: "mock_txn_7723c3",
      simulated: true,
      recordedAt: daysAgo(44),
    },
  ]);

  // Subscriptions.
  await db.insert(subscriptions).values([
    {
      ownerId: owner.id,
      clientId: clientRows[1].id,
      planName: "Design retainer — standard",
      amount: "3200.00",
      interval: "monthly",
      status: "active",
      nextBillingDate: daysAhead(4),
      startedAt: daysAgo(180),
    },
    {
      ownerId: owner.id,
      clientId: clientRows[2].id,
      planName: "Research advisory",
      amount: "1500.00",
      interval: "monthly",
      status: "active",
      nextBillingDate: daysAhead(11),
      startedAt: daysAgo(90),
    },
    {
      ownerId: owner.id,
      clientId: clientRows[5].id,
      planName: "Hosting & maintenance",
      amount: "480.00",
      interval: "monthly",
      status: "active",
      nextBillingDate: daysAhead(22),
      startedAt: daysAgo(240),
    },
    {
      ownerId: owner.id,
      clientId: clientRows[6].id,
      planName: "Quarterly design review",
      amount: "6000.00",
      interval: "quarterly",
      status: "active",
      nextBillingDate: daysAhead(38),
      startedAt: daysAgo(120),
    },
    {
      ownerId: owner.id,
      clientId: clientRows[7].id,
      planName: "Analytics dashboard license",
      amount: "9600.00",
      interval: "yearly",
      status: "trial",
      nextBillingDate: daysAhead(9),
      startedAt: daysAgo(5),
    },
    {
      ownerId: owner.id,
      clientId: clientRows[0].id,
      planName: "Brand support",
      amount: "800.00",
      interval: "monthly",
      status: "paused",
      nextBillingDate: daysAhead(0),
      startedAt: daysAgo(300),
    },
  ]);

  // Sample audit log entries so the timeline looks real.
  await db.insert(auditLogs).values([
    {
      ownerId: owner.id,
      action: "invoice.paid",
      entity: "invoice",
      entityId: inv1.id,
      metadata: JSON.stringify({ amount: inv1.total }),
      createdAt: daysAgo(27),
    },
    {
      ownerId: owner.id,
      action: "invoice.sent",
      entity: "invoice",
      entityId: inv3.id,
      metadata: JSON.stringify({ to: clientRows[2].email }),
      createdAt: daysAgo(7),
    },
    {
      ownerId: owner.id,
      action: "subscription.created",
      entity: "subscription",
      createdAt: daysAgo(90),
    },
    {
      ownerId: owner.id,
      action: "invoice.overdue",
      entity: "invoice",
      entityId: inv4.id,
      createdAt: daysAgo(1),
    },
  ]);

  console.log("✅  Seeded:", {
    users: 1,
    clients: clientRows.length,
    invoices: 7,
    subscriptions: 6,
  });
  console.log(
    "Demo login: demo@ledgerline.app / demo1234"
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
