"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Feedback } from "@/components/ui";
import { formatCurrency } from "@/lib/format";

interface Props {
  invoiceId: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  remaining: number;
}

export function InvoiceActions({ invoiceId, status, remaining }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [method, setMethod] = useState("mock_card");

  async function sendAction(action: string) {
    setError(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't update the invoice.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(null);
    }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("pay");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "pay", amount, method }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't record the payment.");
        return;
      }
      setPayOpen(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setLoading(null);
    }
  }

  const canSend = status === "draft";
  const canPay = status !== "paid" && status !== "void" && remaining > 0.005;
  const canVoid = status !== "paid";

  return (
    <div className="space-y-3">
      {error ? <Feedback tone="error">{error}</Feedback> : null}
      <div className="flex flex-wrap gap-2">
        {canSend ? (
          <Button
            size="sm"
            loading={loading === "send"}
            loadingLabel="Sending…"
            onClick={() => sendAction("send")}
          >
            Mark as sent
          </Button>
        ) : null}
        {canPay ? (
          <Button
            size="sm"
            variant={payOpen ? "ghost" : "signal"}
            onClick={() => setPayOpen((o) => !o)}
          >
            {payOpen ? "Cancel" : "Record payment"}
          </Button>
        ) : null}
        {canVoid ? (
          <Button
            size="sm"
            variant="ghost"
            loading={loading === "void"}
            loadingLabel="Voiding…"
            onClick={() => sendAction("void")}
          >
            Void invoice
          </Button>
        ) : null}
      </div>
      {payOpen ? (
        <form
          onSubmit={recordPayment}
          className="card-quiet max-w-[420px] space-y-4"
        >
          <div>
            <div className="label text-ink-muted mb-1">Remaining balance</div>
            <div className="font-mono text-[16px]">{formatCurrency(remaining)}</div>
          </div>
          <label className="block">
            <span className="field-label">Amount to record</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remaining.toFixed(2)}
              className="field font-mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="field-label">Payment method</span>
            <select
              className="field"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="mock_card">Mock card</option>
              <option value="mock_bank">Mock bank transfer</option>
              <option value="mock_stripe_test">Mock Stripe (test)</option>
              <option value="manual">Manual / offline</option>
            </select>
          </label>
          <div className="text-[12px] text-ink-muted">
            This is a simulated payment. No money will move.
          </div>
          <Button
            type="submit"
            loading={loading === "pay"}
            loadingLabel="Recording…"
          >
            Record payment
          </Button>
        </form>
      ) : null}
    </div>
  );
}
