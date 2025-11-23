# PRD – GD&T Feature Control Frame (FCF) Builder & Interpreter (AI‑Driven)

- **Product**: GD&T Feature Control Frame (FCF) Builder & Interpreter
- **Version**: 1.1 (Revised)
- **Status**: Draft
- **Owner**: Wilfred Stephen Ekeoseye
- **Contributors**: [Eng Lead], [Design Lead], [GD&T SME], [Data/ML Lead]
- **Primary Standard**: ASME Y14.5‑2018

---

## 0. Overview

### 0.1 Problem Statement

Engineering and quality teams frequently need to interpret or create GD&T Feature Control Frames (FCFs) compliant with ASME Y14.5‑2018. Today this is:

- Manual and error‑prone.
- Dependent on scarce GD&T experts.
- Difficult to standardize across organizations and suppliers.
- Hard to automate for reporting or downstream calculations.

We need a SaaS application that lets engineers **define, validate, and interpret FCFs** quickly and reliably, leveraging AI while preserving a deterministic rules/calculation core that stays aligned with the ASME standard.

### 0.2 Product Summary

Build a SaaS web application that helps engineers define, validate, and interpret FCFs compliant with ASME Y14.5‑2018.

The app provides:

1. A modern **FCF Builder UI** (web version of the classic “Geometric Tolerance” dialog).
2. **Image / screenshot‑based FCF extraction** and interpretation (including from PDF snippets).
3. **Text/JSON‑based interpretation and calculators** for key tolerances.
4. A **multi‑agent ChatGPT pipeline** that:
   - Extracts FCF data from user inputs.
   - Interprets the FCF into plain‑language explanations.
   - Cross‑checks outputs via a combined extract+interpret agent.
   - Uses a QA/adjudicator agent to reconcile differences and return a single vetted result.
5. A **canonical FCF JSON schema** as the backbone for previews, calculations, storage, and exports.

The system’s numerical logic and standards constraints are enforced by a **deterministic rules and calculation engine**; AI explanations must align with those results.

---

## 1. Goals, Non‑Goals, and Success Metrics

### 1.1 Goals

1. Allow users to **define, validate, and interpret** FCFs without deep GD&T expertise.
2. Provide two primary input modes:
   - Mode 1: **Image / screenshot interpretation** (including drawing/PDF snippets).
   - Mode 2: **Form‑based FCF Builder** with live preview.
3. Normalize all inputs into a **canonical FCF JSON** structure.
4. Use **ChatGPT multi‑agent orchestration** for:
   - FCF extraction from image/text.
   - Interpretation into human‑readable explanations.
   - Cross‑checking via a combined agent and a QA/adjudicator agent.
5. Maintain a **deterministic rules & calculation engine** as the source of truth for:
   - Standards constraints (what is allowed or required per ASME Y14.5).
   - Numeric results (bonus tolerance, virtual condition, pass/fail).
6. Provide **project saving, calculators, exports, and unit handling** suitable for production use.

### 1.2 Non‑Goals (v1)

- CAD geometry parsing or model interrogation.
- Fully automated tolerance stack‑ups.
- Multi‑standard support (v1 is **ASME Y14.5‑2018 only**).
- Offline desktop client.
- Full CMM integration or direct gage programming.

### 1.3 Success Metrics (Indicative)

Product success should be measurable via:

- **Time to build an FCF**: P90 time for a GD&T‑literate user to build and export an FCF (PNG + SVG + JSON) ≤ 2 minutes.
- **Interpretation accuracy**: ≥ 90% of test FCFs judged “correct or acceptable” by GD&T SMEs on a structured evaluation set.
- **Interpretation latency**: P90 `/api/fcf/interpret` latency ≤ 400 ms at 1 req/s per user (excluding extreme network variance).
- **Adoption and usage**:
  - At least N active projects per month for internal pilot.
  - At least M FCF interpretation calls per active user per week.
- **Error rate**: < 2% of interpretations require manual override due to obvious standards violations (per SME review).

---

## 2. Target Users & Personas

### 2.1 Design Engineer

- **Motivation**: Needs to understand supplier drawings quickly, and to specify tolerances correctly on new designs.
- **Key needs**:
  - Paste or upload an FCF screenshot and get a precise explanation.
  - Build standards‑correct FCFs with guidance and validation.
- **Key flows**:
  - Mode 1: Image‑based interpretation.
  - Mode 2: FCF Builder with live preview and exports.

### 2.2 Quality / Manufacturing Engineer

- **Motivation**: Needs to ensure parts are inspected against the correct interpretation and pass/fail criteria.
- **Key needs**:
  - Interpreted FCF with explicit measurement setup and equations.
  - Pass/fail calculators for position, flatness, perpendicularity, and profile.
- **Key flows**:
  - Interpreter + calculators, with measurement inputs.
  - Projects to store multiple FCFs and results by part/line.

### 2.3 Project Lead / Technical Manager

- **Motivation**: Needs traceability across multiple FCFs, parts, and measurement runs.
- **Key needs**:
  - Organize FCFs into projects.
  - Export graphics and JSON for reports or downstream tools.
- **Key flows**:
  - Project CRUD, search, tagging, and exports.

---

## 3. Scope (v1)

### 3.1 In Scope

1. **FCF Builder (Mode 2)**
   - Web form to construct standards‑correct FCFs.
   - Live SVG preview of the FCF frame.
   - Validation via a rules engine aligned with ASME Y14.5‑2018.

2. **Image / Screenshot Interpretation (Mode 1)**
   - Upload or paste an image/PDF snippet containing an FCF.
   - Extraction Agent parses the FCF into structured fields.
   - User confirms/corrects parsed fields via a form.
   - Normalized FCF JSON generated and stored.

3. **FCF Interpretation**
   - Interpretation Agent converts FCF JSON (plus optional size/measurement info) into plain‑language explanations.
   - Deterministic engine computes numeric values (bonus tolerance, virtual condition, etc.) and feeds them into the LLM.
   - Combined Extract+Interpret Agent runs in parallel for image/text inputs.
   - QA/Adjudicator Agent reconciles outputs and produces the final JSON + explanation.

4. **Calculators**
   - Position at MMC (including bonus tolerance and virtual condition).
   - Flatness.
   - Perpendicularity.
   - Profile of a surface.
   - Inputs supplied by user or derived from FCF JSON.

5. **Projects & Data**
   - Projects CRUD with tags and search.
   - Each project holds multiple FCF records and associated measurement runs.

6. **File Uploads**
   - STEP or CSV upload for **metadata only** (no geometry parsing).
   - Link uploaded files to projects; store in private storage.

7. **Exports**
   - Export FCF as:
     - PNG (server‑side rasterization of SVG).
     - SVG.
     - JSON (copy to clipboard, format easily readable without the codelike format).

8. **Units & Precision**
   - Global settings:
     - Units: mm (default) or inch.
     - Decimal precision: 1–4 places.
     - Optional dual‑unit display (e.g., mm [primary] with inch in parentheses).

9. **Authentication & Security**
   - Supabase auth (OAuth or email magic link).
   - Row‑Level Security (RLS) on all user data.
   - Private buckets with signed URLs only.

10. **Multi‑Agent Orchestration**
    - Orchestrator service that manages multiple ChatGPT calls (agents), combines outputs, and returns final results to the frontend.

### 3.2 Out of Scope (v1)

- CAD geometry interrogation or feature recognition from STEP files.
- Automated tolerance stack‑up analysis.
- ISO GPS or other dimensional standards (beyond ASME Y14.5‑2018).
- Advanced composite FCF modeling beyond simple two‑segment placeholders.
- Multi‑tenant enterprise admin and billing.

---

## 4. User Stories (v1 Must‑Have)

1. **Image‑based Interpretation**
   - As a design engineer, I can upload or paste a screenshot of a drawing FCF and get a validated plain‑language explanation of what it controls and how, including bonus tolerance and virtual condition, so I can quickly understand supplier drawings.

2. **FCF Builder**
   - As a GD&T‑literate user, I can use a guided dialog to build an FCF that is standards‑correct, with live preview and error feedback, so I can specify tolerances confidently.

3. **Validation & QA**
   - As a quality engineer, I can rely on the system to run multiple AI “opinions” and reconcile them before giving me a result, so I can trust the interpretation more.

4. **Projects & Reporting**
   - As a project lead, I can save FCFs into projects, associate them with measurement runs, and export graphics and JSON for use in reports and downstream tools.

5. **Calculators**
   - As a quality engineer, I can calculate position at MMC with bonus tolerance, as well as flatness, perpendicularity, and profile pass/fail given required inputs and clearly documented assumptions.

6. **Units & Presentation**
   - As any user, I can switch units between millimeters and inches and set decimal places from 1 to 4, and see the builder, interpreter, tables, and exports respect this selection.

---

## 5. Canonical FCF JSON Schema

### 5.1 Structure

All flows must terminate in a shared FCF JSON structure:

```json
{
  "source": {
    "inputType": "image|builder|json",
    "fileUrl": "/uploads/fcf_123.png"
  },
  "characteristic": "position",
  "featureType": "internal_cylindrical_feature",
  "tolerance": {
    "value": 0.7,
    "diameter": true
  },
  "modifiers": ["MMC"],
  "datums": [
    { "id": "A", "materialCondition": "RFS" },
    { "id": "B", "materialCondition": "RFS" },
    { "id": "C", "materialCondition": "RFS" }
  ],
  "pattern": {
    "count": 2,
    "note": "2X"
  },
  "sizeDimension": {
    "nominal": 14.0,
    "tolerancePlus": 0.2,
    "toleranceMinus": 0.2
  },
  "projectedZone": false,
  "composite": null
}
```

Notes:

- `source.inputType` distinguishes:
  - `"image"` – Mode 1.
  - `"builder"` – Mode 2.
  - `"json"` – direct JSON/text inputs.
- `featureType` is used both for interpretation wording and validation.
- `composite` is reserved for future multi‑segment FCFs; v1 may only support null or simple structures.
- A strongly typed schema (e.g., Zod `FcfJson`) in the codebase enforces this structure and performs first‑line validation.

---

## 6. Mode 1 – Image / Screenshot Interpretation

### 6.1 Workflow

1. User uploads an image/PDF snippet or pastes a screenshot containing an FCF. Users should be able to indicate where the FCF is applied. 
2. Backend stores the file in a private bucket and generates a signed URL for ChatGPT Vision.
3. **Extraction Agent call**:
   - Prompt instructs the model to:
     - Identify characteristic symbol.
     - Tolerance value(s).
     - Diameter symbol presence.
     - Material condition modifiers (MMC/LMC/RFS).
     - Datum references + material condition.
     - Pattern count and notes (e.g., `2X`).
     - Size feature and its limits if legible.
   - Output:
     - Candidate FCF JSON.
     - `parseConfidence` score.
     - Ambiguity notes.

4. Backend runs the **FCF rules engine** to validate the candidate JSON.
   - If invalid or incomplete, system may run a **repair pass** (same Extraction Agent with validation errors and hints).
5. Parsed fields are shown in a confirmation form where the user can adjust:
   - Feature type.
   - Datums and material conditions.
   - Modifiers.
   - Tolerance value and diameter flag.
   - Pattern and size data.
6. Once the user confirms:
   - Canonical FCF JSON is finalized and stored.
   - Calculation engine computes numeric values.
   - Interpretation and Combined Agents are triggered.
   - QA Agent reconciles final outputs.

### 6.2 User‑Facing Output

The final explanation (after multi‑agent QA) must cover:

- Controlled characteristic and feature(s).
- Tolerance zone shape and size, with units.
- Effect of MMC/LMC/RFS (bonus tolerance, virtual condition).
- Datum reference frame behavior and constrained degrees of freedom.
- Feature‑type implications (internal vs external, slot vs cylinder, pattern, etc.).
- A concise summary suitable for non‑experts, plus an optional “expert detail” section.

### 6.3 Error Handling

- Show clear inline errors when:
  - Extracted FCF JSON violates rules engine constraints.
  - Image quality is insufficient (`parseConfidence` below threshold).
- Provide actionable suggestions:
  - Ask user to re‑upload clearer image.
  - Allow manual corrections to fields.
- For AI/API failures:
  - Present user with status and a retry option.
  - Log failures with correlation IDs for debugging.

---

## 7. Mode 2 – FCF Builder (Form‑Based)

### 7.1 Layout & Sections

Component: **Feature Control Frame Builder**

1. **Characteristic Symbol Selection**
   - Grid of GD&T icons (position, flatness, perpendicularity, profile, etc.).
   - Selection determines which controls are enabled (e.g., datums allowed/required, modifiers allowed).

2. **Tolerance Zone Definition**
   - Diameter toggle (only where valid).
   - Tolerance numeric value (unit‑aware).
   - Material condition modifier dropdown (RFS, MMC, LMC) with rules‑based validation.

3. **Datum Reference Frame**
   - Primary, Secondary, Tertiary dropdowns (A, B, C, …).
   - Material condition per datum reference (RFS/MMB/LMB).
   - No duplicates; enforce rules for minimum/maximum datums per characteristic.

4. **Feature Type Selection**
   - Internal hole, external shaft, slot, tab, plane, boss/pin, pattern, other (free text).
   - Used by interpreter and validation rules.

5. **Advanced Options**
   - Projected tolerance zone (checkbox + height when enabled).
   - Composite FCF (placeholder for future extension; `composite` field exists in JSON but is constrained for v1).

6. **Live Preview**
   - SVG rendering of FCF (e.g., `| ⌖ | ⌀0.7 M | A | B | C |`).
   - Inline error/warning icons surfaced from rules engine.

7. **Export / Actions**
   - Save FCF to a project.
   - Export PNG/SVG/JSON.

### 7.2 Validation Rules (Examples)

- Reject MMC or LMC for form controls without size features (e.g., flatness).
- Require at least one datum for position.
- Disallow datums for pure form tolerances.
- Enforce correct use of diameter symbol (e.g., required for cylindrical zones where applicable).
- Composite position:
  - Top segment controls pattern relative to datums.
  - Bottom segment controls intra‑pattern refinement (future extension).

---

## 8. Interpretation & Calculators

### 8.1 Interpretation Agent Requirements

Input:

- Validated FCF JSON.
- Deterministic calculation outputs (bonus tolerance, virtual condition, pass/fail rules, etc.).

Behavior:

- Generate a detailed, standards‑aligned explanation that:
  - Uses correct GD&T terminology.
  - References the numeric values and equations from the deterministic engine.
  - Clearly separates assumptions from results.
- Provide sections:
  - Tolerance zone.
  - Datums and precedence.
  - Material condition effects.
  - Measurement setup guidance.
  - Calculations and pass/fail rule explanation (if measurement inputs are present).

### 8.2 Calculators

All calculators share:

- Explicit list of assumptions (e.g., perfect gaging, default temperature, free‑state unless specified).
- Equations rendered consistently with numeric examples.
- Results presented in current unit system with optional dual display.

**Required calculators (v1):**

1. **Position at MMC**
   - Inputs:
     - FCF JSON (with MMC on feature where applicable).
     - Nominal size, MMC size, measured actual size.
     - Measured location deviation (radial or equivalent).
   - Calculations:
     - Bonus tolerance: `bonus = abs(actual_size − MMC_size)`.
     - Effective position tolerance: `T_eff = T_geo_MMC + bonus`.
     - Pass/fail rule for cylindrical position: `radial_location_error ≤ T_eff / 2`.
   - Output:
     - Pass/fail result.
     - All intermediate values.

2. **Flatness**
   - Inputs:
     - Flatness tolerance value.
     - Measured variation.
   - Output:
     - Pass/fail plus explanation of flatness zone.

3. **Perpendicularity**
   - Inputs:
     - Perpendicularity tolerance.
     - Datum references.
     - Measured angular or positional deviation.
   - Output:
     - Pass/fail with description of orientation zone.

4. **Profile of a Surface**
   - Inputs:
     - Profile tolerance.
     - Measured deviation data (simplified numeric input).
   - Output:
     - Pass/fail + explanation of profile zone.

---

## 9. Multi‑Agent ChatGPT Architecture

### 9.1 Agent Roles

The AI layer uses **four logical agents** (implemented as separate ChatGPT calls with distinct prompts):

1. **Extraction Agent**
   - Input: raw user input (image URL and/or transcribed text).
   - Task: produce candidate FCF JSON + notes + `parseConfidence`.
   - Primary use: Mode 1 (image), also capable of text‑only FCF strings.

2. **Interpretation Agent**
   - Input:
     - Validated FCF JSON.
     - Deterministic calculation outputs.
   - Task: generate the main explanation and calculator narrative, consistent with numeric results.

3. **Combined Extract+Interpret Agent**
   - Input: same as Extraction Agent.
   - Task:
     - Infer FCF JSON.
     - Produce explanation in a single pass.
   - Purpose: independent second opinion against the extraction → interpretation pipeline.

4. **QA / Adjudicator Agent**
   - Inputs:
     - Extraction Agent output (JSON + notes).
     - Interpretation Agent output.
     - Combined Agent output (JSON + explanation).
     - Validation errors (if any) from rules engine.
     - Numeric results from calculation engine.
   - Tasks:
     - Compare Extraction vs Combined JSON.
     - Check explanations against rules engine and numeric results.
     - Decide:
       - Final canonical FCF JSON (or flag uncertainty).
       - Final explanation text.
       - Confidence score (e.g., high/medium/low).
       - Warning notes for the user.

### 9.2 Orchestration Flow – Image Case (Mode 1)

1. User submits image.
2. Backend triggers in parallel:
   - Extraction Agent.
   - Combined Agent.
3. Backend runs rules engine on Extraction Agent’s JSON.
4. Interpretation Agent runs on validated Extraction JSON + calc outputs.
5. QA Agent receives all outputs + deterministic checks and produces:
   - Final FCF JSON.
   - Final explanation.
   - Confidence + warnings.
6. UI shows:
   - Final answer with confidence indicator.
   - Summary of reasoning (high‑level).
   - Option to edit JSON/fields or override.

### 9.3 Orchestration Flow – Builder Case (Mode 2)

1. User builds FCF via Builder form.
2. Rules engine validates FCF JSON.
3. Calculation engine computes numeric results.
4. Interpretation Agent generates explanation.
5. QA Agent:
   - Optionally runs Combined Agent on a synthetic text rendering of the FCF.
   - Validates Interpretation output against rules/calcs.
   - Returns final explanation + confidence.

---

## 10. Calculation & Rules Engine

### 10.1 Responsibilities

A deterministic engine is responsible for:

- **Validation** of FCF JSON against core ASME Y14.5 constraints, including:
  - Which characteristics permit modifiers.
  - When datums are allowed/required.
  - Composite position constraints.
  - Correct usage of diameter and material condition symbols.
- **Computation** of numeric results:
  - Bonus tolerance: `bonus = abs(actual_size − MMC_size)`.
  - Effective position tolerance: `T_eff = T_geo_MMC + bonus`.
  - Pass/fail rule for cylindrical position:
    - `radial_location_error ≤ T_eff / 2`.
  - Additional computations for flatness, perpendicularity, profile, etc.

All numeric outputs are treated as **ground truth**. LLM‑generated content must not contradict these; QA Agent flags and resolves inconsistencies.

### 10.2 Error Codes

Standardized error codes surface in the UI and are passed into agent contexts, e.g.:

- `E001`: MMC not permitted for this characteristic.
- `E002`: Datums not allowed for this form tolerance.
- `E003`: Primary datum missing for position.
- `E004`: Invalid composite FCF configuration.
- `E005`: Incompatible modifiers for selected feature type.

UI must display:

- Human‑readable message.
- Error code.
- Suggested fix.

---

## 11. Frontend, Backend, and Data Model

### 11.1 Frontend & UX

**Tech Stack**

- Next.js 15 (App Router, Server Actions).
- TypeScript.
- Tailwind CSS + shadcn/ui + lucide-react.
- Vitest + React Testing Library.

**Key Routes**

- `/` – Marketing landing with demo FCF and CTA.
- `/app` – Authenticated shell with sidebar navigation.
- `/app/builder` – FCF Builder (Mode 2).
- `/app/interpreter` – Paste/load FCF JSON, run interpreters and calculators.
- `/app/image-interpreter` – Image upload + AI extraction & interpretation (Mode 1).
- `/app/projects` – Project list with search & tags.
- `/app/projects/[id]` – Project detail with linked FCFs and measurements.
- `/app/settings` – Units, decimals, dual display, profile.

**Core UI Components (shadcn/ui)**

- `FcfBuilderPanel`, `FcfPreview`, `FcfExportBar`.
- `InterpreterForm`, `CalcResults`, `ValidationHint`.
- `ImageUploadPanel` with upload status and preview.
- `ProjectList`, `ProjectDetail`, `RecordCard`.
- `UnitControls`, `MetricsBar`, `Toaster`.

### 11.2 Backend & APIs

**Core APIs**

- `POST /api/ai/extract-fcf`
  - Input: `{ imageUrl?: string, text?: string, hints?: { featureType?: string, standard?: 'ASME_Y14_5_2018' } }`
  - Output: `{ fcf: FcfJson, parseConfidence: number, notes?: string[] }`

- `POST /api/ai/interpret-fcf`
  - Input: `{ fcf: FcfJson, measurements?: any }`
  - Output: `{ explanation: string, calculations: any, passFail?: boolean }`

- `POST /api/ai/combined-fcf`
  - Input: `{ imageUrl?: string, text?: string }`
  - Output: `{ fcf: FcfJson, explanation: string, parseConfidence: number }`

- `POST /api/ai/qa-fcf`
  - Input: outputs of the three agents + rules/calcs summary.
  - Output: `{ finalFcf: FcfJson, explanation: string, confidence: 'high' | 'medium' | 'low', warnings?: string[] }`

- `POST /api/fcf/interpret`
  - Public app endpoint orchestrating the above and returning QA Agent result.

- `POST /api/fcf/export`
  - Input: `{ fcf: FcfJson, format: 'png' | 'svg' }`
  - Output: `{ url: string, json: FcfJson }`

- `POST /api/projects` (CRUD)
  - Projects, FCF records, measurements.

- `POST /api/upload`
  - Generate signed URL, persist file metadata; link to project.

### 11.3 Data Model (Postgres)

- `projects`
  - `id`, `user_id`, `name`, `tags text[]`, `created_at`.

- `fcf_records`
  - `id`, `project_id`, `name`, `fcf_json jsonb`, `created_at`.

- `measurements`
  - `id`, `fcf_record_id`, `inputs_json jsonb`, `results_json jsonb`, `created_at`.

- `user_settings`
  - `user_id` (PK), `unit` ('mm'|'in'), `decimals` (1–4), `dual` boolean, `updated_at`.

RLS policies restrict all tables to `auth.uid()`.

---

## 12. Non‑Functional Requirements

### 12.1 Performance

- First Contentful Paint on desktop (`/app`) ≤ 2.0 s P90.
- Live FCF preview update ≤ 50 ms P90 for user input changes.
- `/api/fcf/interpret` latency ≤ 400 ms P90 at 1 req/s per user (assuming warm models and stable network).

### 12.2 Reliability

- Retry transient AI/API errors with exponential backoff.
- Log fails with correlation IDs, including agent inputs/outputs (user‑scoped, no PII).
- Capture minimal telemetry:
  - `builder_open`, `export_success`, `interpret_run`, `project_save`, `unit_change`.

### 12.3 Security & Privacy

- RLS on all tables.
- Private file storage with signed URLs.
- No storage of raw CAD geometry beyond file metadata.
- Role‑based access if/when team workspaces are added (future).

### 12.4 Accessibility

- Keyboard navigable, proper focus order.
- ARIA labels on all interactive controls.
- High contrast mode compatibility.
- Assistive text for GD&T icons and FCF previews.

---

## 13. Release Plan & Acceptance Criteria (v1)

### 13.1 Key Flows to Validate

1. **Build & Export FCF**
   - User builds and exports an FCF (PNG and SVG) and copies JSON in under 2 minutes.

2. **Interpret FCF JSON**
   - User pastes valid FCF JSON, runs interpreter, and sees:
     - Tolerance zone description.
     - Datums and precedence.
     - Material condition effects.
     - Measurement setup guidance.
     - Calculations and pass/fail result (if measurements provided).

3. **Image‑based Interpretation**
   - User uploads an FCF screenshot; system returns an explanation and canonical FCF JSON with confidence and warnings.

4. **Calculators**
   - Position at MMC with bonus tolerance working correctly vs test table.
   - Flatness, perpendicularity, and profile calculators return correct pass/fail for test cases.

5. **Units & Precision**
   - Unit toggle and decimal precision propagate across builder, interpreter, tables, and exports in real time.

6. **Security**
   - RLS prevents cross‑user access to projects, FCFs, and uploads.
   - Private bucket blobs are only accessible via signed URLs.

7. **Performance**
   - `/api/fcf/interpret` meets latency target on test environment.

### 13.2 Launch Criteria

- All acceptance tests above pass.
- No open P0/P1 bugs.
- At least N representative FCF cases validated by a GD&T SME (including edge cases).

---

## 14. Risks & Mitigations

- **Risk: AI Hallucinations / Standards Violations**
  - Mitigation: Deterministic rules & computation engine is the single source of truth; QA agent checks all text against numeric and rules context.

- **Risk: Ambiguous or Poor‑Quality Images**
  - Mitigation: Confidence scoring, clear user warnings, and strong manual editing flows.

- **Risk: Performance & Cost**
  - Mitigation: Aggressive caching of common prompts; rate limiting; observability for AI spend.

- **Risk: Standards Drift**
  - Mitigation: Explicit tagging of standard version (ASME Y14.5‑2018); future standards isolated by config.

---

## 15. Open Questions / Future Extensions

- Support for richer **composite FCFs** and multi‑segment patterns.
- “Teacher mode” that explains why certain FCF setups are invalid and suggests better alternatives.
- **Multi‑standard** support (e.g., ISO GPS).
- Batch interpretation of many FCFs at once (CSV/JSON import).
- Integration paths for CMM software or PLM/ERP systems.
- Enterprise‑grade features: SSO, audit logs, workspace‑level permissions.

---

## 16. Glossary (Abbreviated)

- **FCF** – Feature Control Frame.
- **GD&T** – Geometric Dimensioning and Tolerancing.
- **MMC/LMC/RFS** – Maximum Material Condition, Least Material Condition, Regardless of Feature Size.
- **MMB/LMB** – Maximum/Least Material Boundary (for datum features).
- **ASME Y14.5‑2018** – Standard for Dimensioning and Tolerancing.
- **RLS** – Row‑Level Security.
