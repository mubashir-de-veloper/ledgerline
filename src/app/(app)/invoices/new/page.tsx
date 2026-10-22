"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SectionHead, Button, Feedback, Hairline } from "@/components/ui";
import { formatCurrency, toISODate } from "@/lib/format";

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: Math.random().toString(36), description: "", quantity: "1", unitPrice: "" },
  ]);
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [issueDate, setIssueDate] = useState(toISODate(new Date()));
  const [dueDate, setDueDate] = useState(
    toISODate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => {});
  }, []);

  const subtotal = items.reduce((sum, it) => {
    const q = parseFloat(it.quantity) || 0;
    const u = parseFloat(it.unitPrice) || 0;
    return sum + q * u;
  }, 0);
  const taxAmount = subtotal * ((parseFloat(taxRate) || 0) / 100);
  const total = subtotal + taxAmount;

  function addItem() {
    setItems([
      ...items,
      { id: Math.random().toString(36), description: "", quantity: "1", unitPrice: "" },
    ]);
  }
  function removeItem(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }
  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientId,
          issueDate,
          dueDate,
          taxRate: parseFloat(taxRate) || 0,
          notes,
          items: items.map((i) => ({
            description: i.description,
            quantity: parseFloat(i.quantity) || 0,
            unitPrice: parseFloat(i.unitPrice) || 0,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't save the invoice.");
        return;
      }
      router.push(`/invoices/${data.invoice.id}`);
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
        eyebrow="New invoice"
        title="Send a bill in minutes."
        lede="Pick a client, list the work, and Ledgerline does the math. The invoice starts as a draft — send it when you're ready."
      />

      <form onSubmit={onSubmit} className="mt-14 max-w-[820px] space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="field-label">Issue date</span>
              <input
                type="date"
                className="field"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="field-label">Due date</span>
              <input
                type="date"
                className="field"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-[1.2rem] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Line items.
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-ghost btn-sm"
            >
              + Add item
            </button>
          </div>
          <div className="card-quiet">
            <div className="grid grid-cols-12 gap-3 pb-3 border-b border-line text-[11px] label text-ink-muted">
              <div className="col-span-6">Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit price</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-1" />
            </div>
            {items.map((item) => {
              const amount =
                (parseFloat(item.quantity) || 0) *
                (parseFloat(item.unitPrice) || 0);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-3 py-3 items-center"
                >
                  <input
                    type="text"
                    className="field col-span-6 !py-2.5"
                    placeholder="e.g. Brand identity system"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, { description: e.target.value })
                    }
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="field col-span-2 !py-2.5 font-mono"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, { quantity: e.target.value })
                    }
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="field col-span-2 !py-2.5 font-mono"
                    placeholder="0.00"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, { unitPrice: e.target.value })
                    }
                    required
                  />
                  <div className="col-span-1 text-right font-mono text-[14px]">
                    {formatCurrency(amount)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="col-span-1 text-ink-muted hover:text-signal label justify-self-end"
                    aria-label="Remove item"
                    disabled={items.length === 1}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="block">
            <span className="field-label">Tax rate (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="field font-mono"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </label>
          <div className="card-quiet">
            <div className="flex justify-between text-[14px] py-1">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[14px] py-1">
              <span className="text-ink-muted">Tax</span>
              <span className="font-mono">{formatCurrency(taxAmount)}</span>
            </div>
            <Hairline className="my-2" />
            <div className="flex justify-between text-[16px] font-semibold">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="field-label">
            Notes{" "}
            <span className="text-ink-muted font-body normal-case tracking-normal">
              (optional)
            </span>
          </span>
          <textarea
            className="field"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Payment via bank transfer to the account on file."
          />
        </label>

        {error ? <Feedback tone="error">{error}</Feedback> : null}
        <div className="flex gap-3">
          <Button type="submit" loading={loading} loadingLabel="Saving…">
            Save draft
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/invoices")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
