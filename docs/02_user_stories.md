# Datum Pilot – User Stories (v1)

## Design Engineer

### DE1 – Mode 1 Image Interpretation (Priority: Must, Phase: Core Build)
As a design engineer, I want to upload or paste an FCF screenshot/PDF snippet, review parsed fields, and receive a validated explanation plus canonical FCF JSON so that I can quickly understand supplier drawings.

Acceptance Criteria:
- Given a supported file (PNG/JPG/PDF snippet), when I submit it, the system stores it in private storage and generates a signed URL for AI extraction.
- When extraction returns `parseConfidence` below the threshold, I see a warning and can either re-upload or proceed to manual corrections.
- When validation fails, I see inline errors with standard codes (e.g., E001–E005) and cannot finalize until corrected.
- After I confirm or edit fields, the canonical FCF JSON is saved with `source.inputType = "image"`, an explanation is shown, and confidence/warnings are displayed.
- If agents disagree with deterministic calculations, the QA step flags the discrepancy and surfaces warnings before completion.

### DE2 – FCF Builder with Validation & Live Preview (Priority: Must, Phase: Core Build)
As a design engineer, I want a guided builder with standards-aware controls and live SVG preview so that I can create ASME Y14.5-2018 compliant FCFs without errors.

Acceptance Criteria:
- When I select a characteristic that requires datums (e.g., position) and omit them, I receive a blocking validation error.
- Invalid combinations (e.g., MMC on flatness, duplicate datums) surface error codes and block save/export.
- Live SVG preview updates within an acceptable latency target (~50 ms P90) as I change fields and reflects diameter/modifiers/datums.
- Save/export actions are disabled until validation passes against the rules engine.
- Advanced options allow projected tolerance zone (with required height) and restrict composite to null/simple placeholder for v1.

### DE3 – Export FCF (PNG/SVG/JSON) (Priority: Must, Phase: Core Build)
As a design engineer, I want to export the FCF I built as PNG, SVG, or JSON so that I can share or reuse it in downstream tools.

Acceptance Criteria:
- When the builder is valid, I can export PNG via server-side rasterization of the SVG preview and download the file.
- SVG export matches the on-screen preview, including symbols, diameter, modifiers, and datums.
- JSON export matches the canonical schema, includes `source.inputType = "builder"`, and is human-readable.
- Unit, precision, and dual-display settings are reflected in all exports.
- Exported files use signed URLs and are inaccessible to unauthorized users.

### DE4 – Units & Precision Controls (Priority: Should, Phase: Core Build)
As a design engineer, I want to set units (mm/inch), decimal precision (1–4), and optional dual display so that builder, interpreter, calculators, and exports respect my preferences.

Acceptance Criteria:
- I can change units, decimals, and dual-display in settings; values persist to `user_settings` and default to mm/primary with 1–4 decimals allowed.
- Changing settings updates builder preview, interpretation text, and calculator outputs without data loss.
- Exports (PNG/SVG/JSON) reflect the active settings.
- Input validation prevents decimals outside 1–4 and rejects unsupported unit combinations.

## Quality / Manufacturing Engineer

### QE1 – Interpret FCF JSON with Calculations (Priority: Must, Phase: Core Build)
As a quality/manufacturing engineer, I want to paste or load FCF JSON and get a validated explanation plus deterministic calculations so that I can trust the pass/fail interpretation.

Acceptance Criteria:
- Pasted/loaded FCF JSON is validated against the schema; invalid fields produce blocking errors with codes and hints.
- On valid input, deterministic calculations (bonus, virtual condition, effective tolerance) run before AI, and the explanation references those numeric results.
- When measurement inputs are provided, pass/fail status and intermediate values are displayed for the relevant calculator.
- If the interpretation text conflicts with rules/calculations, QA marks confidence as medium/low and surfaces warnings.
- Users can copy/download the final JSON and explanation for documentation.

### QE2 – Calculators (Position @ MMC, Flatness, Perpendicularity, Profile) (Priority: Must, Phase: Core Build)
As a quality/manufacturing engineer, I want calculators for key characteristics so that I can compute pass/fail with clear assumptions.

Acceptance Criteria:
- Position @ MMC computes `bonus = abs(actual_size − MMC_size)` and `T_eff = T_geo_MMC + bonus`; pass when `radial_location_error ≤ T_eff / 2`.
- Flatness, perpendicularity, and profile calculators produce pass/fail and show the tolerance zone description and measured deviation.
- All calculators honor current unit/precision settings and optionally show dual display.
- Missing or invalid measurement inputs show inline errors and block calculation.
- Calculators can be invoked from a stored FCF record without re-entering FCF fields.

### QE3 – Measurement Run Capture (Priority: Should, Phase: Core Build)
As a quality/manufacturing engineer, I want to save measurement inputs and results per FCF so that I can track inspection runs by project.

Acceptance Criteria:
- I can enter measurement inputs for an FCF and save them as a measurement record linked to a project and FCF record.
- Saved records persist both `inputs_json` and `results_json` and are retrievable in project detail.
- Measurement runs list shows timestamped entries; selecting one reveals inputs and computed outputs.
- RLS prevents access to measurement records for other users; unauthenticated calls are rejected.

### QE4 – Multi-Agent QA & Confidence (Priority: Should, Phase: Core Build)
As a quality/manufacturing engineer, I want the system to reconcile multiple AI outputs and surface confidence/warnings so that I know when to trust or override results.

Acceptance Criteria:
- For image/text inputs, the orchestrator runs Extraction and Combined agents in parallel, then Interpretation and QA; sequencing is logged with correlation IDs.
- QA selects or synthesizes a final FCF JSON and explanation, returning confidence (`high|medium|low`) and warnings when discrepancies exist.
- UI displays confidence state and warnings; when confidence is low, editing of fields is offered before finalizing.
- If agents disagree beyond thresholds or fail, the flow surfaces retry guidance and does not present a high-confidence result.

## Project Lead / Technical Manager

### PL1 – Projects CRUD with Tags & Search (Priority: Must, Phase: Core Build)
As a project lead, I want to create, tag, search, and manage projects so that I can organize multiple FCFs and inspection runs by part/line.

Acceptance Criteria:
- I can create, edit, and delete projects with name and optional tags.
- Project list supports search/filter by name or tag and returns only my projects (RLS enforced).
- Project cards show counts of FCF records and measurement runs.
- Deleting a project handles linked records per policy (e.g., soft delete or cascade as defined) and confirms the action.

### PL2 – Project Detail with FCF Records & Measurements (Priority: Should, Phase: Core Build)
As a project lead, I want to view a project with its FCF records and measurement runs so that I can audit and reuse them.

Acceptance Criteria:
- Project detail shows FCF records with ability to open each in builder/interpreter preloaded with stored JSON.
- Measurement runs for each FCF are visible with timestamp and pass/fail summary; selecting shows full details.
- Exports (PNG/SVG/JSON) for each FCF are accessible from the project detail view with signed URLs.
- Navigation back to project list retains search/filter state.

### PL3 – File Uploads for Metadata (STEP/CSV) (Priority: Should, Phase: Core Build)
As a project lead, I want to upload STEP or CSV files for metadata only, linked to a project, so that reference files are stored securely.

Acceptance Criteria:
- Upload accepts only STEP or CSV; unsupported file types are rejected with a clear error.
- Files are stored in a private bucket with signed URLs; metadata (name, size, type, project link) is saved, and no geometry parsing occurs.
- Linked uploads are listed in project detail and can be downloaded via signed URL by the owner only.
- Upload failures surface retry guidance and log correlation IDs.

## Cross-Persona / All Users

### AU1 – Authentication & Data Isolation (Priority: Must, Phase: Discovery/Architecture)
As any user, I want secure authentication and data isolation so that my FCFs, projects, and uploads are not visible to others.

Acceptance Criteria:
- Users sign in via Supabase OAuth or magic link; unauthenticated access to app routes or APIs returns 401/redirect.
- Row-Level Security prevents access to projects, FCF records, measurements, and uploads belonging to other users (validated with automated tests).
- Signed URLs gate access to stored files; access expires and is scoped to the requester.
- Logging and telemetry avoid storing PII beyond necessary auth metadata.

## Gaps / Follow-Ups
- Add explicit accessibility stories (keyboard navigation, ARIA labels, high-contrast support) across builder, interpreter, and upload flows.
- Add observability/telemetry stories for AI latency, error rates, and cost tracking tied to correlation IDs.
- Clarify deletion/retention policy for projects and linked records (hard vs soft delete) and confirm expected UX safeguards.
- Add performance targets as acceptance criteria per route/API (e.g., `/api/fcf/interpret` P90 ≤ 400 ms at 1 req/s, preview update ≤ 50 ms P90).
- Future extensions (explicitly out of v1): richer composite FCF modeling, stack-up analysis, multi-standard support, batch interpretation, enterprise admin/billing, and teacher-mode guidance.
