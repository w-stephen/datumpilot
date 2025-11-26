# Datum Pilot – Product Alignment

## 1) Summary
- SaaS web app for engineers to define, validate, and interpret GD&T Feature Control Frames (FCFs) strictly against ASME Y14.5-2018.
- Primary personas: design engineer (fast understanding/build), quality/manufacturing engineer (trustworthy interpretation and calculators), and project lead/manager (traceability across parts/runs).
- Mode 1: image/PDF/screenshot interpretation with AI extraction (GPT-5.1), user confirmation, deterministic validation/calcs, and Explanation Agent output.
- Mode 2: form-based FCF Builder with rules-driven validation and live SVG preview, producing canonical FCF JSON.
- Deterministic rules + calculation engine is the source of truth for standards constraints, bonus tolerance, virtual condition, and pass/fail math; LLM outputs must align to it.
- Canonical FCF JSON schema underpins storage, preview, exports (PNG/SVG/JSON), calculators, and agent prompts.
- Calculators: position at MMC (with bonus tolerance), flatness, perpendicularity, and profile of a surface with explicit assumptions and pass/fail results.
- Projects: CRUD with tags/search; each project holds FCF records, uploads (metadata-only), and measurement runs.
- Settings: global units (mm default, inch option), 1–4 decimal precision, optional dual-display; respected across builder, interpreter, tables, and exports.

## 2) Scope
| In Scope (v1) | Out of Scope (v1) |
| --- | --- |
| Mode 1 image/PDF upload, AI extraction, user correction, deterministic validation + explanation agent | CAD geometry interrogation or feature recognition from STEP |
| Mode 2 form-based FCF Builder with rules validation and live SVG preview | Automated tolerance stack-up analysis |
| Canonical FCF JSON schema; validation and deterministic calculations | ISO GPS or other standards (ASME Y14.5-2018 only) |
| 2-agent architecture: Extraction + Explanation (GPT-5.1) with deterministic rules/calcs authority | Advanced composite FCF modeling beyond simple placeholders |
| Calculators: position at MMC, flatness, perpendicularity, profile | Multi-tenant enterprise admin, billing, SSO (beyond Supabase auth) |
| Projects CRUD with tags/search; store FCF records and measurement runs | Offline desktop client; batch interpretation/import at scale |
| File uploads for metadata only (STEP/CSV), linked to projects | Full CMM integration or direct gage programming |
| Exports: PNG, SVG, JSON (readable) | Teacher mode or guidance beyond current flows |
| Settings: units (mm/inch), decimals (1–4), optional dual display | |
| Auth/security: Supabase OAuth/magic link, RLS, private buckets with signed URLs | |

## 3) Constraints
- Standards: ASME Y14.5-2018 only; rules engine enforces allowed symbols, modifiers, datums, and composite limitations; deterministic math is authoritative over AI text.
- Data model: all flows produce canonical FCF JSON; strong typing/validation (e.g., Zod) required before calculations or exports.
- UX: live SVG preview within ~50 ms P90; clear inline errors with codes (E001–E005 examples); confirmation form for extracted data; accessibility (keyboard, ARIA, high contrast).
- Performance: `/api/fcf/interpret` target ≤ 400 ms P90 at 1 req/s; builder/export workflow under ~2 minutes end-to-end; resilient retry on transient AI/API failures.
- Security/privacy: Supabase auth with RLS; private storage via signed URLs; no raw CAD geometry persisted beyond metadata; logging with correlation IDs without PII leakage.
- Tech stack: Next.js 15 (App Router/Server Actions), TypeScript, Tailwind + shadcn/ui + lucide-react; Vitest + RTL for frontend tests.
- Units/precision: mm default, inch option, 1–4 decimals, optional dual display; calculators and explanations must reflect current settings.
- Scope limits: metadata-only STEP/CSV handling; composite FCF restricted to null/simple placeholder; single-tenant app shell (no enterprise workspace features).

## 4) Risks & Unknowns
- AI hallucinations or standards drift leading to incorrect explanations; mitigation relies on deterministic rules/calcs, constrained Explanation Agent prompts, and derived confidence, but coverage depth must be validated.
- Ambiguous/low-quality images lowering parse confidence and increasing manual correction; need strong UX for warnings, retries, and edits.
- Performance/cost of 2-agent GPT-5.1 calls; must monitor latency and spend, cache prompts, and rate-limit.
- Validation coverage for edge-case characteristics, modifiers, and partial composites may be incomplete; requires SME-reviewed test set.
- Calculator assumptions (measurement inputs, gage conditions) may not match user setups; documentation and input collection need clarity to avoid misinterpretation.
- Limited composite support and absence of stack-up/geometry parsing could disappoint advanced users; manage expectations in UI/marketing.
- Security/PII leakage via logs or uploads if controls are misconfigured; RLS and signed URL policies must be rigorously tested.

## 5) Alignment Checklist
- I agree v1 targets ASME Y14.5-2018 only and excludes CAD geometry interrogation and stack-ups.
- I will deliver two primary modes: image interpretation with confirmation and builder with live preview, both producing canonical FCF JSON.
- I accept deterministic rules/calculations as authoritative; AI outputs cannot contradict them.
- I will ship calculators (position at MMC, flatness, perpendicularity, profile) and exports (PNG/SVG/JSON) respecting unit/precision settings.
- I will provide projects with FCF records/uploads/measurements, Supabase auth with RLS, and private storage only.
- I acknowledge performance, accessibility, and security targets and will log failures with correlation IDs without storing PII.
