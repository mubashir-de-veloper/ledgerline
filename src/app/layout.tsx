import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Bricolage_Grotesque,
  Instrument_Serif,
  Hanken_Grotesk,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-display",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif-accent",
  display: "swap",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ledgerline — invoices, subscriptions, paid on time.",
  description:
    "A small SaaS for independent studios and small businesses to manage clients, invoices, subscriptions, and payments.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${serif.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
