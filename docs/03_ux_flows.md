# DatumPilot – IA & UX Flows

## 1) Information Architecture (App Routes)
- `/app` – Authenticated shell dashboard; quick links to builder, interpreter modes, recent projects; status/toast area.
- `/app/builder` – Mode 2 form-based FCF Builder; sections: feature type selection, characteristic selection, tolerance zone (with auto-diameter for cylindrical features), size dimension input (symmetric/asymmetric/limits notation), datums, frame modifiers, name & notes, live SVG preview, validation hints, save/export bar.
- `/app/interpreter` – JSON interpreter + calculators; sections: JSON input/loader, validation results, explanation, calculators (position @ MMC, flatness, perpendicularity, profile), export/copy panel.
- `/app/image-interpreter` – Mode 1 image/PDF interpretation; sections: upload/paste area with status, extracted fields form, validation errors, confidence/warnings, final explanation, save/export controls.
- `/app/projects` – Project list; search/filter by name/tag, cards with counts (FCFs, measurement runs, uploads), create project CTA.
- `/app/projects/[id]` – Project detail; sections: project header (name/tags/actions), FCF records list (open in builder/interpreter), measurement runs list/detail, linked uploads (STEP/CSV metadata), exports access, activity/log.
- `/app/settings` – User settings; units (mm/inch), decimals (1–4), dual display toggle, profile basics, auth/session info.

## 2) User Flows

### Mode 1 – Image Interpretation
1. Navigate to `/app/image-interpreter` from shell or CTA.
2. Upload/paste image/PDF snippet; see upload progress; stored privately.
3. System runs the Extraction Agent; shows spinner and correlation ID (for support).
4. Extracted fields populate editable form; confidence shown. If low, warning displayed.
5. User reviews/edits fields (characteristic, tolerance, diameter, modifiers, datums, pattern, size, feature type).
6. Validation runs; inline errors with codes must be resolved; user retries if needed.
7. On confirm, canonical FCF JSON saved with `source=inputType:image`; calculation engine computes; Explanation Agent runs.
8. Final explanation + derived confidence/warnings displayed; user can copy JSON/explanation or save to project (select/create).
9. User exports PNG/SVG/JSON as needed; return/back to previous route preserves unsaved edits until cleared or saved.

### Mode 2 – FCF Builder
1. Navigate to `/app/builder`.
2. **Select Feature Type first** (hole, pin, slot, boss, plane, surface, edge); this identifies what is being toleranced.
3. Select characteristic icon (position, flatness, perpendicularity, etc.); UI enables relevant fields.
4. Enter tolerance value; for cylindrical features (hole, pin), diameter zone is auto-selected for position tolerance.
5. Choose material condition (MMC, LMC, RFS) if applicable; validation hints appear in real time.
6. For Features of Size (hole, pin, boss, slot): enter size dimension using symmetric (±), asymmetric (+/-), or limits notation; MMC/LMC values are correctly calculated based on feature type (internal vs external).
7. Select datums (primary/secondary/tertiary) with material conditions; prevent duplicates/invalid combos.
8. Optionally enable frame modifiers (projected zone, composite, etc.).
9. Live SVG preview updates per change; errors block save/export.
10. Save FCF to project (select/create); persisted with `source=inputType:builder`.
11. Export PNG/SVG/JSON when valid; toasts confirm success.
12. Navigate away/back retains current draft until cleared or saved.

### JSON Interpreter + Calculators
1. Navigate to `/app/interpreter`.
2. Paste/load FCF JSON from project or file; schema validation runs immediately.
3. If invalid, inline errors with codes/hints; user edits JSON or reloads.
4. On valid JSON, deterministic calculations run; Explanation Agent produces explanation and confidence is derived from validation (and parseConfidence=1 for builder/JSON paths).
5. Calculators show results (pass/fail, intermediates) using current unit/precision; user can adjust measurement inputs and rerun.
6. User saves the FCF record and measurement run to a project; can export/copy JSON/explanation.
7. Navigation away warns on unsaved measurement inputs; back returns to last loaded FCF state.

### Projects & Measurements
1. Navigate to `/app/projects`.
2. Search/filter projects; select one to open `/app/projects/[id]`.
3. In project detail, view FCF records list; open an FCF in builder/interpreter preloaded with stored JSON.
4. View measurement runs list; select a run to see inputs/results; optionally add a new run linked to an FCF.
5. Manage uploads (STEP/CSV metadata) via add/remove; downloads via signed URL.
6. Edit project metadata (name/tags); deletion prompts confirmation and handles linked items per retention policy.
7. Breadcrumbs/back keep search/filter context; returning from child pages preserves project view state.

### Settings (Units & Precision)
1. Navigate to `/app/settings`.
2. Set units (mm/inch), decimals (1–4), and dual-display toggle; changes persist to `user_settings`.
3. On save, global state updates; builder/interpreter/calculators/export reflect new settings.
4. Navigate away; settings persist; toasts confirm changes or errors if invalid.

## 3) State & Navigation Notes
- Global state: auth/session; units (mm/inch), decimals, dual display; active project selection (optional); correlation ID for AI runs.
- FCF draft state (builder/image): feature type, characteristic, tolerance (value, diameter zone, material condition), size dimension (nominal, tolerancePlus, toleranceMinus, notation mode), modifiers, datums, pattern, advanced options; retain on route change until saved/cleared.
- Validation state: error codes and messages; should block finalize/export; displayed inline near offending fields.
- Confidence state: derived from parseConfidence (image mode) + validation cleanliness (`high|medium|low`); drives warnings/UI emphasis.
- Measurement state: inputs, computed results, pass/fail, linked FCF/project; warn on unsaved changes when navigating away.
- Navigation behaviors: 
  - Back/Cancel returns to prior route without losing unsaved form state unless explicitly cleared.
  - Save actions require valid state; disable buttons when invalid.
  - New project/FCF/measurement opens modal or inline form; on complete, return to originating context.
  - Preserve list filters/search on projects when returning from detail pages.
  - Exports and uploads use signed URLs; ensure download actions don’t break history.

## 4) UX Risks / Hot Spots
- Low-confidence or conflicting AI outputs: need clear warnings, editable fields, and a trusted "finalize" step tied to deterministic validation.
- Validation UX: complex GD&T rules (datums, modifiers, diameter) may confuse; inline hints and examples may be necessary.
- Size dimension notation: users may be familiar with different conventions (symmetric ±, asymmetric +/-, limits); the toggle accommodates all styles but conversions between notations need clear feedback.
- MMC/LMC interpretation: internal features (holes, slots) have opposite MMC/LMC from external features (pins, bosses); the UI must clearly show which applies and auto-calculate correctly.
- Performance expectations: live preview ~50 ms and `/api/fcf/interpret` P90 400 ms—prototype to ensure responsiveness with AI in the loop.
- Units/precision propagation: risk of mismatched displays between UI and exports; require consistent formatting utilities.
- File upload edge cases: PDF/image clarity, supported MIME types, retries, and private URL handling need clear feedback.
- State retention: drafts across routes risk stale or unintended persistence; define explicit "clear/reset" behaviors.
