# TripQuote

TripQuote helps travelers turn a rough route idea into a practical multi-stop road trip, understand the route, and connect with a suitable local travel operator.

## What is included

- Multi-destination trip planner with per-stop stay days, roaming radius, and notes
- Route calculation with leg-by-leg distance and estimated driving time
- Separate visual treatment for main route distance and exploration radius
- PostgreSQL-backed demo operators and vehicles
- Transparent operator matching scores with match reasons
- Operator discovery and profile pages
- Call, WhatsApp, and enquiry actions
- Customer dashboard with saved trips and enquiry summary
- Responsive mobile-friendly interface

TripQuote V1 intentionally does not include payments, commissions, wallets, subscriptions, or booking settlement.

## Technology

- React + Vite + TypeScript
- Tailwind CSS
- Express API server
- PostgreSQL + Drizzle ORM
- OpenAPI contract with generated React Query hooks and Zod schemas
- OpenStreetMap-compatible route service abstraction for MVP distance calculations

The current workspace is structured around the existing pnpm TypeScript service template. The relational data model and API contracts are kept independent of the route calculation implementation so a self-hosted OSRM, GraphHopper, Valhalla, or OSMnx service can replace the MVP calculator later.

## Repository map

```text
artifacts/tripquote/       React/Vite frontend
artifacts/api-server/      Express API routes and server startup
lib/api-spec/              OpenAPI source of truth
lib/api-client-react/      Generated React Query client
lib/api-zod/               Generated Zod request/response schemas
lib/db/                    PostgreSQL Drizzle schema and seed helper
scripts/                   Workspace utility scripts
```

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set `DATABASE_URL` in the environment. Copy `.env.example` and use a PostgreSQL database.

3. Apply the relational schema:

   ```bash
   pnpm --filter @workspace/db run push
   ```

4. Seed demo operators and vehicles:

   ```bash
   pnpm --filter @workspace/scripts run seed
   ```

   The API also ensures demo operators exist on startup for a fresh development database.

5. Run the API:

   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

6. Run the frontend:

   ```bash
   pnpm --filter @workspace/tripquote run dev
   ```

7. Regenerate API clients after changing `lib/api-spec/openapi.yaml`:

   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```

## API endpoints

```text
GET  /api/healthz
GET  /api/trips
POST /api/trips
GET  /api/trips/:tripId
GET  /api/trips/:tripId/route
GET  /api/operators
GET  /api/operators/:operatorId
GET  /api/matching/operators?tripId=:tripId
POST /api/enquiries
GET  /api/dashboard/summary
```

## Validation

```bash
pnpm run typecheck
PORT=21950 BASE_PATH=/ pnpm --filter @workspace/tripquote run build
```

## Hostinger VPS deployment

1. Provision Ubuntu/Debian, Node.js 20+, pnpm, PostgreSQL, and Nginx.
2. Clone the repository and install dependencies with `pnpm install --frozen-lockfile`.
3. Create the production environment from `.env.example` and set the production `DATABASE_URL` and `SESSION_SECRET`.
4. Apply the schema with `pnpm --filter @workspace/db run push`.
5. Seed only if this is a demo environment: `pnpm --filter @workspace/scripts run seed`.
6. Build the frontend with the production base path used by Nginx:

   ```bash
   PORT=3000 BASE_PATH=/ pnpm --filter @workspace/tripquote run build
   ```

7. Build and run the API with a process manager such as systemd or PM2:

   ```bash
   pnpm --filter @workspace/api-server run build
   PORT=8080 NODE_ENV=production pnpm --filter @workspace/api-server run start
   ```

8. Serve `artifacts/tripquote/dist/public` with Nginx and reverse proxy `/api` to the API process on port 8080.

The application does not require MongoDB or a Replit-only runtime service.