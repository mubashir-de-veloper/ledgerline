
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ledgerline — invoices, subscriptions, paid on time.",
  description:
    "A small SaaS for independent studios and small businesses to manage clients, invoices, subscriptions, and payments.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="font-variables"
    >
      <body className="bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
