# Master Prompt Pack (GD&T FCF Builder & Interpreter)

Below is a "master prompt pack" you can use end-to-end as a solo founder.

For each phase/Epic you get:

* A ready-to-paste prompt for ChatGPT 5.1 Codex Max.
* The expected output / definition of done.
* Assumptions & inputs you should have ready.

All prompts are written so you can paste them as-is. Where context is needed (PRD, code, etc.), the prompt tells Codex Max to ask you for it in the first reply, so you never need to edit the prompt text itself.

---

## Phase 1 - Discovery & Product Alignment (Epic E1)

### Prompt 1.1 - Align goals, scope, personas, risks from PRD

**Prompt (paste into ChatGPT 5.1 Codex Max)**

```text
You are ChatGPT 5.1 Codex Max acting as a senior SaaS product strategist. I am a solo founder building a SaaS application called "GD&T FCF Builder & Interpreter" for engineering teams working with ASME Y14.5-2018 GD&T.

In your first response, ask me to paste the latest version of my Product Requirements Document (PRD), then wait for me to provide it. Do not attempt any analysis until you receive the PRD.

After I paste the PRD, respond once with a structured analysis containing:

1) Summary - 5-10 bullet points summarizing the product goals, primary personas, and key workflows (Mode 1 image interpretation, Mode 2 builder, calculators, projects, settings).

2) Scope - a table with two columns: In Scope for v1, Out of Scope for v1, based strictly on the PRD.

3) Constraints - a bullet list of key technical, UX, and standards constraints that the solution must respect.

4) Risks & Unknowns - a prioritized list of risks, open questions, and assumptions that could impact delivery.

5) Alignment Checklist - a short checklist I can use to confirm with myself that I understand and agree with the product goals and boundaries.

Write in concise, professional language suitable for a planning document I can commit to my repo.
```

**Expected output / definition of done**

* You have a short planning document with:

  * Clear summary of product goals and personas.
  * Explicit v1 scope vs out-of-scope items.
  * Key constraints and risks listed.
  * A checklist you can literally walk through and confirm.
* You can store this as `docs/01_product_alignment.md`.

**Assumptions & inputs**

* You have your PRD ready to paste.
* You are comfortable confirming or adjusting the alignment checklist yourself.

---

### Prompt 1.2 - Derive user stories and acceptance criteria

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as an experienced product manager and QA-savvy analyst. I am a solo founder building the "GD&T FCF Builder & Interpreter" SaaS product.

In your first response, ask me to paste:
- My latest PRD text, and
- The "Summary / Scope / Constraints" document I produced earlier (if available).

Wait until I provide these before you proceed.

After I paste them, respond with:

1) User Stories - a list of user stories grouped by persona (Design Engineer, Quality/Manufacturing Engineer, Project/Lead), written in standard "As a..., I want..., so that..." format. Focus on v1 scope only.

2) Acceptance Criteria - for each user story, 3-7 concrete, testable acceptance criteria written in Gherkin-style or clear bullet points.

3) Story Prioritization - for each story, assign a priority (Must / Should / Could) and a suggested phase (Discovery/Architecture, Core Build, Hardening).

4) Gaps - a short list of any important stories or criteria that appear missing based on the PRD.

Present your output in a structured way that I can save directly into a backlog document or import into a planning tool.
```

**Expected output / definition of done**

* You have a complete list of v1 user stories with:

  * Persona labels.
  * Acceptance criteria.
  * Priority tags and phase tags.
* You can paste this into your backlog tool or store it as `docs/02_user_stories.md`.
* Every key workflow from the PRD has at least one story with clear acceptance criteria.

**Assumptions & inputs**

* PRD and prior alignment summary are available.
* You are willing to tweak priorities yourself if something feels off.

---

### Prompt 1.3 - UX flows and information architecture

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a UX lead and information architect for a SaaS product.

I am a solo founder building a Next.js 15 web app called "GD&T FCF Builder & Interpreter." We will have core routes such as: /app, /app/builder, /app/interpreter, /app/image-interpreter, /app/projects, /app/projects/[id], and /app/settings.

In your first response, ask me to paste:
- My PRD, and
- The user stories/acceptance criteria you previously generated (if I have them).

Wait for that information before proceeding.

After I provide the inputs, respond once with:

1) Information Architecture - a tree of pages/routes with a one-sentence purpose statement for each route and the key UI sections on each page.

2) User Flows - for each key workflow (Mode 1 image interpretation, Mode 2 builder, JSON interpreter + calculators, projects & measurements, settings), outline a numbered step-by-step UX flow from first click to completion.

3) State & Navigation Notes - list the main pieces of state per flow (e.g., selected FCF, measurement run, units) and how navigation should behave (back, cancel, save, new, etc.).

4) UX Risks - a short bullet list of UX risks or complexity hot spots that I should prototype or test carefully.

Use concise language suitable for turning into wireframes and tickets.
```

**Expected output / definition of done**

* You have:

  * A clear IA tree mapping routes to purposes.
  * Detailed textual UX flows for each major workflow.
  * Notes on state and navigation you can use for component design.
* You can store this as `docs/03_ux_flows.md` and reference it while designing components.

**Assumptions & inputs**

* PRD + stories document is available.
* You are using a design tool (e.g., Figma) separately for visual wireframes.

---

### Prompt 1.4 - 6-sprint roadmap and epics allocation

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a project planner and delivery lead.

I am a solo founder with limited capacity but will use you heavily for code and content generation. Assume a 6-sprint (2 weeks each) v1 target for the "GD&T FCF Builder & Interpreter" product.

In your first response, ask me for:
- The user stories/acceptance criteria document,
- The UX flows/IA document,
- Any constraints on my weekly time (hours per week).

Wait until I provide the information.

After that, respond once with:

1) Epics - a concise list of epics (Discovery, Architecture & Platform, FCF Model & Rules, AI Orchestration, Core Features, Projects & Settings, Testing & Security, Launch).

2) Sprint Plan - a table with 6 rows (Sprint 1-6) and columns: Key Objectives, Epics Covered, Representative Stories.

3) Milestones - a list of 5-8 core milestones (e.g., deterministic engine ready, AI orchestration slice, core flows usable in staging, etc.) and which sprint they target.

4) Risk-Mitigated Plan - short notes on how to sequence the work to reduce risk (e.g., deliver deterministic engine before heavy AI, earliest possible vertical slice).

Format everything so I can commit the results directly into `docs/04_roadmap.md`.
```

**Expected output / definition of done**

* You have a sprint-by-sprint plan with:

  * Epics mapped to sprints.
  * Milestones and sequencing rationale.
* You can use this as your master schedule and adjust as needed.

**Assumptions & inputs**

* You know your approximate available hours per week.
* You are comfortable revisiting this roadmap after a couple of sprints.

---

## Phase 2 - Architecture & Platform Foundations (Epic E2)

### Prompt 2.1 - High-level architecture and boundaries

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a senior SaaS architect.

I am a solo founder building "GD&T FCF Builder & Interpreter" with a Next.js 15 + TypeScript + Supabase stack. I want a clean separation between frontend, deterministic rules/calculation engine, AI orchestration, and persistence.

In your first response, ask me to paste:
- The PRD, and
- The IA/UX flows document (if I have it).

Wait for that context.

After I provide it, respond once with:

1) Architecture Overview - a list of major components (e.g., web frontend, rules engine, calculation engine, AI orchestration, data layer, file storage, observability).

2) Component Responsibilities - for each component, specify responsibilities, inputs, outputs, and key interactions.

3) Boundaries - describe clear boundaries between:
   - Rules/calculation engine vs AI layer,
   - Backend vs frontend,
   - Persistence vs stateless logic.

4) Technology Choices - confirm or recommend concrete technologies (e.g., Next.js App Router, Supabase auth/RLS, Postgres schema, object storage) plus any notable alternatives.

5) Initial ADR List - a bullet list of 5-10 decisions I should document as Architecture Decision Records (ADRs), each with a one-line description.

Write in a structured, implementation-ready format I can drop into `docs/05_architecture_overview.md`.
```

**Expected output / definition of done**

* You have:

  * A documented architecture overview with clear components and boundaries.
  * A shortlist of ADRs to capture as separate files later.
* You can implement code modules and repo structure consistent with this document.

**Assumptions & inputs**

* You are committed to a Next.js + Supabase style stack.
* You are open to minor tech choice suggestions from the model.

---

### Prompt 2.2 - Data model and schema design

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a backend/data architect.

I am building "GD&T FCF Builder & Interpreter" using Postgres (via Supabase). I need a normalized data model for:
- users,
- projects,
- FCF records (canonical FCF JSON),
- measurements,
- user settings,
- uploads (images/files).

In your first response, ask me to paste:
- My PRD,
- Any existing architecture overview you helped me create.

Wait for that context.

After I provide it, respond with:

1) Entity List - a concise list of entities and their responsibilities.

2) Table Design - for each entity, propose a Postgres table definition (columns, types, constraints, indexes) using a clear, SQL-like schema notation.

3) Relationships - describe foreign keys and cardinalities (e.g., one project -> many FCF records, one FCF -> many measurement sets).

4) RLS Strategy - a brief description of how Row-Level Security should be applied per table for a multi-tenant SaaS.

5) Migration Outline - a suggested order of database migrations I can apply when setting up the project.

Format the output so I can copy parts of it into migration files and a data model spec.
```

**Expected output / definition of done**

* You have a concrete schema design and RLS strategy.
* You know which tables to create first and how they relate.
* You can create migrations and Supabase policies based on this.

**Assumptions & inputs**

* Multi-tenant, user-scoped data is required.
* You will refine column naming/types to match your coding preferences if needed.

---

### Prompt 2.3 - Repo structure, conventions, and scaffolding

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a senior TypeScript/Next.js architect.

I am working in VS Code and starting a new Next.js 15 project for "GD&T FCF Builder & Interpreter." I want a maintainable monorepo or single-repo structure, consistent naming conventions, and clear separation of domain logic from UI.

Without asking for any files yet, respond once with:

1) Recommended Repo Structure - a tree layout for the project (apps/web, app routes, components, lib modules for `fcf`, `rules`, `calc`, `ai`, `supabase`, tests, docs, etc.).

2) Naming Conventions - conventions for files, types, components, modules, and error codes.

3) Initial Scripts - recommended npm/yarn scripts (dev, build, lint, test, typecheck, format).

4) Setup Steps - a short, ordered checklist I can follow in VS Code to initialize the repo and apply your structure.

Explain in concise detail so I can follow it step by step in my environment.
```

**Expected output / definition of done**

* You have:

  * A concrete folder/tree structure to implement.
  * Naming conventions for types, components, and modules.
  * A checklist for initial setup.
* You can scaffold your repo following this guidance.

**Assumptions & inputs**

* You will run the necessary CLI commands yourself in VS Code terminal.
* You are comfortable using npm or yarn.

---

### Prompt 2.4 - CI/CD pipeline design

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a DevOps engineer.

I am a solo founder with a Next.js 15 + TypeScript + Supabase project on GitHub. I want a simple but robust CI/CD pipeline using GitHub Actions for:

- install, lint, typecheck,
- run tests,
- build,
- deploy to staging and production.

Without asking for code first, respond once with:

1) Pipeline Overview - describe the stages of the pipeline and when they run (push, PR, tag).

2) GitHub Actions Workflow - provide a full example of a GitHub Actions YAML workflow file that implements the basic pipeline (use placeholders for deployment commands if needed).

3) Environment/Secrets Handling - explain how to manage environment variables and secrets safely for CI and deployment.

4) Definition of Done - a short checklist I can use to verify that CI/CD is working (e.g., what should I see in GitHub after pushing).

Make everything copy-and-paste-able into `.github/workflows/ci.yml` with minimal modification.
```

**Expected output / definition of done**

* You have a template GitHub Actions workflow you can paste.
* You understand where to configure secrets and deployment steps.
* After you hook this up, every push/PR runs the pipeline.

**Assumptions & inputs**

* Your repo is on GitHub.
* You know how you will deploy (e.g., Vercel, custom infra), or you can fill in placeholder deploy steps later.

---

## Phase 3 - Canonical FCF Model, Rules & Calculation Engine (Epic E3)

### Prompt 3.1 - FCF JSON schema design and examples

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a GD&T-aware domain modeler in TypeScript.

I am building a canonical FCF JSON schema ("FcfJson") for the "GD&T FCF Builder & Interpreter" app. This schema will be the single source of truth across UI, validation, calculations, and AI.

In your first response, ask me to paste:
- The PRD, and
- Any existing notes I have on FCF fields and calculators.

Wait for that context.

After I paste it, respond once with:

1) FcfJson Structure - a clear description of the JSON structure: top-level fields, nested objects, and enums for things like characteristic type, modifiers, feature type, datums, units.

2) TypeScript Type - a TypeScript `type FcfJson = { ... }` that matches this structure, with comments explaining each field.

3) Examples - 3-5 example FcfJson objects for different characteristics (e.g., position, flatness, perpendicularity, profile), annotated with short notes on what they represent.

4) Constraints Notes - notes on important constraints that will matter for validation (e.g., which modifiers are allowed with which characteristics, datum requirements).

Write everything so I can paste the type directly into `lib/fcf/schema.ts`.
```

**Expected output / definition of done**

* You have:

  * A clear conceptual structure of FcfJson.
  * Actual TypeScript type definition.
  * Example JSON objects for testing and documentation.
* You can then proceed to implement Zod schemas and validation.

**Assumptions & inputs**

* PRD has enough detail about FCF representation; otherwise the model will propose reasonable defaults to refine.

---

### Prompt 3.2 - Zod schema and basic validation helpers

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a senior TypeScript backend engineer.

I already have a conceptual `FcfJson` type for my "GD&T FCF Builder & Interpreter" project (I can paste it when needed). I now want to implement a Zod schema and basic validation helpers.

In your first response, ask me to paste:
- The current `FcfJson` TypeScript type,
- Any example FcfJson objects I have.

Wait until I provide them.

After that, respond once with:

1) Zod Schema - a `const fcfJsonSchema = z.object({ ... })` that matches my `FcfJson` type as closely as possible.

2) Helper Functions - small helpers:
   - `parseFcfJson(raw: unknown): FcfJson`
   - `isFcfJson(raw: unknown): raw is FcfJson`

3) Basic Validation - a simple `validateSchemaOnly(fcf: FcfJson): string[]` that checks for obvious missing required fields and returns a list of human-readable issues.

4) Minimal Tests - a few example Jest/Vitest test cases showing schema validation on valid and invalid inputs.

Output everything as code blocks I can paste directly into `lib/fcf/schema.ts` and a corresponding test file.
```

**Expected output / definition of done**

* You have:

  * A Zod schema aligned with your FcfJson type.
  * Helper functions for parsing and checking.
  * Sample tests to verify schema behavior.

**Assumptions & inputs**

* You have chosen a test framework (Jest or Vitest).
* You can adapt import paths and test setup as needed.

---

### Prompt 3.3 - Rules engine design and implementation

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a GD&T-aware rules engine designer.

I need a deterministic rules engine for validating FCFs in my "GD&T FCF Builder & Interpreter" app, using the FcfJson schema and ASME-consistent rules defined in my PRD.

In your first response, ask me to paste:
- My FcfJson TypeScript type,
- The PRD sections that describe FCF rules and error codes,
- Any initial thoughts or constraints I have written down.

Wait for that context.

After I provide it, respond once with:

1) Validation Model - propose a `ValidationResult` type including:
   - overall validity,
   - list of issues with structured fields (code, message, path, severity).

2) Rule Catalog - a prioritized list of rule categories (e.g., characteristic-modifier compatibility, datum requirements, feature type constraints) and example rules in each.

3) Implementation Sketch - a TypeScript outline for:
   - `validateFcf(fcf: FcfJson): ValidationResult`
   - Rule registration mechanism (e.g., list of pure functions with metadata).

4) Concrete Rules - implement at least 3-5 representative rules in TypeScript, each mapping to a specific error code.

5) Test Outline - a set of test scenarios for these rules (describe expected inputs/outputs and edge cases).

Provide code that I can paste into `lib/rules/validateFcf.ts` and then extend.
```

**Expected output / definition of done**

* You have:

  * A clear ValidationResult type.
  * A working baseline rules engine with some representative rules.
  * A testing plan for additional rules.

**Assumptions & inputs**

* You have or can extract rule details from your PRD.
* You are willing to extend the ruleset incrementally.

---

### Prompt 3.4 - Calculation engine for position, flatness, perpendicularity, profile

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a numeric calculation engine designer for GD&T.

I need deterministic calculator functions for my "GD&T FCF Builder & Interpreter" app, focused on:
- Position at MMC,
- Flatness,
- Perpendicularity,
- Profile.

In your first response, ask me to paste:
- The PRD sections describing calculator behavior,
- Any existing formula notes or examples.

Wait for that information.

After I provide it, respond once with:

1) Type Definitions - define TypeScript types for:
   - calculator inputs,
   - calculator outputs,
   - common supporting types (e.g., units, tolerance).

2) Function Signatures - propose signatures like:
   - `calculatePositionAtMMC(input: PositionInput): PositionResult`
   - Similar for flatness, perpendicularity, profile.

3) Implementation - implement at least the position at MMC calculator with:
   - bonus tolerance,
   - virtual condition,
   - pass/fail determination.

4) Test Cases - provide a set of example inputs/outputs and corresponding Jest/Vitest tests for position at MMC (including boundary cases).

5) Extension Notes - brief notes on how to structure the other calculators (flatness, perpendicularity, profile) for consistent design.

Output code I can paste into `lib/calc/position.ts` and tests.
```

**Expected output / definition of done**

* You have:

  * Types and function signatures for calculators.
  * A working implementation for position at MMC.
  * Test cases verifying key scenarios.

**Assumptions & inputs**

* PRD contains or implies calculation rules; if not, the model will propose reasonable formulas for you to verify with SMEs later.

---

## Phase 4 - AI Orchestration (2-Agent, GPT-5.1)

### Prompt 4.1 - 2-agent architecture and I/O specs

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as an AI systems designer.

I need to design a 2-agent orchestration layer for my "GD&T FCF Builder & Interpreter" app, consisting of:
- Extraction Agent,
- Explanation Agent.

In your first response, ask me to paste:
- The PRD sections describing the AI agents and orchestrator,
- My current FcfJson type, ValidationResult type, and CalcResult type.

Wait for that context.

After I provide it, respond once with:

1) Agent Responsibilities - a concise description of each agent's purpose, input, and output.

2) TypeScript Interfaces - TypeScript interfaces for each agent's request and response payloads.

3) Orchestration Flow - a step-by-step description of how `/api/fcf/interpret` should call extraction (if image), deterministic validation/calculation, and the Explanation Agent, including how to handle failures and low confidence (derived from parseConfidence + validation).

4) Sequence Diagram Description - a textual sequence diagram (steps) that I can later draw or document visually.

5) Data Contract Notes - key invariants the agents must respect to avoid contradicting deterministic outputs.

Write in implementation-ready language so I can create `lib/ai` modules based on this.
```

**Expected output / definition of done**

* You have:

  * Clear agent responsibilities and I/O contracts.
  * Orchestration flow defined.
* You can implement the orchestrator and APIs confidently.

**Assumptions & inputs**

* PRD defines high-level agent behaviors.
* You have FcfJson, validation, and calculation types ready.

---

### Prompt 4.2 - System prompts for Extraction + Explanation

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a prompt engineer for a 2-agent AI system.

I have two agents for my "GD&T FCF Builder & Interpreter" app:
- Extraction,
- Explanation.

In your first response, ask me to paste:
- The PRD sections about these agents,
- The TypeScript request/response interfaces you helped me define (or I already have).

Wait for that information.

After I provide it, respond once with:

1) System Prompts - a full system prompt for each agent, emphasizing:
   - role,
   - constraints (e.g., do not contradict rules/calcs; use exact CalcResult numbers),
   - expected JSON structure or explanation style,
   - behavior on uncertainty.

2) User Prompt Templates - one template per agent that my backend can use, with clear placeholders for fields (e.g., image URL, raw text, FcfJson, CalcResult, ValidationResult).

3) Failure/Uncertainty Instructions - specific instructions for how agents should respond when information is ambiguous or assumptions are required.

4) Versioning Notes - brief recommendations on how to version and manage prompt changes over time.

Write everything in a way that I can paste into a `prompts.ts` module and adapt to my code.
```

**Expected output / definition of done**

* You have:

  * A complete set of system/user prompts for each agent.
  * Clear instructions for ambiguous/uncertain cases.
* You can implement these in your backend as prompt templates.

**Assumptions & inputs**

* PRD defines what each agent should do.
* You will adapt placeholder markers (e.g., `{{imageUrl}}`) to your actual templating approach.

---

### Prompt 4.3 - Implement AI endpoints and orchestrator in Next.js

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a full-stack TypeScript/Next.js engineer.

I need to implement the AI endpoints and orchestrator for my "GD&T FCF Builder & Interpreter" app in a Next.js 15 API layer, calling OpenAI/ChatGPT and my deterministic rules/calculation engine.

In your first response, ask me to paste:
- The TypeScript interfaces for agent requests/responses,
- The high-level orchestration flow we defined,
- Any existing API route scaffolding (if I have some).

Wait for that context.

After I provide it, respond once with:

1) API Design - confirm the shape of these endpoints:
   - `/api/ai/extract-fcf`
   - `/api/fcf/interpret` (orchestrator: extraction → validation → calculation → explanation with derived confidence).

2) Route Implementation - example Next.js route handlers or server actions for each endpoint, including:
   - input validation,
   - calling the OpenAI client,
   - error handling and timeouts,
   - returning typed JSON responses.

3) Orchestrator Implementation - a complete example implementation for `/api/fcf/interpret` that:
   - orchestrates extraction when imageUrl is provided,
   - calls the rules/calculation engine,
   - invokes the Explanation Agent with authoritative CalcResult,
   - derives confidence from parseConfidence + validation results.

4) Logging & Metrics - suggestions on how to log key events and measure latency/cost per request.

Provide code I can paste into `app/api/.../route.ts` files and then adjust.
```

**Expected output / definition of done**

* You have concrete Next.js route code for the AI endpoints and orchestrator.
* You understand how to plug in your OpenAI client, rules, and calculators.

**Assumptions & inputs**

* You already have or can configure an OpenAI client.
* You will add your own environment variable names and keys.

---

### Prompt 4.4 - Evaluation harness for agent quality

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as an AI evaluation engineer.

I want an evaluation harness to test the quality of my 2-agent FCF interpretation pipeline for "GD&T FCF Builder & Interpreter."

In your first response, ask me to paste:
- A few example FcfJson objects and their expected interpretations,
- Any sample images or textual descriptions (if I have them),
- My current agent/orchestrator interfaces.

Wait for that context.

After I provide it, respond once with:

1) Evaluation Plan - describe how to evaluate the agents and orchestrator (metrics such as correctness of FcfJson fields, explanation quality, adherence to rules, and confidence derivation).

2) Test Harness Design - propose a simple TypeScript test harness (could be a script or test file) that:
   - defines evaluation cases,
   - calls the orchestrator endpoint,
   - compares results to expected FcfJson and explanation snippets.

3) Example Code - provide a TypeScript example for a small set of evaluation cases and how to report results (e.g., pass/fail with reason).

4) Expansion Notes - how to add more test cases over time and track regressions.

Write in a way that I can create `tools/ai_evaluation.ts` and start experimenting.
```

**Expected output / definition of done**

* You have:

  * An evaluation framework concept.
  * A working script or test file to exercise the orchestrator.

**Assumptions & inputs**

* You can call your own API endpoints from Node/TypeScript.
* You are prepared to refine metrics as you see real results.

---


## Phase 5 - Core Application Features (Epics E5 & E6)

### Prompt 5.1 - Implement `/app/builder` (FCF Builder UI)

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a senior React/Next.js frontend engineer.

I need to implement the FCF Builder page at `/app/builder` for my "GD&T FCF Builder & Interpreter" app. It should:

- Use the canonical FcfJson type and schema,
- Allow users to configure characteristic, tolerance, modifiers, datums, feature type, advanced options,
- Show live validation using the rules engine,
- Render a live SVG preview of the FCF,
- Save the FCF to a project and support export actions.

In your first response, ask me to paste:
- The FcfJson type and schema,
- Any existing rules/validation helpers,
- Any current page or component scaffolding for `/app/builder` (if present).

Wait for those.

After I provide them, respond once with:

1) Component Structure - a proposal for the key components (e.g., `FcfBuilderPanel`, `FcfPreview`, `FcfExportBar`) and their props.

2) Page Implementation - a `page.tsx` example for `/app/builder` that wires up:
   - state management for FcfJson,
   - validation calls,
   - passing props to builder and preview components.

3) Core Components - implementation examples for:
   - `FcfBuilderPanel` - form UI,
   - `FcfPreview` - SVG rendering stub,
   - `FcfExportBar` - buttons for save/export.

4) UX Details - short notes on how to handle errors, loading states, and disabled actions.

Provide code I can paste into `app/app/builder/page.tsx` and `components/fcf/*.tsx` and then adapt.
```

**Expected output / definition of done**

* You have:

  * A working structure for the builder page and components.
  * Initial wiring to FcfJson and validation.

**Assumptions & inputs**

* Rules engine and FcfJson schema exist.
* You will refine SVG rendering as needed.

---

### Prompt 5.2 - Implement `/app/interpreter` (JSON interpreter + calculators)

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a React/Next.js frontend engineer.

I need to implement the JSON Interpreter and calculator UI at `/app/interpreter` for my "GD&T FCF Builder & Interpreter" app. This page should:

- Let me paste or load an FcfJson object,
- Call the `/api/fcf/interpret` endpoint,
- Show validation errors, calculator results, and explanation.

In your first response, ask me to paste:
- The FcfJson type,
- The `/api/fcf/interpret` request/response contracts,
- Any existing UI scaffolding (if present).

Wait for that.

After I provide it, respond once with:

1) Page Layout - design for the main sections (JSON input, results, explanation).

2) `page.tsx` Example - Next.js page implementation using React hooks and server actions/client fetch as appropriate.

3) Core Components - React components for:
   - `InterpreterForm` - JSON input, validation, submit,
   - `CalcResults` - display of numeric results and pass/fail,
   - `ExplanationPanel` - plain-language explanation and warnings.

4) Error Handling - how to display API errors, invalid JSON, or unexpected responses.

Return code I can paste into `app/app/interpreter/page.tsx` and `components/fcf/*`.
```

**Expected output / definition of done**

* You have a usable `/app/interpreter` page wired to your orchestrator.
* You can paste FcfJson, get validation and calculator results, and see explanations.

**Assumptions & inputs**

* `/api/fcf/interpret` is implemented or stubbed.
* You have an HTTP client pattern (fetch, server actions) chosen.

---

### Prompt 5.3 - Implement `/app/image-interpreter` (image upload + AI)

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a full-stack Next.js engineer.

I need to implement the image-based interpreter at `/app/image-interpreter` for my "GD&T FCF Builder & Interpreter" app. It should:

- Allow users to upload or paste an image of an FCF,
- Store the upload securely (e.g., Supabase storage with signed URLs),
- Call the appropriate AI agent endpoint(s),
- Show parsed fields with confidence, allow edits, and then route into the same interpretation/calculation pipeline.

In your first response, ask me to paste:
- My storage strategy (e.g., Supabase storage snippet or notes),
- The AI extraction/combined endpoint specs,
- Any current UI scaffolding for this page.

Wait for that.

After I provide it, respond once with:

1) Flow Outline - a clear step-by-step flow from image upload to final interpreted FcfJson and explanation.

2) Page Implementation - example `page.tsx` code for `/app/image-interpreter`, including:
   - `ImageUploadPanel` for uploading/pasting images,
   - Calls to an upload API route and AI endpoint,
   - State handling for FcfJson and confidence metadata.

3) Parsed Fields Form - a component that displays extracted fields, shows parse confidence and warnings, and allows manual edits.

4) Integration - how to reuse the same interpretation/calculation display as `/app/interpreter` once the final FcfJson is confirmed.

Return code I can paste and adapt into `app/app/image-interpreter/page.tsx` and `components/fcf/*`.
```

**Expected output / definition of done**

* You have a functional skeleton for Mode 1:

  * Image upload,
  * AI extraction,
  * Human confirmation,
  * Final interpretation.

**Assumptions & inputs**

* Your storage backend is chosen and accessible.
* AI endpoints for extraction/combined exist or are stubbed.

---

### Prompt 5.4 - Implement `/app/projects` and `/app/projects/[id]` (projects & measurements)

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a full-stack Next.js engineer.

I need to implement project and measurement management for my "GD&T FCF Builder & Interpreter" app at:

- `/app/projects` - project list,
- `/app/projects/[id]` - project detail with associated FCFs and measurement runs.

In your first response, ask me to paste:
- The Postgres table schemas for projects, FCF records, and measurements,
- Any existing API routes or server actions I have for these entities.

Wait for that context.

After I provide it, respond once with:

1) Data Access Layer - suggest minimal data access utilities (e.g., `getProjectsForUser`, `getProjectDetailWithFcfs`, `createProject`, etc.).

2) `/app/projects` Implementation - a `page.tsx` example showing:
   - project list with search/filter,
   - creation flow (modal or inline form).

3) `/app/projects/[id]` Implementation - a `page.tsx` example showing:
   - project metadata,
   - table/list of FCF records and measurement runs,
   - links/actions to open builder/interpreter from a selected FCF.

4) Measurement Handling - outline how measurement runs should be listed and linked back to calculators and FcfJson.

Provide code I can paste into the relevant route files and adjust.
```

**Expected output / definition of done**

* You have:

  * Working project listing and detail pages.
  * Clear linkages between projects, FCFs, and measurements.

**Assumptions & inputs**

* Tables and RLS policies exist or are planned.
* You have or will add server-side data access helpers.

---

### Prompt 5.5 - Implement `/app/settings` (units, precision, preferences)

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a React/Next.js frontend engineer.

I need to implement the Settings page at `/app/settings` for my "GD&T FCF Builder & Interpreter" app. It should at minimum support:

- Preferred units (e.g., mm/inch),
- Decimal precision,
- Dual-display options (if supported),
- Any other per-user calculation/formatting preferences.

In your first response, ask me to paste:
- The user_settings table schema,
- Any existing utilities for units/precision formatting.

Wait for that.

After I provide it, respond once with:

1) Page Layout - a simple layout for `/app/settings` (sections for Units & Precision, Display, Other).

2) Units Component - a `UnitControls` React component that:
   - reads current settings,
   - lets the user change units and precision,
   - saves via a server action or API.

3) Wiring - example server action or API handler that:
   - loads current settings on page load,
   - persists updates to the database,
   - handles errors and optimistic UI if appropriate.

4) Propagation Notes - short notes on how to propagate these settings into builder, interpreter, calculators, and exports.

Return code for `app/app/settings/page.tsx`, `components/settings/UnitControls.tsx`, and any supporting functions.
```

**Expected output / definition of done**

* You have a functioning Settings page for unit/precision preferences.
* You know how to propagate settings throughout the app.

**Assumptions & inputs**

* `user_settings` table exists or will be created.
* You have a pattern for server actions or API routes.

---

## Phase 6 - Testing & Quality Assurance (Epic E7.F1)

### Prompt 6.1 - Global test plan and traceability matrix

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a QA lead.

I need a test plan and traceability matrix for my "GD&T FCF Builder & Interpreter" app, covering:

- Deterministic rules and calculators,
- FCF Builder,
- JSON Interpreter,
- Image Interpreter,
- Projects/measurements,
- Settings.

In your first response, ask me to paste:
- The user stories and acceptance criteria,
- Any notes I have on non-functional requirements (performance, security).

Wait for that.

After I provide it, respond once with:

1) Test Strategy - a concise description of test levels (unit, integration, end-to-end, AI evaluation) and what belongs where.

2) Traceability Matrix - a table mapping user stories to test cases (ID, story, test case name).

3) Test Suite Outline - lists of specific test suites to create (e.g., `rulesEngine.test.ts`, `positionCalc.test.ts`, `builder.e2e.ts`, etc.).

4) Definition of Done - a short checklist for when v1 is "test complete" (coverage, critical path cases, SME validation).

Write in a way that I can save as `docs/06_test_plan.md`.
```

**Expected output / definition of done**

* You have a test strategy and traceability matrix.
* You know which test suites to create and when you are "done enough" for v1.

**Assumptions & inputs**

* User stories/acceptance criteria exist.
* You know your test framework (Playwright/Cypress, Jest/Vitest, etc.).

---

### Prompt 6.2 - Unit tests for rules and calculators

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a test-oriented TypeScript engineer.

I want strong unit test coverage for the deterministic rules and calculation engines in my "GD&T FCF Builder & Interpreter" app.

In your first response, ask me to paste:
- The current implementation of my rules engine (`validateFcf` and related code),
- The current implementation of my calculators (at least position at MMC),
- Any existing tests I already wrote (if any).

Wait until I provide them.

After that, respond once with:

1) Test Inventory - a list of recommended test files and what each should cover.

2) Test Cases - detailed example unit tests for:
   - several rules (including passing and failing FcfJson examples),
   - the position at MMC calculator (including boundary conditions).

3) Data Table Approach - show how to define reusable test data tables (arrays of cases) to reduce duplication.

4) Coverage Guidance - notes on which rules/calculations are highest priority for thorough testing.

Return code I can paste into `tests/unit/*` with minimal changes.
```

**Expected output / definition of done**

* You have:

  * Concrete test files for rules and calculators.
  * Representative cases covering success, failure, and edge conditions.

**Assumptions & inputs**

* Your rules and calculators are already coded or stubbed.
* You can adapt import paths in tests.

---

### Prompt 6.3 - Integration and UI tests for core flows

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as an end-to-end test engineer.

I need integration/UI tests for core flows in my "GD&T FCF Builder & Interpreter" app, using a tool like Playwright or Cypress:

- Build an FCF in the builder and export it,
- Interpret FcfJson via `/app/interpreter`,
- Run an image-based interpretation via `/app/image-interpreter`,
- Create a project, attach FCFs and measurements,
- Change settings and see them applied.

In your first response, ask me to tell you:
- Which E2E test framework I plan to use (Playwright, Cypress, etc.),
- The current state of my front-end routes and any test helpers.

Wait for that.

After I answer, respond once with:

1) Test Scenarios - a list of end-to-end scenarios and their business purpose.

2) Example Test Code - example implementation for 2-3 high-value scenarios (e.g., builder + export, image interpreter end-to-end).

3) Test Data Strategy - suggestions for seeding data or using fixtures (projects, FCF samples).

4) CI Integration - notes on how to add these tests to my GitHub Actions pipeline.

Provide code I can paste into `tests/e2e/*`.
```

**Expected output / definition of done**

* You have:

  * E2E scenarios defined.
  * Example test code you can run and extend.

**Assumptions & inputs**

* You are comfortable installing and configuring your chosen E2E tool.
* Auth/seed data approaches are roughly decided.

---

### Prompt 6.4 - Performance and load test scenarios

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a performance engineer.

I want to define lightweight performance and load test scenarios for my "GD&T FCF Builder & Interpreter" app, focusing on:

- `/api/fcf/interpret` latency and throughput,
- Overall app responsiveness under typical usage.

Without needing any code first, respond once with:

1) Performance Goals - suggested target ranges for latency and resource usage, based on a small SaaS product with AI calls.

2) Test Scenarios - a set of scenarios (e.g., single user, small team, stress test) for the interpret endpoint and main flows.

3) Tool Suggestions - practical tools or approaches (e.g., k6, simple Node scripts) I can use as a solo founder.

4) Reporting Template - a small template for recording test results (scenario, configuration, metrics, observations).

Write in concise terms so I can create `docs/07_performance_plan.md` and run basic tests.
```

**Expected output / definition of done**

* You have:

  * A performance goal baseline.
  * A small number of practical test scenarios and a reporting template.

**Assumptions & inputs**

* You do not need highly sophisticated performance tooling for v1; basic checks are sufficient.

---

## Phase 7 - Security, Deployment, Observability, Launch (Epics E7.F2 & E7.F3)

### Prompt 7.1 - RLS, access control, and data privacy review

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a security-minded backend architect.

I use Supabase/Postgres with Row-Level Security for my "GD&T FCF Builder & Interpreter" app. I want to ensure RLS, access control, and data privacy are solid for v1.

In your first response, ask me to paste:
- My current table schemas (projects, FCF records, measurements, user_settings, uploads),
- Any RLS policies or notes I already defined.

Wait for that.

After I provide it, respond once with:

1) Policy Review - review my RLS and call out any obvious gaps or risks for a multi-tenant SaaS.

2) Policy Recommendations - suggest precise RLS policies and examples that:
   - restrict all rows to the owning user or team,
   - ensure uploads cannot be accessed by other tenants,
   - support any sharing model I describe (if applicable).

3) Logging & Privacy Notes - give guidance on:
   - what to log vs avoid logging,
   - handling of image data and FcfJson in logs.

4) Security Checklist - a short checklist I can run before launch for access control and privacy.

Write in practical terms with example SQL for RLS rules where possible.
```

**Expected output / definition of done**

* You have:

  * Reviewed and improved RLS policy designs.
  * A pre-launch security checklist.

**Assumptions & inputs**

* Your schema and basic RLS policies exist.
* You have a clear idea whether you support sharing across users or only per-user data.

---

### Prompt 7.2 - Secrets and configuration management

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a DevOps/security engineer.

I need guidance on secrets and configuration management for my "GD&T FCF Builder & Interpreter" app, including:

- OpenAI API keys,
- Database and Supabase keys,
- Storage keys,
- Environment configs per environment (dev, staging, prod).

Without needing code first, respond once with:

1) Secrets Inventory - a list of the secrets/config values I likely need.

2) Management Strategy - how to manage these secrets for:
   - local development,
   - CI,
   - staging,
   - production.

3) Practical Steps - concrete steps for a solo founder using GitHub + a common hosting provider (e.g., Vercel or similar) to keep secrets safe.

4) Definition of Done - a short list of conditions under which secrets management is "good enough" for an internal pilot.

Keep it concise and actionable.
```

**Expected output / definition of done**

* You have:

  * A list of required secrets/configs.
  * A plan for managing them safely in all environments.

**Assumptions & inputs**

* You use GitHub and a hosted platform where you can configure environment variables.

---

### Prompt 7.3 - Observability and monitoring plan

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as an observability engineer.

I want basic but useful observability for my "GD&T FCF Builder & Interpreter" app, including:

- API metrics (latency, error rates),
- AI usage metrics (number of calls, failures),
- Frontend errors.

Without needing code first, respond once with:

1) Metrics - list the key metrics I should track for:
   - `/api/fcf/interpret`,
   - AI agent calls,
   - general API and web app health.

2) Logging - describe what to log (and what not to log) for:
   - API requests/responses,
   - AI prompts/responses (sanitized),
   - errors and exceptions.

3) Tooling - suggest low-impact tools (e.g., simple logging library, hosted monitoring platform) suitable for a solo founder.

4) Dashboards & Alerts - propose 2-3 dashboards and a small set of alerts (what to alert on, thresholds).

Present in a format I can use to create `docs/08_observability_plan.md`.
```

**Expected output / definition of done**

* You have:

  * A metrics and logging plan.
  * A set of dashboards/alerts you intend to configure.

**Assumptions & inputs**

* You will select a specific monitoring platform (e.g., vendor or open source) yourself.

---

### Prompt 7.4 - Deployment checklist and runbook

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a release manager.

I need a deployment checklist and basic runbook for launching v1 of my "GD&T FCF Builder & Interpreter" app for an internal pilot.

Without requiring code, respond once with:

1) Pre-Deployment Checklist - detailed steps to verify before deploying (tests, migrations, secrets, RLS, observability, feature flags if any).

2) Deployment Steps - a generic deployment sequence I can adapt (e.g., build, apply migrations, deploy, smoke test).

3) Smoke Test Script - a short script of UI/API checks I should perform right after deployment to confirm the app is healthy.

4) Incident Handling Basics - a brief runbook section on what to do if:
   - AI endpoints fail,
   - DB or RLS issues appear,
   - app performance degrades.

Write in a concise, step-by-step style for `docs/09_deployment_runbook.md`.
```

**Expected output / definition of done**

* You have a clear deployment checklist and runbook.
* You can follow it step by step during your first pilot launch.

**Assumptions & inputs**

* You have a chosen hosting/deployment platform.
* You can translate generic steps into platform-specific commands.

---

### Prompt 7.5 - Post-launch metrics and iteration plan

**Prompt**

```text
You are ChatGPT 5.1 Codex Max acting as a product analytics and iteration coach.

Once v1 of "GD&T FCF Builder & Interpreter" is live for internal pilot, I want to:

- Track key usage and success metrics,
- Capture qualitative feedback,
- Feed both into a continuous improvement loop.

Without needing any code, respond once with:

1) Core Metrics - list a small set of product metrics to track (e.g., number of interpretations per week, success rate, time to build an FCF, error rates).

2) Feedback Channels - suggest simple ways for a small internal user group to provide feedback (structured and unstructured).

3) Review Cadence - propose a realistic cadence (e.g., weekly) for me as a solo founder to review metrics/feedback and adjust priorities.

4) Iteration Framework - a simple framework (e.g., "Observe -> Decide -> Plan -> Implement -> Validate") and how to apply it to this product.

Write this as a short plan I can store in `docs/10_post_launch_plan.md`.
```

**Expected output / definition of done**

* You have:

  * A small, focused set of post-launch metrics.
  * A repeatable review and iteration process.

**Assumptions & inputs**

* You can instrument basic analytics (events, metrics) in the app.
* You have access to a small group of pilot users or internal stakeholders.

---

You can now walk through these prompts phase by phase in VS Code, using them as your "master prompt pack" to drive the entire build from PRD to launch as a solo founder.
