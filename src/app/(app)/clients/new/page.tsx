"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SectionHead, Button, Feedback } from "@/components/ui";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          company: form.get("company"),
          address: form.get("address"),
          notes: form.get("notes"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't save the client.");
        return;
      }
      router.push("/clients");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SectionHead
        eyebrow="New client"
        title="Add someone you work with."
        lede="Fill in the basics. You can edit any of these fields later."
      />

      <form onSubmit={onSubmit} className="mt-14 max-w-[600px] space-y-6">
        <div>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="field"
            placeholder="e.g. Iris Holloway"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="field"
            placeholder="e.g. iris@company.com"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="company">
            Company{" "}
            <span className="text-ink-muted font-body normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <input
            id="company"
            name="company"
            className="field"
            placeholder="e.g. Northwind Trading"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="address">
            Address{" "}
            <span className="text-ink-muted font-body normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <input
            id="address"
            name="address"
            className="field"
            placeholder="e.g. 221 Market St, San Francisco, CA"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="notes">
            Notes{" "}
            <span className="text-ink-muted font-body normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <textarea
            id="notes"
            name="notes"
            className="field"
            rows={4}
            placeholder="e.g. Prefers net-15. Always pays early."
          />
        </div>
        {error ? <Feedback tone="error">{error}</Feedback> : null}
        <div className="flex gap-3">
          <Button type="submit" loading={loading} loadingLabel="Saving…">
            Save client
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/clients")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
