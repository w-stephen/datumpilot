/**
 * AI Provider Abstraction Layer
 *
 * Provides a provider-agnostic interface for AI operations with
 * Claude Opus 4.5 as primary and OpenAI GPT-4.1 as fallback.
 *
 * Usage:
 * ```ts
 * import { generateExplanation } from "@/lib/ai/providers";
 *
 * const result = await generateExplanation({
 *   fcf: fcfJson,
 *   validation: validationResult,
 *   calculation: calcResult,
 * });
 * ```
 */

// Types
export type {
  ProviderType,
  ProviderInfo,
  AIProvider,
  ExplanationInput,
  ExplanationOutput,
  AIErrorCode,
  ProviderConfig,
} from "./types";

export { AIProviderError, DEFAULT_PROVIDER_CONFIG } from "./types";

// Prompts
export { PROMPT_VERSION, GDT_REFERENCE_CONTENT } from "./prompts";

// Factory (main entry point)
export {
  AIProviderFactory,
  getProviderFactory,
  generateExplanation,
} from "./factory";

// Individual providers (for direct access if needed)
export { AnthropicProvider, getAnthropicProvider } from "./anthropic";
export { OpenAIProvider, getOpenAIProvider } from "./openai";
