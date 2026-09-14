# TripQuote

TripQuote turns multi-stop road-trip ideas into route plans and connects travelers with suitable local operators.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/tripquote run dev` — run the TripQuote frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed demo operators and vehicles
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/tripquote/src/pages/tripquote-pages.tsx` — primary TripQuote screens
- `artifacts/api-server/src/routes/tripquote.ts` — trip, route, matching, operator, enquiry, and dashboard APIs
- `artifacts/api-server/src/lib/route-service.ts` — provider-independent MVP route calculation
- `lib/db/src/schema/` — relational PostgreSQL tables
- `lib/api-spec/openapi.yaml` — API source of truth
- `artifacts/tripquote/src/index.css` — TripQuote visual tokens and motion

## Architecture decisions

- Roaming radius is stored per destination and excluded from main route distance calculations.
- Route calculation is isolated behind a small service so a self-hosted routing engine can replace the MVP haversine estimate.
- Generated OpenAPI hooks and Zod schemas are the shared contract between frontend and API.
- PostgreSQL stores normalized trips, trip destinations, operators, operator vehicles, and enquiries.

## Product

- Travelers create multi-stop routes with dates, passengers, vehicle type, stay days, and per-stop exploration radius.
- The app shows route distance, drive time, itinerary context, ranked operators, profiles, and enquiry actions.
- V1 excludes payments, commissions, wallets, subscriptions, and settlement.

## User preferences

- Keep the product focused on discovery, planning, operator matching, and enquiry generation.
- Do not add paid Google Maps dependencies or payment functionality.

## Gotchas

- Run API codegen after every OpenAPI contract change.
- Run `pnpm run typecheck:libs` before leaf package checks when changing `lib/*`.
- Artifact workflows provide `PORT` and `BASE_PATH`; do not hard-code either in app code.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
