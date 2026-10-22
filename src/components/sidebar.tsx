"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

interface SidebarProps {
  owner: { name: string; email: string; companyName: string };
  navItems: { href: string; label: string }[];
}

export function Sidebar({ owner, navItems }: SidebarProps) {
  const path = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-ink text-on-ink border-r border-on-ink-line sticky top-0 h-screen">
      <div className="px-7 pt-8 pb-6">
        <Logo light />
      </div>
      <nav className="px-5 flex-1 overflow-y-auto">
        <div className="label text-on-ink-muted-3 px-3 py-2">Workspace</div>
        <ul className="space-y-1 mt-1">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? path === "/dashboard" || path === "/"
                : path.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg label transition-colors ${
                    active
                      ? "bg-on-ink text-ink"
                      : "text-on-ink hover:bg-on-ink/10"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  {active ? (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--color-signal)" }}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-5 border-t border-on-ink-line">
        <div className="label text-on-ink-muted-3">Signed in as</div>
        <div className="mt-2">
          <div className="text-[15px] font-semibold">{owner.name}</div>
          <div className="text-[13px] text-on-ink-muted-2 truncate">
            {owner.email}
          </div>
          <div className="text-[12px] text-on-ink-muted-3 mt-0.5">
            {owner.companyName}
          </div>
        </div>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <button
            type="submit"
            className="w-full text-left label text-on-ink-muted-2 hover:text-on-ink transition-colors"
          >
            Sign out ↗
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileTopBar({ navItems }: { navItems: { href: string; label: string }[] }) {
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-canvas/90 backdrop-blur border-b border-line">
      <div className="px-5 py-4 flex items-center justify-between">
        <Logo />
        <details className="relative">
          <summary className="list-none cursor-pointer p-2 rounded-md hover:bg-canvas-sunken">
            <span className="block w-6 h-[1.5px] bg-ink relative">
              <span className="absolute inset-x-0 -top-[7px] h-[1.5px] bg-ink" />
              <span className="absolute inset-x-0 top-[7px] h-[1.5px] bg-ink" />
            </span>
          </summary>
          <div className="absolute right-0 mt-2 w-56 card-quiet shadow-[0_20px_40px_-20px_rgba(22,20,15,0.3)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block label px-3 py-2.5 hover:bg-canvas-sunken rounded"
              >
                {item.label}
              </Link>
            ))}
            <hr className="hairline my-2" />
            <form action="/api/auth/logout" method="post">
              <button className="w-full text-left label px-3 py-2.5 hover:bg-canvas-sunken rounded">
                Sign out
              </button>
            </form>
          </div>
        </details>
      </div>
    </div>
  );
}
