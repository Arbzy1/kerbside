# Kerbside (application)

Web front-end and API for an MSc transport-modelling project. Interactive UI and Cloudflare Workers services live here; the Python research codebase is a sibling repo and is not part of this build.

## What the app shows and why

Kerbside presents a **scoreboard of research claims** about what improves (or harms) cycle-flow prediction from street-network and attractor features. Open **Cities** first for the twelve-city transfer numbers (ranking vs scale). **Findings** leads with the k-curve, then every claim. **Story** (`/guide`) is the Cooper-facing page: ranking transfers; scale needs a local intercept; radius still 800/1600/3200. Do not quote Cardiff s=1 hunt numbers or Learn 0.89 on the Guide. Live DB can go stale — reseed after copy or CSV edits (`npm run db:seed`).

## Install

```bash
cd Application
npm install
```

Requires Node 20+.

## Development

```bash
npm run dev
```

Turborepo starts:

- **web** — Vite at http://localhost:5173 (proxies `/api` and `/health` to the API)
- **api** — Hono on Wrangler at http://127.0.0.1:8787

Other scripts: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:e2e`, `npm run rules:sync`, `npm run data:sync`, `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`, `npm run db:studio`, `npm run deploy:staging`, `npm run deploy:prod`, `npm run db:migrate:staging`, `npm run db:migrate:prod`.

Copy `.env.example` to `.env` and set `DATABASE_URL` before migrate/seed. For local Workers, also put `DATABASE_URL` in `apps/api/.dev.vars` (gitignored).

## Deploying

Staging and production are fully separate: different Worker names, different Pages projects, different Neon `DATABASE_URL` values. Migrations are never part of `deploy:*` — run `db:migrate:*` first (locally or as its own CI step).

### First-time setup (manual)

1. **Cloudflare account** — create (or reuse) an account; note the Account ID.
2. **API token** — create a token with Workers edit + Pages edit permissions (`CLOUDFLARE_API_TOKEN`).
3. **Workers** — first deploy creates them from `apps/api/wrangler.toml`:
   - Staging: `kerbside-api-staging`
   - Production: `kerbside-api`
4. **Worker secrets** (never commit these):
   ```bash
   cd Application
   npx wrangler secret put DATABASE_URL --env staging
   npx wrangler secret put DATABASE_URL --env production
   ```
   Use the staging Neon URL for `--env staging` and the production Neon URL for `--env production`.
5. **Pages projects** — create empty projects named `kerbside-web-staging` and `kerbside-web` (Direct Upload). After the first Pages deploy, confirm the `*.pages.dev` hostnames match `CORS_ORIGIN` in `apps/api/wrangler.toml`; update and redeploy the API if they differ.
6. **GitHub repository secrets** (Settings → Secrets and variables → Actions):
   | Secret | Used for |
   | --- | --- |
   | `CLOUDFLARE_API_TOKEN` | Wrangler deploy |
   | `CLOUDFLARE_ACCOUNT_ID` | Wrangler deploy |
   | `DATABASE_URL` | PR CI unit + e2e (local web/api against this DB) |
   | `DATABASE_URL_STAGING` | `db:migrate:staging` on push to `main` |
   | `DATABASE_URL_PRODUCTION` | `db:migrate:prod` on manual prod deploy |
7. **GitHub repository variables** (not secrets — public origins):
   | Variable | Example |
   | --- | --- |
   | `STAGING_API_URL` | `https://kerbside-api-staging.<subdomain>.workers.dev` |
   | `PRODUCTION_API_URL` | `https://kerbside-api.<subdomain>.workers.dev` |
   | `STAGING_WEB_URL` | `https://kerbside-web-staging.pages.dev` |
   | `PRODUCTION_WEB_URL` | `https://kerbside-web.pages.dev` |

   Set the API URLs after the first Worker deploy so Pages builds get the correct `VITE_API_URL`. Set the WEB URLs after the first Pages deploy. Smoke tests curl the Worker `/health` and `/api/verdicts`, and hard-hit Pages `/cities` (SPA deep-link; must return the app shell, not a 404).

### Normal flow

- **Merge to `main`** → `deploy-staging.yml` runs checks → `db:migrate:staging` → `deploy:staging` → smoke test.
- **Production** → Actions → “Deploy production” → `workflow_dispatch` only → `db:migrate:prod` → `deploy:prod` → smoke test.

Local equivalents (with Cloudflare credentials and the right `DATABASE_URL` / `VITE_API_URL` in the environment):

```bash
npm run db:migrate:staging   # uses DATABASE_URL from the environment
npm run deploy:staging       # API Worker + Pages; web build reads VITE_API_URL
SMOKE_API_URL=https://kerbside-api-staging.<subdomain>.workers.dev \
SMOKE_WEB_URL=https://kerbside-web-staging.pages.dev \
  npm run smoke:deploy

npm run db:migrate:prod
npm run deploy:prod
```

Do not put secrets in `wrangler.toml`. Do not echo secret values in CI logs.

## Why this structure

`apps/web` owns the React UI, `apps/api` owns the Workers API, and `packages/shared` holds types and constants both sides import. `packages/data` vendors experiment result CSVs so CI does not depend on the Python research tree. That split keeps browser and edge runtimes independent while sharing contracts without a published package registry — npm workspaces + Turborepo wire install, `dev`, `build`, and `typecheck` across the tree.
