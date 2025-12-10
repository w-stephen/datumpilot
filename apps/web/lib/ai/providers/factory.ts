/**
 * AI Provider Factory with Fallback Support
 *
 * Creates providers based on configuration and handles automatic fallback
 * when the primary provider fails with retryable errors.
 */

import type {
  AIProvider,
  ProviderType,
  ProviderConfig,
  ExplanationInput,
  ExplanationOutput,
} from "./types";
import { AIProviderError, DEFAULT_PROVIDER_CONFIG } from "./types";
import { getAnthropicProvider } from "./anthropic";
import { getOpenAIProvider } from "./openai";

// ---------------------------------------------------------------------------
// Provider Resolution
// ---------------------------------------------------------------------------

function getProviderByType(type: ProviderType): AIProvider {
  switch (type) {
    case "anthropic":
      return getAnthropicProvider();
    case "openai":
      return getOpenAIProvider();
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown provider type: ${_exhaustive}`);
    }
  }
}

function resolveConfigFromEnv(): ProviderConfig {
  const primaryEnv = process.env.AI_PRIMARY_PROVIDER;
  const fallbackEnv = process.env.AI_FALLBACK_PROVIDER;

  const primary: ProviderType =
    primaryEnv === "openai" ? "openai" : "anthropic";

  const fallback: ProviderType | undefined =
    fallbackEnv === "none"
      ? undefined
      : fallbackEnv === "anthropic"
        ? "anthropic"
        : fallbackEnv === "openai"
          ? "openai"
          : primary === "anthropic"
            ? "openai"
            : "anthropic";

  return {
    ...DEFAULT_PROVIDER_CONFIG,
    primary,
    fallback,
  };
}

// ---------------------------------------------------------------------------
// Delay Helper
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Provider Factory
// ---------------------------------------------------------------------------

export class AIProviderFactory {
  private config: ProviderConfig;

  constructor(config?: Partial<ProviderConfig>) {
    const envConfig = resolveConfigFromEnv();
    this.config = { ...envConfig, ...config };
  }

  /**
   * Get the primary provider instance.
   */
  getPrimaryProvider(): AIProvider {
    return getProviderByType(this.config.primary);
  }

  /**
   * Get the fallback provider instance, if configured.
   */
  getFallbackProvider(): AIProvider | null {
    if (!this.config.fallback) {
      return null;
    }
    return getProviderByType(this.config.fallback);
  }

  /**
   * Generate explanation with automatic retry and fallback.
   *
   * Flow:
   * 1. Try primary provider up to maxRetries times
   * 2. If primary fails with retryable error, try fallback (if available)
   * 3. If fallback also fails, throw the last error
   */
  async generateExplanationWithFallback(
    input: ExplanationInput
  ): Promise<ExplanationOutput> {
    const maxRetries = this.config.maxRetries ?? 2;
    const retryDelayMs = this.config.retryDelayMs ?? 1000;

    const primary = this.getPrimaryProvider();
    let lastError: AIProviderError | null = null;

    // Check if primary is available
    if (!primary.isAvailable()) {
      console.warn(
        `[ai-provider] Primary provider ${this.config.primary} not available, trying fallback`
      );
      return this.tryFallback(input, null);
    }

    // Try primary provider with retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await primary.generateExplanation(input);
        return result;
      } catch (error) {
        lastError =
          error instanceof AIProviderError
            ? error
            : AIProviderError.fromError(error, this.config.primary);

        console.warn(
          `[ai-provider] Primary provider ${this.config.primary} failed (attempt ${attempt}/${maxRetries}): ${lastError.message}`
        );

        // Only retry if error is retryable and we have attempts left
        if (!lastError.retryable || attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        await delay(retryDelayMs * attempt);
      }
    }

    // Try fallback if primary failed
    return this.tryFallback(input, lastError);
  }

  private async tryFallback(
    input: ExplanationInput,
    primaryError: AIProviderError | null
  ): Promise<ExplanationOutput> {
    const fallback = this.getFallbackProvider();

    if (!fallback) {
      if (primaryError) {
        throw primaryError;
      }
      throw new AIProviderError(
        "No AI provider available",
        "PROVIDER_UNAVAILABLE",
        this.config.primary,
        false
      );
    }

    if (!fallback.isAvailable()) {
      if (primaryError) {
        throw primaryError;
      }
      throw new AIProviderError(
        "No AI provider available (fallback not configured)",
        "PROVIDER_UNAVAILABLE",
        this.config.fallback!,
        false
      );
    }

    console.info(
      `[ai-provider] Falling back to ${this.config.fallback} provider`
    );

    try {
      return await fallback.generateExplanation(input);
    } catch (fallbackError) {
      // If fallback also fails, throw the fallback error (more recent)
      if (fallbackError instanceof AIProviderError) {
        throw fallbackError;
      }
      throw AIProviderError.fromError(
        fallbackError,
        this.config.fallback!,
        "Fallback provider failed"
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton Factory
// ---------------------------------------------------------------------------

let factoryInstance: AIProviderFactory | null = null;

export function getProviderFactory(
  config?: Partial<ProviderConfig>
): AIProviderFactory {
  if (!factoryInstance || config) {
    factoryInstance = new AIProviderFactory(config);
  }
  return factoryInstance;
}

/**
 * Convenience function to generate explanation with fallback.
 */
export async function generateExplanation(
  input: ExplanationInput
): Promise<ExplanationOutput> {
  const factory = getProviderFactory();
  return factory.generateExplanationWithFallback(input);
}
