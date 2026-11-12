# TRD: Pizza Delivery Full-Stack Platform

**Version:** 1.0 (Draft)
**Companion to:** PRD: Pizza Delivery Full-Stack Platform
**Stack:** React (Vite), Node.js 20 LTS + Express 4, MongoDB 7 (Atlas, replica set), Socket.IO 4, Razorpay (test mode), Nodemailer, node-cron

---

## 1. Purpose and Scope

This document specifies *how* the requirements in the PRD are implemented: architecture, data schemas, API contracts, security design, payment/stock/real-time/cron mechanics, testing and deployment. Where the PRD says *what*, this TRD says *how*, and is the source of truth for engineering decisions.

## 2. System Architecture

```
 ┌────────────────────┐        HTTPS (REST, JSON)         ┌──────────────────────────┐
 │  React SPA (Vite)  │ ────────────────────────────────▶ │  Express API             │
 │  - User app        │ ◀──────────────────────────────── │  - routes/controllers    │
 │  - Admin app       │        WebSocket (Socket.IO)      │  - services              │
 │  - Razorpay JS     │ ◀───────────────────────────────▶ │  - Socket.IO server      │
 └─────────┬──────────┘                                   │  - node-cron scheduler   │
           │ Checkout (popup)                             └───────┬───────────┬──────┘
           ▼                                                      │           │
 ┌────────────────────┐   webhook (payment.captured)              ▼           ▼
 │  Razorpay (test)   │ ────────────────────────────────▶  ┌───────────┐  ┌────────────┐
 └────────────────────┘                                    │ MongoDB   │  │ SMTP       │
                                                           │ (Atlas)   │  │ provider   │
                                                           └───────────┘  └────────────┘
```

**Design principles**

- Layered backend: `routes → controllers → services → models`. Business rules live only in services.
- Server is the source of truth for prices, stock and status transitions. The client is never trusted.
- Stateless API (JWT) so it can scale horizontally; the only stateful pieces are Socket.IO rooms and the cron job (see §11 and §12).
- Idempotent handlers for anything touched by external callbacks (payment verify, webhook).

## 3. Technology Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Frontend build | Vite + React 18 | Fast dev, simple config |
| Routing | React Router v6 | Nested role-guarded routes |
| State | Redux Toolkit + RTK Query (or Context + Axios) | Cache and invalidate order/inventory data |
| Styling | Tailwind CSS | Rapid responsive UI |
| Forms/validation | React Hook Form + Zod | Shared schema style with backend |
| Backend | Express 4, Node 20 | Required stack |
| Validation | Zod (server) | Typed, composable request schemas |
| DB/ODM | MongoDB 7 + Mongoose 8 | Required stack; transactions need replica set |
| Auth | `jsonwebtoken`, `bcryptjs` | JWT requirement |
| Realtime | Socket.IO | Rooms, auth middleware, auto-reconnect, polling fallback |
| Payments | `razorpay` Node SDK | Official SDK, test mode |
| Email | Nodemailer (SMTP) | Required |
| Scheduling | node-cron | Required |
| Security | Helmet, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `hpp` | Standard hardening |
| Logging | Pino + pino-http | Structured logs with request ids |
| Tests | Jest, Supertest, mongodb-memory-server (replset), Vitest + RTL, Playwright | Unit, integration, E2E |
| Tooling | ESLint, Prettier, Husky + lint-staged | Consistency |

## 4. Repository Layout

Monorepo with two packages.

```
pizza-platform/
├── client/
│   ├── src/
│   │   ├── api/            # axios instance, RTK Query slices
│   │   ├── app/            # store, router, route guards
│   │   ├── features/
│   │   │   ├── auth/       # register, login, verify, forgot/reset
│   │   │   ├── menu/       # dashboard, pizza cards
│   │   │   ├── builder/    # 4-step wizard
│   │   │   ├── checkout/   # summary, Razorpay launcher
│   │   │   ├── orders/     # live tracking, history
│   │   │   └── admin/      # login, inventory, orders
│   │   ├── hooks/          # useSocket, useOrdersLive
│   │   ├── components/     # shared UI
│   │   └── main.jsx
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/         # env.js (validated), db.js, logger.js, mailer.js, razorpay.js
│   │   ├── models/         # User, Admin, InventoryItem, Pizza, Order, StockLog
│   │   ├── routes/         # auth, catalogue, orders, payments, admin/*
│   │   ├── controllers/
│   │   ├── services/       # authService, pricingService, orderService, paymentService,
│   │   │                   # inventoryService, emailService, alertService
│   │   ├── middleware/     # auth, adminAuth, validate, rateLimit, error, notFound
│   │   ├── sockets/        # index.js (auth + rooms), emitters.js
│   │   ├── jobs/           # lowStockJob.js
│   │   ├── utils/          # tokens.js, asyncHandler.js, ApiError.js
│   │   ├── scripts/        # seedAdmin.js, seedCatalogue.js
│   │   ├── app.js          # express app (no listen, for tests)
│   │   └── server.js       # http server, socket, cron bootstrap
│   └── tests/
├── docker-compose.yml
└── README.md
```

## 5. Environment Configuration

Validated at boot with Zod; the process exits if required variables are missing.

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000

# Database (replica set required for transactions)
MONGO_URI=mongodb+srv://...

# Auth
JWT_SECRET=<32+ random bytes>
JWT_ADMIN_SECRET=<different 32+ random bytes>
JWT_EXPIRES_IN=1h
JWT_ADMIN_EXPIRES_IN=30m

# Razorpay (test)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Pizza Shop <no-reply@example.com>"
ADMIN_ALERT_EMAILS=admin@example.com

# Jobs
LOW_STOCK_CRON=*/15 * * * *
LOW_STOCK_COOLDOWN_HOURS=24
RUN_CRON=true

# Business
TAX_PERCENT=5
DELIVERY_FEE=40
MAX_VEGGIES=8
```

Client uses `VITE_API_URL` and `VITE_RAZORPAY_KEY_ID` (the public key id only; the secret never reaches the client).

## 6. Data Model (Mongoose)

### 6.1 User
```js
{
  name: String (required, trim, 2-60),
  email: String (required, unique, lowercase, index),
  passwordHash: String (required, select: false),
  isVerified: { type: Boolean, default: false },
  verifyTokenHash: { type: String, select: false },
  verifyTokenExpires: Date,
  resetTokenHash: { type: String, select: false },
  resetTokenExpires: Date,
  passwordChangedAt: Date,       // invalidates older JWTs
  timestamps: true
}
```

### 6.2 Admin
```js
{
  email: { unique, lowercase },
  passwordHash: { select: false },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  passwordChangedAt: Date,
  timestamps: true
}
```
Stored in a **separate collection** from users, so no user can ever acquire admin rights by field manipulation.

### 6.3 InventoryItem
```js
{
  name: String (required),
  category: { enum: ['base','sauce','cheese','veggie'], index },
  price: Number (>= 0, in paise),
  quantity: { type: Number, min: 0, required },
  threshold: { type: Number, min: 0, default: 20 },
  isActive: { type: Boolean, default: true },
  imageUrl: String,
  lowStockAlertedAt: Date | null,
  timestamps: true
}
// Index: { category: 1, isActive: 1 }
// Unique: { category: 1, name: 1 }
```
`quantity` has a schema-level `min: 0` and every decrement carries a `$gte` guard (see §9).

### 6.4 Pizza (ready-made variety)
```js
{
  name, description, imageUrl,
  components: {
    base: ObjectId(InventoryItem),
    sauce: ObjectId(InventoryItem),
    cheese: ObjectId(InventoryItem),
    veggies: [ObjectId(InventoryItem)]
  },
  priceOverride: Number | null,   // otherwise computed from components
  isActive: Boolean
}
```
Availability is **derived** at read time: a pizza is available only if every referenced component is active and `quantity >= 1`.

### 6.5 Order
```js
{
  user: ObjectId(User, index),
  items: [{
    kind: { enum: ['preset','custom'] },
    pizza: ObjectId(Pizza)?,
    base: ObjectId, sauce: ObjectId, cheese: ObjectId, veggies: [ObjectId],
    snapshot: { names, unitPrice },   // frozen at order time
    qty: { min: 1, max: 10 }
  }],
  subtotal, tax, deliveryFee, total,       // all in paise (integers)
  address: { line1, line2, city, pincode }, phone,
  payment: {
    razorpayOrderId: { unique, sparse, index },
    razorpayPaymentId: { unique, sparse },
    state: { enum: ['created','paid','failed'], default: 'created' },
    paidAt: Date
  },
  status: { enum: ['pending_payment','order_received','in_kitchen','sent_to_delivery'],
            default: 'pending_payment', index },
  statusHistory: [{ status, at, by: ObjectId(Admin)? }],
  needsReview: { type: Boolean, default: false },  // stock conflict after payment
  timestamps: true
}
// Index: { user: 1, createdAt: -1 }, { status: 1, createdAt: -1 }
```

### 6.6 StockLog (audit)
```js
{ item: ObjectId, delta: Number, reason: { enum: ['order','manual','correction'] },
  note: String, order: ObjectId?, admin: ObjectId?, quantityAfter: Number, at: Date }
```

### 6.7 Money handling
All monetary values are stored and computed as **integer paise** to avoid floating-point errors, and converted to rupees only for display. Razorpay also expects the smallest currency unit.

## 7. Authentication and Authorization

### 7.1 User auth
| Concern | Design |
|---|---|
| Password | bcrypt cost 12; min 8 chars with a letter and a digit |
| JWT | HS256, payload `{ sub, role: 'user', iat, exp }`, signed with `JWT_SECRET`, `aud: 'user'` |
| Transport | `Authorization: Bearer <token>`; stored in memory plus `sessionStorage`/`localStorage` for the SPA (see §7.4 for the httpOnly-cookie alternative) |
| Invalidation | Reject tokens whose `iat` precedes `passwordChangedAt` |
| Verification gate | `requireVerified` middleware blocks login and ordering when `isVerified === false` |

### 7.2 Verification and reset tokens
1. Generate `raw = crypto.randomBytes(32).toString('hex')`.
2. Store `sha256(raw)` and expiry in the user document; email only the raw token.
3. On use, hash the submitted token, find the match with `expires > now`, apply the effect, then **unset** both fields (single use).
4. Verification TTL 24 h; reset TTL 1 h.

Email link formats:
- `${CLIENT_URL}/verify-email?token=<raw>` (SPA page calls the API)
- `${CLIENT_URL}/reset-password?token=<raw>`

Forgot-password always returns `200` with the same body regardless of whether the email exists.

### 7.3 Admin auth
- Separate model, endpoint (`POST /api/admin/auth/login`), secret (`JWT_ADMIN_SECRET`), audience (`aud: 'admin'`), and shorter lifetime.
- `adminAuth` middleware verifies with the admin secret and audience, loads the admin, and rejects otherwise. A user token fails signature verification on admin routes by construction.
- Lockout: after 5 failed attempts, `lockedUntil = now + 15 min`; reset the counter on success.
- No registration route exists. Admins are created by `npm run seed:admin -- --email x --password y`.
- Generic error message "Invalid credentials" for any login failure.

### 7.4 Token storage note
Default for v1: bearer token in memory with `localStorage` persistence (simple, works with Socket.IO auth handshake). Accepted risk is XSS token theft, mitigated by Helmet CSP, output escaping (React default) and short expiries. Recommended upgrade path: httpOnly + SameSite=Lax cookies plus CSRF token.

### 7.5 Route protection matrix
| Route group | Middleware chain |
|---|---|
| `/api/auth/*` | `rateLimit(auth)`, `validate` |
| `/api/pizzas`, `/api/ingredients` | public read |
| `/api/orders/*` | `auth`, `requireVerified`, `validate` |
| `/api/payments/verify` | `auth`, `requireVerified`, `validate` |
| `/api/payments/webhook` | raw body, signature check, no JWT |
| `/api/admin/auth/login` | `rateLimit(adminAuth)`, `validate` |
| `/api/admin/*` | `adminAuth` |

## 8. API Contracts

Base path `/api`. All responses JSON. Errors use a uniform envelope:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ { "path": "email", "message": "Invalid" } ] } }
```

Standard codes: `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `OUT_OF_STOCK` 409, `RATE_LIMITED` 429, `INTERNAL` 500.

### 8.1 Auth (user)

| Method & Path | Body | Success |
|---|---|---|
| `POST /auth/register` | `{name,email,password}` | `201 {message}` (verification email sent) |
| `GET /auth/verify-email?token=` | | `200 {message}` |
| `POST /auth/resend-verification` | `{email}` | `200 {message}` (generic) |
| `POST /auth/login` | `{email,password}` | `200 {token,user:{id,name,email}}`; `403 EMAIL_NOT_VERIFIED` if unverified |
| `POST /auth/forgot-password` | `{email}` | `200 {message}` (generic) |
| `POST /auth/reset-password` | `{token,password}` | `200 {message}` |
| `GET /auth/me` | | `200 {user}` |

### 8.2 Catalogue

| Method & Path | Notes |
|---|---|
| `GET /pizzas` | Active presets with derived `available` flag and computed `price` |
| `GET /ingredients?category=base\|sauce\|cheese\|veggie` | Active items: `{id,name,price,imageUrl,inStock}`. Raw quantity is **not** exposed to users |

### 8.3 Orders (user)

**`POST /orders`**
```json
{
  "items": [
    { "kind": "preset", "pizzaId": "…", "qty": 1 },
    { "kind": "custom", "baseId": "…", "sauceId": "…", "cheeseId": "…", "veggieIds": ["…","…"], "qty": 2 }
  ],
  "address": { "line1": "…", "city": "…", "pincode": "…" },
  "phone": "+91…"
}
```
Behavior: validate, resolve components, check availability (read-only check, no decrement yet), compute totals server-side, create the order as `pending_payment`, create a Razorpay order, return:
```json
{ "orderId": "…", "razorpayOrderId": "order_xxx", "amount": 45900, "currency": "INR", "keyId": "rzp_test_xxx", "summary": { … } }
```
Errors: `409 OUT_OF_STOCK` with the offending item names.

| Method & Path | Notes |
|---|---|
| `GET /orders/mine?page=&limit=` | Paginated history (excluding `pending_payment` unless `includePending=true`) |
| `GET /orders/active` | Orders in `order_received`, `in_kitchen`, `sent_to_delivery`; also the polling fallback |
| `GET /orders/:id` | Owner only |

### 8.4 Payments

**`POST /payments/verify`**
```json
{ "orderId": "…", "razorpay_order_id": "…", "razorpay_payment_id": "…", "razorpay_signature": "…" }
```
Success `200 { order }` with `status: "order_received"`. Details in §9.

**`POST /payments/webhook`** (Razorpay → server). Uses the raw request body; see §9.4.

### 8.5 Admin

| Method & Path | Body / Query | Notes |
|---|---|---|
| `POST /admin/auth/login` | `{email,password}` | `{token}` |
| `GET /admin/inventory` | `?category=` | Items with quantity, threshold, `status: ok\|low\|out` |
| `PATCH /admin/inventory/:id` | `{ quantity? , delta?, threshold?, note }` | Exactly one of `quantity` or `delta`; `note` required when changing stock |
| `POST /admin/inventory` | item fields | Create |
| `PUT /admin/inventory/:id` | item fields | Edit name/price/active |
| `DELETE /admin/inventory/:id` | | Soft delete (`isActive:false`); refuse if referenced by an active pizza |
| `GET /admin/inventory/:id/log` | | Stock audit trail |
| `GET /admin/orders` | `?status=&from=&to=&page=&limit=` | Excludes `pending_payment` by default |
| `GET /admin/orders/:id` | | Full detail |
| `PATCH /admin/orders/:id/status` | `{ status }` | Forward-only transitions; `409 INVALID_TRANSITION` otherwise |

### 8.6 Validation
Every route has a Zod schema for `body`, `query`, `params`, applied by a `validate(schema)` middleware that strips unknown keys. `express-mongo-sanitize` removes `$`/`.` operators from input before validation.

## 9. Payment, Order and Stock Logic

### 9.1 Pricing service (server-side)
```
unitPrice = base.price + sauce.price + cheese.price + Σ veggie.price      (custom)
unitPrice = pizza.priceOverride ?? Σ component prices                      (preset)
subtotal  = Σ unitPrice × qty
tax       = round(subtotal × TAX_PERCENT / 100)
total     = subtotal + tax + DELIVERY_FEE
```
All integer paise. Item names and prices are **snapshotted** into the order so later catalogue edits do not rewrite history.

### 9.2 Order creation sequence
1. Validate payload (Zod), ensure `veggieIds.length <= MAX_VEGGIES` and ids are unique.
2. Load referenced items; reject inactive ones.
3. Build the **requirement map**: `{ itemId → totalUnits }` across all line items (each component × qty).
4. Availability pre-check: for each item `quantity >= units`; otherwise `OUT_OF_STOCK`.
5. Compute totals, persist order (`pending_payment`), call `razorpay.orders.create({ amount, currency:'INR', receipt: order._id, notes:{ orderId } })`, save `razorpayOrderId`.
6. Respond to client.

No stock is reserved at this point (decision in §9.5).

### 9.3 Payment verification and stock decrement

```js
// paymentService.verifyAndConfirm({ userId, orderId, rzpOrderId, rzpPaymentId, signature })
const expected = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${rzpOrderId}|${rzpPaymentId}`)
  .digest('hex');

if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)))
  throw new ApiError(400, 'INVALID_SIGNATURE');

const session = await mongoose.startSession();
await session.withTransaction(async () => {
  const order = await Order.findOne({ _id: orderId, user: userId,
                  'payment.razorpayOrderId': rzpOrderId }).session(session);
  if (!order) throw new ApiError(404, 'NOT_FOUND');
  if (order.payment.state === 'paid') return;          // idempotent

  for (const [itemId, units] of requirementMap(order)) {
    const res = await InventoryItem.updateOne(
      { _id: itemId, quantity: { $gte: units } },
      { $inc: { quantity: -units } }, { session });
    if (res.modifiedCount !== 1) throw new StockConflict(itemId);  // aborts txn
    await StockLog.create([{ item: itemId, delta: -units, reason: 'order',
                             order: order._id, at: new Date() }], { session });
  }

  order.payment = { ...order.payment, razorpayPaymentId: rzpPaymentId,
                    state: 'paid', paidAt: new Date() };
  order.status = 'order_received';
  order.statusHistory.push({ status: 'order_received', at: new Date() });
  await order.save({ session });
});
```

After commit (outside the transaction):
- emit `order:new` to room `admins` and `order:update` to room `user:<id>`;
- send the confirmation email (failures logged, never fail the request);
- evaluate low-stock for touched items (optional immediate alert, PRD N-4).

**Stock conflict handling.** If a conflict aborts the transaction (item sold out between pre-check and payment), the service marks the order `needsReview = true`, `payment.state = 'paid'` (money was captured), logs at `error`, notifies admins by email and responds `409 STOCK_CONFLICT_AFTER_PAYMENT` with guidance. Refund handling is out of v1 scope (manual via Razorpay dashboard), flagged in the admin orders list.

### 9.4 Webhook (backup path)
- Route registered **before** `express.json()` using `express.raw({ type: 'application/json' })` so the exact bytes are available.
- Verify header `x-razorpay-signature` = `HMAC_SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)`.
- Handle `payment.captured`: look up the order by `razorpayOrderId` and run the same `confirmPayment` routine as §9.3 (no user check). Already-paid orders return `200` immediately.
- Always respond `200` quickly for valid, already-processed events so Razorpay does not retry unnecessarily; respond `5xx` only for transient failures.
- Local testing: expose via an HTTPS tunnel (ngrok / cloudflared) and register the URL in the Razorpay test dashboard.

### 9.5 Reservation decision
v1 uses **decrement on confirmed payment**, not reserve-on-create. Trade-off: simpler and no ghost reservations from abandoned checkouts, at the cost of a rare post-payment conflict, handled in §9.3. If conflicts become frequent, add short-TTL reservations (an `InventoryHold` collection with a TTL index).

### 9.6 Status transitions
```
order_received → in_kitchen → sent_to_delivery
```
```js
const NEXT = { order_received: 'in_kitchen', in_kitchen: 'sent_to_delivery' };
// Conditional update guards against double-clicks and races:
Order.findOneAndUpdate(
  { _id, status: current, 'payment.state': 'paid' },
  { $set: { status: next }, $push: { statusHistory: { status: next, at: now, by: adminId } } },
  { new: true });
```
A `null` result yields `409 INVALID_TRANSITION`.

### 9.7 Manual stock updates
`PATCH /admin/inventory/:id` runs one atomic update:
- `delta`: `$inc` with a filter `quantity: { $gte: -delta }` when negative.
- `quantity`: `$set`.
- On a change that lifts quantity to `>= threshold`, set `lowStockAlertedAt: null` (re-arms alerts).
- Always writes a `StockLog` row with the admin id and note, and emits `inventory:update`.

## 10. Real-Time Design (Socket.IO)

### 10.1 Connection and auth
- Client connects with `io(API_URL, { auth: { token } })`.
- Server middleware verifies the JWT (user secret/audience, else admin secret/audience), attaches `socket.data = { id, role }`, rejects otherwise.
- On connect, join rooms:
  - users → `user:<userId>`
  - admins → `admins`

### 10.2 Events

| Event | Direction | Room | Payload |
|---|---|---|---|
| `order:new` | server → client | `admins` | `{ orderId, summary, total, createdAt }` |
| `order:update` | server → client | `user:<id>` (+ `admins` for sync across admin tabs) | `{ orderId, status, statusHistory }` |
| `inventory:update` | server → client | `admins` | `{ itemId, quantity, status }` |

Clients cannot emit domain events; all mutations go through authenticated REST so validation and authorization stay in one place.

### 10.3 Client behavior
- `useOrdersLive()` hook merges socket events into the RTK Query cache.
- On `disconnect`, start polling `GET /orders/active` every 10 s; stop polling on `connect`.
- On reconnect, refetch once to cover missed events.

### 10.4 Scaling note
With multiple API instances, add the `@socket.io/redis-adapter` so emits reach sockets on other nodes. Not required for single-instance v1.

## 11. Scheduled Low-Stock Alerts

### 11.1 Job
```js
cron.schedule(process.env.LOW_STOCK_CRON, async () => {
  try { await alertService.runLowStockCheck(); }
  catch (err) { logger.error({ err }, 'low-stock job failed'); }
}, { timezone: 'Asia/Kolkata' });
```
Started in `server.js` only if `RUN_CRON === 'true'`.

### 11.2 Query and de-duplication
```js
const cutoff = new Date(Date.now() - COOLDOWN_HOURS * 3600e3);
const items = await InventoryItem.find({
  isActive: true,
  $expr: { $lt: ['$quantity', '$threshold'] },
  $or: [{ lowStockAlertedAt: null }, { lowStockAlertedAt: { $lt: cutoff } }]
});
if (!items.length) return;
await emailService.sendLowStock(items);
await InventoryItem.updateMany({ _id: { $in: items.map(i => i._id) } },
                               { $set: { lowStockAlertedAt: new Date() } });
```
Flag is cleared when stock is raised to or above the threshold (§9.7), so the next dip alerts again.

### 11.3 Email content
One consolidated message to `ADMIN_ALERT_EMAILS`, subject `Low stock alert: N item(s) below threshold`, HTML table grouped by category: item, current quantity, threshold, with a link to the admin inventory page. Plain-text alternative included.

### 11.4 Single-run guarantee
With one instance this is inherent. If scaled out, either run the scheduler in a dedicated worker process (`RUN_CRON=true` on exactly one), or make the job claim work atomically via `findOneAndUpdate` on `lowStockAlertedAt`, so duplicate emails cannot occur even if two instances fire.

## 12. Email Service

- Nodemailer pooled SMTP transport created once in `config/mailer.js`; `verify()` at boot logs connectivity.
- Templates: verification, password reset, order confirmation, low-stock alert, stock-conflict alert. Plain HTML with inline styles, kept as template functions in `emailService`.
- Sending is wrapped in try/catch with up to 3 retries and exponential backoff for transient errors. User-facing flows (e.g. register) succeed even if the email provider hiccups, but the failure is logged; the user can use "resend".
- Development: Mailtrap or Ethereal. Production: transactional provider (SendGrid, SES, Brevo) with SPF/DKIM configured.

## 13. Frontend Technical Design

### 13.1 Routing
```
/                         → redirects by auth state
/login /register /verify-email /forgot-password /reset-password   (public)
/dashboard                → [UserGuard] menu + active orders
/builder                  → [UserGuard] 4-step wizard
/checkout                 → [UserGuard] summary + pay
/orders                   → [UserGuard] history
/admin/login              → public (unlinked)
/admin                    → [AdminGuard] layout
   /admin/inventory
   /admin/orders
```
Guards read role/token and redirect; they are UX only, since the server enforces authorization.

### 13.2 Builder state
A `builderSlice` holds `{ base, sauce, cheese, veggies[], step }`. Selection is validated per step; the running price is derived with a selector from the cached ingredient list. The final payload sends **ids only**.

### 13.3 Checkout and Razorpay
```js
const { data } = await createOrder(payload);           // POST /orders
const rzp = new window.Razorpay({
  key: data.keyId,
  amount: data.amount,
  currency: data.currency,
  order_id: data.razorpayOrderId,
  name: 'Pizza Shop',
  prefill: { name, email, contact: phone },
  handler: async (res) => {                            // on "Success"
    await verifyPayment({ orderId: data.orderId, ...res });
    navigate('/dashboard');
  },
  modal: { ondismiss: () => toast('Payment cancelled') }
});
rzp.on('payment.failed', () => toast.error('Payment failed, try again'));
rzp.open();
```
`checkout.js` is loaded from Razorpay's script URL (`https://checkout.razorpay.com/v1/checkout.js`) on the checkout route. Test mode: use Razorpay's test cards/UPI; the mock bank page offers Success/Failure.

### 13.4 UX/engineering requirements
- Loading, empty, and error states for every data view; optimistic UI only for admin status changes (rolled back on error).
- Debounced/disabled submit buttons to prevent double submits.
- Axios interceptor: attach token; on `401` clear session and redirect to the relevant login.
- Accessible wizard: focus management between steps, `aria-live` for status changes, keyboard-selectable option cards.
- Responsive from 360 px; admin tables collapse to cards on small screens.

## 14. Security Controls

| Threat | Control |
|---|---|
| Credential stuffing / brute force | Rate limit login (e.g. 10/15 min/IP), admin lockout, bcrypt cost 12 |
| Account enumeration | Generic responses on forgot-password, resend, and login failure |
| Token theft/replay | Short JWT TTLs, hashed single-use email tokens, `passwordChangedAt` invalidation |
| Privilege escalation | Separate admin collection, secret and audience; no admin registration route |
| NoSQL injection | `express-mongo-sanitize`, Zod validation, never passing raw `req.body` into queries |
| XSS | React escaping, Helmet CSP, no `dangerouslySetInnerHTML` with user data |
| CSRF | Bearer-token auth (not ambient credentials); required if cookies adopted |
| Payment tampering | Server-side pricing; HMAC signature verification with `timingSafeEqual`; webhook signature on raw body |
| Overselling | Atomic conditional `$inc` inside transactions |
| Mass assignment | Zod strips unknown fields; explicit field whitelists in services |
| Information leakage | Central error handler hides stack traces in production; users never see raw stock counts |
| HTTP hardening | Helmet, `hpp`, body size limit (e.g. 100 kb), CORS allow-list = `CLIENT_URL` |
| Secrets | Env only, `.env` git-ignored, `.env.example` committed, no secrets in client bundle |
| Dependencies | `npm audit` in CI, Dependabot |

## 15. Error Handling and Logging

- `asyncHandler` wraps controllers; all thrown `ApiError`s flow to a single error middleware that maps to the envelope in §8.
- Unknown errors log at `error` with request id and return generic `INTERNAL`.
- `pino-http` adds `req.id` (also returned as `X-Request-Id`). Never log passwords, tokens, or full payment payloads.
- `unhandledRejection` / `uncaughtException` handlers log and exit so the process manager restarts cleanly.
- Graceful shutdown on `SIGTERM`: stop accepting connections, stop cron, close sockets, close Mongo.
- Health endpoints: `GET /healthz` (liveness) and `GET /readyz` (checks DB ping).

## 16. Performance and Indexing

| Query | Index |
|---|---|
| Login by email | `users.email` unique |
| Active orders for user | `orders { user:1, createdAt:-1 }` |
| Admin order list by status | `orders { status:1, createdAt:-1 }` |
| Payment lookup | `orders.payment.razorpayOrderId` unique sparse |
| Ingredient lists | `inventory { category:1, isActive:1 }` |
| Low-stock job | scan of a small collection; add `{ isActive:1 }` index |

Targets: read p95 < 300 ms; socket-to-UI latency < 2 s. Use `.lean()` on read-only queries, projections on list endpoints, and pagination everywhere lists can grow.

## 17. Testing Strategy

| Layer | Tooling | Focus |
|---|---|---|
| Unit | Jest | pricing math, requirement-map builder, transition guard, token utils, signature verification |
| Integration | Jest + Supertest + mongodb-memory-server (replica set) | register→verify→login, reset flow, admin vs user token separation, order create, verify payment, **concurrent orders on the last unit** (exactly one succeeds), manual stock update, status transitions |
| Job | Jest with fake timers / direct call | low-stock query, de-dup flag, re-arm on restock, email mocked |
| Realtime | Jest + `socket.io-client` | auth rejection, room isolation (user A never receives user B's events) |
| Frontend | Vitest + React Testing Library | builder step rules, route guards, summary calculations |
| E2E | Playwright | register (mailbox stub) → build pizza → pay (Razorpay test) → admin advances status → user sees update |

Razorpay is mocked in unit/integration tests (generate valid HMAC signatures locally). The E2E suite uses real test-mode keys. Target ≥ 80% coverage on services.

## 18. DevOps and Deployment

### 18.1 Environments
| Env | Client | API | DB |
|---|---|---|---|
| Local | Vite dev server | `nodemon` | Docker Mongo replset or Atlas free tier |
| Staging/Prod | Vercel or Netlify | Render, Railway or Fly.io | MongoDB Atlas (M0 for demo; M10+ for production) |

### 18.2 Local Docker Compose
Services: `mongo` (started with `--replSet rs0` and an init script), `api`, `client`, `mailhog` (SMTP sink for dev).

### 18.3 CI (GitHub Actions)
`lint → unit/integration tests → build client → npm audit`. On `main`: deploy via platform hooks. Migrations and seeds are run as explicit one-off commands, not on boot.

### 18.4 Seed commands
```
npm run seed:catalogue    # 5 bases, 5 sauces, cheeses, vegetables, sample presets, thresholds
npm run seed:admin -- --email admin@example.com --password '<strong>'
```

### 18.5 Production checklist
- HTTPS everywhere; HSTS via Helmet.
- Trust proxy configured (`app.set('trust proxy', 1)`) so rate limiting sees real client IPs.
- CORS restricted to the deployed client origin; Socket.IO CORS likewise.
- Webhook URL registered with the matching secret.
- Atlas IP allow-list and a least-privilege DB user; automated backups on.
- Cron enabled on exactly one instance.

## 19. Seed Catalogue (reference)

| Category | Items (default threshold 20) |
|---|---|
| Base (5) | Classic Hand-Tossed, Thin Crust, Cheese Burst, Whole Wheat, Multigrain |
| Sauce (5) | Tomato Marinara, Pesto, Barbecue, Garlic White, Spicy Arrabbiata |
| Cheese | Mozzarella, Cheddar, Parmesan Blend, Vegan |
| Veggie | Onion, Capsicum, Tomato, Mushroom, Sweet Corn, Olives, Jalapeño, Paneer |
| Presets | Margherita, Farmhouse, Veggie Supreme, Spicy Paneer (each defined by components) |

Initial quantities are set above thresholds (e.g. 100) so alerts are demonstrable by lowering a quantity manually.

## 20. Implementation Order (engineering)

1. Scaffolding: monorepo, ESLint/Prettier, env validation, Mongo connection, logger, error middleware, health routes.
2. Models and seeds.
3. User auth: register, email verification, login, forgot/reset (with email service).
4. Admin auth and guards.
5. Catalogue and inventory APIs; admin inventory UI; manual stock updates and audit log.
6. Dashboard and builder UI.
7. Pricing service, order creation, Razorpay checkout, verify endpoint, atomic decrement.
8. Webhook backup path.
9. Socket.IO server and client hooks; admin order panel with status updates; polling fallback.
10. Low-stock cron job with de-duplication.
11. Test hardening (concurrency, security), accessibility pass, docs, deployment.

## 21. Technical Risks and Open Items

| Item | Detail | Plan |
|---|---|---|
| MongoDB transactions need a replica set | Standalone Mongo throws on `withTransaction` | Use Atlas or a local replset in Docker; document in README |
| Post-payment stock conflict | Rare but possible without reservations | Flag `needsReview`, alert admin, add `InventoryHold` if frequent |
| Webhook vs callback race | Both may confirm the same order | Idempotent confirm guarded by `payment.state` and unique indexes |
| Cron duplication when scaled | Duplicate emails | Single worker or atomic claim (§11.4) |
| Token storage | `localStorage` XSS exposure | CSP and short TTLs now; httpOnly cookies later |
| Email deliverability | Spam folder, rate limits | Transactional provider, SPF/DKIM, resend flow |
| Refunds | Out of scope | Manual via Razorpay dashboard; track via `needsReview` |

## 22. Definition of Done

A feature is done when: code is merged with passing CI, validation and authorization are in place, tests cover the happy path and key failure paths, errors and empty states are handled in the UI, no secrets are committed, the README documents any new env vars or commands, and the corresponding PRD acceptance criteria are demonstrably met.
