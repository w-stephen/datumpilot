/**
 * AI Provider Prompts - Centralized prompt management
 *
 * Contains the system prompts and reference content for the Explanation Agent.
 * GDT_REFERENCE_CONTENT is optimized for Anthropic's prompt caching (>1024 tokens).
 */

export const PROMPT_VERSION = "v1.2.0";

// ---------------------------------------------------------------------------
// GD&T Reference Content (Cacheable)
// ---------------------------------------------------------------------------

/**
 * ASME Y14.5-2018 GD&T reference material for prompt caching.
 * This content is >1024 tokens and will be cached by Anthropic's API
 * to reduce costs on repeated calls.
 */
export const GDT_REFERENCE_CONTENT = `
# ASME Y14.5-2018 GD&T Reference Guide

## Geometric Characteristics

### Form Controls
- **Flatness (⏥)**: Controls how flat a surface must be. No datums required. Tolerance zone is the space between two parallel planes.
- **Straightness (—)**: Controls how straight a line element or axis must be. Applied to surfaces or axes.
- **Circularity (○)**: Controls how round a circular cross-section must be. Measured in a plane perpendicular to the axis.
- **Cylindricity (⌭)**: Controls the form of a cylindrical surface. Combines circularity, straightness, and taper.

### Orientation Controls
- **Perpendicularity (⊥)**: Controls how perpendicular a surface, axis, or center plane is to a datum. Requires at least one datum reference.
- **Angularity (∠)**: Controls the orientation of a surface at a specified angle to a datum.
- **Parallelism (∥)**: Controls how parallel a surface or axis is to a datum plane or axis.

### Location Controls
- **Position (⌖)**: Controls the location of a feature of size relative to datums. The most common GD&T control.
- **Concentricity (◎)**: Controls how closely the axis of a feature coincides with a datum axis. Rarely used; replaced by position in most cases.
- **Symmetry (⌯)**: Controls how symmetrical a feature is about a datum center plane. Also rarely used.

### Profile Controls
- **Profile of a Line (⌒)**: Controls the form of a 2D line element on a surface.
- **Profile of a Surface (⌓)**: Controls the 3D form of a surface. Can be used with or without datums.

### Runout Controls
- **Circular Runout (↗)**: Controls cumulative variation of circularity and coaxiality for a surface of revolution about a datum axis.
- **Total Runout (↗↗)**: Controls all surface elements simultaneously as the part is rotated about a datum axis.

## Material Condition Modifiers

### Maximum Material Condition (MMC) - Ⓜ
- Applied to features of size only
- For external features (shaft): largest size (maximum material)
- For internal features (hole): smallest size (maximum material)
- Allows bonus tolerance as feature departs from MMC
- Virtual condition = MMC size ± geometric tolerance

### Least Material Condition (LMC) - Ⓛ
- Applied to features of size only
- For external features (shaft): smallest size (least material)
- For internal features (hole): largest size (least material)
- Allows bonus tolerance as feature departs from LMC
- Used when maintaining minimum wall thickness is critical

### Regardless of Feature Size (RFS)
- Default condition when no modifier is specified
- Geometric tolerance applies at any produced size
- No bonus tolerance available
- Most restrictive but simplest to inspect

## Datum Reference Frame (DRF)

### Datum Precedence
- **Primary datum**: First contact, constrains 3 degrees of freedom (typically a plane)
- **Secondary datum**: Second contact, constrains 2 degrees of freedom (typically perpendicular to primary)
- **Tertiary datum**: Third contact, constrains 1 degree of freedom (completes the reference frame)

### Datum Features
- Actual surfaces or features used to establish datums
- Datums are theoretical exact points, axes, or planes derived from datum features
- Datum feature simulator: Perfect geometric counterpart of datum feature at MMC/LMC

### Material Boundary Modifiers for Datums
- **Ⓜ on datum**: Datum established at virtual condition (MMC boundary)
- **Ⓛ on datum**: Datum established at LMC boundary
- **No modifier**: Datum established regardless of feature size (RFS)

## Tolerance Zones

### Cylindrical Tolerance Zone
- Used for position of holes and pins
- Diameter specified with ⌀ symbol
- Feature axis must lie within the cylinder

### Parallel Planes Tolerance Zone
- Used for flatness, parallelism, perpendicularity of surfaces
- Two parallel planes separated by tolerance value
- Surface must lie between the planes

### Spherical Tolerance Zone
- Used for position of spherical features
- Specified with S⌀ symbol

## Calculations

### Position Tolerance (Holes at MMC)
- Actual Position Deviation = √[(Δx)² + (Δy)²] × 2
- Bonus Tolerance = Actual Size - MMC Size (when Ⓜ specified)
- Total Available Tolerance = Specified Tolerance + Bonus Tolerance
- Feature PASSES if Actual Deviation ≤ Total Available Tolerance

### Virtual Condition
- For external feature at MMC: Virtual Condition = MMC + Geometric Tolerance
- For internal feature at MMC: Virtual Condition = MMC - Geometric Tolerance
- For external feature at LMC: Virtual Condition = LMC - Geometric Tolerance
- For internal feature at LMC: Virtual Condition = LMC + Geometric Tolerance

### Flatness
- Measure multiple points across surface
- Calculate total variation (max - min)
- Feature PASSES if variation ≤ specified tolerance

### Perpendicularity
- Measured deviation from perfect 90° to datum
- For surfaces: zone between two parallel planes perpendicular to datum
- For axes: cylindrical zone (if ⌀ specified) centered on theoretical true position
`.trim();

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

export const EXPLANATION_SYSTEM_PROMPT = `
You are an engineering GD&T explainer for DatumPilot.
You receive validated FCF JSON and optionally authoritative calculation outputs.

Hard rules:
- If CalcResult is provided, use EXACT numbers, units, and pass/fail flags; never recompute or adjust.
- If CalcResult is NOT provided, explain what the FCF specification means and how it would be measured.
- If ValidationResult has any errors, return the blocking message instead of an explanation.
- If ValidationResult has warnings, surface them verbatim as warnings.
- Keep terminology ASME Y14.5-2018 consistent.
- Respond with EXACTLY one JSON object matching the shape below. No prose, no code fences.
- Do not alter FCF JSON, CalcResult, or units.

Expected output shape (no comments):
{
  "explanation": "string",
  "warnings": ["string"]
}
`.trim();

// ---------------------------------------------------------------------------
// User Prompt Builder
// ---------------------------------------------------------------------------

export interface ExplanationPromptInput {
  fcfJson: string;
  validationResult: string;
  calcResult?: string;
  format?: "markdown" | "plain";
}

export function buildExplanationUserPrompt(input: ExplanationPromptInput): string {
  const { fcfJson, calcResult, validationResult, format } = input;

  const hasCalcResult = calcResult && calcResult !== "null" && calcResult !== "undefined";

  const calcSection = hasCalcResult
    ? `CalcResult (authoritative; use these numbers verbatim):
${calcResult}

Sections to include:
- Summary: what is controlled and tolerance zone shape/size.
- Datums & precedence: how the DRF constrains the part.
- Material condition effects: MMC/LMC/RFS and bonus/virtual condition (if applicable).
- Measurement guidance: how to verify conformance using the provided numbers.
- Calculations: restate key numbers from CalcResult; do not derive new ones.
- Warnings: list any validation warnings.`
    : `CalcResult: Not provided (specification-only mode).

Sections to include:
- Summary: what geometric characteristic is controlled and tolerance zone shape/size.
- Datums & precedence: how the Datum Reference Frame constrains the part.
- Material condition effects: explain MMC/LMC/RFS effects and bonus tolerance potential (if applicable).
- Measurement guidance: describe how this tolerance would be measured/verified.
- Practical interpretation: what does this tolerance mean for manufacturing and inspection.
- Warnings: list any validation warnings.`;

  return `
Provide a constrained GD&T explanation.

Output format: ${format ?? "markdown"}

FCF JSON (validated):
${fcfJson}

ValidationResult (authoritative):
${validationResult}

${calcSection}

Response rules:
- If validationResult.summary.errorCount > 0, respond with:
  {"explanation":"Cannot explain until validation errors are fixed.","warnings":[...all error messages]}
- Otherwise, respond with one JSON object: {"explanation": "...", "warnings": [...validation warnings if any]}
- No prose, no code fences.
`.trim();
}

// ---------------------------------------------------------------------------
// Version Changelog
// ---------------------------------------------------------------------------

export const PROMPT_VERSION_NOTES = `
Changelog:
- v1.2.0: Added GDT_REFERENCE_CONTENT for Anthropic prompt caching; provider abstraction
- v1.1.0: Removed extraction prompts (image extraction removed for v1 launch)
- v1.0.1: Initial 2-agent stack prompts
`;
