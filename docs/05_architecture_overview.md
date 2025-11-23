# DatumPilot – Architecture Overview

## 1) Architecture Overview (Major Components)
- Web frontend (Next.js 15 App Router, React, Tailwind/shadcn/ui) for builder, interpreter, image interpreter, projects, settings.
- API layer (Next.js route handlers + server actions) exposing `/api/fcf/*`, `/api/ai/*`, project CRUD, uploads, exports.
- Deterministic core (canonical FcfJson schema, Zod validation, rules engine, calculation engine, units/formatting utilities).
- AI orchestration (multi-agent OpenAI calls: Extraction, Combined, Interpretation, QA/adjudicator) with guardrails using deterministic results.
- Data layer (Supabase Postgres with RLS) for projects, fcf_records, measurements, user_settings, uploads metadata.
- Auth and access control (Supabase Auth + RLS + signed URLs).
- Object/file storage (Supabase Storage private buckets for images/PDFs/exports; signed URL generation).
- Export/rendering service (server-side SVG→PNG rasterization; JSON/SVG export endpoints).
- Observability/telemetry (structured logging with correlation IDs, metrics/alerts, frontend error capture).

## 2) Component Responsibilities, Inputs, Outputs, Interactions
- Web frontend
  - Responsibilities: UI flows for builder, interpreter, image upload, projects, settings; optimistic UX; state hydration from server actions.
  - Inputs: user actions, session, settings, API responses (validation issues, AI results, exports).
  - Outputs: FcfJson drafts, measurement inputs, project CRUD requests, upload requests.
  - Interactions: calls server actions/route handlers; renders deterministic validation; displays AI confidence/warnings.

- API layer (route handlers + server actions)
  - Responsibilities: authenticate requests, enforce RLS via Supabase client, orchestrate deterministic core + AI, expose CRUD.
  - Inputs: authenticated user context, FcfJson payloads, files (via upload URLs), measurement inputs.
  - Outputs: validation issues, calculation results, AI responses (final JSON, explanation, confidence), CRUD results, export URLs.
  - Interactions: invokes deterministic core modules, Supabase DB/storage SDKs, OpenAI API, logging/metrics.

- Deterministic core (schema + rules + calculations)
  - Responsibilities: define `FcfJson` type/schema, validate against ASME rules, compute numeric results (bonus, virtual condition, pass/fail), format units/precision.
  - Inputs: candidate FcfJson, measurement inputs, user settings (units/decimals/dual display).
  - Outputs: `ValidationResult` (codes E001–E005...), calculation outputs (bonus, T_eff, pass/fail), formatted values.
  - Interactions: consumed by API and frontend; fed into AI prompts; blocks finalize/export on invalid data.

- AI orchestration
  - Responsibilities: manage agent prompts/calls (Extraction, Combined, Interpretation, QA), reconcile outputs, attach confidence/warnings.
  - Inputs: signed image URL or text, validated FcfJson, deterministic calculations, validation issues, correlation ID.
  - Outputs: final FcfJson, explanation, confidence level, warnings/notes.
  - Interactions: called from `/api/fcf/interpret`; logs per-agent traces; uses deterministic outputs as ground truth.

- Data layer (Supabase Postgres + RLS)
  - Responsibilities: persist projects, fcf_records, measurement runs, user_settings, uploads metadata; enforce per-user isolation with RLS.
  - Inputs: CRUD requests from API; service role for server actions as needed.
  - Outputs: rows/jsonb payloads; errors if policy denied.
  - Interactions: used by API via Supabase client; RLS bound to `auth.uid()`; uses Postgres constraints/indexes.

- Object/file storage
  - Responsibilities: store uploaded images/PDFs/STEP/CSV (metadata only) and generated exports; keep private by default.
  - Inputs: upload requests via signed URLs; server-side writes for exports.
  - Outputs: signed URLs with expiry; metadata persisted in DB.
  - Interactions: Supabase Storage buckets; linked to DB rows via metadata table.

- Auth and access control
  - Responsibilities: Supabase OAuth/magic link; session management; RLS enforcement; signed URL scope.
  - Inputs: auth provider responses; JWT in requests.
  - Outputs: session tokens, user context for RLS, access-denied responses.
  - Interactions: frontend uses Supabase client for session; backend uses service role with RLS or user session tokens.

- Export/rendering service
  - Responsibilities: render SVG preview to PNG server-side; serve SVG/JSON exports; ensure user-scoped access.
  - Inputs: validated FcfJson, user settings (units/precision), request format (png/svg/json).
  - Outputs: signed URL to artifact; inline JSON for copy/download.
  - Interactions: uses deterministic formatter/SVG renderer; writes to storage; returns URL to frontend.

- Observability/telemetry
  - Responsibilities: structured logs with correlation IDs, AI call metrics (latency, cost, failures), API health, frontend error capture.
  - Inputs: request lifecycle data, agent responses, validation/calculation outcomes.
  - Outputs: log events, metrics/alerts dashboards, error traces (sanitized).
  - Interactions: lightweight logger (pino/console), monitoring service (e.g., Sentry/PostHog), Supabase log drains as needed.

## 3) Boundaries
- Rules/calculation engine vs AI layer
  - Deterministic engine is authoritative for schema validity and numeric outputs (bonus, T_eff, pass/fail); AI cannot override, only explain.
  - AI prompts always receive deterministic outputs and validation issues; QA agent must reject contradictions.
  - Any AI-generated FcfJson is revalidated; invalid results trigger repair or user correction before finalize/export.

- Backend vs frontend
  - Backend (route handlers/server actions) owns orchestration, validation, calculations, persistence, storage signing, and AI calls.
  - Frontend owns presentation, local draft state, optimistic UX, and client-side validation hints; it never bypasses server validation on finalize/export.
  - Sensitive keys/secrets and service-role operations never run in the browser.

- Persistence vs stateless logic
  - Persistence: Postgres (projects, fcf_records, measurements, settings, uploads metadata) and storage buckets; all behind RLS and signed URLs.
  - Stateless logic: rules/calculation engine, AI prompts, formatters, SVG rendering; pure/pure-ish functions called by API.
  - Orchestrator treats AI calls as stateless; retries/backoff handled without coupling to DB except for logging/auditing.

## 4) Technology Choices (with notable alternatives)
- Web/app: Next.js 15 App Router + TypeScript; Tailwind + shadcn/ui; React Server Components where possible; client components for interactive forms/previews.
- API layer: Next.js route handlers (`app/api/*`) and server actions; Supabase server client for DB/storage/auth; `fetch` for OpenAI; consider `zod` for input parsing.
- Deterministic core: TypeScript modules under `lib/fcf`, `lib/rules`, `lib/calc`, `lib/format`; Zod schemas; Vitest for unit tests.
- AI orchestration: OpenAI GPT-4.1/GPT-4o for Extraction/Combined/Interpretation/QA; correlation IDs; optional streaming explanations; rate limiting via middleware.
  - Alternative: fallback provider abstraction (e.g., Azure OpenAI) behind a `providers/llm` interface.
- Data/auth: Supabase Postgres + Auth + RLS; `jsonb` for FcfJson storage; indexes on `user_id`, `project_id`, `created_at`.
  - Alternative: Prisma for type-safe queries (optional) vs direct Supabase client.
- Storage: Supabase Storage private buckets (`uploads`, `exports`); signed URLs with short TTL.
  - Alternative: S3-compatible bucket if migrating later; keep interface thin.
- Exports/rendering: Server-side SVG generator in Node (no external binary) plus `sharp` for PNG rasterization.
  - Alternative: Headless Chromium only if SVG→PNG quality needs it; prefer `sharp` for speed.
- Observability: Sentry (errors), PostHog (product analytics + feature flags), simple metrics via Vercel/Supabase logs; JSON logging with correlation IDs.
  - Alternative: Open-source Grafana/Loki/Promtail stack if self-hosting later.

## 5) Initial ADR List (capture separately)
- Choose Next.js App Router with server actions for app and API boundaries.
- Use Supabase (Auth, Postgres with RLS, Storage) as primary backend platform; no separate backend service.
- Canonical `FcfJson` schema stored as `jsonb`; deterministic rules/calcs are authoritative over AI outputs.
- Multi-agent orchestration pattern (Extraction, Combined, Interpretation, QA) with QA as final arbiter.
- Private storage with signed URLs; no public blobs; uploads limited to image/PDF/STEP/CSV metadata.
- Export pipeline uses server-side SVG + `sharp` PNG; no client-side export for persistence reasons.
- Error codes (`E001`–`E00x`) standardized in rules engine and surfaced to AI for repair/QA.
- Units/precision as user settings persisted in `user_settings`; all calculators/exports derive from this, not ad-hoc props.
- Observability stack: Sentry for errors + PostHog for product metrics; correlation IDs required on AI/API calls.
- Performance budget: live preview ≤50 ms P90; `/api/fcf/interpret` ≤400 ms P90 at 1 rps; retries/backoff on AI calls.

## 6) Services to Sign Up For (and info to copy)
- Supabase
  - Create project; record project URL, anon/public API key, service role key, JWT secret, database connection string, storage bucket names (`uploads`, `exports`), RLS enabled.
- Vercel (or preferred Next.js host)
  - Link repo; env vars for Supabase keys/URL, OpenAI keys, SENTRY_DSN/POSTHOG keys; set serverless function region; configure protected preview envs.
- OpenAI
  - API key(s), org ID, model choices (GPT-4o/4.1); spend limits; note base URL if using Azure OpenAI.
- Sentry (errors)
  - DSN for frontend and server; release/env naming convention; sampling rates.
- PostHog (analytics/feature flags)
  - Project API key, host URL; plan events (`builder_open`, `interpret_run`, `export_success`, `unit_change`).
- GitHub Actions
  - Repo secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, OPENAI_API_KEY, SENTRY_DSN, POSTHOG_API_KEY; configure CI cache keys.
- Optional: Image optimization/CDN
  - If using Vercel built-in, no extra; otherwise note CDN base URL for signed URLs if fronting Supabase Storage.
- Domain/email provider (for auth links)
  - Domain DNS access; email sender/SMTP for Supabase auth (from address, SMTP creds) if not using default.
