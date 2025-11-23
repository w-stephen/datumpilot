# GD&T FCF Builder & Interpreter – End-to-End Project Plan

> This project plan is derived from the **PRD – GD&T Feature Control Frame (FCF) Builder & Interpreter (AI‑Driven)**. 

---

## 1) Executive summary of the project plan

This project will deliver a SaaS (Software as a Service) web application that enables engineers to define, validate, interpret, and export GD&T (Geometric Dimensioning and Tolerancing) Feature Control Frames (FCFs) compliant with ASME Y14.5‑2018.  

The product supports two primary workflows:

1. **Mode 1 – Image / Screenshot Interpretation**  
   Users upload or paste an image/PDF snippet of an FCF. The system:
   - Extracts structured FCF JSON from the visual FCF.
   - Validates it via a deterministic rules engine.
   - Runs numeric calculations (e.g., bonus tolerance, virtual condition).
   - Generates expert‑level plain‑language explanations.

2. **Mode 2 – FCF Builder (Form‑Based)**  
   Users construct standards‑correct FCFs using a guided web UI with:
   - Standards‑aware controls.
   - Live SVG preview of the FCF.
   - Validation using the same deterministic rules engine.
   - Export to PNG, SVG, and canonical FCF JSON.

All flows converge on a **canonical FCF JSON schema** that acts as the system’s single source of truth across UI, rules/validation, calculators, AI interpretation, storage, and exports.

### Proposed technology stack (aligned with PRD)

- **Frontend**
  - Next.js 15 (App Router, Server Actions).
  - TypeScript.
  - Tailwind CSS + shadcn/ui + lucide-react.
- **Backend**
  - Next.js API routes and server actions.
  - Dedicated domain modules for:
    - Canonical FCF schema.
    - Rules/validation engine.
    - Calculation engine.
    - AI multi‑agent orchestration.
- **Data**
  - Postgres (e.g., Supabase) with Row‑Level Security (RLS).
  - Object storage for images, exports, and uploads.
  - Tables for projects, FCF records, measurements, user settings. 
- **AI Layer**
  - Multi‑agent ChatGPT pipeline:
    - Extraction Agent.
    - Interpretation Agent.
    - Combined Extract+Interpret Agent.
    - QA/Adjudicator Agent.
- **Auth & Security**
  - Supabase auth (OAuth or magic link).
  - RLS on all tables.
  - Private storage with signed URLs.

### High‑level delivery horizon

Assuming:
- 2‑week sprints.
- A cross‑functional team (PM, Design, 1–2 FE, 1–2 BE, 1 AI/ML, 1 QA, 1 DevOps).
- Strong use of ChatGPT Codex Max for design, implementation, and testing.

A realistic target is **~6 sprints (~12 weeks)** to reach a robust v1 internal pilot.

---

## 2) Phase‑by‑phase project plan

### Phase 1 – Discovery & Product Alignment

**Goals**

- Confirm problem, personas, and scope per PRD.fileciteturn0file0  
- Derive concrete user journeys and acceptance criteria for v1.
- Prioritize must‑have vs nice‑to‑have features.

**Entry criteria**

- PRD v1.1 available and circulated.
- Core stakeholders identified (PM, Eng, Design, GD&T SME, Data/ML).

**Exit criteria**

- Agreed list of v1 user stories by persona.
- Mapped UX flows for:
  - FCF Builder (Mode 2).
  - Image Interpreter (Mode 1).
  - JSON Interpreter and calculators.
  - Projects and measurements.fileciteturn0file0  
- Initial non‑functional targets (latency, accuracy, security) validated.

**Key deliverables**

- Persona one‑pagers and journey maps.
- Flow diagrams for each major route.
- Prioritized backlog of epics/features.
- Draft acceptance criteria for key flows.

---

### Phase 2 – Architecture & Technical Foundations

**Goals**

- Define system architecture and boundaries between UI, deterministic engine, and AI orchestration.
- Choose stack and integration patterns aligned with PRD.
- Set up repo, CI/CD, auth, and base observability.

**Entry criteria**

- Discovery outputs (user journeys, prioritized backlog).
- Agreement on cloud provider (e.g., Vercel + Supabase).

**Exit criteria**

- High‑level architecture diagram and ADRs (Architecture Decision Records) for:
  - Rules engine implementation approach.
  - AI orchestration strategy.
  - Data model and storage strategy.
- Repo initialized with Next.js 15, TypeScript, Tailwind, shadcn/ui.
- CI/CD pipeline for linting, tests, typechecking, and deploy to staging.

**Key deliverables**

- Architecture design document.
- Base Postgres schema and RLS policies:
  - `projects`, `fcf_records`, `measurements`, `user_settings`.fileciteturn0file0  
- Infra as code (if applicable) and environment config pattern.

---

### Phase 3 – Canonical FCF Model, Rules & Calculation Engine

**Goals**

- Implement canonical FCF JSON schema and strongly typed TypeScript model.fileciteturn0file0  
- Build deterministic validation rules engine aligned with ASME Y14.5‑2018 v1 scope.
- Implement calculator functions for position at MMC, flatness, perpendicularity, and profile.fileciteturn0file0  

**Entry criteria**

- Architectural decisions locked in.
- Database and base backend modules ready.

**Exit criteria**

- `FcfJson` type and Zod schema implemented and shared across frontend/backend.
- Rules engine in place with standardized error codes (E001–E005, etc.).fileciteturn0file0  
- Calculator functions implemented with unit tests and SME‑validated reference data.

**Key deliverables**

- `core-fcf` module:
  - Schema, types, canonical representation.
- `rules-engine` module:
  - Validation functions.
  - Error codes and human‑readable messages.
- `calculation-engine` module:
  - Position at MMC (including bonus tolerance).
  - Flatness, perpendicularity, profile.
- Unit test suite for rules and calculators.

---

### Phase 4 – AI Multi‑Agent Orchestration Layer

**Goals**

- Implement the four logical agents:
  - Extraction.
  - Interpretation.
  - Combined Extract+Interpret.
  - QA/Adjudicator.fileciteturn0file0  
- Provide stable backend endpoints and orchestration for `/api/fcf/interpret`.
- Ensure AI outputs are consistent with deterministic rules.

**Entry criteria**

- Deterministic FCF schema, rules, and calculators complete.
- AI client integration with ChatGPT Codex Max available.

**Exit criteria**

- Functional AI endpoints:
  - `/api/ai/extract-fcf`
  - `/api/ai/interpret-fcf`
  - `/api/ai/combined-fcf`
  - `/api/ai/qa-fcf`
  - `/api/fcf/interpret` as orchestrator.fileciteturn0file0  
- Prompt templates for each agent, versioned and documented.
- Initial latency and cost profile for AI endpoints.

**Key deliverables**

- Prompt library with system and user prompts for each agent.
- Orchestrator module with structured logging and correlation IDs.
- Evaluation harness with golden FCF examples.

---

### Phase 5 – Core Application Features (Builder, Interpreter, Image Mode, Calculators, Projects)

**Goals**

- Deliver end‑to‑end UX and core functionality for v1:
  - FCF Builder (Mode 2).
  - JSON Interpreter and calculators.
  - Image‑based Interpretation (Mode 1).
  - Projects, measurement runs, uploads, units & precision.fileciteturn0file0  

**Entry criteria**

- Architecture, deterministic engine, and AI layer functioning in staging.
- Approved designs for key routes.

**Exit criteria**

- All key flows in PRD “Key Flows to Validate” are behavior‑complete in staging:
  - Build & export FCF.
  - Interpret FCF JSON.
  - Image‑based interpretation.
  - Calculators.
  - Units & precision behavior.fileciteturn0file0  
- UX quality and accessibility meet baseline standards.

**Key deliverables**

- `/app/builder` FCF Builder with:
  - Characteristic selection.
  - Datum reference frame.
  - Tolerance/modifiers.
  - Feature type.
  - Advanced options.
  - Live SVG preview and validation hints.fileciteturn0file0  
- `/app/interpreter` JSON interpreter and calculator UI.
- `/app/image-interpreter` image upload, confirmation UI, and explanation.
- `/app/projects`, `/app/projects/[id]` for projects and measurement runs.
- `/app/settings` for units & precision.

---

### Phase 6 – Testing, Quality Assurance & Performance

**Goals**

- Validate correctness, stability, and performance.
- Establish automated tests across:
  - Unit.
  - Integration.
  - UI.
  - Performance.

**Entry criteria**

- Core features implemented and wired together.

**Exit criteria**

- Automated tests at agreed coverage thresholds.
- `/api/fcf/interpret` meets latency and reliability targets in test environment.fileciteturn0file0  
- No open P0/P1 defects for v1 scope.
- GD&T SME sign‑off for a representative set of FCFs.

**Key deliverables**

- Test plan and traceability matrix.
- Automated regression test suites in CI.
- Performance test results and tuning changes.

---

### Phase 7 – Security, Compliance & Production Readiness

**Goals**

- Harden security posture.
- Verify privacy guarantees for FCF data and images.
- Ensure logging and observability are adequate.

**Entry criteria**

- QA phase near completion, staging environment stable.

**Exit criteria**

- RLS policies verified with automated tests.fileciteturn0file0  
- Private storage and signed URLs validated.
- Observability in place with dashboards and alerts.
- Production readiness review completed.

**Key deliverables**

- Security review document.
- Monitoring/alerting configuration and dashboards.
- Runbooks and on‑call procedures.

---

### Phase 8 – Deployment, Beta, and Post‑Launch Iteration

**Goals**

- Deploy v1 to production for internal pilot.
- Collect telemetry and SME feedback.
- Plan follow‑on v1.x iterations.

**Entry criteria**

- Production readiness gate passed and go‑live approved.

**Exit criteria**

- v1 running in production for internal users.
- N representative FCF cases validated by SMEs and logged.fileciteturn0file0  
- Prioritized feedback backlog for v1.x.

**Key deliverables**

- Production deployment.
- Release notes and internal onboarding guide.
- Post‑launch metrics and roadmap.

---

## 3) Work breakdown structure (epics → features → tasks)

### Epic E1 – Product Discovery & UX Foundations

**Feature E1.F1 – Confirm Scope & Personas**

- **E1.F1.T1 – PRD deep‑dive and clarification workshop**  
  - Role: Product Manager  
  - Dependencies: PRD v1.1  
  - Inputs: PRD, stakeholder list  
  - Outputs: Clarified requirements and assumptions log  

- **E1.F1.T2 – Persona detail & prioritization**  
  - Role: Product Manager  
  - Dependencies: E1.F1.T1  
  - Inputs: PRD personas (Design Engineer, Quality/Manufacturing Engineer, Project Lead).fileciteturn0file0  
  - Outputs: Persona one‑pagers and primary/secondary designation  

**Feature E1.F2 – User Journeys & Flows**

- **E1.F2.T1 – Map Mode 1 and Mode 2 journeys**  
  - Role: UX Designer  
  - Dependencies: E1.F1.T2  
  - Inputs: PRD flows  
  - Outputs: Journey and flow diagrams by persona  

- **E1.F2.T2 – Define success metrics & instrumentation**  
  - Role: Product Manager  
  - Dependencies: E1.F2.T1  
  - Inputs: PRD success metricsfileciteturn0file0  
  - Outputs: Metrics spec and analytics tracking plan  

**Feature E1.F3 – UX Wireframes**

- **E1.F3.T1 – Low‑fidelity wireframes for core routes**  
  - Role: UX Designer  
  - Dependencies: E1.F2.T1  
  - Inputs: Route list from PRDfileciteturn0file0  
  - Outputs: Wireframes in design tool  

- **E1.F3.T2 – UX review and refinement**  
  - Role: PM + UX Designer + GD&T SME  
  - Dependencies: E1.F3.T1  
  - Outputs: Approved wireframes and feedback log  

---

### Epic E2 – Architecture & Platform Foundations

**Feature E2.F1 – Repo, Tooling & CI/CD**

- **E2.F1.T1 – Initialize monorepo/Next.js app**  
  - Role: Backend/Full‑stack Developer  
  - Dependencies: E1 complete  
  - Outputs: Repo with Next.js 15, TypeScript, Tailwind, shadcn/ui  

- **E2.F1.T2 – Configure CI/CD pipeline**  
  - Role: DevOps Engineer  
  - Dependencies: E2.F1.T1  
  - Outputs: Pipeline for build, test, deploy to staging  

**Feature E2.F2 – Auth & Data Layer**

- **E2.F2.T1 – Integrate Supabase auth & RLS baseline**  
  - Role: Backend Developer  
  - Dependencies: E2.F1.T1  
  - Inputs: Auth section of PRDfileciteturn0file0  
  - Outputs: Login flow and basic RLS policies  

- **E2.F2.T2 – Implement base schema (projects, FCF records, measurements, user_settings)**  
  - Role: Backend Developer  
  - Dependencies: E2.F2.T1  
  - Inputs: PRD data modelfileciteturn0file0  
  - Outputs: Database migrations and ORM models  

**Feature E2.F3 – App Shell & Navigation**

- **E2.F3.T1 – Build authenticated `/app` shell and sidebar navigation**  
  - Role: Frontend Developer  
  - Dependencies: E2.F2.T1  
  - Outputs: Layout, sidebar, routing to core pages  

---

### Epic E3 – Canonical FCF Model, Rules & Calculations

**Feature E3.F1 – Canonical FCF JSON Schema**

- **E3.F1.T1 – Define `FcfJson` TypeScript types and Zod schema**  
  - Role: Backend Developer  
  - Dependencies: E2.F2.T2  
  - Inputs: PRD canonical JSON specfileciteturn0file0  
  - Outputs: `schema.ts` with types and Zod schema  

- **E3.F1.T2 – Implement shared validation utilities**  
  - Role: Backend Developer  
  - Dependencies: E3.F1.T1  
  - Outputs: `validateSchema(fcf)` helper used across APIs/UI  

**Feature E3.F2 – Rules Engine**

- **E3.F2.T1 – Catalogue v1 validation rules**  
  - Role: GD&T SME + Backend Developer  
  - Dependencies: E3.F1.T1  
  - Inputs: ASME Y14.5‑2018 and PRD rulesfileciteturn0file0  
  - Outputs: Rule specification document  

- **E3.F2.T2 – Implement rules engine with standardized error codes**  
  - Role: Backend Developer  
  - Dependencies: E3.F2.T1  
  - Outputs: `validateFcf(fcf): ValidationResult` with codes E001–E005  

**Feature E3.F3 – Calculation Engine & Units**

- **E3.F3.T1 – Implement calculator functions**  
  - Role: Backend Developer  
  - Dependencies: E3.F1.T1  
  - Inputs: PRD calculator definitionsfileciteturn0file0  
  - Outputs: `position.ts`, `flatness.ts`, `perpendicularity.ts`, `profile.ts`  

- **E3.F3.T2 – Implement units and precision handling**  
  - Role: Backend Developer  
  - Dependencies: E3.F3.T1  
  - Outputs: Shared utilities for units and formatting  

---

### Epic E4 – AI Multi‑Agent Orchestration

**Feature E4.F1 – Agent Prompt Design**

- **E4.F1.T1 – Draft prompts for all 4 agents**  
  - Role: Data/ML Lead  
  - Dependencies: E3 complete  
  - Inputs: PRD AI sectionsfileciteturn0file0  
  - Outputs: Versioned system/user prompts  

- **E4.F1.T2 – Create evaluation dataset of FCF examples**  
  - Role: GD&T SME + Data/ML Lead  
  - Dependencies: E4.F1.T1  
  - Outputs: Labeled examples and expected outputs  

**Feature E4.F2 – AI APIs & Orchestrator**

- **E4.F2.T1 – Implement `/api/ai/extract-fcf`, `/interpret-fcf`, `/combined-fcf`, `/qa-fcf`**  
  - Role: Backend Developer  
  - Dependencies: E3, E4.F1  
  - Outputs: Typed endpoints and integration tests  

- **E4.F2.T2 – Implement `/api/fcf/interpret` orchestrator endpoint**  
  - Role: Backend Developer  
  - Dependencies: E4.F2.T1  
  - Outputs: End‑to‑end orchestrated flow  

**Feature E4.F3 – Latency & Cost Guardrails**

- **E4.F3.T1 – Implement caching and rate limiting**  
  - Role: Backend Developer + DevOps  
  - Dependencies: E4.F2.T1  
  - Outputs: Caching strategy and rate‑limit middleware  

---

### Epic E5 – Core Features: Builder, Interpreter, Image Mode, Calculators

**Feature E5.F1 – FCF Builder (Mode 2)**

- **E5.F1.T1 – Implement `FcfBuilderPanel` UI**  
  - Role: Frontend Developer  
  - Dependencies: E3  
  - Outputs: Form sections for characteristic, tolerance, datums, feature type, advanced options  

- **E5.F1.T2 – Live SVG preview and validation hints**  
  - Role: Frontend Developer  
  - Dependencies: E5.F1.T1, E3.F2.T2  
  - Outputs: `FcfPreview` component with inline errors  

- **E5.F1.T3 – Save to project & export (PNG/SVG/JSON)**  
  - Role: Full‑stack Developer  
  - Dependencies: E5.F1.T2, E2.F2.T2  
  - Outputs: `/api/fcf/export`, export buttons, and download flows  

**Feature E5.F2 – JSON Interpreter & Calculators**

- **E5.F2.T1 – `InterpreterForm` to paste/load FCF JSON**  
  - Role: Frontend Developer  
  - Dependencies: E3, E4  
  - Outputs: Form calling `/api/fcf/interpret`  

- **E5.F2.T2 – Calculator UI (`CalcResults`)**  
  - Role: Frontend Developer  
  - Dependencies: E3.F3  
  - Outputs: UI for numeric results and pass/fail  

**Feature E5.F3 – Image / Screenshot Interpretation (Mode 1)**

- **E5.F3.T1 – `ImageUploadPanel` & storage integration**  
  - Role: Frontend + Backend Developer  
  - Dependencies: E2.F2.T1, E4  
  - Inputs: File upload requirementsfileciteturn0file0  
  - Outputs: Private upload and signed URL pipeline  

- **E5.F3.T2 – Parsed fields confirmation form**  
  - Role: Frontend Developer  
  - Dependencies: E5.F3.T1, E3  
  - Outputs: UI for editing extracted fields and resolving ambiguities  

- **E5.F3.T3 – End‑to‑end Mode 1 flow**  
  - Role: Full‑stack Developer  
  - Dependencies: E5.F3.T2, E4  
  - Outputs: Uploaded image → final FCF JSON and explanation flow  

---

### Epic E6 – Projects, Measurements, Uploads & Settings

**Feature E6.F1 – Projects & FCF Records**

- **E6.F1.T1 – `ProjectList` with search and tags**  
  - Role: Frontend Developer  
  - Dependencies: E2.F2.T2  
  - Outputs: Project listing page  

- **E6.F1.T2 – `ProjectDetail` view**  
  - Role: Frontend Developer  
  - Dependencies: E6.F1.T1  
  - Outputs: Project detail with associated FCF records and measurements  

**Feature E6.F2 – Measurements Capture**

- **E6.F2.T1 – Measurement input forms**  
  - Role: Frontend Developer  
  - Dependencies: E3.F3  
  - Outputs: Forms capturing measurement inputs  

- **E6.F2.T2 – Persist measurement runs and results_json**  
  - Role: Backend Developer  
  - Dependencies: E6.F2.T1, E2.F2.T2  
  - Outputs: API endpoints to create/query measurements  

**Feature E6.F3 – Settings & Units**

- **E6.F3.T1 – `UnitControls` and `/app/settings` page**  
  - Role: Frontend Developer  
  - Dependencies: E3.F3.T2, E2.F2.T2  
  - Outputs: Settings UI for unit, precision, dual display  

- **E6.F3.T2 – Propagate units across app**  
  - Role: Full‑stack Developer  
  - Dependencies: E6.F3.T1  
  - Outputs: Unit‑aware formatting across builder, interpreter, calculators, and exports  

---

### Epic E7 – Testing, Security, Deployment & Launch

**Feature E7.F1 – Test Automation & SME Validation**

- **E7.F1.T1 – Author test plan and traceability matrix**  
  - Role: QA Engineer  
  - Dependencies: E1, E5  
  - Inputs: PRD key flowsfileciteturn0file0  
  - Outputs: Test plan by feature and scenario  

- **E7.F1.T2 – Implement unit, integration, and UI tests**  
  - Role: QA Engineer + Developers  
  - Dependencies: E7.F1.T1  
  - Outputs: Automated tests in CI  

- **E7.F1.T3 – SME validation of FCF examples**  
  - Role: GD&T SME  
  - Dependencies: E5, E4  
  - Outputs: SME sign‑off and defect log  

**Feature E7.F2 – Security & Privacy**

- **E7.F2.T1 – Verify RLS policies and tests**  
  - Role: Backend Developer  
  - Dependencies: E2.F2.T2  
  - Outputs: Automated tests confirming isolation  

- **E7.F2.T2 – Audit uploads and signed URL access**  
  - Role: DevOps Engineer  
  - Dependencies: E5.F3.T1  
  - Outputs: Validated access control and logs  

**Feature E7.F3 – Deployment & Monitoring**

- **E7.F3.T1 – Production environment setup**  
  - Role: DevOps Engineer  
  - Dependencies: E2.F1.T2  
  - Outputs: Production environment and deployment pipeline  

- **E7.F3.T2 – Monitoring, logging, and alerting**  
  - Role: DevOps Engineer  
  - Dependencies: E7.F3.T1  
  - Outputs: Dashboards and alerts for latency, errors, AI failures  

- **E7.F3.T3 – Go‑live & post‑launch review**  
  - Role: Product Manager  
  - Dependencies: All epics  
  - Outputs: Release notes, pilot feedback, v1.x backlog  

---

## 4) Milestones and indicative timeline

Assume 2‑week sprints.

### Milestones

1. **M1 – Inception & Architecture Complete (End of Sprint 1)**
   - Discovery done, UX flows drafted.
   - Repo, CI/CD, auth, base schema in place.
   - Architecture and ADRs signed off.

2. **M2 – Deterministic Core Ready (End of Sprint 2)**
   - Canonical FCF schema and rules engine implemented.
   - Calculators implemented and unit‑tested.
   - Basic app shell and navigation complete.

3. **M3 – AI Orchestration Vertical Slice (End of Sprint 3)**
   - All four agents implemented with prompts.
   - `/api/fcf/interpret` working end‑to‑end for JSON input.fileciteturn0file0  
   - Initial latency/cost profiling.

4. **M4 – Core UX Flows Complete (End of Sprint 4)**
   - FCF Builder, JSON Interpreter + calculators, and Projects complete.
   - Image Interpreter flow functional.
   - Units & settings wired through the app.

5. **M5 – Hardening, Performance & Security (End of Sprint 5)**
   - Test coverage and performance targets met.
   - RLS, signed URLs, and observability validated.
   - SME review and fixes for FCF examples.

6. **M6 – v1 Pilot Launch (End of Sprint 6)**
   - Production deployment live for internal pilot.
   - Telemetry and feedback collection in place.
   - v1.x backlog defined.

### Sprint mapping (indicative)

- **Sprint 1:** E1, E2.F1–F3  
- **Sprint 2:** E3 + basic Builder shell  
- **Sprint 3:** E4 + JSON Interpreter route  
- **Sprint 4:** E5 + E6 basics  
- **Sprint 5:** E6 completion + E7.F1–F2  
- **Sprint 6:** E7.F3, polish, SME re‑validation, telemetry tuning  

---

## 5) High‑level architecture overview (aligned with the PRD)

### Core components

1. **Web Frontend (Next.js 15, TypeScript)**
   - Key routes:
     - `/`, `/app`, `/app/builder`, `/app/interpreter`, `/app/image-interpreter`, `/app/projects`, `/app/projects/[id]`, `/app/settings`.fileciteturn0file0  
   - Uses Tailwind + shadcn/ui for UI.
   - Uses server actions and API routes to talk to backend.

2. **Auth & User Management (Supabase)**
   - OAuth/magic link authentication.
   - RLS for user‑scoped data.fileciteturn0file0  

3. **Deterministic Rules & Calculation Engine**
   - TypeScript modules for:
     - Validation (rules engine).
     - Numeric calculations (position, flatness, perpendicularity, profile).fileciteturn0file0  
   - Used by both UI and backend.

4. **AI Orchestration Layer**
   - Multi‑agent pipeline (Extraction, Interpretation, Combined, QA).fileciteturn0file0  
   - Orchestrator endpoint `/api/fcf/interpret` coordinates them, ensuring consistency with deterministic engine.

5. **Data Storage & File Handling**
   - Postgres tables:
     - `projects`, `fcf_records`, `measurements`, `user_settings`.fileciteturn0file0  
   - Object storage for:
     - Image/PDF uploads.
     - Exported PNG/SVG files.
   - Signed URLs for private access.

6. **Exports and Rendering**
   - SVG rendering from FCF JSON.
   - Server‑side rasterization to PNG.
   - JSON export using the canonical schema.

7. **Telemetry & Observability**
   - Metrics for:
     - `/api/fcf/interpret` latency and success/failure.
     - AI usage volume and cost estimates.
     - Key product events (`interpret_run`, `builder_export`, etc.).
   - Dashboards and alerts for critical metrics.

### Early technical decisions

- Representation of rules (declarative vs imperative).
- Caching strategy for AI results.
- Versioning strategy for FCF JSON and agent prompts.
- Log redaction of sensitive content (images, FCF text).
- Strategy for evolution to composite FCF support.

### Risk areas & technical spikes

- **AI correctness vs standards**  
  Spike: Evaluate prompt strategies for Interpretation and QA to minimize hallucinations.

- **Image quality and parsing accuracy**  
  Spike: Measure performance on noisy drawings and evaluate pre‑processing steps.

- **Performance & Cost**  
  Spike: Benchmark parallel vs sequential agent flows.

- **Complex FCFs (patterns, composites)**  
  Spike: Explore limitations of v1 schema and rules, define guardrails.

---

## 6) Prompt library, organized by phase and role

Below are reusable prompt templates designed for ChatGPT Codex Max. Paste the PRD, code snippets, or specs as context when using them.

### 6.1 Product Manager (PM) prompts

**PM‑P1 – Refine user stories and acceptance criteria**

> You are an experienced SaaS product manager and GD&T‑aware assistant.  
> We are building a GD&T Feature Control Frame (FCF) Builder & Interpreter SaaS product.  
> Here is our current PRD:  
> [PASTE PRD TEXT HERE]  
>  
> Please:  
> 1) Extract and refine user stories for v1, grouped by persona (Design Engineer, Quality/Manufacturing Engineer, Project Lead).  
> 2) For each user story, propose 3–5 clear, testable acceptance criteria.  
> 3) Flag ambiguous or under‑specified aspects and propose clarifying questions.  

---

**PM‑P2 – Turn PRD into a prioritized backlog**

> You are helping me turn this PRD into a prioritized backlog for a 6‑sprint delivery.  
> Context: [PASTE PRD HERE + TEAM SIZE AND SKILLS]  
>  
> Please:  
> - Propose epics and features suitable for a Jira board.  
> - For each epic, suggest priority (Must / Should / Could) and target sprint(s).  
> - Respect the v1 “In Scope” and “Out of Scope” constraints and highlight any risky items.  

---

**PM‑P3 – Detailed spec for one key flow**

> Focus on this specific flow: [e.g., “Image‑based Interpretation (Mode 1)”].  
> Context: [PASTE PRD SECTION FOR THAT FLOW]  
>  
> Please:  
> - Describe the end‑to‑end flow from the user’s perspective.  
> - Enumerate edge cases and failure modes.  
> - Produce a step‑by‑step behavior spec that QA can map directly into test cases.  

---

### 6.2 Architect / Tech Lead prompts

**ARCH‑P1 – High‑level architecture proposal**

> You are a senior SaaS architect familiar with Next.js, Supabase, and AI orchestration.  
> We are building the GD&T FCF Builder & Interpreter as described below:  
> [PASTE PRD HERE]  
>  
> Please propose a high‑level architecture including:  
> - Frontend modules and routes.  
> - Backend modules (rules engine, calculators, AI orchestrator).  
> - Postgres data model (projects, FCF records, measurements, user settings).  
> - External dependencies (Supabase, storage, logging).  
> Present components, responsibilities, and interactions in a diagram‑friendly format.  

---

**ARCH‑P2 – Rules & calculation engine design**

> Context: We need deterministic rules and calculation engines aligned with ASME Y14.5‑2018 within this PRD:  
> [PASTE RELEVANT PRD SECTIONS]  
>  
> Please:  
> - Propose a TypeScript module structure for rules and calculations.  
> - Show how to define and organize `FcfJson` types and Zod schemas.  
> - Suggest patterns for unit testing rules and adding new rules later.  

---

**ARCH‑P3 – AI multi‑agent orchestration**

> We must implement four logical agents (Extraction, Interpretation, Combined, QA/Adjudicator) and an `/api/fcf/interpret` orchestrator.  
> Context: [PASTE PRD AI SECTIONS]  
>  
> Please outline:  
> - Input/output types for each agent.  
> - Orchestration flow (parallel vs sequential calls).  
> - Methods for enforcing consistency with deterministic rules and calculations.  
> - Pseudo‑code for the orchestrator function.  

---

### 6.3 Frontend Developer prompts

**FE‑P1 – Implement a typed React component**

> You are an expert TypeScript/React/Next.js 15 developer.  
> I am building the [COMPONENT NAME] for the GD&T FCF app.  
> Here is the relevant PRD excerpt and UX description:  
> [PASTE PRD SECTION + DESIGN NOTES]  
>  
> Below is my current component file (or stub).  
> Please:  
> - Implement or improve the component using shadcn/ui and Tailwind.  
> - Use the provided props type: [PASTE TYPE HERE].  
> - Integrate validation and error hints via props.  
> - Keep the code idiomatic and add brief inline documentation comments.  
>  
> [PASTE COMPONENT CODE HERE]  

---

**FE‑P2 – Build a Next.js route with server actions**

> I need to implement the Next.js App Router page for `[ROUTE, e.g. /app/builder]` for the GD&T FCF Builder.  
> Context and requirements: [PASTE PRD EXCERPT + API CONTRACTS]  
>  
> Please:  
> - Propose a file structure for this route (page.tsx, loading, layout).  
> - Provide example server actions for loading/saving FCF records.  
> - Show how the client components call these actions.  

---

**FE‑P3 – Refactor for accessibility**

> Here is my current React component for [COMPONENT NAME].  
> We need strong accessibility and keyboard navigation.  
> Context: [PASTE RELEVANT UX/ACCESSIBILITY REQUIREMENTS]  
>  
> Please:  
> - Refactor the component to improve accessibility (ARIA, keyboard handling, focus).  
> - Explain your key changes in concise bullet points.  

---

### 6.4 Backend Developer prompts

**BE‑P1 – Implement FCF JSON schema and Zod validation**

> You are a senior TypeScript backend engineer.  
> We must implement the canonical FCF JSON schema described here:  
> [PASTE PRD SECTION 5]  
>  
> Please:  
> - Define TypeScript types/interfaces for `FcfJson`.  
> - Provide a Zod schema implementation.  
> - Include a few example valid/invalid objects and tests.  

---

**BE‑P2 – Implement rules engine with error codes**

> Context:  
> - FcfJson schema: [PASTE CURRENT SCHEMA CODE]  
> - Rules engine requirements: [PASTE PRD RULES SECTION]  
>  
> Please:  
> - Sketch a `validateFcf(fcf: FcfJson): ValidationResult` function with error codes (E001, E002, etc.).  
> - Implement a few representative rules (e.g., MMC not allowed for certain characteristics, datums required for position).  
> - Provide unit tests covering success and failure scenarios.  

---

**BE‑P3 – Implement calculator functions**

> We need deterministic calculators for position at MMC, flatness, perpendicularity, and profile as defined in the PRD.  
> Context: [PASTE CALCULATOR SECTION]  
>  
> Please:  
> - Propose function signatures and TypeScript types.  
> - Implement position at MMC including bonus tolerance and pass/fail rules.  
> - Provide example calls and unit tests.  

---

### 6.5 AI / Data / ML prompts

**AI‑P1 – Extraction Agent prompt**

> You are an expert prompt engineer and GD&T‑aware assistant.  
> We need a robust prompt for the Extraction Agent that takes an image URL or text description of an FCF and outputs candidate FcfJson, parseConfidence, and ambiguity notes.  
> Context: [PASTE PRD SECTIONS ON MODE 1 & AI]  
>  
> Please draft:  
> - A system prompt that defines the task, constraints, and behavior on uncertainty.  
> - A user prompt template.  
> - An example output JSON object that matches our `FcfJson` schema.  

---

**AI‑P2 – QA/Adjudicator prompt**

> The QA/Adjudicator receives:  
> - Extraction Agent output (JSON + notes).  
> - Interpretation Agent explanation.  
> - Combined Agent output (JSON + explanation).  
> - Rules engine errors (if any).  
> - Calculation engine summary.  
> Context: [PASTE PRD AI SECTION 9]  
>  
> Please produce a QA/Adjudicator prompt that:  
> - Chooses or synthesizes a final FcfJson.  
> - Produces a final explanation consistent with deterministic results.  
> - Outputs a confidence score and warnings for the UI.  

---

### 6.6 QA Engineer prompts

**QA‑P1 – Generate detailed test cases for a feature**

> You are an experienced QA engineer.  
> Here is a feature description and behavior spec:  
> [PASTE FEATURE SPEC, E.G., “FCF Builder” OR “Image‑based Interpretation”]  
>  
> Please:  
> - Generate a comprehensive list of test cases (positive, negative, edge).  
> - Organize them in a table with: ID, Title, Preconditions, Steps, Expected Result.  
> - Identify which cases should be automated vs manual.  

---

**QA‑P2 – Derive calculator test data**

> We have deterministic calculators for position at MMC, flatness, perpendicularity, and profile.  
> Context: [PASTE CALCULATOR SPEC]  
>  
> Please:  
> - Generate test data (input/output rows) for each calculator, including boundary cases.  
> - Provide results as a CSV‑friendly table.  

---

### 6.7 DevOps Engineer prompts

**DEVOPS‑P1 – CI/CD pipeline definition**

> You are a DevOps engineer.  
> We have a Next.js 15 + Supabase + TypeScript project described here:  
> [PASTE PRD AND ARCHITECTURE NOTES]  
>  
> Please:  
> - Propose a GitHub Actions (or similar) pipeline with steps for install, lint, test, typecheck, build, and deploy to staging/production.  
> - Include caching and environment variable handling best practices.  

---

**DEVOPS‑P2 – Observability setup**

> We need observability for a GD&T FCF SaaS application, including AI usage metrics.  
> Context: [PASTE ARCHITECTURE SUMMARY]  
>  
> Please propose:  
> - Key metrics, logs, and traces.  
> - Example alerts for performance, error rates, and AI failures.  
> - A minimal dashboard layout for monitoring.  

---

## 7) Practical guidelines for using ChatGPT Codex Max and VS Code

### 7.1 Recommended repository & folder structure

A pragmatic structure for this project:

```text
/
  apps/
    web/
      app/
        (marketing)/
        app/
          page.tsx
          builder/
            page.tsx
          interpreter/
            page.tsx
          image-interpreter/
            page.tsx
          projects/
            page.tsx
            [id]/
              page.tsx
          settings/
            page.tsx
      components/
        fcf/
          FcfBuilderPanel.tsx
          FcfPreview.tsx
          FcfExportBar.tsx
          ImageUploadPanel.tsx
          InterpreterForm.tsx
          CalcResults.tsx
        layout/
        projects/
      lib/
        fcf/
          schema.ts
          examples.ts
        rules/
          validateFcf.ts
          errorCodes.ts
        calc/
          position.ts
          flatness.ts
          perpendicularity.ts
          profile.ts
        ai/
          extractionAgent.ts
          interpretationAgent.ts
          combinedAgent.ts
          qaAgent.ts
          orchestrator.ts
        supabase/
          client.ts
        util/
      tests/
        unit/
        integration/
  infra/
    terraform-or-other/
  packages/
    eslint-config/
    tsconfig/
```

This structure keeps domain logic (`lib/fcf`, `lib/rules`, `lib/calc`) decoupled from UI, enabling ChatGPT to reason over these modules independently and making tests easier.

### 7.2 Developer workflow with VS Code + ChatGPT Codex Max

1. **Design first, then generate**  
   - Sketch types, interfaces, and behavior in comments or small spec files.
   - Use focused prompts (e.g., BE‑P2, FE‑P1) to generate or refine implementations.

2. **Work in small, focused prompts**  
   - Operate on one component or function at a time.
   - Paste only relevant code and types into your prompt to maintain context quality.

3. **Use ChatGPT for refactoring and tests**  
   - After initial implementation, ask ChatGPT to:
     - Refactor for clarity.
     - Suggest performance improvements.
     - Generate unit and integration tests.

4. **Maintain security hygiene**  
   - Never paste secrets or real keys into prompts.
   - Use placeholder values and environment variables.

5. **Code review discipline**  
   - Treat AI output as a draft.
   - Use VS Code diff tools to review changes before committing.
   - Validate logic against PRD and GD&T rules (especially numeric/standards‑related behavior).

6. **Naming and conventions**  
   - Types: `PascalCase` (e.g., `FcfJson`, `ValidationResult`).  
   - Components: `PascalCase` filenames under `components/`.  
   - Modules: `camelCase` filenames (e.g., `validateFcf.ts`).  
   - Error codes: centralized `errorCodes.ts`.  

7. **Documentation with AI assistance**  
   - Use ChatGPT to generate doc comments and design notes for complex rules and calculations.
   - Store docs in `/docs` or adjacent `README.md` files.

8. **QA & test authoring**  
   - Keep test specs and golden cases in `/tests/specs/`.
   - Use QA prompts to enumerate test cases, then refine and automate in the repo.

By following this project plan and integrating ChatGPT Codex Max into each discipline’s workflow inside VS Code, the team can deliver a rigorous, standards‑aligned GD&T FCF Builder & Interpreter with strong velocity and quality.

