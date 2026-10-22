import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
  uuid,
  index,
  boolean,
} from "drizzle-orm/pg-core";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "void",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "paused",
  "cancelled",
  "trial",
]);

export const subscriptionIntervalEnum = pgEnum("subscription_interval", [
  "monthly",
  "quarterly",
  "yearly",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "mock_card",
  "mock_bank",
  "mock_stripe_test",
  "manual",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  companyName: text("company_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index("clients_owner_idx").on(table.ownerId),
  }),
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
    paidAmount: numeric("paid_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index("invoices_owner_idx").on(table.ownerId),
    numberOwnerIdx: index("invoices_number_owner_idx").on(
      table.number,
      table.ownerId,
    ),
  }),
);

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 })
    .notNull()
    .default("1"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    planName: text("plan_name").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    interval: subscriptionIntervalEnum("interval").notNull().default("monthly"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    nextBillingDate: timestamp("next_billing_date", {
      withTimezone: true,
    }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index("subscriptions_owner_idx").on(table.ownerId),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull().default("mock_card"),
    reference: text("reference").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    simulated: boolean("simulated").notNull().default(true),
  },
  (table) => ({
    ownerIdx: index("payments_owner_idx").on(table.ownerId),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index("audit_logs_owner_idx").on(table.ownerId),
  }),
);
