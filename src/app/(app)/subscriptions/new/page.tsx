"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SectionHead, Button, Feedback } from "@/components/ui";
import { toISODate } from "@/lib/format";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [planName, setPlanName] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setInterval] = useState("monthly");
  const [status, setStatus] = useState("active");
  const [nextBillingDate, setNextBillingDate] = useState(
    toISODate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId,
          planName,
          amount: parseFloat(amount),
          interval,
          status,
          nextBillingDate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't save the subscription.");
        return;
      }
      router.push("/subscriptions");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SectionHead
        eyebrow="New subscription"
        title="Track recurring work."
        lede="Retainers, hosting, maintenance — anything that bills on a schedule. Pick a client and set the cadence."
      />

      <form onSubmit={onSubmit} className="mt-14 max-w-[600px] space-y-6">
        <label className="block">
          <span className="field-label">Client</span>
          <select
            className="field"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            <option value="">Pick a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` — ${c.company}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Plan name</span>
          <input
            type="text"
            className="field"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g. Design retainer — standard"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="field-label">Amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="field font-mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>
          <label className="block">
            <span className="field-label">Interval</span>
            <select
              className="field"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="field-label">Status</span>
            <select
              className="field"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Next billing date</span>
            <input
              type="date"
              className="field"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              required
            />
          </label>
        </div>

        {error ? <Feedback tone="error">{error}</Feedback> : null}
        <div className="flex gap-3">
          <Button type="submit" loading={loading} loadingLabel="Saving…">
            Save subscription
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/subscriptions")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
