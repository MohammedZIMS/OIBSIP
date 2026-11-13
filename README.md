# Forno & Farina: Pizza Ordering and Inventory Platform

MERN monorepo (React + Vite, Express, MongoDB). See `CLAUDE.md` for working rules and `docs/` for the PRD, TRD, workflow, plan and file structure.

## Status

| Area | State |
|---|---|
| Folder structure | Done (see `docs/FILE_Structure.md`) |
| Customer Home page (`/`) | Done (static data) |
| Database models (10) and backend architecture | Done (`docs/DATABASE.md`) |
| Centralized error handling, request validation | Done, 28 tests |
| Catalogue API (`/api/ingredients`, `/api/pizzas`) | Done |
| Everything else | Not started (Phase 1 next: authentication) |

## Quick start

```bash
npm install
cp client/.env.example client/.env
cp server/.env.example server/.env
npm run dev            # client on :5173, API on :5000 (needs MONGO_URI in server/.env)
```

Optional local services: `docker compose up -d` (MongoDB replica set and Mailhog).

The client runs on its own with `npm run dev:client`; the Home page uses static sample data until `GET /api/pizzas` exists.

## Backend commands

```bash
npm test -w server                       # unit and HTTP tests (no database needed)
npm run seed:catalogue -w server         # ingredients and preset pizzas (idempotent)
npm run seed:admin -w server -- --email you@example.com --password 'LongPassword#1'
```

Use your own MongoDB connection string in `server/.env` (never commit it). Atlas: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/pizza?retryWrites=true&w=majority`.
