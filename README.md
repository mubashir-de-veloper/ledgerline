# Ledgerline — Invoice & Subscription Management

A full-stack SaaS application for small businesses to manage clients, invoices, subscriptions, and payments. Built as a portfolio audit and rescue case study.

**Live Preview:** https://3000-ignle53rf0r5swzn7bqyr.e2b.app

## Demo Account

- **Email:** `demo@ledgerline.app`
- **Password:** `demo1234`

The demo is pre-seeded with:
- 8 clients
- 7 invoices (draft, sent, paid, overdue)
- 6 subscriptions (monthly, quarterly, yearly)
- Recent payment history

## Features

### Core Workflows
- **Client Management** — Directory with contact info, addresses, and notes
- **Invoice Creation** — Line items, tax calculation, auto-numbering, status transitions (draft → sent → paid)
- **Payment Recording** — Mock payment workflow with multiple methods (card, bank, Stripe test, manual)
- **Subscription Tracking** — Recurring plans with billing intervals, next billing dates, and status management
- **Dashboard KPIs** — Outstanding balance, paid invoices, overdue count, MRR from subscriptions

### Security & Reliability
- HTTP-only signed session cookies (HMAC-SHA256)
- Password hashing with scrypt + per-user salt
- Server-side authorization (all queries scoped to owner)
- Input validation on all API endpoints
- Foreign key constraints with cascade deletes
- Audit trail for payments and invoice status changes

### Design System
Editorial design signature with:
- **Fonts:** Bricolage Grotesque (display), Instrument Serif (italic accent), Hanken Grotesk (body), JetBrains Mono (labels)
- **Palette:** Warm cream canvas, warm ink, electric indigo accent, hot coral signal
- **Motion:** Signature ease curve, 34px rise entrance, 80ms stagger
- **Accessibility:** WCAG AA contrast, visible focus rings, reduced motion support, 44px touch targets

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL with Drizzle ORM
- **Styling:** Tailwind CSS 4
- **Auth:** Custom session cookies with Node.js crypto
- **Deployment:** Vercel-ready (builds and starts successfully)

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app pages
│   │   ├── dashboard/      # KPIs and recent activity
│   │   ├── clients/        # List, detail, new
│   │   ├── invoices/       # List, detail (with actions), new
│   │   ├── subscriptions/  # List, new
│   │   ├── payments/       # Timeline
│   │   ├── audit/          # Audit report documenting 8 flaws
│   │   └── layout.tsx      # Wraps all app pages with AppShell
│   ├── api/                # REST API routes
│   │   ├── auth/           # login, logout
│   │   ├── clients/        # CRUD
│   │   ├── invoices/       # CRUD + send/pay/void actions
│   │   ├── subscriptions/  # CRUD + status updates
│   │   ├── payments/       # List
│   │   └── me/             # Current user + all data
│   ├── login/              # Sign-in page
│   ├── page.tsx            # Marketing landing page
│   └── globals.css         # Design tokens and base styles
├── components/
│   ├── ui.tsx              # Buttons, chips, cards, fields, feedback, etc.
│   ├── shell.tsx           # Server component: AppShell, PublicHeader, PublicFooter
│   ├── sidebar.tsx         # Client component: Sidebar with usePathname
│   └── logo.tsx            # Wordmark with signal dot
├── db/
│   ├── schema.ts           # Drizzle schema (users, clients, invoices, etc.)
│   ├── index.ts            # Database connection pool
│   └── seed.ts             # Demo data seeder
└── lib/
    ├── auth.ts             # Password hashing, session signing
    ├── session.ts          # Cookie-based session helpers
    └── format.ts           # Currency, date, relative time formatters
```

## API Endpoints

### Auth
- `POST /api/auth/login` — Sign in with email + password
- `POST /api/auth/logout` — Clear session cookie

### Clients
- `GET /api/clients` — List all clients for current user
- `POST /api/clients` — Create a new client
- `GET /api/clients/[id]` — Get client with invoices and subscriptions
- `PATCH /api/clients/[id]` — Update client
- `DELETE /api/clients/[id]` — Delete client (if no invoices/subs)

### Invoices
- `GET /api/invoices` — List all invoices with client info
- `POST /api/invoices` — Create invoice with line items (server calculates totals)
- `GET /api/invoices/[id]` — Get invoice with items, payments, owner
- `POST /api/invoices/[id]` — Actions: `send`, `void`, `pay`

### Subscriptions
- `GET /api/subscriptions` — List all subscriptions with client info
- `POST /api/subscriptions` — Create a new subscription
- `PATCH /api/subscriptions/[id]` — Update status (active, paused, cancelled, trial)

### Payments
- `GET /api/payments` — List all payments with invoice and client info

### Meta
- `GET /api/me` — Current user + all clients, invoices, subscriptions, payments
- `GET /api/health` — Health check endpoint

## Audit Report

The `/audit` page documents 8 intentional flaws and their fixes:

1. **Exposed session secrets** (Critical) — Moved to env vars, added validation
2. **No authentication** (Critical) — Implemented signed session cookies
3. **Missing row-level security** (High) — All queries scoped to ownerId
4. **Plaintext passwords** (Critical) — scrypt hashing with per-user salt
5. **No input validation** (High) — Added validation for all endpoints
6. **Inconsistent error handling** (Medium) — Structured error responses
7. **No loading or empty states** (Medium) — Skeleton loaders, empty states, button loading
8. **Invoice totals calculated on client** (High) — Server-side calculation from line items

## Stretch Goals (Not Implemented)

- **Stripe test mode** — Replace mock payments with Stripe Checkout
- **Email notifications** — Send invoice PDFs and payment receipts
- **Shared workspaces** — Multi-user collaboration with role-based access
- **Error monitoring** — Sentry integration for production error tracking

## Development

```bash
# Install dependencies
npm install

# Push schema to database
npx drizzle-kit push

# Seed demo data
npx tsx src/db/seed.ts

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
SESSION_SECRET=your-secret-here-at-least-16-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

The app is production-ready and can be deployed to Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables (DATABASE_URL, SESSION_SECRET)
4. Deploy

The build passes with no TypeScript errors and all routes are generated successfully.

## Case Study

Ledgerline demonstrates a complete business workflow — from client onboarding to invoice collection — with the security and reliability expected of a real product. The code is open, the audit is transparent, and every flaw is documented with severity, risk, and fix.

This is what a rescued app looks like.

---

**Built with Next.js, Drizzle ORM, and Tailwind CSS.**
