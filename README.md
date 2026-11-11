# Apparel Distribution ERP

A MERN-stack ERP for a multi-brand clothing distributor (men, women, kids): employees, salary, brands and sub-brands, parties,
bookings, GST invoices with stock deduction, targets, payments, attendance, reports and audit trail, with **3 Super Admins**, **many scoped Admins** and **salespeople**.

Design document (diagrams, access matrix, ER model): [`docs/Apparel_Distribution_ERP_Documentation.pdf`](docs/Apparel_Distribution_ERP_Documentation.pdf)

```
apparel-erp/
  server/                     Node.js + Express + Mongoose API
    src/
      config/                 env validation, db, roles/permissions (single source of truth)
      middleware/             auth, rate limit, validation, error handling
      models/                 Mongoose models (User, Employee, Brand, Party, Booking, Target, ...)
      validators/             zod schemas (every request body is validated and stripped)
      services/               permissions, scope, tokens, audit, achievement, salary, reports
      modules/<feature>/      routes (+ controller where custom): auth, admins, employees, brands, parties, bookings, ...
      utils/                  generic scope-aware CRUD factory, crypto, helpers
      seed/                   Super Admin creation + optional demo data
    tests/                    security + unit tests (node:test)
  client/                     React 18 + Vite + Tailwind
    src/
      app/                    Auth + Theme providers
      components/ui/          Button, Card, Modal, Badge, Input, ...
      components/data/        DataTable (config-driven), Pagination
      components/form/        DynamicForm + FieldRenderer (schema-driven forms)
      components/resource/    ResourcePage (one generic CRUD screen)
      components/layout/      AppShell, sidebar, top bar
      config/resources/       one config file per module (columns, fields, filters, row actions)
      pages/                  Dashboard, Reports, Security, Login, ...
  docs/                       PDF design documentation
  docker-compose.yml          MongoDB + API + web (nginx)
```

## Quick start (development)

Requirements: Node 18.18+ (Node 20 recommended) and MongoDB 6/7 running locally (or an Atlas URI).

```bash
# 1. API
cd server
cp .env.example .env            # generate real secrets and set COMPANY_NAME / COMPANY_GSTIN / COMPANY_STATE
npm install
npm run seed:demo               # creates the 3 Super Admins (passwords printed ONCE) + demo data
npm run dev                     # http://localhost:5000

# 2. Web (second terminal)
cd client
npm install
npm run dev                     # http://localhost:5173  (proxies /api to the API)
```

Demo logins created by `seed:demo` (password for all: `Demo@12345678`): `admin@example.com`, `sales1@example.com` ... `sales5@example.com`.
Super Admins (`superadmin1..3@example.com`) get random passwords printed by the seed command and must change them at first sign-in.
`seed:demo` refuses to run when `NODE_ENV=production`.

For real use run `npm run seed` (Super Admins only) or create each Super Admin explicitly:
`npm run create-super-admin -- --name "Asha Verma" --email asha@company.com`. The maximum (default 3) is enforced.

Tests: `cd server && npm test`.

## Roles

| Role | Count | What they can do |
|---|---|---|
| Super Admin | exactly 3 (`MAX_SUPER_ADMINS`) | Everything, including creating Admins, approving, reading audit logs. Created only from the server CLI/seed. |
| Admin | many | Only the modules and actions a Super Admin grants (view / add / edit / delete / approve), optionally limited to chosen **brands** and **regions**. |
| Salesperson | many | Own parties, own bookings, own targets, own attendance and salary slips. Created from Employees > "Set or reset login". |

Permissions live in `server/src/config/permissions.js` and are checked **on the server** for every request; the UI only hides what you cannot do.

## Security built in

- Passwords hashed with bcrypt (cost 12), strong password policy, forced change after a temporary password.
- Short-lived access token (15 min, held in memory only) + rotating single-use refresh token in an `httpOnly`, `SameSite=Strict`, path-restricted cookie. Reusing an old refresh token revokes all sessions. Changing a password invalidates every older token.
- Account lockout after 5 failed logins, constant-time-ish handling of unknown emails, login/refresh rate limits, global rate limit.
- Optional/mandatory TOTP two-factor (`REQUIRE_2FA_SUPER_ADMIN=true` forces Super Admins to enable it).
- Role + permission + data-scope checks on every endpoint; scoped queries prevent reading other people's records (IDOR tests included).
- zod validation on every body (unknown fields stripped, so no mass-assignment of totals, status or approval), NoSQL-injection sanitising, HPP, body size limit, strict CORS allowlist, Helmet headers, CSP in nginx.
- Bank account numbers encrypted with AES-256-GCM (only last 4 shown); Aadhaar stored as last 4 digits only.
- Append-only audit log of logins, creates, updates, deletes, approvals and status changes; soft deletes everywhere.
- Money stored as integer paise; booking totals computed on the server.
- The server refuses to start in production with default or reused secrets.

## Business rules implemented

- **Bookings**: draft > booked > confirmed > dispatched > delivered (or cancelled). Only approvers confirm. A discount above the brand limit, or a credit-limit breach, requires an approver's decision before confirmation.
- **Targets**: per employee, brand (and optional sub-brand) and period. Achievement is calculated live from confirmed bookings; incentive slabs in `permissions.js` (`INCENTIVE_SLABS`).
- **GST invoices**: created from a confirmed booking (Bookings > "Create GST invoice"). Booking rates are treated as **excluding GST**; tax = taxable value x the brand's GST rate. If the party's state equals `COMPANY_STATE` the tax is split into CGST + SGST, otherwise it is IGST. Totals are rounded to the whole rupee with a round-off line. Numbers look like `INV-2026-27-00001` (Indian financial year). Issued invoices are snapshots (seller, buyer, rates) and can only be cancelled with a reason, which returns stock and lets the booking be invoiced again. Print or save as PDF from the invoice screen; export a month as CSV (taxable, CGST, SGST, IGST, total) for your accountant.
- **Stock**: booking lines linked to a catalog product (with size and color) deduct the matching size/color stock row when the invoice is issued, atomically and all-or-nothing; insufficient stock blocks the invoice with a clear message.
- **Outstanding** per party = issued invoices (GST inclusive) + confirmed bookings not yet invoiced - payments received.
- **Payroll**: monthly run creates draft records from salary structure, attendance and incentives; approve then pay; approved/paid records are locked.

## Deploy (Docker)

```bash
cp .env.example .env            # fill every value (the compose file refuses to start with blanks)
docker compose up -d --build
docker compose exec server npm run seed
```

Put HTTPS in front of port 8080 (Caddy, Cloudflare, a cloud load balancer). Keep client and API on the same domain. Back up the `mongo_data` volume daily and test a restore.

## Adding a new module

1. Server: add a model, a zod schema, and `modules/<name>/<name>.routes.js` using `createCrud` + `crudRoutes`, then mount it in `routes.js`.
2. Client: add `config/resources/<name>.jsx` (columns, fields, filters, row actions) and one line in `App.jsx`. The table, form, validation errors, permissions and pagination come for free.

## What is and is not included (read this)

Included and exercised against a Mongo-compatible database (FerretDB, not MongoDB itself): auth flows (login, forced password change, refresh rotation and reuse detection, lockout), RBAC and scope checks, CRUD for every module, booking approvals and status flow, payroll, reports, dashboard and audit log.

Not included yet (planned in the design document):
- GST e-invoice (IRN/QR) and e-way bill generation, credit notes for returns, and a direct Tally XML export (use the invoice CSV for now).
- Stock reservation at booking time (stock is deducted when the invoice is issued, not when the order is booked).
- Invoice numbers are sequential but not guaranteed gapless if a database error happens mid-issue; check this with your accountant.
- WhatsApp/email notifications, PDF salary slips, file uploads for employee documents, the party portal.
- Party-brand and employee-brand mappings are stored inside the Party and Employee documents (not separate collections like the ER diagram) to keep editing simple.

Before going live: review with your accountant (payroll, incentive and GST rules), have someone independent security-test it, and confirm
personal-data obligations for employee records with a legal advisor. Have your accountant check the GST logic (rates per brand, treatment of discounts, place of supply) against your real invoices.

Testing status: server unit/security tests (`npm test`), a live end-to-end API run, and a render check of every table, form, invoice view and the dashboard against real API data all passed. The UI has **not** been looked at in a real browser (colors, spacing, dark mode, mobile layout and chart appearance are unverified), and the API has not been run against real MongoDB, only a compatible database. Click through every screen before relying on it.
