# DatumPilot – Architecture Overview

## Document Info
- **Version**: 2.0
- **Last Updated**: December 2025
- **Status**: Approved

---

## 1) Architecture Overview (Major Components)

- Web frontend (Next.js 15 App Router, React, Tailwind/shadcn/ui) for **builder, interpreter, stack-up analysis, projects, settings**.
- API layer (Next.js route handlers + server actions) exposing `/api/fcf/*`, project CRUD, exports.
- Deterministic core:
  - Canonical FcfJson schema with Zod validation
  - Rules engine for ASME Y14.5-2018 validation
  - FCF calculation engine (bonus tolerance, virtual condition, pass/fail)
  - **Stack-up calculation engine** (Worst-Case, RSS, Six Sigma methods)
  - Units/formatting utilities
- AI architecture: **Single-agent Claude Opus 4.5** (with OpenAI GPT-4.1 fallback) for explanations only. Deterministic rules/calcs are authoritative.
- Data layer (Supabase Postgres with RLS) for projects, fcf_records, **stackup_analyses**, measurements, user_settings, uploads metadata.
- Auth and access control (Supabase Auth + RLS + signed URLs).
- Object/file storage (Supabase Storage private buckets for exports; signed URL generation).
- Export/rendering service (server-side SVG→PNG rasterization; JSON/SVG export endpoints).
- Observability/telemetry (structured logging with correlation IDs, metrics/alerts, frontend error capture).

### What Changed from v1.0

| Original | Current |
|----------|---------|
| Image interpreter route | Removed (Mode 1 out of v1 scope) |
| `/api/ai/*` endpoints | Removed (no extraction agent) |
| 2-agent GPT-5.1 | Single-agent Claude Opus 4.5 + OpenAI fallback |
| parseConfidence | Removed (builder input only) |
| — | Added stack-up analysis module |
| — | Added stackup_analyses table |

---

## 2) Component Responsibilities, Inputs, Outputs, Interactions

### Web Frontend
- **Responsibilities**: UI flows for builder, interpreter, **stack-up analysis**, projects, settings; optimistic UX; state hydration from server actions.
- **Inputs**: user actions, session, settings, API responses (validation issues, AI results, exports).
- **Outputs**: FcfJson drafts, measurement inputs, **stack-up dimensions**, project CRUD requests.
- **Interactions**: calls server actions/route handlers; renders deterministic validation; displays AI explanations.

### API Layer (Route Handlers + Server Actions)
- **Responsibilities**: authenticate requests, enforce RLS via Supabase client, orchestrate deterministic core + AI, expose CRUD.
- **Inputs**: authenticated user context, FcfJson payloads, **stack-up analysis inputs**, measurement inputs.
- **Outputs**: validation issues, calculation results, AI explanations, CRUD results, export URLs.
- **Interactions**: invokes deterministic core modules, Supabase DB/storage SDKs, AI provider abstraction, logging/metrics.

### Deterministic Core (Schema + Rules + Calculations)
- **Responsibilities**:
  - Define `FcfJson` type/schema
  - Validate against ASME rules
  - Compute FCF results (bonus, virtual condition, pass/fail)
  - **Compute stack-up results (Worst-Case, RSS, Six Sigma)**
  - Format units/precision
- **Inputs**: candidate FcfJson, measurement inputs, **stack-up dimensions with tolerances**, user settings.
- **Outputs**:
  - `ValidationResult` (codes E001–E00x)
  - FCF calculation outputs (bonus, T_eff, pass/fail)
  - **Stack-up results (nominal, total tolerance, min/max, contributions)**
  - Formatted values
- **Interactions**: consumed by API and frontend; fed into AI prompts; blocks finalize/export on invalid data.

### AI Architecture (Single-Agent with Provider Abstraction)
- **Responsibilities**:
  - Generate engineering-format explanations via Explanation Agent
  - Manage provider abstraction (Claude primary, OpenAI fallback)
  - Apply prompt caching for cost efficiency
- **Inputs**: validated FcfJson, optional CalcResult, validation results, correlation ID.
- **Outputs**: explanation text, AI metadata (provider, model, cache status, tokens).
- **Interactions**: invoked by `/api/fcf/interpret`; uses deterministic outputs as ground truth.

### Agent Responsibilities

| Agent | Purpose | Model |
|-------|---------|-------|
| **Explanation Agent** | Generate engineering-format explanation | Claude Opus 4.5 (primary) / GPT-4.1 (fallback) |

**Removed agents:**
- ~~Extraction Agent~~ - Image interpretation removed from v1 scope

### Data Layer (Supabase Postgres + RLS)
- **Responsibilities**: persist projects, fcf_records, **stackup_analyses**, measurement runs, user_settings, uploads metadata; enforce per-user isolation with RLS.
- **Inputs**: CRUD requests from API; service role for server actions as needed.
- **Outputs**: rows/jsonb payloads; errors if policy denied.
- **Interactions**: used by API via Supabase client; RLS bound to `auth.uid()`; uses Postgres constraints/indexes.

### Object/File Storage
- **Responsibilities**: store generated exports (PNG/SVG/JSON); keep private by default.
- **Inputs**: server-side writes for exports.
- **Outputs**: signed URLs with expiry; metadata persisted in DB.
- **Interactions**: Supabase Storage buckets; linked to DB rows via metadata table.

**Note**: Image/PDF uploads removed from v1 scope (no Mode 1).

### Auth and Access Control
- **Responsibilities**: Supabase OAuth/magic link; session management; RLS enforcement; signed URL scope.
- **Inputs**: auth provider responses; JWT in requests.
- **Outputs**: session tokens, user context for RLS, access-denied responses.
- **Interactions**: frontend uses Supabase client for session; backend uses service role with RLS or user session tokens.

### Export/Rendering Service
- **Responsibilities**: render SVG preview to PNG server-side; serve SVG/JSON exports; ensure user-scoped access.
- **Inputs**: validated FcfJson, user settings (units/precision), request format (png/svg/json).
- **Outputs**: signed URL to artifact; inline JSON for copy/download.
- **Interactions**: uses deterministic formatter/SVG renderer; writes to storage; returns URL to frontend.

### Observability/Telemetry
- **Responsibilities**: structured logs with correlation IDs, AI call metrics (latency, cost, failures), API health, frontend error capture.
- **Inputs**: request lifecycle data, AI responses, validation/calculation outcomes.
- **Outputs**: log events, metrics/alerts dashboards, error traces (sanitized).
- **Interactions**: lightweight logger (pino/console), monitoring service (e.g., Sentry/PostHog), Supabase log drains as needed.

---

## 3) Boundaries

### Rules/Calculation Engine vs AI Layer
- Deterministic engine is authoritative for schema validity and numeric outputs; AI cannot override, only explain.
- AI prompts receive deterministic outputs; the Explanation Agent must mirror authoritative numbers.
- Confidence is derived from validation cleanliness (no parseConfidence).

### Backend vs Frontend
- Backend (route handlers/server actions) owns orchestration, validation, calculations, persistence, storage signing, and AI calls.
- Frontend owns presentation, local draft state, optimistic UX, and client-side validation hints; it never bypasses server validation on finalize/export.
- Sensitive keys/secrets and service-role operations never run in the browser.

### Persistence vs Stateless Logic
- **Persistence**: Postgres (projects, fcf_records, **stackup_analyses**, measurements, settings, uploads metadata) and storage buckets; all behind RLS and signed URLs.
- **Stateless logic**: rules/calculation engine, **stack-up calculator**, AI prompts, formatters, SVG rendering; pure functions called by API.
- Orchestrator treats AI calls as stateless; retries/backoff handled without coupling to DB except for logging/auditing.

---

## 4) Technology Choices

### Core Stack
- **Web/app**: Next.js 15 App Router + TypeScript; Tailwind + shadcn/ui; React Server Components where possible; client components for interactive forms/previews.
- **API layer**: Next.js route handlers (`app/api/*`) and server actions; Supabase server client for DB/storage/auth; Zod for input parsing.
- **Deterministic core**: TypeScript modules under `lib/fcf`, `lib/rules`, `lib/calc`, `lib/stackup`, `lib/format`; Zod schemas; Vitest for unit tests.

### AI Architecture
- **Primary**: Anthropic Claude Opus 4.5 with prompt caching
- **Fallback**: OpenAI GPT-4.1
- **Provider abstraction**: `lib/ai/providers/` with automatic retry and failover
- Correlation IDs for debugging; optional streaming for longer explanations

### Data/Auth
- Supabase Postgres + Auth + RLS
- `jsonb` for FcfJson and stack-up dimensions storage
- Indexes on `user_id`, `project_id`, `created_at`

### Storage
- Supabase Storage private buckets (`exports`)
- Signed URLs with short TTL

### Exports/Rendering
- Server-side SVG generator in Node
- `sharp` for PNG rasterization

### Observability
- Sentry (errors), PostHog (product analytics + feature flags)
- JSON logging with correlation IDs

---

## 5) ADR List

| ADR | Status | Summary |
|-----|--------|---------|
| ADR-001 | Accepted | Next.js App Router with server actions |
| ADR-002 | Accepted | Supabase as primary backend platform |
| ADR-003 | Accepted | FcfJson schema stored as jsonb; deterministic rules authoritative |
| ADR-007 | **Superseded** | 2-agent architecture → see ADR-009 |
| ADR-008 | **Superseded** | GPT-5.1 model selection → see ADR-009 |
| ADR-009 | Accepted | Single-agent Claude Opus 4.5 with OpenAI fallback |
| ADR-010 | Accepted | Stack-up analysis with Worst-Case/RSS/Six Sigma |

---

## 6) Services Configuration

### Supabase
- Project URL, anon/public API key, service role key
- Database connection string
- Storage bucket: `exports`
- RLS enabled on all tables

### Vercel (or preferred host)
- Link repo; env vars for Supabase keys/URL
- **Anthropic API key** (primary AI)
- **OpenAI API key** (fallback AI)
- Sentry DSN, PostHog keys

### AI Providers
- **Anthropic**: `ANTHROPIC_API_KEY`, model: `claude-opus-4-5-20250514`
- **OpenAI**: `OPENAI_API_KEY`, model: `gpt-4.1`

### Observability
- Sentry DSN for frontend and server
- PostHog project API key
- Events: `builder_open`, `interpret_run`, `stackup_calculate`, `export_success`

---

## 7) Key Changes from Original Architecture

1. **Removed Mode 1 (Image Interpretation)**: No image upload, no Extraction Agent, no parseConfidence
2. **Single-Agent AI**: Claude Opus 4.5 for explanations only, with OpenAI fallback
3. **Provider Abstraction**: Clean interface for swapping AI providers
4. **Added Stack-Up Analysis**: Full tolerance stack-up calculation engine with three methods
5. **Simplified Data Model**: Removed `parse_confidence` column, changed `source_input_type` check
6. **Updated Navigation**: Removed `/app/image-interpreter`, added `/app/stackup`
