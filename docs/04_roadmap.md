# DatumPilot – 6-Sprint Roadmap (v1)

## 1) Epics (v1 scope)
- Discovery & Alignment (partially covered by PRD, alignment docs, user stories).
- Architecture & Platform Foundations (Next.js 15 app shell, Supabase auth/RLS, CI/CD baseline).
- FCF Model, Rules & Calculations (canonical JSON schema, validation/error codes, calculators, units/precision utilities).
- AI Orchestration (2-agent GPT-5.1: Extraction + Explanation; `/api/fcf/interpret` orchestrator with derived confidence).
- Core Features (Builder, JSON interpreter + calculators, image interpreter, exports).
- Projects & Settings (projects/FCF records/measurement runs, uploads metadata, units/settings UI).
- Testing & Security (automated tests, performance targets, RLS/signed URLs verification).
- Launch & Telemetry (production deploy, observability, SME validation, post-launch feedback).

## 2) Sprint Plan
| Sprint | Key Objectives | Epics Covered | Representative Stories |
| --- | --- | --- | --- |
| Sprint 1 | Finalize scope/alignment; stand up repo, auth, data schema, CI/CD | Discovery; Architecture & Platform | AU1 auth/RLS baseline; scaffold `/app` shell; base schema (projects, fcf_records, measurements, user_settings); CI pipeline |
| Sprint 2 | Deliver deterministic core: FCF schema, rules, calculators, units | FCF Model, Rules & Calculations | Implement FcfJson + Zod; rules with error codes E001–E005; calculators (position @ MMC, flatness, perpendicularity, profile); unit/precision utilities |
| Sprint 3 | 2-agent GPT-5.1 vertical slice for JSON inputs; interpreter route usable | AI Orchestration; Core Features | `/api/ai/extract-fcf` + prompts; `/api/fcf/interpret` orchestrator with derived confidence; `/app/interpreter` JSON load/validate + explanation; CalcResults UI |
| Sprint 4 | Builder and image interpreter flows; exports; projects shell | Core Features; Projects & Settings | FCF Builder with live preview/validation; image upload + extracted-fields confirmation; PNG/SVG/JSON export; projects list/detail skeleton; settings page for units/precision |
| Sprint 5 | Projects/measurements completion; hardening, perf, security | Projects & Settings; Testing & Security | Measurement runs capture; RLS and signed URL tests; performance checks (preview latency, `/api/fcf/interpret` P90); confidence surfacing derived from parseConfidence + validation; accessibility pass |
| Sprint 6 | Launch readiness, telemetry, SME validation, polish | Launch & Telemetry; Testing & Security | Observability dashboards/alerts; SME validation set; P0/P1 fixes; production deploy; release notes and feedback hooks |

## 3) Milestones
- M1 (Sprint 1 end): Repo, CI/CD, Supabase auth/RLS baseline, base schema ready.
- M2 (Sprint 2 end): Deterministic FCF schema + rules engine + calculators complete with tests.
- M3 (Sprint 3 mid/end): 2-agent GPT-5.1 orchestration slice working for JSON input via `/app/interpreter` and `/api/fcf/interpret`, with derived confidence (parseConfidence + validation) and prompt caching.
- M4 (Sprint 4 end): Builder + image interpreter + exports functional; settings and project shell present.
- M5 (Sprint 5 end): Projects/measurements fully wired; performance/security targets validated in staging; confidence UX (derived from validation + parseConfidence) live.
- M6 (Sprint 6 end): Production pilot live with observability, SME sign-off on representative FCF set, v1.x backlog captured.

## 4) Risk-Mitigated Sequencing Notes
- Build deterministic core first (schema, rules, calculators, units) to anchor AI prompts/explanations and validation-driven confidence; prevents AI drift.
- Deliver earliest vertical slice in Sprint 3 (JSON interpreter + AI + deterministic checks) to validate latency/cost and prompt quality.
- Parallelize UI shells with backend readiness: scaffold builder/interpreter routes early, wire to real engines once stable.
- Keep image upload and signed URL handling simple and private; defer any preprocessing until core flows are stable.
- Make performance and RLS/signed-URL tests part of Sprint 5 to catch infra/security risks before pilot.
- Maintain prompt/versioning and correlation IDs from first AI integration to simplify debugging and cost control.***
