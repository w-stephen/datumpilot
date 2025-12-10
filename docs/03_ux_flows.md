# DatumPilot – IA & UX Flows (v2.0)

## Document Info
- **Version**: 2.0
- **Last Updated**: December 2025
- **Status**: Approved

---

## 1) Information Architecture (App Routes)

| Route | Purpose |
|-------|---------|
| `/app` | Authenticated dashboard; quick links to builder, interpreter, stack-up analysis, projects |
| `/app/builder` | FCF Builder with live preview and ASME Y14.5 validation |
| `/app/interpreter` | JSON interpreter + calculators for tolerance analysis |
| `/app/stackup` | Stack-up analysis list view |
| `/app/stackup/new` | Create new stack-up analysis (4-step wizard) |
| `/app/stackup/[id]` | View/edit stack-up analysis details |
| `/app/projects` | Project list with search/filter |
| `/app/projects/[id]` | Project detail with FCF records and measurement runs |
| `/app/settings` | User preferences (units, decimals, dual display) |

### What Changed from v1.0

| Original | Current |
|----------|---------|
| `/app/image-interpreter` | Removed (Mode 1 out of v1 scope) |
| — | Added `/app/stackup/*` routes |
| References to parseConfidence | Removed |

---

## 2) User Flows

### FCF Builder (Primary Input Mode)

1. Navigate to `/app/builder` from dashboard or sidebar.
2. **Select Feature Type first** (hole, pin, slot, boss, plane, surface, edge); this identifies what is being toleranced.
3. Select characteristic icon (position, flatness, perpendicularity, etc.); UI enables relevant fields.
4. Enter tolerance value; for cylindrical features (hole, pin), diameter zone is auto-selected for position tolerance.
5. Choose material condition (MMC, LMC, RFS) if applicable; validation hints appear in real time.
6. For Features of Size (hole, pin, boss, slot): enter size dimension using symmetric (±), asymmetric (+/-), or limits notation; MMC/LMC values are correctly calculated based on feature type (internal vs external).
7. Select datums (primary/secondary/tertiary) with material conditions; prevent duplicates/invalid combos.
8. Optionally enable frame modifiers (projected zone, composite, etc.).
9. Live SVG preview updates per change; errors block save/export.
10. Save FCF to project (select/create); persisted with `source_input_type: 'builder'`.
11. Export PNG/SVG/JSON when valid; toasts confirm success.
12. Navigate away/back retains current draft until cleared or saved.

### JSON Interpreter + Calculators

1. Navigate to `/app/interpreter` from dashboard or sidebar.
2. Paste/load FCF JSON from project or file; schema validation runs immediately.
3. If invalid, inline errors with codes/hints; user edits JSON or reloads.
4. On valid JSON, deterministic calculations run; Explanation Agent produces explanation.
5. Confidence is derived from validation cleanliness (no extraction confidence in v1).
6. Calculators show results (pass/fail, intermediates) using current unit/precision; user can adjust measurement inputs and rerun.
7. User saves the FCF record and measurement run to a project; can export/copy JSON/explanation.
8. Navigation away warns on unsaved measurement inputs; back returns to last loaded FCF state.

### Stack-Up Analysis

#### Creating a New Analysis

1. Navigate to `/app/stackup` from dashboard or sidebar.
2. Click "NEW ANALYSIS" button.
3. **Step 1 - Basics**: Enter analysis name, measurement objective, select unit (mm/inch), positive direction.
4. **Step 2 - Dimensions**: Add dimensions to the stack chain:
   - Enter name, nominal value, plus/minus tolerances
   - Toggle sign (+/−) for contribution direction
   - Optionally add Cp value (for Six Sigma), source drawing reference
   - Reorder dimensions via drag-and-drop or up/down buttons
5. **Step 3 - Criteria**: Set acceptance criteria (min/max limits and/or max tolerance), select analysis method (Worst-Case, RSS, Six Sigma).
6. **Step 4 - Review**: Preview calculation results, contribution chart, pass/fail status.
7. Click "CREATE ANALYSIS" to save; redirects to detail view.

#### Viewing/Editing an Analysis

1. Navigate to `/app/stackup` to see list of all analyses.
2. Click a card to open `/app/stackup/[id]` detail view.
3. View results panel with:
   - Pass/fail status with color indicator
   - Nominal result and tolerance range
   - Visual range bar showing result vs acceptance limits
4. View contribution chart showing dimension contributions (Pareto-style).
5. Toggle "Method Comparison" to see results across all three methods.
6. Enter edit mode to:
   - Modify dimensions (add/remove/reorder)
   - Change acceptance criteria
   - Switch analysis method
7. Changes auto-recalculate results in real-time.
8. Actions: Duplicate analysis, Delete analysis (with confirmation).

### Projects & Measurements

1. Navigate to `/app/projects` from dashboard or sidebar.
2. Search/filter projects; select one to open `/app/projects/[id]`.
3. In project detail, view FCF records list; open an FCF in builder/interpreter preloaded with stored JSON.
4. View measurement runs list; select a run to see inputs/results; optionally add a new run linked to an FCF.
5. Manage uploads (exports, STEP/CSV metadata) via add/remove; downloads via signed URL.
6. Edit project metadata (name/tags); deletion prompts confirmation and handles linked items per retention policy.
7. Breadcrumbs/back keep search/filter context; returning from child pages preserves project view state.

### Settings (Units & Precision)

1. Navigate to `/app/settings` from sidebar.
2. Set units (mm/inch), decimals (1–4), and dual-display toggle; changes persist to `user_settings`.
3. On save, global state updates; builder/interpreter/calculators/stack-up/export reflect new settings.
4. Navigate away; settings persist; toasts confirm changes or errors if invalid.

---

## 3) State & Navigation Notes

### Global State
- Auth/session context
- Units (mm/inch), decimals, dual display from user_settings
- Active project selection (optional)
- Correlation ID for AI runs

### FCF Draft State (Builder)
- Feature type, characteristic
- Tolerance (value, diameter zone, material condition)
- Size dimension (nominal, tolerancePlus, toleranceMinus, notation mode)
- Modifiers, datums, pattern, advanced options
- Retain on route change until saved/cleared

### Stack-Up Draft State (New Analysis Wizard)
- Analysis name, measurement objective, unit, direction
- Dimensions array with tolerances and signs
- Acceptance criteria
- Analysis method
- Retain during wizard steps; clear on complete or cancel

### Validation State
- Error codes and messages (E001-E00x)
- Blocks finalize/export when invalid
- Displayed inline near offending fields

### Confidence State (v2.0)
- Derived from validation cleanliness only (`high|medium|low`)
- No parseConfidence in v1 (no image extraction)
- Drives warnings/UI emphasis

### Measurement State
- Inputs, computed results, pass/fail
- Linked FCF/project
- Warn on unsaved changes when navigating away

### Navigation Behaviors
- Back/Cancel returns to prior route without losing unsaved form state unless explicitly cleared
- Save actions require valid state; disable buttons when invalid
- New project/FCF/measurement/analysis opens modal or inline form; on complete, return to originating context
- Preserve list filters/search on projects when returning from detail pages
- Exports use signed URLs; ensure download actions don't break history

---

## 4) UX Risks / Hot Spots

### Validation UX
Complex GD&T rules (datums, modifiers, diameter) may confuse users. Mitigations:
- Inline hints and examples
- Contextual help tooltips
- Clear error codes with explanations

### Size Dimension Notation
Users may be familiar with different conventions (symmetric ±, asymmetric +/-, limits). Mitigations:
- Toggle accommodates all styles
- Conversions between notations show clear feedback
- Visual preview confirms interpretation

### MMC/LMC Interpretation
Internal features (holes, slots) have opposite MMC/LMC from external features (pins, bosses). Mitigations:
- UI clearly shows which applies based on feature type
- Auto-calculate correctly based on internal/external
- Tooltips explain the logic

### Stack-Up Method Selection
Users may not understand differences between Worst-Case, RSS, and Six Sigma. Mitigations:
- Brief description in method selector
- Method comparison view to see all results
- Contribution chart helps identify critical dimensions

### Performance Expectations
- Live preview ~50 ms
- `/api/fcf/interpret` P90 400 ms
- Stack-up calculations synchronous and fast
- AI explanation may add latency (streaming supported)

### Units/Precision Propagation
Risk of mismatched displays between UI and exports. Mitigations:
- Consistent formatting utilities
- Settings apply globally
- Dual display mode for mm/inch comparison

### State Retention
Drafts across routes risk stale or unintended persistence. Mitigations:
- Define explicit "clear/reset" behaviors
- Warn on navigation with unsaved changes
- Auto-save drafts to local storage (optional)

---

## 5) Component Library (Key UI Patterns)

### TechnicalPanel
Container with corner accents and optional label; used throughout for consistent technical aesthetic.

```tsx
<TechnicalPanel label="PANEL.LABEL">
  {children}
</TechnicalPanel>
```

### Status Indicators
- `bg-accent-500` - Valid/active state
- `bg-success-500` - Pass/success
- `bg-error-500` - Fail/error
- `bg-warning-500` - Warning/attention needed

### Action Buttons
Primary action with clipped corners:
```tsx
<button
  className="bg-accent-500 text-slate-950 font-mono text-xs font-semibold"
  style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, ...)' }}
>
  ACTION
</button>
```

### Cards (Quick Actions, Stack-Up, etc.)
Cards with cut corners and hover states; icon + title + description pattern.

---

## 6) Removed from v1 Scope

The following were planned but removed from v1:

| Feature | Reason | Future Status |
|---------|--------|---------------|
| Image/PDF upload | Mode 1 complexity | v2 consideration |
| Extraction Agent | No image input in v1 | v2 consideration |
| parseConfidence field | No extraction confidence | v2 consideration |
| File upload (image/pdf roles) | No image input in v1 | v2 consideration |
