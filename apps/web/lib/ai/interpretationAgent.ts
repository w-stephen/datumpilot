import { ExplanationAgentRequest, ExplanationAgentResponse } from "./types";

/**
 * Calls the GPT-5.1 Explanation Agent to produce a constrained narrative
 * using authoritative validation + calculation outputs.
 * This placeholder keeps outputs deterministic until the LLM call is wired.
 */
export async function runExplanationAgent(
  request: ExplanationAgentRequest
): Promise<ExplanationAgentResponse> {
  const { fcf, calcResult, validation } = request;
  const warningMessages = validation.warnings.map((issue) => `${issue.code}: ${issue.message}`);

  const explanationLines = [
    `Characteristic: ${fcf.characteristic}`,
    `Stated tolerance: ${calcResult.result.statedTolerance} ${calcResult.result.unit}`,
    `Calculation summary: ${calcResult.result.summary}`,
    warningMessages.length > 0 ? `Warnings: ${warningMessages.join("; ")}` : "Validation clean"
  ];

  return {
    explanation: explanationLines.join("\n"),
    warnings: warningMessages.length > 0 ? warningMessages : undefined
  };
}

// Backwards compatibility for any lingering imports during the 4→2 agent migration.
export const runInterpretationAgent = runExplanationAgent;
