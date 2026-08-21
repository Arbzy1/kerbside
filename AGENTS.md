# Kerbside

Kerbside is the web front-end and API for an MSc transport-modelling project: interactive maps, scenario tooling, and supporting services around kerbside / access analysis. The Python research code lives in a sibling repository and is not part of this build. This monorepo is the application layer only — React UI, Cloudflare Workers API, and shared TypeScript types.

## Stack

| Layer | Choice |
| --- | --- |
| Web | React 19 + Vite |
| UI | Tailwind CSS v4 + shadcn/ui |
| API | Hono on Cloudflare Workers |
| Database | Neon Postgres + Drizzle |
| Auth | Better Auth |
| Monorepo | npm workspaces + Turborepo (`@kerbside/*` packages) |
| Unit tests | Vitest |
| E2E tests | Playwright |
| Deploy | Cloudflare Pages / Workers |
| Email | Resend |
| CDN / media | Bunny CDN |

## Package scope

All workspace packages use the `@kerbside/*` scope (for example `@kerbside/web`, `@kerbside/api`, `@kerbside/shared`, `@kerbside/data`).

## Tailwind CSS v4

This project uses **Tailwind v4**. Theme tokens live in `apps/web/src/index.css` under `@theme` / `:root` CSS variables. There is **no** `tailwind.config.ts`. Brand colours are stored as **oklch**. Any prompt or doc that refers to `tailwind.config.ts` is wrong for this repo.

## Scripts

All npm scripts use `<domain>:<action>` naming (for example `test:unit`, `lint:fix`, `rules:sync`, `db:migrate`, `data:sync`, `deploy:staging`, `db:migrate:prod`). Top-level verbs that are themselves domains (`dev`, `build`, `typecheck`, `lint`) are allowed as-is and are wired through Turborepo.

## Deploy / Workers

- Migrations **never** run inside a deploy step. Invoke `db:migrate:staging` / `db:migrate:prod` (or the matching CI step) separately before `deploy:staging` / `deploy:prod`.
- CORS is per-environment: each Worker env allows only its matching Pages origin plus localhost for local dev. Never use a wildcard `Access-Control-Allow-Origin`.
- The API must use the Neon **HTTP** driver (`@neondatabase/serverless` + `drizzle-orm/neon-http`). Workers cannot open TCP sockets; `pg` / `node-postgres` will fail in production even if it works locally.

## Code style

- No default exports in application source (tooling entry files such as Vite config and the Workers/Hono export may use the default export required by the framework).
- Prefer composition over inheritance.
- Use named imports; keep import groups sorted (external packages, then workspace packages, then relative/`@/` paths).

## Frontend motion

- In `apps/web/src`, use the shared motion and glass-surface tokens in `index.css`; do not add ad-hoc durations, easing curves, or opaque surfaces.
- Interactive state changes should animate with the shared motion utilities, while `prefers-reduced-motion` must always remove non-essential movement.
- Route navigation uses View Transitions where supported and must retain a non-animated functional fallback.
- Keep glass effects readable: preserve contrast, avoid blur over dense chart/table content, and never rely on motion alone to communicate state.

## NEVER-DO

- Never use pnpm or yarn — npm only; do not commit `pnpm-lock.yaml` or `yarn.lock`.
- Never hand-write SQL table migrations — use the Drizzle generator. The only allowed hand-written SQL migrations are RLS / grant policies that drizzle-kit cannot emit.
- Never hand-roll a UI primitive that shadcn provides — add it with the shadcn CLI.
- Never bypass RLS with a service-role key outside trusted server contexts.
- Never edit the tool-specific rule files directly — change `AGENTS.md` and run `npm run rules:sync`.
- Never reassign `c.env` in a Cloudflare Workers handler or middleware — it is read-only and doing so returns 500. Read values from `c.env` directly and pass them down.
- Never fold `db:migrate:*` into `deploy:*` scripts or workflow steps that only deploy.
- Never allow CORS `*` for the API; keep origins explicit per environment.
- Never use a TCP Postgres driver in the Worker runtime — Neon HTTP only.

## Testing

- Unit tests live beside source (or under a clear `*.test.ts` convention) and run via `npm run test:unit` (Vitest).
- E2E tests live under `e2e/` and run via `npm run test:e2e` (Playwright) against a locally started web+api (not a live deploy).
- Prefer focused, deterministic tests. Scaffold-phase tests may be trivial; feature work must cover the behaviour it adds.
- CI on pull requests runs typecheck, lint, unit tests, build, and e2e. Push to `main` deploys staging after the same checks plus migrate; production is manual `workflow_dispatch` only.

## Definition of done

- [ ] Typecheck and lint pass (`npm run typecheck`, `npm run lint`)
- [ ] Relevant unit tests pass (`npm run test:unit`)
- [ ] UI uses shadcn components where a primitive exists
- [ ] No secrets committed; env vars documented in `.env.example`
- [ ] Scripts follow `<domain>:<action>`; `AGENTS.md` updated and `npm run rules:sync` run if agent rules changed
- [ ] Acceptance criteria for the task are met end-to-end in local `npm run dev`

## Decisions

RLS + auth: Better Auth sessions reach Postgres via a per-request GUC set inside a
transaction (SET LOCAL request.jwt.claims). Policies read that. Better Auth remains
session-based; no JWT layer is rolled on top.

Phase 1 ships public reference data only. RLS is enabled with SELECT-only policies and no write grant for the app role. Better Auth and the per-request GUC pattern are deferred to Phase 1b and only if user accounts are required.
