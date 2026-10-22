import { AppShell } from "@/components/shell";
import { SectionHead, Hairline, Chip } from "@/components/ui";
import Link from "next/link";

export const runtime = "nodejs";

export default function AuditPage() {
  return (
    <>
      <SectionHead
        eyebrow="Audit report"
        title="What was broken, and how it was fixed."
        lede="Ledgerline is a portfolio project built as a rescue case study. This page documents the eight intentional flaws, their severity, the risks they posed, and the fixes applied."
      />

      <div className="mt-14 max-w-[900px] space-y-10">
        <div className="card-quiet">
          <h2
            className="text-[1.6rem] tracking-[-0.02em] mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Overview.
          </h2>
          <p className="text-[16px] leading-[1.65] text-ink-muted">
            This app was built in three phases: (1) a baseline with intentional
            flaws, (2) an audit documenting each flaw with severity and risk,
            and (3) a rescue that fixed authentication, security, database
            design, error handling, and deployment. The audit below covers the
            eight most critical issues.
          </p>
        </div>

        <AuditItem
          index="01"
          title="Exposed session secrets"
          severity="Critical"
          risk="Session tokens could be forged, allowing anyone to impersonate any user."
          fix="Moved SESSION_SECRET to environment variables. Added validation to reject secrets shorter than 16 characters. Secrets are never logged or exposed to the client."
          effort="Low (1h)"
        />
        <AuditItem
          index="02"
          title="No authentication"
          severity="Critical"
          risk="Anyone could access any user's data by guessing or enumerating IDs."
          fix="Implemented HTTP-only signed session cookies using scrypt for password hashing and HMAC for token signing. Every API route now requires a valid session and scopes queries to the signed-in owner."
          effort="Medium (6h)"
        />
        <AuditItem
          index="03"
          title="Missing row-level security"
          severity="High"
          risk="A logged-in user could read or modify another user's clients, invoices, or subscriptions by changing the ID in the URL or API call."
          fix="Every database query is scoped to ownerId. API routes verify ownership before returning or modifying data. Foreign key constraints cascade deletes to prevent orphaned records."
          effort="Medium (4h)"
        />
        <AuditItem
          index="04"
          title="Plaintext passwords"
          severity="Critical"
          risk="If the database was compromised, all user passwords would be exposed."
          fix="Passwords are hashed with scrypt using a per-user salt. Verification uses timing-safe comparison to prevent timing attacks."
          effort="Low (2h)"
        />
        <AuditItem
          index="05"
          title="No input validation"
          severity="High"
          risk="Malformed or malicious input could cause database errors, XSS, or logic bugs."
          fix="Added validation for email format, numeric ranges, required fields, and array lengths. Error messages are specific and actionable."
          effort="Medium (5h)"
        />
        <AuditItem
          index="06"
          title="Inconsistent error handling"
          severity="Medium"
          risk="Users saw generic errors or blank screens when something failed."
          fix="Every API route returns structured error responses with actionable messages. UI components show inline errors and disable buttons during loading states."
          effort="Medium (4h)"
        />
        <AuditItem
          index="07"
          title="No loading or empty states"
          severity="Medium"
          risk="Users didn't know if data was loading, if a list was empty, or if an action was in progress."
          fix="Added skeleton loaders, empty states with CTAs, button loading states with present-progressive labels, and success/error feedback blocks."
          effort="Medium (6h)"
        />
        <AuditItem
          index="08"
          title="Invoice totals calculated on the client"
          severity="High"
          risk="A malicious user could send a different total than what the UI showed, bypassing tax or line-item math."
          fix="All invoice totals, tax, and paid amounts are calculated server-side from line items. The client sends only quantities and unit prices."
          effort="Low (2h)"
        />

        <Hairline />

        <div className="card-quiet">
          <h2
            className="text-[1.6rem] tracking-[-0.02em] mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Stretch goals.
          </h2>
          <p className="text-[16px] leading-[1.65] text-ink-muted mb-4">
            These features are documented but not yet implemented. They would be
            the next phase of work if this were a real product.
          </p>
          <ul className="space-y-3 text-[15px]">
            <li className="flex gap-3">
              <span className="text-accent">→</span>
              <span>
                <strong>Stripe test mode integration.</strong> Replace mock
                payments with Stripe Checkout in test mode. Store Stripe
                customer and payment intent IDs. Handle webhooks for payment
                confirmation.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">→</span>
              <span>
                <strong>Email notifications.</strong> Send invoice PDFs via
                email when marked as sent. Send payment receipts. Use a
                transactional email service like Resend or Postmark.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">→</span>
              <span>
                <strong>Shared workspaces.</strong> Allow multiple users to
                collaborate on the same set of clients and invoices. Implement
                role-based access control (owner, editor, viewer).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">→</span>
              <span>
                <strong>Error monitoring.</strong> Integrate Sentry or a
                similar service to capture and alert on server-side errors.
                Add structured logging for audit trails.
              </span>
            </li>
          </ul>
        </div>

        <div className="card-quiet">
          <h2
            className="text-[1.6rem] tracking-[-0.02em] mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Deployment checklist.
          </h2>
          <ul className="space-y-2 text-[15px]">
            <li className="flex gap-3">
              <span className="text-success">✓</span>
              <span>Environment variables configured (DATABASE_URL, SESSION_SECRET)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-success">✓</span>
              <span>Database schema pushed with Drizzle Kit</span>
            </li>
            <li className="flex gap-3">
              <span className="text-success">✓</span>
              <span>Production build passes with no TypeScript errors</span>
            </li>
            <li className="flex gap-3">
              <span className="text-success">✓</span>
              <span>Health check endpoint at /api/health returns 200</span>
            </li>
            <li className="flex gap-3">
              <span className="text-success">✓</span>
              <span>Session cookies use secure flag in production</span>
            </li>
            <li className="flex gap-3">
              <span className="text-success">✓</span>
              <span>No secrets hardcoded in source code</span>
            </li>
          </ul>
        </div>

        <div className="card-quiet">
          <h2
            className="text-[1.6rem] tracking-[-0.02em] mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            Case study.
          </h2>
          <p className="text-[16px] leading-[1.65] text-ink-muted mb-4">
            Ledgerline started as a broken AI-generated SaaS with exposed
            secrets, no authentication, and inconsistent database writes. The
            rescue phase focused on three priorities: (1) securing access with
            signed session cookies and server-side authorization, (2) enforcing
            data ownership at the database layer, and (3) improving the user
            experience with loading states, empty states, and actionable error
            messages. The result is a small but production-ready billing tool
            that demonstrates a complete business workflow — from client
            onboarding to invoice collection — with the security and reliability
            expected of a real product.
          </p>
          <p className="text-[16px] leading-[1.65] text-ink-muted">
            The code is open and the audit is transparent. Every flaw is
            documented, every fix is tested, and the deployment is stable. This
            is what a rescued app looks like.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard" className="btn btn-primary">
            Try the demo
          </Link>
          <Link href="/" className="btn btn-ghost">
            Back to home
          </Link>
        </div>
      </div>
    </>
  );
}

function AuditItem({
  index,
  title,
  severity,
  risk,
  fix,
  effort,
}: {
  index: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  risk: string;
  fix: string;
  effort: string;
}) {
  const tone: "signal" | "accent" | "muted" | "success" =
    severity === "Critical"
      ? "signal"
      : severity === "High"
        ? "accent"
        : severity === "Medium"
          ? "muted"
          : "success";

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="idx">{index}</span>
          <h3
            className="text-[1.3rem] tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            {title}.
          </h3>
        </div>
        <Chip tone={tone}>{severity}</Chip>
      </div>
      <div className="space-y-3 text-[15px] leading-[1.6]">
        <div>
          <div className="label text-ink-muted mb-1">Risk</div>
          <p className="text-ink-muted">{risk}</p>
        </div>
        <div>
          <div className="label text-accent mb-1">Fix</div>
          <p>{fix}</p>
        </div>
        <div className="flex items-center gap-4 pt-2 border-t border-line">
          <span className="label text-ink-muted">Estimated effort</span>
          <span className="font-mono text-[14px]">{effort}</span>
        </div>
      </div>
    </div>
  );
}
