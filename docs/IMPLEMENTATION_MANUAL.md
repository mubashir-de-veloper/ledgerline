# Ledgerline — Implementation & Running Manual

## Table of Contents

1. [What this app does](#what-this-app-does)
2. [Database schema](#database-schema)
3. [Running locally](#running-locally)
4. [Deploying to Vercel](#deploying-to-vercel)
5. [API reference](#api-reference)
6. [Authentication & authorization](#authentication--authorization)
7. [Data flow walkthroughs](#data-flow-walkthroughs)
8. [Troubleshooting](#troubleshooting)

---

## What this app does

Ledgerline is a small billing SaaS for independent studios and small businesses. It handles:

- **Clients** — a directory of the people and companies you bill
- **Invoices** — line-item bills with tax, that move from draft → sent → paid
- **Payments** — a simulated ledger of every payment recorded against an invoice
- **Subscriptions** — recurring plans with billing intervals and next-billing dates
- **Dashboard** — KPIs (outstanding, paid, overdue, MRR) and recent activity
- **Audit report** — a page documenting the intentional flaws and their fixes

**No real money moves.** All payments are recorded as database rows labeled `simulated: true`. Stripe test mode is documented as a stretch goal.

---

## Database schema

### ER Diagram (text)

```
users (owner)
  │
  ├───→ clients
  │        │
  │        ├───→ invoices
  │        │         ├───→ invoice_items
  │        │         └───→ payments
  │        │
  │        └───→ subscriptions
  │
  └───→ audit_logs
```

### Table definitions

#### `users`
| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `email` | `text` | NOT NULL, UNIQUE | Login email (lowercased) |
| `name` | `text` | NOT NULL | Display name |
| `company_name` | `text` | NOT NULL | Business name used in invoice "From" block |
| `password_hash` | `text` | NOT NULL | `salt:scrypt_hash` format |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | When the account was created |

**Ownership note:** Every other table has an `owner_id` FK to `users.id` with `ON DELETE CASCADE`. Deleting a user cleans up their entire workspace.

#### `clients`
| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `owner_id` | `uuid` | NOT NULL, FK → `users.id` | The user who owns this client |
| `name` | `text` | NOT NULL | Client's contact person |
| `email` | `text` | NOT NULL | Client's email |
| `company` | `text` | NULL | Client's business name (optional) |
| `address` | `text` | NULL | Client's mailing address (optional) |
| `notes` | `text` | NULL | Free-form notes (optional) |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | When added |

**Index:** `clients_owner_idx` on `owner_id` — every query filters by this.

#### `invoices`
| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique identifier |
| `owner_id` | `uuid` | NOT NULL, FK → `users.id` | The user who created the invoice |
| `client_id` | `uuid` | NOT NULL, FK → `clients.id` | Which client this invoice is for |
| `number` | `text` | NOT NULL | Auto-generated: `INV-2026-001` |
| `status` | `enum invoice_status` | NOT NULL, DEFAULT 'draft' | `draft` / `sent` / `paid` / `overdue` / `void` |
| `issue_date` | `timestamp` | NOT NULL | When the invoice was issued |
| `due_date` | `timestamp` | NOT NULL | When payment is due |
| `subtotal` | `numeric(12,2)` | NOT NULL, DEFAULT 0 | Sum of all line items (before tax) |
| `tax_rate` | `numeric(5,2)` | NOT NULL, DEFAULT 0 | Tax percentage as a number (e.g., 8.5) |
| `tax_amount` | `numeric(12,2)` | NOT NULL, DEFAULT 0 | Computed: `subtotal × tax_rate / 100` |
| `total` | `numeric(12,2)` | NOT NULL, DEFAULT 0 | `subtotal + tax_amount` |
| `paid_amount` | `numeric(12,2)` | NOT NULL, DEFAULT 0 | Running total of all payments recorded |
| `notes` | `text` | NULL | Free-form notes visible on the invoice |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | When created |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() | When last modified |

**Indexes:** `invoices_owner_idx` on `owner_id`, `invoices_number_owner_idx` on `(number, owner_id)` for fast lookups by invoice number.

**Computed fields:** All totals are computed server-side from `invoice_items` and `tax_rate`. Never trusted from the client.

#### `invoice_items`
| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique identifier |
| `invoice_id` | `uuid` | NOT NULL, FK → `invoices.id`, CASCADE | The invoice this line item belongs to |
| `description` | `text` | NOT NULL | Human-readable description of the work |
| `quantity` | `numeric(10,2)` | NOT NULL, DEFAULT 1 | Number of units billed |
| `unit_price` | `numeric(12,2)` | NOT NULL | Price per unit |
| `amount` | `numeric(12,2)` | NOT NULL | `quantity × unit_price` (precomputed) |

**Cascade delete:** Deleting an invoice deletes its line items.

#### `subscriptions`
| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique identifier |
| `owner_id` | `uuid` | NOT NULL, FK → `users.id` | The user who owns this subscription |
| `client_id` | `uuid` | NOT NULL, FK → `clients.id` | Which client is subscribed |
| `plan_name` | `text` | NOT NULL | e.g., "Design retainer — standard" |
| `amount` | `numeric(12,2)` | NOT NULL | Recurring amount per interval |
| `interval` | `enum subscription_interval` | NOT NULL, DEFAULT 'monthly' | `monthly` / `quarterly` / `yearly` |
| `status` | `enum subscription_status` | NOT NULL, DEFAULT 'active' | `active` / `paused` / `cancelled` / `trial` |
| `next_billing_date` | `timestamp` | NOT NULL | When this subscription renews |
| `started_at` | `timestamp` | NOT NULL, DEFAULT NOW() | When the subscription started |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | When added |

#### `payments`
| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique identifier |
| `owner_id` | `uuid` | NOT NULL, FK → `users.id` | The user who recorded the payment |
| `invoice_id` | `uuid` | NOT NULL, FK → `invoices.id`, CASCADE | Which invoice this payment applies to |
| `amount` | `numeric(12,2)` | NOT NULL | Payment amount |
| `method` | `enum payment_method` | NOT NULL, DEFAULT 'mock_card' | `mock_card` / `mock_bank` / `mock_stripe_test` / `manual` |
| `reference` | `text` | NOT NULL | A unique reference ID (e.g., `mock_txn_a3b5c7d9`) |
| `recorded_at` | `timestamp` | NOT NULL, DEFAULT NOW() | When the payment was recorded |
| `simulated` | `boolean` | NOT NULL, DEFAULT true | Always `true` in current build |

**Cascade delete:** Deleting an invoice deletes all recorded payments.

#### `audit_logs`
| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Unique identifier |
| `owner_id` | `uuid` | NOT NULL, FK → `users.id` | The user who performed the action |
| `action` | `text` | NOT NULL | e.g., `invoice.paid`, `subscription.created` |
| `entity` | `text` | NOT NULL | e.g., `invoice`, `subscription` |
| `entity_id` | `text` | NULL | The ID of the entity |
| `metadata` | `text` | NULL | JSON string with context (e.g., `{ "amount": "6400.00" }`) |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() | When the action occurred |

---

## Running locally

### Prerequisites

- **Node.js** 22.x (or 20.x)
- **PostgreSQL** 16+ running locally or accessible via URL
- **npm** 11.x

### Step 1: Clone and install

```bash
git clone <your-repo>
cd ledgerline
npm install
```

### Step 2: Set up PostgreSQL

If you don't have PostgreSQL:

```bash
# macOS (with Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt install postgresql-16
sudo systemctl start postgresql

# Create the database
createdb app_db
```

### Step 3: Set environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
SESSION_SECRET=replace-with-a-random-secret-at-least-16-characters-long
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Generate a strong secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Push the schema

```bash
npx drizzle-kit push
```

This reads `src/db/schema.ts` and creates all tables in your database. The command is idempotent — it's safe to run multiple times.

### Step 5: Seed demo data

```bash
npx tsx src/db/seed.ts
```

This creates:
- 1 demo user (`demo@ledgerline.app` / `demo1234`)
- 8 clients
- 7 invoices (in various statuses)
- 6 subscriptions (monthly, quarterly, yearly)
- Recent payment history
- Sample audit log entries

### Step 6: Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Step 7: Sign in

Use the demo account:
- **Email:** `demo@ledgerline.app`
- **Password:** `demo1234`

---

## Deploying to Vercel

### Option A: Deploy via Vercel CLI

```bash
# Install the CLI
npm install -g vercel

# Log in
vercel login

# Deploy
vercel --prod
```

### Option B: Deploy via GitHub

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and click "New Project"
3. Import your repository
4. Add environment variables:
   - `DATABASE_URL` (use a hosted Postgres like Neon, Supabase, or Supabase Pooler)
   - `SESSION_SECRET` (generate a new one for production)
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel assignment URL, e.g., `https://ledgerline.vercel.app`)
5. Click "Deploy"

### Hosted Postgres options

| Service | Free tier | Notes |
|---|---|---|
| **Neon** | 512MB | Serverless Postgres, fast cold starts |
| **Supabase** | 500MB | Includes auth and RLS if you want to migrate later |
| **Railway** | $5/mo | No free tier after trial, but generous limits |
| **Your own VPS** | — | Run Postgres on a $5 DigitalOcean droplet |

### After deployment

```bash
# Run the seed script against your production database
# (replace with your production DATABASE_URL)
DATABASE_URL="postgresql://..." npx tsx src/db/seed.ts
```
# First, configure DATABASE_URL in your local .env file.
# Then run this command from the project root:
npx.cmd tsx src/db/seed.ts
---
Warning: The seed script recreates demo data. Confirm that DATABASE_URL points to the intended demo database before running it. Do not run it against a production database containing real customer data.

## API reference

All endpoints except `/api/health` and `/api/auth/login` require a valid session cookie.

### Auth

#### `POST /api/auth/login`
Sign in and set session cookie.

**Request:**
```json
{
  "email": "demo@ledgerline.app",
  "password": "demo1234"
}
```

**Response (200):**
```json
{ "ok": true, "redirectTo": "/dashboard" }
```

**Response (400):**
```json
{ "error": "Please enter your email and password." }
```

**Response (401):**
```json
{ "error": "We couldn't sign you in. Check your email and password." }
```

#### `POST /api/auth/logout`
Clear the session cookie and redirect to `/login`.

**Response (302):** Redirects to `/login`

---

### Workspace summary

#### `GET /api/me`
Returns the current user plus all clients, invoices, subscriptions, and payments.

**Response (200):**
```json
{
  "owner": { "id": "...", "email": "...", "name": "...", "companyName": "..." },
  "clients": [...],
  "invoices": [...],
  "subscriptions": [...],
  "payments": [...]
}
```

---

### Clients

#### `GET /api/clients`
List all clients for the current user.

**Response (200):**
```json
{ "clients": [...] }
```

#### `POST /api/clients`
Create a new client.

**Request:**
```json
{
  "name": "Iris Holloway",
  "email": "iris@company.com",
  "company": "Northwind Trading",
  "address": "221 Market St, San Francisco, CA",
  "notes": "Prefers net-15. Always pays early."
}
```

#### `GET /api/clients/[id]`
Get a single client with their invoices and subscriptions.

#### `PATCH /api/clients/[id]`
Update a client.

**Request:** same as POST (all fields optional)

#### `DELETE /api/clients/[id]`
Delete a client. **Blocked** if the client has any invoices or subscriptions.

**Response (409):**
```json
{
  "error": "This client has invoices or subscriptions. Archive those first, then remove the client."
}
```

---

### Invoices

#### `GET /api/invoices`
List all invoices with client info (joined query).

#### `POST /api/invoices`
Create a new invoice with line items.

**Request:**
```json
{
  "clientId": "uuid",
  "issueDate": "2026-01-15",
  "dueDate": "2026-01-29",
  "taxRate": 8.5,
  "notes": "Optional notes",
  "items": [
    { "description": "Brand identity", "quantity": 1, "unitPrice": 6400 },
    { "description": "Stationery suite", "quantity": 1, "unitPrice": 1200 }
  ]
}
```

**The server computes:** `subtotal`, `tax_amount`, `total`.

**The server generates:** The invoice number (`INV-2026-001` pattern).

**Status starts:** `draft`.

#### `GET /api/invoices/[id]`
Get a single invoice with line items, payments, client info, and owner info.

#### `POST /api/invoices/[id]` (actions)

Actions mutate the invoice state. Pass the `action` field in the body.

**Send (mark as sent):**
```json
{ "action": "send" }
```
Only works if the invoice is currently `draft`.

**Void:**
```json
{ "action": "void" }
```
Do not work if the invoice is already `paid`.

**Record payment:**
```json
{ "action": "pay", "amount": 2000.00, "method": "mock_card" }
```
- `amount` is optional; defaults to the remaining balance.
- `method` can be `mock_card`, `mock_bank`, `mock_stripe_test`, `manual`.
- If the new `paidAmount` >= `total`, status flips to `paid`.

---

### Subscriptions

#### `GET /api/subscriptions`
List all subscriptions with client info.

#### `POST /api/subscriptions`
Create a new subscription.

**Request:**
```json
{
  "clientId": "uuid",
  "planName": "Design retainer — standard",
  "amount": 3200,
  "interval": "monthly",
  "status": "active",
  "nextBillingDate": "2026-02-15"
}
```

#### `PATCH /api/subscriptions/[id]`
Update the status.

**Request:**
```json
{ "status": "paused" }
```

Valid: `active`, `paused`, `cancelled`, `trial`.

---

### Payments

#### `GET /api/payments`
List all payments with invoice and client info.

---

### Health check

#### `GET /api/health`
Returns 200 with `{ "ok": true }`. Used by deployment platforms to verify the app is alive.

---

## Authentication & authorization

### How the session works

1. **Login:** POST `/api/auth/login` verifies the password with scrypt, signs a session token with `HMAC-SHA256(payload, SESSION_SECRET)`, and sets it as an HTTP-only cookie.
2. **Cookie:** The cookie is `ledgerline_session`, valid for 7 days, `httpOnly: true`, `sameSite: "lax"`, `secure: true` in production.
3. **Verify:** Every request reads the cookie, verifies the HMAC signature, and extracts the `userId`.
4. **Authorization:** Every database query is scoped to the session's `userId`. No user can read or modify another user's data.

### Files involved

- `src/lib/auth.ts` — password hashing, session signing/verification
- `src/lib/session.ts` — cookie helpers (`getSession()`, `requireOwner()`)
- `src/app/api/me/route.ts` — exports `requireOwner()` used by every other route

### Password format

```
salt:hash
```

Example: `a3f5c7d9b1e2f4a6:f4a7c9b3e8d2f1a5...` (16-byte salt, 64-byte hash)

This is `scrypt(password, salt, 64)` from Node.js `crypto`.

---

## Data flow walkthroughs

### "Create an invoice" flow

1. User fills in the form on `/invoices/new`:
   - Pick client from `<select>`
   - Add line items
   - Set tax rate, dates, notes
2. Client-side JavaScript shows live subtotal/tax/total
3. **On submit:** POST `/api/invoices` with the raw items and tax rate
4. **Server-side:** `src/app/api/invoices/route.ts`
   - Validates inputs (positive numbers, descriptions present, tax 0–100)
   - Verifies the client belongs to this user
   - Computes subtotal, tax, total from line items
   - Generates the next invoice number scoped to the user
   - Inserts the invoice row and items in a transaction
   - Returns the new invoice ID
5. **Client-side:** `router.push(/invoices/[id])` and `router.refresh()`
6. User sees the invoice detail page with the breakdown

### "Record a payment" flow

1. User clicks "Record payment" on `/invoices/[id]`
2. A modal opens with:
   - Current remaining balance
   - Amount input (defaults to remaining)
   - Method dropdown (mock card, mock bank, mock stripe, manual)
3. **On submit:** POST `/api/invoices/[id]` with `{"action": "pay", "amount": 2000, "method": "mock_card"}`
4. **Server-side** in a transaction:
   - Validates the amount (positive, <= remaining)
   - Inserts a `payments` row with a random reference
   - Updates the invoice's `paid_amount`
   - Flips status to `paid` if `paid_amount >= total`
   - Writes an `audit_logs` row
5. **Client-side:** `router.refresh()` to see the updated state
6. The payments list on the right panel updates

### "Create a subscription" flow

1. User fills in `/subscriptions/new`:
   - Pick client
   - Plan name, amount, interval, status, next billing date
2. **On submit:** POST `/api/subscriptions` with all fields
3. **Server-side:** validates and inserts
4. The subscription appears in the list with the next billing date highlighted

---

## Troubleshooting

### "DATABASE_URL is required"

**Cause:** The `.env` file didn't load, or the variable is missing.

**Fix:**
```bash
cat .env  # confirm it exists
# if missing, copy from .env.example
cp .env.example .env
```

### "SESSION_SECRET must be at least 16 characters"

**Fix:** Edit `.env` and make the secret longer:
```env
SESSION_SECRET=0123456789abcdef0123456789abcdef
```

### "relation 'users' does not exist"

**Cause:** The schema wasn't pushed.

**Fix:**
```bash
npx drizzle-kit push
```

### "demo login doesn't work"

**Cause:** The seed script didn't run or was deleted.

**Fix:**
```bash
npx tsx src/db/seed.ts
```

### "Cannot read properties of null"

**Cause:** The session cookie expired or was deleted.

**Fix:** Sign out and sign back in.

### "npm run build fails with TypeScript errors"

**Fix:**
```bash
# Check the exact error
npm exec tsc -- --noEmit --pretty false

# Regenerate Next.js types
npx next typegen

# Then rebuild
npm run build
```

### "Another next build process is already running"

**Fix:**
```bash
# Kill stale processes
pkill -f "next build"
pkill -f node

# Then rebuild
npm run build
```

### "Can't connect to PostgreSQL on Vercel"

**Cause:** Vercel doesn't have a local Postgres. You need hosted Postgres.

**Fix:** Sign up for Neon or Supabase:
1. Create a new project
2. Copy the `DATABASE_URL` connection string
3. Paste it in Vercel's environment variables

### "Data disappears after Vercel deploys"

**Cause:** The seed script runs only on your local database.

**Fix:** Run the seed script against your production database:
```bash
# Add DATABASE_URL to your production env first
npx tsx src/db/seed.ts
```

Or run it with the production URL as an override:
```bash
DATABASE_URL="postgresql://production-url" npx tsx src/db/seed.ts
```
