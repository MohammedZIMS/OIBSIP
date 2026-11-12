# PRD: Pizza Delivery Full-Stack Platform

**Version:** 1.0 (Draft)\
**Stack:** React.js, Node.js + Express.js, MongoDB, Razorpay (test mode)\
**Status:** Ready for engineering review

## 1. Overview

A web platform where customers browse ready-made pizzas or build their own, pay through Razorpay, and watch their order progress live. Admins manage inventory and orders from a separate, protected panel. The system decrements stock automatically on every paid order and emails the admin when any ingredient drops below a configurable threshold.

## 2. Goals and Non-Goals

### Goals

- Deliver a complete order-to-delivery flow: register, verify, build, pay, track.
- Keep inventory accurate under concurrent orders (no overselling).
- Give admins full control of stock, thresholds and order status, with changes visible to users in real time.
- Meet production-grade standards for security, error handling, logging and deployability.

### Non-Goals (v1)

- Live payments (test mode only), refunds and invoicing/GST.
- Delivery-partner app, GPS tracking, maps.
- Coupons, loyalty, multi-branch inventory.
- Native mobile apps (the web app must be responsive).

## 3. Personas

| Persona | Description | Key needs |
| --- | --- | --- |
| **Customer** | Registered user ordering pizza | Fast ordering, clear price, trustworthy payment, live status |
| **Admin** | Pizzeria operator (seeded account, not self-registered) | Stock visibility, no stock-outs, quick order handling |

## 4. User Stories and Functional Requirements

Priority: **P0** = must ship, **P1** = should ship, **P2** = nice to have.

### 4.1 Authentication and Account (User)

| ID | Requirement | Priority |
| --- | --- | --- |
| U-1 | Register with name, email, password (min 8 chars, validated client and server). Account is created as *unverified*. | P0 |
| U-2 | System emails a verification link containing a single-use, expiring token (24 h). Unverified users cannot log in or order. | P0 |
| U-3 | Resend-verification action with rate limiting. | P1 |
| U-4 | Login with email and password; server issues a JWT (access token, 1 h) and a refresh mechanism or sliding re-login (7 d). | P0 |
| U-5 | Forgot password: user submits email; system emails a reset link (token valid 1 h, single use). Response is identical whether or not the email exists, to prevent account enumeration. | P0 |
| U-6 | Reset password page accepts new password and invalidates the token and existing sessions. | P0 |
| U-7 | Logout clears client token. | P0 |

### 4.2 Menu and Dashboard (User)

| ID | Requirement | Priority |
| --- | --- | --- |
| U-8 | Dashboard lists available ready-made pizza varieties (image, name, description, price). Varieties whose required ingredients are out of stock are shown as *Unavailable*. | P0 |
| U-9 | Dashboard has an "Active Orders" section showing live status of the user's current orders and an "Order History" section. | P0 |
| U-10 | A "Build Your Own" call-to-action launches the custom builder. | P0 |

### 4.3 Custom Pizza Builder (User)

A four-step wizard with a progress indicator, back/next navigation, and preserved selections between steps.

| Step | Selection | Rule |
| --- | --- | --- |
| 1 | Pizza base | Exactly 1 of 5 options (e.g., Classic Hand-Tossed, Thin Crust, Cheese Burst, Whole Wheat, Multigrain) |
| 2 | Sauce | Exactly 1 of 5 options (e.g., Tomato Marinara, Pesto, Barbecue, Garlic White Sauce, Spicy Arrabbiata) |
| 3 | Cheese | Exactly 1 cheese type (e.g., Mozzarella, Cheddar, Vegan, Parmesan blend) |
| 4 | Vegetables | Multi-select, 0 to N (cap configurable, default 8) |

| ID | Requirement | Priority |
| --- | --- | --- |
| B-1 | Options displayed come from the inventory catalogue; out-of-stock options are disabled with a label. | P0 |
| B-2 | Next is disabled until the step's required selection is made. | P0 |
| B-3 | Running price is shown throughout (sum of component prices). | P0 |
| B-4 | Quantity selector (1 to 10) applied on the summary page. | P1 |

### 4.4 Order Summary and Payment (User)

| ID | Requirement | Priority |
| --- | --- | --- |
| O-1 | Summary page shows items, itemised components, quantity, subtotal, taxes (configurable flat %), delivery fee and total, plus a delivery address and phone field. | P0 |
| O-2 | "Pay Now" calls the backend, which re-validates stock and **recomputes the price server-side** (never trust client totals), then creates a Razorpay order. | P0 |
| O-3 | Razorpay Checkout opens in test mode. On the "Success" test outcome the client sends the payment id, order id and signature to the backend. | P0 |
| O-4 | Backend verifies the HMAC-SHA256 signature using the Razorpay key secret. Only a verified payment marks the order *Paid* and sets status *Order Received*. | P0 |
| O-5 | A Razorpay webhook (`payment.captured`) acts as a backup confirmation path if the browser closes before the callback. Handler is idempotent. | P1 |
| O-6 | On failure or dismissal, the order stays *Payment Pending/Failed*, no stock is consumed, and the user can retry. | P0 |
| O-7 | Confirmation page and confirmation email with order id and summary. | P1 |

### 4.5 Real-Time Order Tracking (User)

| ID | Requirement | Priority |
| --- | --- | --- |
| T-1 | Status lifecycle: **Order Received → In Kitchen → Sent to Delivery**. | P0 |
| T-2 | Dashboard updates within 2 seconds of an admin status change without page refresh. | P0 |
| T-3 | Transport: **Socket.IO** (JWT-authenticated, per-user rooms). Fallback: client polls `GET /orders/active` every 10 s if the socket disconnects. | P0 |
| T-4 | Visual stepper/progress bar showing the three stages with timestamps. | P1 |

### 4.6 Admin Authentication

| ID | Requirement | Priority |
| --- | --- | --- |
| A-1 | Admin accounts are created only by a seed script or CLI, never through any public endpoint or UI. | P0 |
| A-2 | Separate login page at `/admin/login` and separate endpoint `POST /api/admin/auth/login`. User credentials do not work there and vice versa. | P0 |
| A-3 | Admin JWT carries `role: admin` and a different audience claim; all `/api/admin/*` routes enforce it via middleware. | P0 |
| A-4 | Admin routes are not linked from the user UI. Failed-login rate limiting and lockout after repeated failures. | P0 |

### 4.7 Inventory Management (Admin)

| ID | Requirement | Priority |
| --- | --- | --- |
| I-1 | Dashboard shows current stock for four categories: pizza bases, sauces, cheeses, vegetables, with each item's quantity, threshold and a status chip (OK / Low / Out). | P0 |
| I-2 | **Auto-decrement**: after a payment is verified, each ingredient in the order is decremented atomically (1 unit per pizza per component, multiplied by quantity). | P0 |
| I-3 | **Manual update**: admin can set an exact quantity or add/subtract a delta for any item, with a required reason note. Changes are logged (audit trail). | P0 |
| I-4 | **Configurable threshold** per item (default: 20 for bases, 20 sauces, 20 cheeses, 20 vegetables). Editable from the dashboard. | P0 |
| I-5 | CRUD for catalogue items (name, category, price, image, active flag), since ingredients differ over time. | P1 |
| I-6 | Stock cannot go below zero; a conflict returns an error and the order is flagged for admin review. | P0 |

### 4.8 Low-Stock Alerts (Admin)

| ID | Requirement | Priority |
| --- | --- | --- |
| N-1 | A `node-cron` job runs every 15 minutes (configurable via env) and finds items with `quantity < threshold`. | P0 |
| N-2 | Sends one consolidated email via Nodemailer (SMTP) to the admin address(es) listing every low item with current quantity and threshold. | P0 |
| N-3 | **De-duplication:** each item carries `lowStockAlertedAt`. It is not re-alerted until restocked above threshold (flag reset) or a configurable cool-down (default 24 h) elapses. | P0 |
| N-4 | Alert also triggered immediately after an order drops an item below threshold (event-driven), in addition to the schedule. | P2 |
| N-5 | Job failures are logged and do not crash the server. | P0 |

### 4.9 Order Management (Admin)

| ID | Requirement | Priority |
| --- | --- | --- |
| M-1 | Orders table: id, customer, items, total, payment state, status, created time; filter by status and date; pagination; newest first. | P0 |
| M-2 | New paid orders appear live (Socket.IO admin room) with an audible/visual cue. | P1 |
| M-3 | Admin can advance status via a dropdown or button. Allowed transitions are forward-only: Received → In Kitchen → Sent to Delivery. Invalid transitions are rejected. | P0 |
| M-4 | Each status change is persisted with timestamp and admin id, then emitted to the owning user's socket room. | P0 |
| M-5 | Order detail view with full component list and delivery details. | P1 |

## 5. Key Flows

### 5.1 Order flow

1. User completes builder, opens summary.
2. `POST /api/orders` validates items and stock, computes total, creates `Order(status: pending_payment)` and a Razorpay order.
3. Client opens Checkout; user chooses "Success" in test mode.
4. `POST /api/payments/verify` checks the signature, then in one MongoDB transaction: marks order paid, sets status *Order Received*, decrements stock with conditional `$inc` (`quantity >= needed`).
5. Server emits `order:new` to the admin room and `order:update` to the user room.
6. Admin advances status; user dashboard updates live.

### 5.2 Concurrency rule

Stock decrement uses `findOneAndUpdate({ _id, quantity: { $gte: n } }, { $inc: { quantity: -n } })` inside a transaction (MongoDB replica set required, Atlas works). If any component fails, the whole transaction aborts and the payment is flagged for manual review.

## 6. Data Model (MongoDB / Mongoose)

**User:** `name, email (unique, indexed), passwordHash (bcrypt, cost 12), isVerified, verifyTokenHash, verifyTokenExpires, resetTokenHash, resetTokenExpires, createdAt`

**Admin:** `email (unique), passwordHash, failedAttempts, lockedUntil`

**InventoryItem:** `name, category (base | sauce | cheese | veggie), price, quantity, threshold, isActive, imageUrl, lowStockAlertedAt`

**Pizza (ready-made variety):** `name, description, imageUrl, price, components: { base, sauce, cheese, veggies[] }, isAvailable (derived)`

**Order:** `user, items[{ type: preset | custom, pizzaRef?, base, sauce, cheese, veggies[], qty, unitPrice }], subtotal, tax, deliveryFee, total, address, phone, payment{ razorpayOrderId, razorpayPaymentId, signature, state }, status, statusHistory[{ status, at, by }], createdAt`

**StockLog:** `item, delta, reason (order | manual | correction), orderRef?, adminRef?, at`

## 7. API Surface (summary)

| Area | Endpoints |
| --- | --- |
| Auth (user) | `POST /api/auth/register`, `GET /api/auth/verify-email?token=`, `POST /api/auth/resend-verification`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Catalogue | `GET /api/pizzas`, `GET /api/ingredients?category=` |
| Orders (user) | `POST /api/orders`, `GET /api/orders/mine`, `GET /api/orders/active` |
| Payments | `POST /api/payments/verify`, `POST /api/payments/webhook` |
| Admin auth | `POST /api/admin/auth/login` |
| Admin inventory | `GET /api/admin/inventory`, `PATCH /api/admin/inventory/:id` (quantity, threshold), `POST/PUT/DELETE` for catalogue items |
| Admin orders | `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status` |
| Realtime events | `order:new` (to admin), `order:update` (to user), `inventory:update` (to admin) |

## 8. Architecture

- **Frontend:** React (Vite), React Router, state via Context or Redux Toolkit, Axios with interceptors, Socket.IO client, Tailwind or MUI. Protected routes by role.
- **Backend:** Express with layered structure (routes, controllers, services, models), `express-validator` or Zod, centralized error handler, Winston/Pino logging.
- **Database:** MongoDB Atlas (replica set for transactions), indexes on `email`, `order.user`, `order.status`, `inventory.category`.
- **Jobs:** `node-cron` inside the API process for v1 (note: run on a single instance, or move to a worker if scaled horizontally).
- **Email:** Nodemailer with SMTP (Gmail app password, Mailtrap or SendGrid in dev).
- **Payments:** Razorpay Node SDK, test keys in environment variables.
- **Config:** `.env` for `MONGO_URI, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, SMTP_*, ADMIN_ALERT_EMAILS, CRON_SCHEDULE, CLIENT_URL`.

## 9. Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| **Security** | bcrypt hashing; verification/reset tokens stored hashed and single-use; Helmet; CORS allow-list; rate limiting on auth routes; input sanitisation against NoSQL injection and XSS; secrets only in env; HTTPS in production; signature verification on all payment confirmations |
| **Performance** | API p95 under 300 ms for reads; status updates delivered under 2 s |
| **Reliability** | Idempotent payment verification and webhook; graceful handling of Razorpay or SMTP outages; cron failures isolated |
| **Accessibility** | WCAG 2.1 AA basics: keyboard navigable wizard, labels, contrast |
| **Responsiveness** | Usable from 360 px mobile to desktop |
| **Observability** | Structured logs with request ids; audit trail for stock and status changes |
| **Testing** | Unit tests for pricing, stock and transition logic; integration tests (Jest + Supertest) for auth, order and payment verification; a few end-to-end tests (Playwright or Cypress) for the happy path |
| **Deployability** | Dockerfile or documented deploy to Render/Railway (API) and Vercel/Netlify (client); seed script for admin and sample catalogue |

## 10. Success Metrics

- 100% of verified-payment orders correctly decrement stock (zero negative-stock records).
- Status change to user UI latency under 2 s in 95% of cases.
- Low-stock email delivered within one cron interval of crossing the threshold, with no duplicate spam.
- Full happy path (register to tracked order) completes in under 3 minutes for a new user.

## 11. Acceptance Criteria (Feature Checklist Mapping)

- [ ] Registration sends a verification email; login blocked until verified.
- [ ] Login returns JWT; protected routes reject missing or expired tokens.
- [ ] Forgot-password email link resets the password once, then expires.
- [ ] Dashboard lists varieties; unavailable ones are marked.
- [ ] Builder enforces steps 1 to 4 with 5 bases, 5 sauces, a cheese choice and multi-select vegetables.
- [ ] Summary page shows server-validated totals before payment.
- [ ] Razorpay test "Success" confirms the order; failure does not.
- [ ] User dashboard shows Order Received, In Kitchen, Sent to Delivery in real time.
- [ ] Admin login is separate; no admin signup exists anywhere.
- [ ] Admin sees stock for bases, sauces, cheeses, vegetables.
- [ ] Stock decrements automatically after each paid order.
- [ ] Admin can manually update stock and thresholds.
- [ ] Cron job emails admin when an item falls below threshold, without duplicates.
- [ ] Admin order panel lists orders and updates status; user sees the change live.

## 12. Milestones (suggested, about 4 weeks)

| Week | Deliverables |
| --- | --- |
| 1 | Repo and tooling, Mongo models, user auth with email verification and password reset, admin seed and login |
| 2 | Catalogue and inventory APIs, admin inventory dashboard, dashboard and builder UI |
| 3 | Order creation, Razorpay integration and verification, atomic stock decrement, summary page |
| 4 | Socket.IO tracking, admin order panel, node-cron low-stock emails, testing, hardening, deployment, docs |

## 13. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Overselling under concurrent orders | Conditional atomic `$inc` inside transactions |
| Payment succeeds but browser closes | Webhook backup, idempotent handlers |
| Alert email spam | `lowStockAlertedAt` de-duplication and cool-down |
| Cron runs twice when scaled | Single-instance for v1; document move to a worker or a lock |
| Email deliverability | Use a transactional provider in production; SPF/DKIM |
| Admin account exposure | Seed-only creation, separate audience claim, lockout, rate limits |

## 14. Assumptions and Open Questions

**Assumptions:** one shop, one currency (INR), delivery-fee and tax are flat configurable values, one unit of each component per pizza.

**Open questions:**

1. Should ready-made pizzas have fixed recipes that also consume stock? (This PRD assumes yes.)
2. Is cancellation allowed after payment, and who handles refunds?
3. Should vegetable quantity per pizza be capped for pricing, or priced per topping? (Assumed per topping with a cap.)
4. Is one admin account enough, or are multiple admin accounts with roles needed?
5. Should verification links be single-device only, or open on any device? (Assumed any device.)

## 15. Reference Resources

- Razorpay official docs: Standard Checkout quickstart for Node.js (test mode, signature verification, webhooks).
- Nodemailer documentation for SMTP setup.
- node-cron documentation for schedule syntax.
- Socket.IO documentation for authentication and rooms.
- A recent end-to-end MERN tutorial for project structure reference.
