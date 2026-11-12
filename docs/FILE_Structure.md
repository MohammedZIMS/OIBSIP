# FILE_Structure.md: Forno & Farina Pizza Platform

Complete project layout for the MERN monorepo. It extends the TRD §4 structure with everything added in `plan.md` (addresses, settings, alert log, ledger, invoices, order notes) and maps every one of the 18 pages to its files.

Priority tags: files marked **(P1)** or **(P2)** belong to later phases in `plan.md`. Everything else is P0.

---

## 1. Top Level

```
pizza-platform/
├── client/                      # React (Vite) single-page app: customer and admin UIs
├── server/                      # Node.js + Express API, Socket.IO, cron jobs
├── docs/                        # Project documents (PRD, TRD, design, workflow, plan)
├── .github/
│   └── workflows/
│       └── ci.yml               # lint, test, build, npm audit
├── docker-compose.yml           # mongo (replica set), api, client, mailhog
├── .gitignore
├── .editorconfig
├── .prettierrc
├── package.json                 # root scripts: dev, lint, test, seed (uses npm workspaces)
└── README.md                    # setup, env vars, seed commands, deploy notes
```

### `docs/`

```
docs/
├── PRD.md
├── TRD.md
├── DESIGN.md
├── Workflow.md
├── plan.md
├── FILE_Structure.md
└── design-reference/            # copy of the Stitch export for reference
    ├── tokens.md                # from artisan_pizza_kitchen/DESIGN.md
    └── screens/                 # one folder per Stitch screen (screen.png, code.html)
```

---

## 2. Server (`server/`)

```
server/
├── package.json
├── .env.example                 # every variable from TRD §5, no secrets
├── .eslintrc.cjs
├── jest.config.js
├── Dockerfile
├── scripts/
│   ├── seedAdmin.js             # npm run seed:admin -- --email --password
│   ├── seedCatalogue.js         # bases, sauces, cheeses, veggies, presets
│   └── seedSettings.js          # default fees, tax, prep and delivery minutes
├── src/
│   ├── server.js                # creates HTTP server, attaches Socket.IO, starts cron, graceful shutdown
│   ├── app.js                   # Express app only (no listen), used by tests
│   │
│   ├── config/
│   │   ├── env.js               # Zod-validated environment, exits if invalid
│   │   ├── db.js                # Mongoose connection
│   │   ├── logger.js            # Pino instance
│   │   ├── mailer.js            # Nodemailer transport
│   │   └── razorpay.js          # Razorpay SDK client
│   │
│   ├── models/
│   │   ├── User.js              # includes phone, addresses[], verify and reset token hashes
│   │   ├── Admin.js             # separate collection, lockout fields
│   │   ├── InventoryItem.js     # category, quantity, threshold, unit, lowStockAlertedAt
│   │   ├── Pizza.js             # preset pizzas with component references
│   │   ├── Order.js             # items, totals, payment, status, statusHistory, notes, needsReview
│   │   ├── StockLog.js          # immutable stock ledger
│   │   ├── AlertLog.js          # record of every low-stock email (cron or manual)
│   │   ├── Settings.js          # single document: orderingPaused, fees, tax, ETA minutes
│   │   └── index.js
│   │
│   ├── routes/
│   │   ├── index.js             # mounts all routers under /api
│   │   ├── auth.routes.js       # register, verify, resend, login, forgot, reset, change-password, me
│   │   ├── user.routes.js       # /users/me, addresses CRUD, preferences (P2)
│   │   ├── catalogue.routes.js  # GET /pizzas, GET /ingredients
│   │   ├── order.routes.js      # create, mine, active, by id, invoice (P1)
│   │   ├── payment.routes.js    # verify; webhook mounted separately with raw body
│   │   └── admin/
│   │       ├── index.js         # applies adminAuth to everything below
│   │       ├── auth.routes.js   # POST /admin/auth/login (no adminAuth on this one)
│   │       ├── dashboard.routes.js   # GET summary
│   │       ├── inventory.routes.js   # list, create, update, adjust, deactivate, export (P1)
│   │       ├── order.routes.js       # list, detail, status, invoice (P1)
│   │       ├── ledger.routes.js      # GET ledger, export (P1)
│   │       ├── alert.routes.js       # GET alerts, POST run, POST test-email (P1)
│   │       └── settings.routes.js    # GET/PATCH settings (P1)
│   │
│   ├── controllers/             # thin: parse request, call a service, send response
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── catalogue.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   └── admin/
│   │       ├── auth.controller.js
│   │       ├── dashboard.controller.js
│   │       ├── inventory.controller.js
│   │       ├── order.controller.js
│   │       ├── ledger.controller.js
│   │       ├── alert.controller.js
│   │       └── settings.controller.js
│   │
│   ├── services/                # all business rules live here
│   │   ├── authService.js       # registration, verification, reset, login, lockout
│   │   ├── userService.js       # profile and address management
│   │   ├── catalogueService.js  # availability derivation for pizzas and ingredients
│   │   ├── pricingService.js    # server-side pricing in integer paise
│   │   ├── orderService.js      # create order, requirement map, status transitions
│   │   ├── paymentService.js    # signature check, transactional confirm, webhook handling
│   │   ├── inventoryService.js  # atomic decrement, manual adjust, threshold re-arm
│   │   ├── ledgerService.js     # StockLog queries and CSV export
│   │   ├── alertService.js      # low-stock query, de-duplication, consolidated email
│   │   ├── dashboardService.js  # revenue today, live order counts, critical items
│   │   ├── settingsService.js   # cached settings read and update
│   │   ├── emailService.js      # templates and send with retry
│   │   ├── invoiceService.js    # PDF generation (P1)
│   │   └── socketService.js     # emit helpers used by services
│   │
│   ├── middleware/
│   │   ├── auth.js              # verifies user JWT, loads user
│   │   ├── requireVerified.js   # blocks unverified users
│   │   ├── adminAuth.js         # verifies admin JWT (different secret and audience)
│   │   ├── validate.js          # Zod validation for body, query, params
│   │   ├── rateLimit.js         # auth, admin auth, resend limiters
│   │   ├── orderingGate.js      # rejects order creation when ordering is paused (P1)
│   │   ├── requestId.js
│   │   ├── notFound.js
│   │   └── errorHandler.js      # maps ApiError to the standard error envelope
│   │
│   ├── validators/              # Zod schemas, one file per area
│   │   ├── auth.schema.js
│   │   ├── user.schema.js
│   │   ├── order.schema.js
│   │   ├── payment.schema.js
│   │   └── admin.schema.js
│   │
│   ├── sockets/
│   │   ├── index.js             # io setup, JWT handshake auth, room joins (user:<id>, admins)
│   │   └── events.js            # event name constants: order:new, order:update, inventory:update
│   │
│   ├── jobs/
│   │   ├── index.js             # starts jobs when RUN_CRON=true
│   │   └── lowStockJob.js       # node-cron schedule calling alertService
│   │
│   ├── templates/               # email HTML builders
│   │   ├── verifyEmail.js
│   │   ├── resetPassword.js
│   │   ├── orderConfirmation.js
│   │   ├── lowStockAlert.js
│   │   └── stockConflictAlert.js
│   │
│   ├── constants/
│   │   ├── orderStatus.js       # statuses and allowed transitions
│   │   ├── inventory.js         # categories, stock reasons
│   │   └── errorCodes.js
│   │
│   └── utils/
│       ├── ApiError.js
│       ├── asyncHandler.js
│       ├── tokens.js            # random token and hash helpers, JWT sign and verify
│       ├── money.js             # paise and rupee helpers
│       ├── csv.js               # CSV writer for exports
│       └── pagination.js
│
└── tests/
    ├── setup/
    │   ├── mongoReplSet.js      # mongodb-memory-server replica set helper
    │   └── factories.js         # users, items, pizzas, orders
    ├── unit/
    │   ├── pricingService.test.js
    │   ├── orderTransitions.test.js
    │   ├── signature.test.js
    │   └── alertQuery.test.js
    ├── integration/
    │   ├── auth.test.js
    │   ├── adminAuth.test.js
    │   ├── inventory.test.js
    │   ├── orders.test.js
    │   ├── payments.test.js     # includes the last-unit concurrency test
    │   ├── webhook.test.js
    │   ├── alerts.test.js
    │   └── sockets.test.js
    └── fixtures/
        └── razorpayPayloads.js
```

### Server conventions

- Request flow is always `route → middleware → controller → service → model`. No Mongoose calls in controllers or routes.
- Money is stored as integer paise everywhere; conversion lives in `utils/money.js`.
- Services throw `ApiError`; only `errorHandler.js` formats responses.
- Socket emits go through `socketService.js`, never directly from controllers.
- The Razorpay webhook route is registered in `app.js` **before** `express.json()` so it receives the raw body.

---

## 3. Client (`client/`)

```
client/
├── package.json
├── vite.config.js
├── tailwind.config.js           # tokens from the design system
├── postcss.config.js
├── index.html                   # loads Razorpay checkout script lazily from the checkout page
├── .env.example                 # VITE_API_URL, VITE_RAZORPAY_KEY_ID, VITE_SOCKET_URL
├── public/
│   ├── favicon.svg
│   └── images/                  # logo, hero and placeholder pizza images
└── src/
    ├── main.jsx
    ├── App.jsx
    │
    ├── app/
    │   ├── store.js             # Redux store
    │   ├── router.jsx           # route tree for customer and admin
    │   └── guards/
    │       ├── UserGuard.jsx    # requires login and verified email
    │       ├── AdminGuard.jsx   # requires admin token
    │       └── PublicOnly.jsx   # redirects logged-in users away from login/register
    │
    ├── api/
    │   ├── client.js            # axios instance, token interceptor, 401 handling
    │   ├── authApi.js           # RTK Query endpoints
    │   ├── catalogueApi.js
    │   ├── orderApi.js
    │   ├── userApi.js
    │   ├── adminApi.js
    │   └── socket.js            # Socket.IO client factory
    │
    ├── styles/
    │   ├── index.css            # Tailwind layers, font imports, base styles
    │   └── tokens.css           # CSS variables for both themes
    │
    ├── components/              # shared UI, no business logic
    │   ├── layout/
    │   │   ├── CustomerLayout.jsx    # header, cart button, deliver-to, footer
    │   │   ├── AdminLayout.jsx       # top nav, connection indicator, operator menu
    │   │   ├── AuthLayout.jsx
    │   │   ├── Header.jsx
    │   │   └── Footer.jsx
    │   ├── ui/
    │   │   ├── Button.jsx
    │   │   ├── TextField.jsx
    │   │   ├── PasswordField.jsx     # visibility toggle and strength meter
    │   │   ├── OtpInput.jsx          # 6-digit code boxes (P1)
    │   │   ├── Select.jsx
    │   │   ├── Checkbox.jsx
    │   │   ├── QuantityStepper.jsx
    │   │   ├── SearchBox.jsx
    │   │   ├── Modal.jsx
    │   │   ├── ConfirmDialog.jsx
    │   │   ├── Toast.jsx
    │   │   ├── Skeleton.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── FilterTabs.jsx
    │   │   ├── DataTable.jsx
    │   │   ├── Pagination.jsx
    │   │   ├── ProgressBar.jsx
    │   │   └── Icon.jsx              # Material Symbols wrapper
    │   └── domain/
    │       ├── StatusBadge.jsx       # order and stock status with icon and label
    │       ├── OrderStepper.jsx      # Received, In Kitchen, Sent to Delivery
    │       ├── PizzaCard.jsx
    │       ├── IngredientOptionCard.jsx
    │       ├── PriceBreakdown.jsx
    │       ├── AddressCard.jsx
    │       ├── AddressForm.jsx
    │       ├── KpiCard.jsx
    │       ├── ConnectionIndicator.jsx
    │       └── StockAdjustModal.jsx  # shared by admin pages 13, 14, 18
    │
    ├── features/
    │   ├── auth/
    │   │   ├── pages/
    │   │   │   ├── RegisterPage.jsx          # page 2
    │   │   │   ├── VerifyEmailPage.jsx       # page 3
    │   │   │   ├── LoginPage.jsx             # page 4
    │   │   │   ├── ForgotPasswordPage.jsx    # page 5
    │   │   │   └── ResetPasswordPage.jsx     # page 6
    │   │   ├── authSlice.js
    │   │   ├── passwordRules.js              # shared rules and strength logic
    │   │   └── schemas.js                    # Zod form schemas
    │   │
    │   ├── home/
    │   │   ├── HomePage.jsx                  # page 1
    │   │   └── sections/                     # Hero, FeaturedPizzas, Philosophy, BuilderCta
    │   │
    │   ├── menu/
    │   │   ├── pages/
    │   │   │   └── DashboardPage.jsx         # page 7
    │   │   ├── components/
    │   │   │   ├── MenuGrid.jsx
    │   │   │   ├── MenuFilters.jsx
    │   │   │   ├── ActiveOrderStrip.jsx
    │   │   │   └── RecentOrders.jsx
    │   │   └── menuFilters.js
    │   │
    │   ├── builder/
    │   │   ├── pages/
    │   │   │   └── BuilderPage.jsx           # page 8 (wizard shell)
    │   │   ├── steps/
    │   │   │   ├── BaseStep.jsx              # step 1, choose 1 of 5
    │   │   │   ├── SauceStep.jsx             # step 2, choose 1 of 5
    │   │   │   ├── CheeseStep.jsx            # step 3, choose 1
    │   │   │   └── VeggieStep.jsx            # step 4, multi-select
    │   │   ├── components/
    │   │   │   ├── StepIndicator.jsx
    │   │   │   └── OrderBreakdownPanel.jsx
    │   │   └── builderSlice.js
    │   │
    │   ├── cart/
    │   │   ├── cartSlice.js                  # items, quantities, persisted to localStorage
    │   │   ├── CartDrawer.jsx
    │   │   └── cartPricing.js                # display-only totals; server stays the source of truth
    │   │
    │   ├── checkout/
    │   │   ├── pages/
    │   │   │   └── CheckoutPage.jsx          # page 9
    │   │   ├── components/
    │   │   │   ├── DeliverySection.jsx
    │   │   │   ├── CartItemsSection.jsx
    │   │   │   ├── NotesSection.jsx
    │   │   │   └── PaymentPanel.jsx
    │   │   └── useRazorpay.js                # loads script, opens checkout, handles callbacks
    │   │
    │   ├── orders/
    │   │   ├── pages/
    │   │   │   └── OrdersPage.jsx            # page 10 (tabs: active tracking, history)
    │   │   ├── components/
    │   │   │   ├── ActiveOrderCard.jsx
    │   │   │   ├── EtaCard.jsx
    │   │   │   ├── OrderManifest.jsx
    │   │   │   └── PastOrderCard.jsx
    │   │   └── useOrdersLive.js              # socket events merged into cache, polling fallback
    │   │
    │   ├── profile/
    │   │   ├── pages/
    │   │   │   └── ProfilePage.jsx           # page 11
    │   │   └── components/
    │   │       ├── PersonalInfoForm.jsx
    │   │       ├── SavedAddresses.jsx
    │   │       ├── ChangePasswordForm.jsx
    │   │       └── DietaryPresets.jsx        # (P2)
    │   │
    │   └── admin/
    │       ├── auth/
    │       │   └── AdminLoginPage.jsx        # page 12
    │       ├── dashboard/
    │       │   ├── AdminDashboardPage.jsx    # page 13
    │       │   └── components/
    │       │       ├── KpiRow.jsx
    │       │       ├── LiveQueue.jsx
    │       │       ├── QueueOrderCard.jsx
    │       │       └── StockWatchlist.jsx
    │       ├── inventory/
    │       │   ├── InventoryPage.jsx         # page 14
    │       │   ├── InventoryEditPage.jsx     # page 15 (create and edit)
    │       │   └── components/
    │       │       ├── InventoryTable.jsx
    │       │       ├── CategoryTabs.jsx
    │       │       ├── ItemForm.jsx
    │       │       └── RecentAdjustments.jsx
    │       ├── orders/
    │       │   ├── AdminOrdersPage.jsx       # page 16
    │       │   ├── AdminOrderDetailPage.jsx  # page 17
    │       │   └── components/
    │       │       ├── OrdersTable.jsx
    │       │       ├── OrderFilters.jsx
    │       │       ├── AdvanceStatusButton.jsx
    │       │       └── StatusAuditTrail.jsx
    │       ├── ledger/
    │       │   ├── LedgerAlertsPage.jsx      # page 18
    │       │   └── components/
    │       │       ├── SystemStatusStrip.jsx
    │       │       ├── AlertQueue.jsx
    │       │       └── LedgerTable.jsx
    │       └── useAdminLive.js               # admin socket events: order:new, order:update, inventory:update
    │
    ├── hooks/
    │   ├── useSocket.js                      # one shared authenticated socket connection
    │   ├── useDebounce.js
    │   ├── useCountdown.js                   # resend cooldowns, token expiry display
    │   └── useSound.js                       # incoming-order alert sound
    │
    ├── utils/
    │   ├── money.js                          # paise to rupee formatting
    │   ├── dates.js
    │   ├── status.js                         # status to label, color, icon mapping
    │   └── constants.js
    │
    └── tests/
        ├── builder.test.jsx
        ├── guards.test.jsx
        ├── passwordRules.test.js
        ├── checkoutTotals.test.js
        └── e2e/                              # Playwright specs
            ├── customer-happy-path.spec.js
            ├── payment-failure.spec.js
            ├── admin-happy-path.spec.js
            └── low-stock-alert.spec.js
```

### Client conventions

- Pages live in `features/<area>/pages/`; each page is a thin composition of components and hooks.
- `components/ui` has no knowledge of orders, pizzas or inventory. `components/domain` can know the domain but not call APIs directly.
- All server calls go through RTK Query slices in `api/`. Socket events update the same cache.
- Colors, spacing and radii come from `tokens.css` and the Tailwind config only. No hard-coded hex values in components.
- Status labels, colors and icons are defined once in `utils/status.js`.

---

## 4. Route Tree (`client/src/app/router.jsx`)

```
/                              HomePage
/register                      RegisterPage          (PublicOnly)
/verify-email                  VerifyEmailPage
/login                         LoginPage             (PublicOnly)
/forgot-password               ForgotPasswordPage    (PublicOnly)
/reset-password                ResetPasswordPage

[UserGuard] CustomerLayout
  /dashboard                   DashboardPage
  /builder                     BuilderPage
  /checkout                    CheckoutPage
  /orders                      OrdersPage
  /orders/:id                  OrdersPage (selected order)
  /profile                     ProfilePage

/admin/login                   AdminLoginPage        (not linked anywhere in the customer UI)

[AdminGuard] AdminLayout
  /admin                       AdminDashboardPage
  /admin/inventory             InventoryPage
  /admin/inventory/new         InventoryEditPage
  /admin/inventory/:id/edit    InventoryEditPage
  /admin/orders                AdminOrdersPage
  /admin/orders/:id            AdminOrderDetailPage
  /admin/ledger                LedgerAlertsPage
```

---

## 5. Page-to-File Map

| # | Page | Client files | Main server files |
|---|---|---|---|
| 1 | Home | `features/home/HomePage.jsx` | `catalogue.controller`, `catalogueService` |
| 2 | Register | `features/auth/pages/RegisterPage.jsx` | `authService`, `emailService`, `templates/verifyEmail` |
| 3 | Email verification | `features/auth/pages/VerifyEmailPage.jsx`, `hooks/useCountdown.js` | `authService`, `rateLimit` |
| 4 | Login | `features/auth/pages/LoginPage.jsx` | `authService`, `middleware/auth` |
| 5 | Forgot password | `features/auth/pages/ForgotPasswordPage.jsx` | `authService`, `templates/resetPassword` |
| 6 | Reset password | `features/auth/pages/ResetPasswordPage.jsx`, `passwordRules.js` | `authService` |
| 7 | Customer dashboard | `features/menu/pages/DashboardPage.jsx` | `catalogueService`, `orderService` |
| 8 | Pizza builder | `features/builder/**`, `features/cart/cartSlice.js` | `catalogueService` |
| 9 | Checkout | `features/checkout/**` | `pricingService`, `orderService`, `paymentService`, `settingsService` |
| 10 | Tracking and history | `features/orders/**` | `orderService`, `socketService` |
| 11 | Profile | `features/profile/**` | `userService`, `authService` |
| 12 | Admin login | `features/admin/auth/AdminLoginPage.jsx` | `routes/admin/auth.routes`, `authService` (admin path), `models/Admin` |
| 13 | Admin dashboard | `features/admin/dashboard/**`, `StockAdjustModal.jsx` | `dashboardService`, `orderService`, `inventoryService` |
| 14 | Inventory | `features/admin/inventory/InventoryPage.jsx` | `inventoryService`, `csv.js` |
| 15 | Add/Edit item | `features/admin/inventory/InventoryEditPage.jsx`, `ItemForm.jsx` | `inventoryService`, `Pizza` reference check |
| 16 | Order management | `features/admin/orders/AdminOrdersPage.jsx` | `orderService`, `socketService` |
| 17 | Order details | `features/admin/orders/AdminOrderDetailPage.jsx` | `orderService`, `invoiceService` (P1) |
| 18 | Ledger and alerts | `features/admin/ledger/**` | `ledgerService`, `alertService`, `jobs/lowStockJob`, `models/AlertLog` |

---

## 6. Naming and Style Rules

| Item | Rule | Example |
|---|---|---|
| React components | PascalCase file, default export | `PizzaCard.jsx` |
| Hooks | `use` prefix, camelCase | `useOrdersLive.js` |
| Redux slices | `<name>Slice.js` | `cartSlice.js` |
| Server routes | `<area>.routes.js` | `inventory.routes.js` |
| Controllers | `<area>.controller.js` | `order.controller.js` |
| Services | `<area>Service.js` | `paymentService.js` |
| Models | Singular PascalCase | `InventoryItem.js` |
| Validators | `<area>.schema.js` | `order.schema.js` |
| Tests | `<unit>.test.js`, E2E `<flow>.spec.js` | `pricingService.test.js` |
| Constants | UPPER_SNAKE_CASE values, camelCase files | `ORDER_STATUS` in `orderStatus.js` |
| API paths | Plural nouns, kebab-case | `/admin/inventory`, `/users/me/addresses` |
| Env vars | UPPER_SNAKE_CASE; client variables start with `VITE_` | `VITE_API_URL` |

---

## 7. Scripts (root `package.json`)

| Script | Action |
|---|---|
| `npm run dev` | Runs API (nodemon) and client (Vite) together |
| `npm run build` | Builds the client |
| `npm run lint` | ESLint on both packages |
| `npm run test` | Server Jest tests, then client Vitest tests |
| `npm run test:e2e` | Playwright suite |
| `npm run seed:catalogue` | Loads ingredients and preset pizzas |
| `npm run seed:admin -- --email x --password y` | Creates an admin account |
| `npm run seed:settings` | Creates default settings document |

---

## 8. What Must Never Be Committed

- `.env` files (only `.env.example` is committed)
- `node_modules/`, `dist/`, coverage output
- Razorpay secrets or webhook secrets
- Real customer data or database dumps
- Generated PDFs or exported CSVs

---

## 9. Build Order by Folder

1. `server/src/config`, `models`, `middleware`, `utils`, then `scripts` (Phase 0)
2. `server/src/services/authService` and `routes/auth`, then `client/features/auth` (Phase 1)
3. Admin auth, inventory service and routes, then `client/features/admin/auth` and `inventory` (Phase 2)
4. `client/features/menu`, `builder`, `cart` (Phase 3)
5. `pricingService`, `orderService`, `paymentService`, then `client/features/checkout` and `profile` (Phase 4)
6. `sockets`, order status endpoints, then `client/features/orders` and `admin/dashboard`, `admin/orders` (Phase 5)
7. `alertService`, `jobs`, `ledgerService`, then `client/features/admin/ledger` (Phase 6)
8. P1 extras: `invoiceService`, CSV exports, `orderingGate`, verification code, then tests, accessibility, deployment (Phase 7)
