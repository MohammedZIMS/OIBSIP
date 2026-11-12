# plan.md: Build Plan for the Forno & Farina Pizza Platform

Implementation plan for the 18 pages in the Stitch export. It reconciles the designs with the PRD and TRD, lists decisions that need your sign-off, and breaks the build into phases with exit criteria. Companion to `Workflow.md`.

Duration: about 4 weeks for one full-stack developer (about 3 weeks for two). Priority labels: **P0** must ship, **P1** should ship, **P2** later.

---

## 1. Design Review Findings (read first)

The Stitch designs are more ambitious than the PRD. They also contain duplicates and inconsistencies. These need decisions before coding so the scope does not grow silently.

### 1.1 Duplicate screens: pick one variant

| Page | Variants in the zip | Recommendation |
|---|---|---|
| Register | `customer_registration_page_1` (no phone), `_2` (phone, "Create account and verify email") | `_2`: phone is useful for delivery and used on checkout |
| Login | `customer_login_page_1`, `_2` (adds Google sign-in, phone OTP, "Admin Hearth Terminal" link) | `_1`, because `_2` links to the admin portal and adds out-of-scope sign-in methods |
| Forgot password | `_1` (rate-limit countdown), `_2` | `_1` |
| Builder | `custom_pizza_builder_4_step_wizard` (sauce step), `custom_pizza_builder_page_8` (cheese step) | Same flow shown at different steps. Use both as the Step 2 and Step 3 references |
| Dashboard | `customer_dashboard_artisanal_menu_7` (welcome, recent orders), `customer_menu_dashboard` (full menu grid) | Merge: menu grid from `customer_menu_dashboard`, welcome and recent orders from `_7` |
| Admin dashboard | Four variants (`hearth_operations_hub`, `inventory_order_management_dashboard`, `manual_stock_update...`, `post_restock_collision_resolved`) | Use `hearth_operations_hub` as the layout; treat the others as states of the same page (adjust modal, post-restock state) |
| Checkout | `order_summary_checkout_page` (full), `..._razorpay_checkout_modal` (simulated Razorpay modal) | Full page for layout. Use the **real** Razorpay test modal, not the mock one |

### 1.2 Brand and naming

Screens use both **Forno & Farina** and **MyPizza**, plus "Hearth Terminal" wording. Pick **Forno & Farina** (it appears on most screens) and update the few "MyPizza" headers. Confirm the final name.

### 1.3 Elements in the designs that are not in the PRD or TRD

| Design element | Where | Decision for v1 | Reason |
|---|---|---|---|
| Oven and hearth telemetry (temperatures, bake timer, flue, hood CFM) | Pages 10, 13 | **Remove** (or label as demo) | No data source; showing fake numbers misleads |
| Courier assignment, "Call courier", live rider tracking | Page 10 | **Defer (P2)**. Show status and an ETA estimate only | PRD excludes delivery partner features |
| Hearth stage "Slide into Oven" button on In Kitchen orders | Pages 13, 16 | **Rename** to "Mark sent to delivery" | PRD defines three statuses only; an extra stage would need new states |
| Emergency Stock Pause button (every admin header) | Admin | **P1**: global "pause ordering" flag in a `Settings` document | Small, useful, easy |
| TOTP and FIDO2 on admin login | Page 12 | **Defer (P2)**; hide the controls | Not in PRD; password plus lockout is enough for v1 |
| Google sign-in and phone OTP login | Page 4 (variant 2) | **Out of scope** | Not in PRD |
| Pairings, dips, beverages, starters in checkout and menu | Pages 7, 9 | **Defer (P2)**; if wanted sooner, add an `extra` inventory category | Needs inventory modeling and prices |
| "Stock reserved for 09:46 mins" banner and "stock locks on payment initiation" copy | Page 9 | **Decision needed**, see §1.4 | Conflicts with TRD §9.5 |
| Saved addresses, default address, delivery zones | Page 11, header | **Include (P0 for addresses, P2 for zones)** | Needed for checkout; zones are cosmetic |
| Dietary and crust presets, "Save to My Custom Creations" | Pages 8, 11 | **Defer (P2)** | Nice to have |
| Active sessions, "Revoke device" | Page 11 | **Defer**; keep "Sign out of other sessions" via `passwordChangedAt` | Needs a session store |
| Share live tracking link | Page 10 | **Defer (P2)** | Needs public tokenized route |
| Tax invoice PDF, Print kitchen ticket | Pages 10, 17 | **P1**: server-generated PDF (pdfkit) and a print stylesheet | Valuable, not in PRD |
| Revenue, average ticket, shift info | Page 13 | **P1** for revenue and counts from paid orders; drop shift info | Computable from orders |
| Export CSV (inventory, ledger) | Pages 14, 18 | **P1** | Simple |
| Email verification with a 6-digit backup code | Page 3 | **P1** (link is P0) | PRD specifies a link |
| Cart (n) in header | All customer pages | **P0, client-side** | Required for multi-item orders; TRD supports `items[]` |
| Cash on delivery (shown disabled) | Page 9 | **Remove** the option | Online payment only |
| Payment method list (UPI, card, netbanking) | Page 9 | Keep as informational; methods are chosen inside Razorpay | Razorpay handles method selection |

### 1.4 Decision needed: reserve stock or not

Page 9 promises "real-time stock reserved for 09:46 mins" and "zero overselling". The TRD decrements stock only when payment is verified.

| Option | What it takes | Trade-off |
|---|---|---|
| **A (recommended for v1)** | Remove the reservation banner. Keep decrement-on-payment with atomic checks and the `needsReview` flag | Simplest; a rare post-payment conflict is handled by admin |
| **B** | Add `InventoryHold` (items, order, expiresAt with a TTL index). Checkout creates holds for 10 minutes; availability checks subtract active holds; verify converts holds into decrements | Matches the design; about 2 extra days and more edge cases (expired holds, timers) |

### 1.5 Small spec differences to align

| Topic | Design | PRD/TRD | Resolution |
|---|---|---|---|
| Password rules | Upper and lower case, number, special symbol | Minimum 8 characters | Adopt the design's rules on both client and server |
| Reset token lifetime | "48 mins remaining" | 1 hour | Keep 1 hour; the countdown shows the real remaining time |
| Registration fields | Name, email, phone (variant 2), terms checkbox | Name, email, password | Add `phone`; make it required |
| Order statuses (customer) | "Order Received and Verified", "Hand-Stretching and 900°F Hearth", "Sent to Delivery" | Order Received, In Kitchen, Sent to Delivery | Use PRD names as data; the longer text is copy only |
| Admin login id | "email or OP-804" | Email | Email only for v1 |
| Delivery fee | "Free", packaging fee | Flat configurable fee | Make packaging and delivery two configurable fees |

---

## 2. Page Inventory and Build Priority

| # | Page | Priority | Main APIs | Notes |
|---|---|---|---|---|
| 1 | Home | P0 | `GET /pizzas` | Mostly static content plus featured pizzas |
| 2 | Register | P0 | `POST /auth/register` | |
| 3 | Email verification | P0 link, P1 code | `GET /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/verify-code` | Resend cooldown |
| 4 | Login | P0 | `POST /auth/login` | Remember me controls token lifetime |
| 5 | Forgot password | P0 | `POST /auth/forgot-password` | Generic response |
| 6 | Reset password | P0 | `GET /auth/reset-token/validate`, `POST /auth/reset-password` | Strength checklist |
| 7 | Customer dashboard | P0 | `GET /pizzas`, `GET /orders/active`, `GET /orders/mine` | Filters and search client-side |
| 8 | Pizza builder | P0 | `GET /ingredients` | Four steps, running price |
| 9 | Order summary and checkout | P0 | `POST /orders`, `POST /payments/verify` | Real Razorpay test checkout |
| 10 | Order tracking and history | P0 | `GET /orders/active`, `GET /orders/mine`, socket `order:update` | Re-order is P1 |
| 11 | User profile | P0 addresses and password, P1 rest | `/users/me`, `/users/me/addresses`, `POST /auth/change-password` | |
| 12 | Admin login | P0 | `POST /admin/auth/login` | Hide TOTP/FIDO |
| 13 | Admin dashboard | P0 | `GET /admin/orders`, `GET /admin/inventory`, `GET /admin/dashboard/summary` | Socket-driven |
| 14 | Inventory management | P0 | `GET/PATCH /admin/inventory` | CSV export P1 |
| 15 | Add/Edit inventory item | P0 | `POST/PUT/DELETE /admin/inventory` | |
| 16 | Order management | P0 | `GET /admin/orders`, `PATCH /admin/orders/:id/status` | |
| 17 | Order details | P0 | `GET /admin/orders/:id` | PDF and print are P1 |
| 18 | Inventory transactions and alerts | P0 ledger and alerts, P1 manual triggers | `GET /admin/ledger`, `GET /admin/alerts`, `POST /admin/alerts/run` | |

---

## 3. Additions to the TRD

### 3.1 New endpoints

| Endpoint | For page | Priority |
|---|---|---|
| `POST /auth/change-password` | 11 | P0 |
| `PATCH /users/me` | 11 | P0 |
| `GET/POST/PATCH/DELETE /users/me/addresses` (plus set default) | 9, 11 | P0 |
| `POST /auth/verify-code`, `PATCH /auth/email` | 3 | P1 |
| `GET /auth/reset-token/validate` | 6 | P0 |
| `GET /admin/dashboard/summary` (revenue today, live orders by status, critical item count) | 13 | P1 |
| `GET /admin/ledger?type=&item=&order=&page=` (reads `StockLog`) | 18 | P0 |
| `GET /admin/alerts` (items below threshold with alert state, last run, cron status) | 18 | P0 |
| `POST /admin/alerts/run`, `POST /admin/alerts/test-email` | 14, 18 | P1 |
| `GET /admin/inventory/export`, `GET /admin/ledger/export` (CSV) | 14, 18 | P1 |
| `GET /orders/:id/invoice` and `GET /admin/orders/:id/invoice` (PDF) | 10, 17 | P1 |
| `GET/PATCH /admin/settings` (pause ordering flag, fees, tax) | Admin header | P1 |

### 3.2 Data model changes

| Collection | Change |
|---|---|
| `User` | Add `phone`, `addresses[{ label, line1, line2, city, state, pincode, instructions, isDefault }]`, optional `verifyCodeHash` |
| `InventoryItem` | Add `unit` (units, L, kg), `description`, `dietaryTags[]`, `supplierNote` |
| `StockLog` | Add reason value `wastage`; keep immutable (no update or delete routes) |
| `AlertLog` (new) | `items[]`, `recipients[]`, `status`, `error?`, `sentAt`, `trigger` (cron or manual) |
| `Settings` (new, single document) | `orderingPaused`, `taxPercent`, `deliveryFee`, `packagingFee`, `prepMinutes`, `deliveryMinutes` |
| `Order` | Add `notes` (kitchen and allergy), `dropoffInstructions`, `addressSnapshot` |

---

## 4. Frontend Foundation

### 4.1 Design tokens

The zip contains two design documents: `artisan_pizza_kitchen/DESIGN.md` (Stitch's token file, with Material-style roles plus the same pizza palette) and a copy of our earlier `design.md`. Use the Stitch file as the source of truth for tokens, because the screens were generated from it.

- Fonts: Bricolage Grotesque (headings), Hanken Grotesk (body), serif display used on some customer headings in the screens (confirm whether to keep it or use Bricolage everywhere).
- Icons: Material Symbols (the screens use them).
- Customer theme: parchment light. Admin theme: dark (`pan`).
- Convert the YAML tokens into CSS variables and the Tailwind config once, then build pages from those only.

### 4.2 Shared component library (build first)

| Group | Components |
|---|---|
| Layout | `CustomerLayout` (header, footer, cart), `AdminLayout` (top nav, status strip), `AuthLayout` |
| Inputs | `TextField`, `PasswordField` (visibility toggle, strength meter), `OtpInput`, `Select`, `Checkbox`, `Stepper` (quantity), `SearchBox` |
| Feedback | `Toast`, `Modal`, `ConfirmDialog`, `EmptyState`, `Skeleton`, `ConnectionIndicator` |
| Display | `StatusBadge` (order and stock), `PizzaCard`, `IngredientOptionCard`, `OrderStepper`, `PriceBreakdown`, `DataTable`, `FilterTabs`, `KpiCard`, `ProgressBar` |
| Domain | `CartDrawer` or cart page, `AddressForm`, `AddressCard`, `StockAdjustModal`, `OrderCard` (customer and admin variants) |

### 4.3 App structure

Feature folders as in the TRD (`auth`, `menu`, `builder`, `checkout`, `orders`, `profile`, `admin/*`). Cart and builder state in Redux slices; server data via RTK Query; one `useSocket` hook that updates the query cache.

---

## 5. Phased Plan

### Phase 0: Setup (2 days)
- Monorepo, linting, env validation, Mongo (replica set), logger, error middleware, health routes.
- Tailwind config from design tokens; font and icon setup.
- Seed scripts: admin, catalogue (5 bases, 5 sauces, cheeses, vegetables, 4 to 12 presets).
- **Exit:** `npm run dev` starts client and API; seeds create data; CI runs lint and a smoke test.

### Phase 1: Authentication, pages 1 to 6 and 11 (account part) (4 days)
- Backend: register, verify (link), resend with rate limit, login, forgot, validate token, reset, change password, `GET /auth/me`. Email service with templates.
- Frontend: `AuthLayout`, pages 2, 3, 4, 5, 6; route guards; token handling; Remember me.
- Home page (page 1) static sections with `GET /pizzas`.
- **Exit:** register → email → verify → login → forgot → reset works end to end with Mailtrap; unit and integration tests for auth pass.

### Phase 2: Catalogue and Admin Inventory, pages 12, 14, 15 (4 days)
- Backend: admin auth with lockout, inventory CRUD, manual adjust with `StockLog`, ingredient and pizza read APIs.
- Frontend: `AdminLayout`, page 12, page 14 (tabs, search, status chips, adjust modal), page 15 (create/edit/deactivate).
- **Exit:** admin can log in, add and edit items, adjust stock, and every change writes a ledger row.

### Phase 3: Customer Menu and Builder, pages 7 and 8 (3 days)
- Backend: derived pizza availability, ingredient availability flags.
- Frontend: dashboard (menu grid, filters, recent orders placeholder), 4-step builder with running price, cart slice and header cart.
- **Exit:** a user can build or pick pizzas and fill the cart; out-of-stock options are disabled.

### Phase 4: Orders and Payment, page 9 plus profile addresses (page 11) (5 days)
- Backend: pricing service, `POST /orders`, Razorpay order creation, signature verify, transactional stock decrement, webhook backup, confirmation email, addresses CRUD, settings (fees, tax).
- Frontend: checkout page, address selection and add, notes, Razorpay Checkout integration, success and failure handling, profile page (info, addresses, change password).
- **Exit:** test-mode payment confirms the order; stock decrements once; the last-unit concurrency test passes; failure leaves stock untouched.

### Phase 5: Real-Time Tracking and Admin Orders, pages 10, 13, 16, 17 (5 days)
- Backend: Socket.IO auth and rooms, status transition endpoint, admin order list and detail, dashboard summary.
- Frontend: tracking page with stepper and live updates plus polling fallback; admin dashboard, order management, order details; sound toggle; past orders and re-order.
- **Exit:** admin status change reaches the customer within 2 seconds; fallback polling works when the socket is blocked.

### Phase 6: Alerts and Ledger, page 18 (3 days)
- Backend: `node-cron` job with de-duplication and cool-down, `AlertLog`, ledger and alerts endpoints, manual run and test email.
- Frontend: page 18 (system strip, alert queue, ledger with filters).
- **Exit:** dropping an item below threshold produces exactly one email per cool-down window; raising stock re-arms it.

### Phase 7: P1 Extras and Hardening (3 to 4 days)
- Verification code, CSV exports, invoice PDF and print stylesheet, pause-ordering flag, `needsReview` banner.
- Security pass (rate limits, sanitization, CORS, headers), accessibility pass (keyboard, focus, contrast, reduced motion), responsive checks at 360 px.
- E2E tests, README, deployment (Atlas, Render or Railway, Vercel or Netlify), Razorpay webhook registration.
- **Exit:** both walkthroughs in `Workflow.md` §9 pass on the deployed staging site.

---

## 6. Page-Level Definition of Done

Each page is done when:
- It matches the chosen Stitch variant at 360 px, 768 px and desktop widths.
- Loading, empty, error and success states exist.
- Forms validate on both client and server with the same rules.
- Every status or stock state has an icon and a text label, not color alone.
- Keyboard navigation and visible focus work.
- It uses only shared components and design tokens (no one-off colors).
- Its API calls have tests, and its happy and main failure paths have at least one UI test.

---

## 7. Testing Plan

| Level | What | Tools |
|---|---|---|
| Unit | Pricing, requirement map, status transitions, token utilities, password rules, alert query | Jest |
| Integration | Auth flows, admin vs user token isolation, order and payment verification, concurrent last-unit orders, manual stock updates, alert de-duplication | Jest, Supertest, mongodb-memory-server (replica set) |
| Realtime | Socket auth, room isolation, event delivery | Jest, socket.io-client |
| Component | Builder rules, route guards, checkout totals, strength meter | Vitest, React Testing Library |
| E2E | Customer happy path, admin happy path, payment failure, low-stock alert | Playwright |
| Manual | Razorpay test mode with Success and Failure, email rendering, color-blindness check | Checklist |

---

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Scope growth from the designs (telemetry, courier, extras) | Schedule slips | Follow §1.3 decisions; park P2 items in a backlog |
| Stock reservation expectation (page 9 copy) | Mismatch between UI and behavior | Decide A or B in §1.4 before Phase 4 |
| MongoDB transactions require a replica set | Local setup failures | Docker replica set or Atlas from day one |
| Duplicate or mixed brand names | Inconsistent UI | Confirm the name before Phase 0 |
| Cron duplicates when scaled | Duplicate emails | Single instance for v1, atomic claim later |
| Razorpay webhook testing locally | Backup path untested | Use an HTTPS tunnel and a test-mode webhook secret |
| Email deliverability | Verification emails land in spam | Transactional provider, SPF and DKIM before launch |

---

## 9. Decisions Needed From You

1. **Brand name:** Forno & Farina or MyPizza?
2. **Stock reservation:** Option A (no reservation) or B (10-minute holds)?
3. **Variants:** confirm the choices in §1.1 (especially login variant 1 and register variant 2).
4. **Extras:** are pairings, dips and beverages wanted in v1? If yes, they need inventory items and prices.
5. **Admin security:** is password plus lockout enough for v1, or is TOTP required?
6. **Telemetry and courier content:** remove, or keep as clearly labeled demo content?
7. **Delivery:** is there a delivery-zone or serviceable-pincode rule, or any address accepted?

---

## 10. Suggested Order of Work (one-page summary)

1. Setup and tokens → 2. Auth pages → 3. Admin login and inventory → 4. Menu and builder → 5. Checkout and payment → 6. Live tracking and admin orders → 7. Alerts and ledger → 8. Extras, security, accessibility, deploy.
