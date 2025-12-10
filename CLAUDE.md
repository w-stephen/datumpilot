# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
pnpm dev              # Start Next.js dev server with Turbo

# Quality checks
pnpm lint             # ESLint
pnpm lint:fix         # ESLint with auto-fix
pnpm typecheck        # TypeScript type checking
pnpm test             # Run Vitest tests
pnpm test:watch       # Vitest in watch mode
pnpm check            # Full CI check: lint:ci + typecheck + test:ci

# Formatting
pnpm format           # Prettier on all files
```

Run a single test file:
```bash
pnpm test apps/web/tests/unit/fcfSchema.test.ts
```

## Architecture Overview

DatumPilot is a GD&T (Geometric Dimensioning and Tolerancing) feature control frame builder/interpreter built with Next.js 15 App Router.

### Key Layers

1. **Web Frontend** (`apps/web/app/`)
   - Next.js 15 App Router with route groups: `(marketing)/` for public pages, `app/` for authenticated app
   - Pages: builder, interpreter, projects, settings

2. **API Layer** (`apps/web/app/api/`)
   - `/api/fcf/*` - FCF validation, interpretation, export
   - `/api/projects/`, `/api/uploads/` - CRUD operations

3. **Deterministic Core** (`apps/web/lib/`)
   - `fcf/schema.ts` - Canonical `FcfJson` type and Zod schema (authoritative over AI outputs)
   - `rules/validateFcf.ts` - ASME Y14.5 validation rules
   - `rules/errorCodes.ts` - Standardized error codes (E001-E009)
   - `calc/` - Calculators for position, flatness, perpendicularity, profile

4. **AI Orchestration** (`apps/web/lib/ai/`)
   - Explanation Agent only (builder input requires no extraction)
   - `orchestrator.server.ts` - Server-only orchestration (validation → calculation → explanation)
   - AI cannot override deterministic validation; serves to explain and suggest

5. **Export Pipeline** (`apps/web/lib/export/`)
   - User-facing: PNG, SVG, PDF (visual exports for drawings and reports)
   - Internal/API: JSON (preserved for future CAD/PLM integrations)

6. **Data Layer**
   - Supabase Postgres with RLS for multi-tenant isolation
   - Tables: projects, fcf_records, measurements, user_settings, uploads
   - All FCF JSON stored as `jsonb` in `fcf_records`

### Critical Boundaries

- **Deterministic engine is authoritative**: AI prompts receive deterministic validation results; AI cannot override schema validity or calculation outputs
- **Server vs Client**: Sensitive operations (AI calls, storage signing, service-role DB access) only run server-side; `.server.ts` suffix marks server-only modules
- **RLS enforced**: All data access filtered by `auth.uid()`; never bypass in client code

## Naming Conventions

- Routes/folders: `kebab-case`
- React components: `PascalCase.tsx`
- TypeScript modules: `kebab-case.ts`
- Types/interfaces: `PascalCase` (e.g., `FcfJson`, `ValidationResult`)
- Zod schemas: suffix with `Schema` (e.g., `fcfJsonSchema`)
- Error codes: `E001`-`E00x` format in `errorCodes.ts`

## Data Model

Key entities and relationships:
- Users (Supabase auth) → Projects → FCF Records → Measurements
- Projects → Uploads (images, PDFs, exports)
- User Settings (units, decimals, dual-display) per user

Units stored canonically in `mm`; source unit preserved for traceability.

## Environment Setup

Copy `.env.example` to `.env.local` and configure:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `OPENAI_API_KEY`
