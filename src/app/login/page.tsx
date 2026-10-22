"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Feedback } from "@/components/ui";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@ledgerline.app");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error ||
            "We couldn't sign you in. Check your connection and try again.",
        );
        return;
      }
      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't reach the sign-in service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex">
      {/* Left: editorial intro */}
      <section className="hidden lg:flex flex-col justify-between w-[55%] bg-ink text-on-ink p-14">
        <Logo light />
        <div>
          <div className="label eyebrow" style={{ color: "var(--color-signal)" }}>
            The demo
          </div>
          <h1
            className="mt-6 max-w-[14ch] text-[clamp(2.2rem,4.2vw,4rem)] tracking-[-0.04em] leading-[0.98]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
          >
            Sign in, <span className="italic-serif" style={{ color: "var(--color-signal)" }}>continue</span> where you left off.
          </h1>
          <p className="mt-6 text-on-ink-muted-1 max-w-[45ch] text-[17px] leading-[1.6]">
            A pre-seeded workspace with eight clients, seven invoices, six
            subscriptions and a recent payments history. Nothing in this demo
            moves real money.
          </p>
        </div>
        <div className="label text-on-ink-muted-3">
          Ledgerline · an audit and rescue case study
        </div>
      </section>

      {/* Right: form */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>
          <h2
            className="mt-10 text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-[-0.03em] leading-[1.05]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
          >
            Welcome <span className="italic-serif text-accent">back</span>.
          </h2>
          <p className="mt-4 text-ink-muted text-[16px] leading-[1.55] max-w-[40ch]">
            Use the demo account below, or sign in with your own credentials.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-6">
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                placeholder="e.g. you@studio.com"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="At least 8 characters"
              />
            </div>
            {error ? <Feedback tone="error">{error}</Feedback> : null}
            <Button
              type="submit"
              loading={loading}
              loadingLabel="Signing in…"
              className="w-full"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-10 text-[14px] text-ink-muted">
            New here?{" "}
            <Link href="/" className="text-accent underline underline-offset-4 hover:no-underline">
              Read what Ledgerline does
            </Link>
            .
          </div>
        </div>
      </section>
    </main>
  );
}
