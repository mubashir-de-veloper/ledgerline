import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Logo } from "./logo";
import { Sidebar, MobileTopBar } from "./sidebar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/payments", label: "Payments" },
  { href: "/audit", label: "Audit report" },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!owner) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar
        owner={{
          name: owner.name,
          email: owner.email,
          companyName: owner.companyName,
        }}
        navItems={NAV_ITEMS}
      />
      <MobileTopBar navItems={NAV_ITEMS} />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 py-10 lg:py-14">
          {children}
        </div>
      </main>
    </div>
  );
}

/* Public header used on landing + auth pages. */
export async function PublicHeader() {
  const session = await getSession();
  const loggedIn = !!session;
  return (
    <header className="sticky top-0 z-20 bg-canvas/85 backdrop-blur-md border-b border-line">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="/#features" className="label nav-link text-ink-muted hover:text-ink">
            Features
          </a>
          <a href="/#pricing" className="label nav-link text-ink-muted hover:text-ink">
            Pricing
          </a>
          <a href="/#faq" className="label nav-link text-ink-muted hover:text-ink">
            Questions
          </a>
          <Link href="/audit" className="label nav-link text-ink-muted hover:text-ink">
            Audit
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Link href="/dashboard" className="btn btn-primary btn-sm">
              Open app <ArrowSmall />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="btn btn-ghost btn-sm hidden sm:inline-flex"
              >
                Sign in
              </Link>
              <Link href="/login" className="btn btn-primary btn-sm">
                Get started <ArrowSmall />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function ArrowSmall() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-ink text-on-ink">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-12">
          <div>
            <Logo light large />
            <p className="mt-6 text-on-ink-muted-2 max-w-[45ch] text-[16px] leading-[1.6]">
              A small billing tool for small studios. Built in the open as a
              portfolio audit and rescue project.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
            <div>
              <div className="label text-on-ink-muted-3">Product</div>
              <ul className="mt-4 space-y-3">
                <li>
                  <a href="/#features" className="text-on-ink-muted-1 hover:text-on-ink">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/#pricing" className="text-on-ink-muted-1 hover:text-on-ink">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/audit" className="text-on-ink-muted-1 hover:text-on-ink">
                    Audit report
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="label text-on-ink-muted-3">Company</div>
              <ul className="mt-4 space-y-3">
                <li>
                  <a href="#" className="text-on-ink-muted-1 hover:text-on-ink">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-on-ink-muted-1 hover:text-on-ink">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="label text-on-ink-muted-3">Legal</div>
              <ul className="mt-4 space-y-3">
                <li>
                  <a href="#" className="text-on-ink-muted-1 hover:text-on-ink">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="text-on-ink-muted-1 hover:text-on-ink">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="border-on-ink-line my-10" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-on-ink-muted-3 label">
          <div>© {new Date().getFullYear()} Ledgerline Studio.</div>
          <div>Illustrative data — no real money moves here.</div>
        </div>
      </div>
    </footer>
  );
}
