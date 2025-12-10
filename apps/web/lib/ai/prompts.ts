// Prompt templates for the Explanation Agent.
// Keep this module lean so it can be imported by route handlers or server actions.

export const promptVersion = "v1.1.0";

// ---------------------------------------------------------------------------
// Explanation Agent
// ---------------------------------------------------------------------------

export const explanationSystemPrompt = `
You are an engineering GD&T explainer.
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
`;

type ExplanationUserTemplateInput = {
  fcfJson: string; // stringified FcfJson
  calcResult?: string; // stringified CalcResult (optional)
  validationResult: string; // stringified ValidationResult
  format?: "markdown" | "plain";
};

export function buildExplanationUserPrompt(input: ExplanationUserTemplateInput) {
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
`;
}

// ---------------------------------------------------------------------------
// Versioning Notes
// ---------------------------------------------------------------------------

export const promptVersioningNotes = `
- Tag every prompt change with a semantic version (promptVersion) and surface it in logs/telemetry.
- Store prompts in this module only; avoid duplication in route handlers.
- Keep a short changelog entry alongside promptVersion when edits ship.
- When changing output shapes, bump a minor/major version and gate downstream parsing by version.

Changelog:
- v1.1.0: Removed extraction prompts (image extraction removed for v1 launch)
- v1.0.1: Initial 2-agent stack prompts
`;
