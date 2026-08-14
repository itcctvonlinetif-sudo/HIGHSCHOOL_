# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24 (Replit), 22 LTS compatible (local Ubuntu)
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React 19, Vite 7, Tailwind CSS 4, Radix UI, React Query

## Structure

```text
/
├── artifacts/
│   ├── api-server/         # Express 5 REST API backend (@workspace/api-server)
│   ├── masjid-istiqlal/    # React + Vite frontend website (@workspace/masjid-istiqlal)
│   └── mockup-sandbox/     # UI mockup sandbox for design work
├── lib/
│   ├── api-spec/           # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection (@workspace/db)
│   └── object-storage-web/ # Browser-side Replit object storage utilities
├── scripts/
│   ├── src/seed.ts         # Database seeding script
│   ├── setup-if-needed.sh  # Auto-setup script (called by artifact workflows on first run)
│   └── post-merge.sh       # Post-merge setup (called after task agent merges)
├── PANDUAN-LOKAL.md        # Guide for running on local Ubuntu server
├── pnpm-workspace.yaml     # pnpm workspace config
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Registered Artifacts

| ID | Kind | Title | Port |
|----|------|-------|------|
| `artifacts/masjid-istiqlal` | web | Masjid Istiqlal Website | 23207 |
| `3B4_FFSkEVBkAeYMFRJ2e` | api | API Server | 8080 |
| `XegfDyZt7HqfW2Bb8Ghoy` | design | Canvas (Mockup Sandbox) | 8081 |

## Active Workflows

- `artifacts/masjid-istiqlal: web` — runs the Vite frontend dev server on port 23207
- `artifacts/api-server: API Server` — builds & runs the Express API on port 8080

Both workflows call `scripts/setup-if-needed.sh` on first run to auto-install dependencies and push DB schema.

## First-Run / Import Setup

When importing this project to a fresh Replit environment:

1. **Dependencies** — installed automatically via `scripts/setup-if-needed.sh` when workflows start
2. **Database** — provision a PostgreSQL database (Replit Database tool), then workflows will auto-run `pnpm --filter db push` to create tables
3. **Seed data** — run once manually: `pnpm --filter @workspace/scripts run seed`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
- Depends on: `@workspace/db`, `@workspace/api-zod`
- Dev: `pnpm --filter @workspace/api-server run dev` — builds then starts with source maps
- Build: `pnpm --filter @workspace/api-server run build` — esbuild bundle to `dist/index.mjs`

### `artifacts/masjid-istiqlal` (`@workspace/masjid-istiqlal`)

React + Vite frontend for the Musholla Nurul Iman website. Includes public-facing pages and an admin dashboard.

- Entry: `src/main.tsx`
- Root component: `src/App.tsx`
- Dev: `pnpm --filter @workspace/masjid-istiqlal run dev` — Vite dev server on port 23207
- Build: `pnpm --filter @workspace/masjid-istiqlal run build` — static output to `dist/`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`)
- Push schema: `pnpm --filter db push` (uses `db` short filter — matches `@workspace/db`)
- Force push: `pnpm --filter db push-force`

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `lib/object-storage-web` (`@workspace/object-storage-web`)

Browser-side utilities for Replit object storage (GCS-backed). Provides `useUpload` hook and `ObjectUploader` component for presigned URL uploads. Used in the admin UI for photo/video file uploads.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`.

- `seed` — seeds the database with default data (admin, settings, menus, berita, galeri, dll.)
- `seed -- --force` — forces re-seed even if data exists
