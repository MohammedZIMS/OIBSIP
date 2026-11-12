# DESIGN.md — Hearth & Stone Co. Pizza Delivery Platform

Visual design system + technical design. Visual tokens come from the Stitch export ("Artisan Fire & Flour"); they live in `frontend/tailwind.config.js`.

---

## 1. Product overview

A MERN pizza ordering and inventory platform with two roles.

| Role | Can do |
|---|---|
| **User** | Register + verify email, log in (JWT), reset password, browse menu, build a custom pizza (base → sauce → cheese → veggies), review summary, pay via Razorpay (test mode), watch live order status |
| **Admin** | Log in via a separate portal, see inventory, update stock manually, set thresholds, receive low-stock emails, manage orders and change their status (reflected live for the customer) |

---

## 2. Visual design system

**Mood:** wood-fired craft + kitchen-operations SaaS. Dark slate canvas, ember-orange actions, amber warnings, sage-green "healthy / done".

### Colour
| Role | Token | Hex | Use |
|---|---|---|---|
| Canvas | `background` | `#0b1326` | page background |
| Card | `surface-container` | `#171f33` | cards, panels |
| Inset | `surface-container-lowest` | `#060e20` | inputs, nested rows, navbar |
| Primary action | `primary-container` | `#f2642d` | CTAs, active nav, progress |
| Primary text accent | `primary` | `#ffb59c` | links, brand, active tab text |
| Warning / price | `secondary` | `#ffb95f` | prices, "watch" state, pending |
| Healthy / done | `tertiary` | `#4edea3` | in stock, completed steps, verified |
| Danger | `error` / `red-400` | `#ffb4ab` / `#f87171` | critical stock, failures |
| Text | `on-surface` / `on-surface-variant` | `#dae2fd` / `#e1bfb4` | primary / secondary text |

Borders are low-contrast: `border-white/5` for cards, `border-white/10` for inputs. Hover on cards adds `border-primary-container/30`.

### Typography
- **Epilogue** (600–800): headlines, hero, item titles → `font-headline-*`, `font-display-hero`
- **Plus Jakarta Sans** (400–700): body, UI, labels → `font-body-*`, `font-label-*`
- Numbers (prices, stock, counters) use `tabular-nums` (`.tabular`) so live-updating columns don't jitter.

### Shape, spacing, elevation
- Radius: inputs/buttons `lg` (8px) · cards `lg` · hero/modals `xl` · chips/steppers `full`.
- 4px spacing baseline; page gutters `margin` (16px) → `margin-desktop` (40px); max width 1440px.
- Depth through tonal layers, not heavy shadows.

### Components (`frontend/src/index.css` + `components/`)
| Class / component | Purpose |
|---|---|
| `.btn-primary / .btn-secondary / .btn-ghost` | button hierarchy |
| `.input`, `.label` | forms (focus ring in ember orange) |
| `.card` | surface container |
| `.chip` + `StatusChip` | status pills: `healthy`, `watch`, `critical`, `neutral` |
| `PizzaCard` | menu card with badges, size selector, add-to-order |
| `Navbar` / `AdminRoute` sidebar | customer top nav / admin shell |
| `ProtectedRoute`, `AdminRoute` | route guards (customer / admin) |

### Responsive behaviour
- `< 640px`: single column; admin sidebar collapses to a scrollable pill nav.
- `≥ 1024px`: two-column layouts (menu + sticky cart; builder + sticky live preview; tracking + timeline).

### Screens
Customer: Login · Register · VerifyEmail · ForgotPassword · Dashboard (menu + live orders + cart) · PizzaBuilder · Cart · OrderSummary · Payment · OrderTracking · OrderHistory.
Admin: AdminLogin · AdminDashboard · ManageOrders (kitchen board) · Inventory · ManageUsers · Payments · Notifications · Reports.

---

## 3. Architecture

```
React (Vite) ──HTTPS/JSON──▶ Express API ──▶ MongoDB
     ▲                           │  ├─ Razorpay (test mode)
     └──── Socket.IO ◀───────────┘  ├─ Nodemailer (SMTP)
                                    └─ node-cron (low-stock job)
```

Backend layers: `routes → middleware → controllers → services → models`. Controllers stay thin; business rules (pricing, stock, payment verification) live in `services/`.

---

## 4. Data model (MongoDB / Mongoose)

| Model | Key fields |
|---|---|
| **User** | name, email (unique), password (bcrypt, `select:false`), role `user\|admin`, isVerified, hashed verify/reset tokens + expiry |
| **Pizza** | name, description, price, category, image, badges, sizes, `ingredients[{key, qty}]`, available |
| **Inventory** | `key` (b1, s2, c3, v4… shared with the builder), name, category `bases\|sauces\|cheeses\|vegetables`, price, quantity, **threshold**, max, `alertSent`, lastAlertAt |
| **Order** | orderNumber, user, items[{name, qty, unitPrice, details, ingredients[{item,key,qty}]}], totals, address, note, **status** `received\|kitchen\|delivery`, statusHistory, **paymentStatus** `pending\|paid\|failed` |
| **Payment** | order, user, razorpayOrderId (unique), razorpayPaymentId, signature, amount, currency, status |
| **Notification** | type `low-stock\|order\|cron`, title, body, read |

---

## 5. API (`/api`)

**Auth** — `POST /auth/register` · `POST|GET /auth/verify-email[/:token]` · `POST /auth/login` · `POST /auth/admin/login` · `POST /auth/forgot-password` · `POST /auth/reset-password/:token` · `GET /auth/me`

**Public** — `GET /pizzas` · `GET /pizzas/options` (builder choices + in-stock flag) · `GET /health`

**Customer (JWT)** — `POST /payments/create-order` · `POST /payments/verify` · `GET /orders/mine` · `GET /orders/:id`

**Admin (JWT, role=admin)** — `GET /admin/orders` · `PATCH /admin/orders/:id/status` · `GET /admin/inventory` · `PATCH /admin/inventory/:id` · `POST /admin/inventory/:id/restock` · `GET /admin/users` · `GET /admin/payments` · `GET /admin/notifications` · `PATCH /admin/notifications/read` · `GET /admin/reports` · `POST|PUT|DELETE /admin/pizzas`

Errors are always `{ "message": "..." }` with the proper HTTP status.

### Checkout request shape
```jsonc
POST /api/payments/create-order
{
  "items": [
    { "type": "pizza",  "pizzaId": "<id>", "size": "12\" Personal", "qty": 1 },
    { "type": "custom", "qty": 1,
      "custom": { "base": "b1", "sauce": "s1", "cheese": "c2", "portion": "regular",
                  "veggies": [{ "key": "v1", "qty": 1 }, { "key": "v7", "qty": 2 }] } }
  ],
  "address": "221 Baker St, Apt 4B", "note": "Buzzer 402", "promoCode": "HEARTHFIRE10"
}
→ { orderId, orderNumber, razorpayOrderId, amount, currency, keyId, totals }
```

---

## 6. Key flows

### Payment (Razorpay test mode)
1. Client sends the cart (ids + selections, **never prices**).
2. Server prices it from the database, checks stock, creates `Order(pending)` + Razorpay order + `Payment(created)`.
3. Client opens Razorpay Checkout with `keyId` + `razorpayOrderId`; in test mode clicking **Success** completes it.
4. Client posts `razorpay_order_id / payment_id / signature` to `/payments/verify`.
5. Server checks `HMAC_SHA256(order_id|payment_id, secret)` (timing-safe) → marks paid → **decrements stock** → creates admin notification → emits `order:new`. Idempotent on repeat calls.

Pricing: custom = $19 base + add-ons (+$2 extra cheese, veggies × qty ≤ 3); delivery 4.25; tax 6 %; promo `HEARTHFIRE10` = 10 %.
Razorpay needs an integer in the smallest unit, so amount = `round(total × 100)` in `CURRENCY` (default INR).

### Stock decrement
Per paid order, each ingredient usage `× line qty` is subtracted with one atomic aggregation-pipeline update clamped at 0 (payment already captured, so a race must not fail the order). Availability is checked earlier, at checkout creation.

### Low-stock alerts (node-cron)
Schedule `LOW_STOCK_CRON` (default every 15 min):
1. Reset `alertSent` for items back above threshold.
2. Find `quantity < threshold` and `alertSent = false`.
3. Send one digest email to `ADMIN_EMAIL`; on success set `alertSent = true` and add Notifications. If email fails, nothing is marked → retried next run.

Thresholds are editable per item (`PATCH /admin/inventory/:id`).

### Real-time status
Admin `PATCH /admin/orders/:id/status` → Socket.IO `order:status` to room `user:<id>` and `admins`. Sockets authenticate with the JWT (`auth: { token }`). The frontend currently polls every 3 s, which works with or without sockets.

---

## 7. Security decisions
- Passwords: bcrypt (12 rounds); never returned (`select:false`).
- JWT in `Authorization: Bearer`; role checked server-side by `adminOnly`.
- Public registration can only create `user`; admins exist only via `scripts/createAdmin.js`. `/auth/login` rejects admins and `/auth/admin/login` rejects customers, both with the same generic error.
- Email-verify and reset tokens: random 32 bytes, only SHA-256 hash stored, expire (24 h / 1 h). `forgot-password` answers identically whether or not the email exists.
- Prices computed server-side only; payment signature verified with timing-safe compare.
- Users can only read their own orders (404 otherwise).
- `helmet`, CORS locked to `CLIENT_URL`, 100 kb body limit, rate limits (300 req/15 min API, 20 req/15 min auth routes).

---

## 8. Frontend ↔ backend wiring (next step)
The UI currently runs on localStorage mocks in `frontend/src/services/*`. To connect:
1. Set `VITE_API_URL` and replace each service body with `request(...)` from `api.js` (store the JWT from login/verify).
2. Builder: load options from `GET /pizzas/options`; send **keys**, not prices, at checkout.
3. Payment page: load `https://checkout.razorpay.com/checkout.js`, open it with the `create-order` response, then call `/payments/verify` in the `handler`.
4. Add a `/reset-password?token=` page (the email links to it) and make VerifyEmail read `?token=`.
5. Optional: `socket.io-client` with `auth: { token }`, listen for `order:status` instead of polling.
