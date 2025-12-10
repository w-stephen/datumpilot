import { chatJson } from "./openaiClient";
import { buildExplanationUserPrompt, explanationSystemPrompt, promptVersion } from "./prompts";
import { ExplanationAgentRequest, ExplanationAgentResponse } from "./types";

/**
 * Calls the Explanation Agent to produce a constrained narrative
 * using authoritative validation + calculation outputs.
 */
export async function runExplanationAgent(
  request: ExplanationAgentRequest
): Promise<ExplanationAgentResponse> {
  const { fcf, calcResult, validation, format } = request;

  const userPrompt = buildExplanationUserPrompt({
    fcfJson: JSON.stringify(fcf, null, 2),
    calcResult: calcResult ? JSON.stringify(calcResult, null, 2) : undefined,
    validationResult: JSON.stringify(validation, null, 2),
    format
  });

  const response = await chatJson<ExplanationAgentResponse>(
    [
      { role: "system", content: explanationSystemPrompt.trim() },
      { role: "user", content: userPrompt.trim() }
    ],
    { model: "gpt-5.1", temperature: 0 }
  );

  return { ...response, warnings: response.warnings ?? [], promptVersion };
}
