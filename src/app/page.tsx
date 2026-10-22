import type { ReactNode } from "react";
import Link from "next/link";
import { PublicHeader, PublicFooter } from "@/components/shell";
import {
  Button,
  Chip,
  LinkButton,
  SectionHead,
  StatusPill,
  ArrowUpRight,
  Hairline,
} from "@/components/ui";

export default async function LandingPage() {
  return (
    <div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 btn btn-primary"
      >
        Skip to content
      </a>
      <PublicHeader />

      <main id="main">
        {/* Hero */}
        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 pt-14 pb-20 lg:pt-24 lg:pb-32">
          <div className="reveal reveal-1">
            <StatusPill>All systems normal</StatusPill>
          </div>
          <h1
            className="mt-8 max-w-[16ch] text-[clamp(2.4rem,8vw,6.5rem)] tracking-[-0.045em] leading-[0.92] reveal reveal-2"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
          >
            Get <span className="italic-serif text-accent">paid</span>,{" "}
            <span className="italic-serif text-accent">on time</span>.
          </h1>
          <p className="mt-8 max-w-[50ch] text-[18px] leading-[1.55] text-ink-muted reveal reveal-3">
            Ledgerline is a small billing tool for independent studios and
            small businesses. Track clients, send invoices, record payments,
            and watch subscriptions renew — without the weight of a big
            platform.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3 reveal reveal-4">
            <LinkButton href="/login" variant="primary" size="lg">
              Try the demo
            </LinkButton>
            <LinkButton href="#features" variant="ghost" size="lg">
              See how it works
            </LinkButton>
          </div>
          <div className="mt-10 text-[13px] label text-ink-muted reveal reveal-5">
            Demo account:{" "}
            <span className="text-ink">demo@ledgerline.app</span> /{" "}
            <span className="text-ink">demo1234</span>
          </div>

          {/* Abstract mockup preview */}
          <div className="mt-16 lg:mt-24 reveal reveal-5">
            <Mockup />
          </div>
        </section>

        {/* Ticker band */}
        <Ticker />

        {/* Stats */}
        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            <StatBig value="4" suffix="k" label="Invoices tracked" index="01" />
            <StatBig value="92" suffix="%" label="Paid on time" index="02" />
            <StatBig value="38" suffix="h" label="Saved per quarter" index="03" />
            <StatBig value="0" suffix="¢" label="Real money moved" index="04" />
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="max-w-[1320px] mx-auto px-5 sm:px-8 py-20 lg:py-28"
        >
          <SectionHead
            eyebrow="Features"
            title="Everything a small studio needs, nothing it doesn't."
            lede="Ledgerline is intentionally small. It covers the four workflows every independent business repeats each month: billing clients, collecting payments, renewing subscriptions, and keeping the books honest."
          />

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[12px]">
            <BentoTile
              index="01"
              category="Clients"
              sub="Directory"
              title={
                <>
                  One place for every <span className="italic-serif">client</span>.
                </>
              }
              body="Names, emails, companies, addresses and free-form notes. Linked to every invoice and subscription that client touches."
            />
            <BentoTile
              index="02"
              category="Invoices"
              sub="Workflow"
              title={
                <>
                  Drafts that become <span className="italic-serif">payments</span>.
                </>
              }
              body="Line items, tax, status transitions from draft to sent to paid, and a full audit trail of what happened and when."
              tone="accent"
            />
            <BentoTile
              index="03"
              category="Subscriptions"
              sub="Recurring"
              title={
                <>
                  Know what renews, and <span className="italic-serif">when</span>.
                </>
              }
              body="Monthly, quarterly or yearly plans with next-billing dates and statuses you can pause, cancel or trial."
            />
            <BentoTile
              index="04"
              category="Payments"
              sub="Mocked"
              title={
                <>
                  A safe sandbox for <span className="italic-serif">money</span>.
                </>
              }
              body="Every payment is simulated. No card data leaves this app. Stripe test mode is documented as a stretch goal on the audit page."
              tone="sand"
            />
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 py-20 lg:py-28">
          <SectionHead
            eyebrow="How it works"
            title="Four steps to your first paid invoice."
            lede="A new business owner can go from sign-up to a paid invoice in an afternoon. Here is what that path looks like."
          />
          <ol className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <Step
              index="01"
              title="Connect"
              body="Create an account, name your company, and add your first client."
            />
            <Step
              index="02"
              title="Invoice"
              body="Add line items and a tax rate. Ledgerline does the totals and the numbering."
            />
            <Step
              index="03"
              title="Send"
              body="Flip the status to sent and the due date goes on your dashboard."
            />
            <Step
              index="04"
              title="Collect"
              body="Record a mock payment. The invoice closes and the numbers update."
            />
          </ol>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="max-w-[1320px] mx-auto px-5 sm:px-8 py-20 lg:py-28"
        >
          <SectionHead
            eyebrow="Pricing"
            title="One plan. Honest."
            lede="Small tools should cost like small tools. Every feature is in every plan — the tiers are about how many clients and invoices you need."
          />
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-[26px]">
            <PlanCard
              name="Solo"
              price="$0"
              unit="/mo"
              description="For a single freelancer getting started."
              bullets={[
                "Up to 5 active clients",
                "Unlimited invoices",
                "Mock payments only",
              ]}
            />
            <PlanCard
              name="Studio"
              price="$12"
              unit="/mo"
              description="The plan most small studios will land on."
              bullets={[
                "Up to 40 active clients",
                "Unlimited invoices & subscriptions",
                "Audit log, exports, tax reports",
              ]}
              featured
            />
            <PlanCard
              name="Practice"
              price="$32"
              unit="/mo"
              description="For small agencies and accountants."
              bullets={[
                "Unlimited clients",
                "Shared workspace (stretch goal)",
                "Priority support",
              ]}
            />
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="max-w-[900px] mx-auto px-5 sm:px-8 py-20 lg:py-28"
        >
          <SectionHead
            eyebrow="Questions"
            title="Answered, plainly."
            lede="Short answers to the questions that come up most often."
          />
          <Faq
            items={[
              {
                q: "Is real money involved?",
                a: "No. Every payment is simulated inside Ledgerline. Stripe test mode is documented on the audit page as a stretch goal, but nothing in the current build talks to a payment processor.",
              },
              {
                q: "Can I use this for my real business?",
                a: "Not yet. Ledgerline is a portfolio project and a case study in rescuing an AI-generated SaaS. Treat it as illustrative. The audit page documents every known limitation.",
              },
              {
                q: "How is access control enforced?",
                a: "Every API route requires a signed HTTP-only session cookie and every query is scoped to the signed-in owner. The audit page explains this and the original flaws it replaced.",
              },
              {
                q: "Where does it run?",
                a: "Next.js on Node, with a Postgres database behind Drizzle ORM. The deployment target is Vercel; the audit page describes the deployment checklist.",
              },
              {
                q: "What happens if I lose my session?",
                a: "Your data stays in the database. Sign in again and the sidebar, dashboard and every list reload from the server with the same data you had before.",
              },
            ]}
          />
        </section>

        {/* CTA panel */}
        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 pb-24 lg:pb-32">
          <div className="bg-ink text-on-ink rounded-[22px] px-8 py-20 lg:py-28 text-center">
            <div className="label eyebrow mx-auto" style={{ color: "var(--color-signal)" }}>
              Get started
            </div>
            <h2
              className="mt-6 text-[clamp(2rem,5.5vw,4.2rem)] tracking-[-0.04em] leading-[1] max-w-[16ch] mx-auto"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
            >
              Try the <span className="italic-serif" style={{ color: "var(--color-signal)" }}>
                demo
              </span>
              . No card required.
            </h2>
            <p className="mt-6 text-on-ink-muted-2 max-w-[50ch] mx-auto text-[17px] leading-[1.55]">
              The demo account is pre-seeded with realistic clients, invoices
              and subscriptions. Every payment is simulated.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Link href="/login" className="btn btn-signal btn-lg">
                Open the app <ArrowUpRight />
              </Link>
              <Link href="/audit" className="btn btn-ghost btn-lg" style={{ color: "var(--color-on-ink)", borderColor: "rgba(243,239,230,0.4)" }}>
                Read the audit
              </Link>
            </div>
            <div className="mt-6 label text-on-ink-muted-3">
              Or sign in with{" "}
              <span className="text-on-ink">demo@ledgerline.app</span>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Subcomponents for the landing page
 * ────────────────────────────────────────────────────────────────────── */

function Mockup() {
  return (
    <div className="relative">
      <div className="card-quiet p-6 lg:p-10 rotate-[-1.2deg] shadow-[0_40px_80px_-40px_rgba(22,20,15,0.35)]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-signal)" }} />
          <span className="w-2.5 h-2.5 rounded-full bg-line-strong/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-line-strong/30" />
          <span className="ml-auto label text-ink-muted">ledgerline.app / dashboard</span>
        </div>
        <Hairline className="my-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Outstanding" value="$18,402" />
          <Stat label="Paid this month" value="$9,600" />
          <Stat label="Renewals in 7 days" value="3" />
          <Stat label="Overdue" value="1" />
        </div>
        <Hairline className="my-6" />
        <div className="space-y-2">
          {[
            ["INV-2026-003", "Canopy Labs", "$6,420", "Sent"],
            ["INV-2026-004", "Tidepool", "$8,400", "Overdue"],
            ["INV-2026-005", "Meridian Dev", "$2,660", "Draft"],
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-t border-line"
            >
              <span className="label text-ink-muted">{r[0]}</span>
              <span className="text-[15px]">{r[1]}</span>
              <span className="font-mono text-[14px]">{r[2]}</span>
              <Chip tone={i === 1 ? "signal" : i === 2 ? "muted" : "accent"}>
                {r[3]}
              </Chip>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label text-ink-muted">{label}</div>
      <div
        className="mt-2 text-[clamp(1.2rem,2.5vw,1.6rem)] tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
      >
        {value}
      </div>
    </div>
  );
}

function Ticker() {
  const phrases = [
    "Invoices, on time",
    "Subscriptions, renewed",
    "Clients, remembered",
    "Payments, recorded",
    "The books, honest",
  ];
  return (
    <div className="bg-ink text-on-ink overflow-hidden">
      <div className="flex whitespace-nowrap animate-[ticker_30s_linear_infinite] py-6">
        {Array.from({ length: 3 }).map((_, k) => (
          <div key={k} className="flex items-center shrink-0">
            {phrases.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-6 px-6 text-[clamp(1.4rem,3vw,2rem)] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                <span>{p}</span>
                <span style={{ color: "var(--color-signal)" }}>✦</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}

function StatBig({
  value,
  suffix,
  label,
  index,
}: {
  value: string;
  suffix?: string;
  label: string;
  index: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label text-ink-muted">{label}</span>
        <span className="idx">{index}</span>
      </div>
      <div
        className="mt-3 text-[clamp(2.2rem,6vw,3.8rem)] tracking-[-0.04em] leading-[1]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
      >
        {value}
        {suffix ? (
          <span className="italic-serif text-accent ml-1">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

function BentoTile({
  index,
  category,
  sub,
  title,
  body,
  tone = "canvas",
}: {
  index: string;
  category: string;
  sub: string;
  title: ReactNode;
  body: string;
  tone?: "canvas" | "accent" | "sand";
}) {
  const bg =
    tone === "accent"
      ? "var(--color-accent)"
      : tone === "sand"
        ? "var(--color-canvas-sunken)"
        : "var(--color-canvas)";
  const fg = tone === "accent" ? "var(--color-on-ink)" : "var(--color-ink)";
  const muted =
    tone === "accent"
      ? "var(--color-on-ink-muted-2)"
      : "var(--color-ink-muted)";
  const border =
    tone === "accent"
      ? "1px solid rgba(243,239,230,0.2)"
      : "1px solid var(--color-line-strong)";
  return (
    <div
      className="rounded-[18px] p-7 min-h-[280px] flex flex-col justify-between gap-6 transition-transform hover:-translate-y-1"
      style={{
        background: bg,
        color: fg,
        border,
        transition: "transform 450ms var(--ease-signature)",
      }}
    >
      <div className="label" style={{ color: muted }}>
        {index} · {category} · {sub}
      </div>
      <div>
        <h3
          className="text-[clamp(1.3rem,2.2vw,1.6rem)] tracking-[-0.02em] leading-[1.15]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          {title}
        </h3>
        <p className="mt-3 text-[15px] leading-[1.55]" style={{ color: muted }}>
          {body}
        </p>
      </div>
    </div>
  );
}

function Step({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <li className="list-none">
      <div className="h-[2px] bg-ink mb-6" />
      <div className="label text-accent">{index}</div>
      <h3
        className="mt-3 text-[1.4rem] tracking-[-0.02em]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
      >
        {title}.
      </h3>
      <p className="mt-3 text-ink-muted text-[15px] leading-[1.55] max-w-[40ch]">
        {body}
      </p>
    </li>
  );
}

function PlanCard({
  name,
  price,
  unit,
  description,
  bullets,
  featured = false,
}: {
  name: string;
  price: string;
  unit: string;
  description: string;
  bullets: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] p-8 flex flex-col min-h-[380px] transition-transform hover:-translate-y-1 ${
        featured ? "bg-ink text-on-ink" : "bg-canvas border border-line-strong"
      }`}
      style={{ transition: "transform 450ms var(--ease-signature)" }}
    >
      <div className="label" style={{ color: featured ? "var(--color-signal)" : "var(--color-accent)" }}>
        {name}
      </div>
      <div
        className="mt-4 text-[2.4rem] tracking-[-0.03em] leading-[1]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
      >
        {price}
        <span
          className="text-[1rem] ml-1"
          style={{ color: featured ? "var(--color-on-ink-muted-2)" : "var(--color-ink-muted)" }}
        >
          {unit}
        </span>
      </div>
      <p
        className="mt-4 text-[15px] leading-[1.55]"
        style={{ color: featured ? "var(--color-on-ink-muted-1)" : "var(--color-ink-muted)" }}
      >
        {description}
      </p>
      <Hairline
        className={`my-6 ${featured ? "!border-on-ink-line" : ""}`}
      />
      <ul className="space-y-3 flex-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 items-start text-[15px]">
            <span style={{ color: featured ? "var(--color-signal)" : "var(--color-accent)" }}>→</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link
          href="/login"
          className={`btn w-full ${
            featured ? "btn-signal" : "btn-primary"
          }`}
        >
          Try it <ArrowUpRight />
        </Link>
      </div>
    </div>
  );
}

function Faq({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  return (
    <div className="mt-14">
      {items.map((it, i) => (
        <details key={i} className="group border-t border-line py-6">
          <summary className="flex items-center justify-between gap-6 cursor-pointer list-none">
            <h3
              className="text-[1.3rem] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              {it.q}
            </h3>
            <span
              className="label text-ink-muted group-open:text-accent transition-transform group-open:rotate-45"
              style={{ transition: "transform 400ms var(--ease-signature), color 250ms" }}
            >
              +
            </span>
          </summary>
          <p className="mt-4 text-ink-muted text-[15.5px] leading-[1.6] max-w-[75ch]">
            {it.a}
          </p>
        </details>
      ))}
    </div>
  );
}
