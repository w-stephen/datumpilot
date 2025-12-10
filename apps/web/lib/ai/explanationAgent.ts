import { generateExplanation, type ExplanationOutput } from "./providers";
import { ExplanationAgentRequest, ExplanationAgentResponse } from "./types";

/**
 * Calls the Explanation Agent to produce a constrained narrative
 * using authoritative validation + calculation outputs.
 *
 * Uses provider abstraction with Claude Opus 4.5 (primary) and
 * OpenAI GPT-4.1 (fallback) with automatic retry and failover.
 */
export async function runExplanationAgent(
  request: ExplanationAgentRequest
): Promise<ExplanationAgentResponse> {
  const { fcf, calcResult, validation, format } = request;

  const result: ExplanationOutput = await generateExplanation({
    fcf,
    validation,
    calculation: calcResult,
    format,
  });

  return {
    explanation: result.explanation,
    warnings: result.warnings,
    promptVersion: result.providerInfo.promptVersion,
    aiMetadata: {
      provider: result.providerInfo.provider,
      model: result.providerInfo.model,
      cacheStatus: result.cacheStatus,
      usage: result.usage,
    },
  };
}
