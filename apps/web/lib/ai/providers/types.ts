/**
 * AI Provider Abstraction Layer - Core Types
 *
 * Defines interfaces for a provider-agnostic AI integration supporting
 * Claude Opus 4.5 (primary) with OpenAI fallback.
 */

import type { FcfJson } from "@/lib/fcf/schema";
import type { ValidationResult } from "@/lib/rules/validateFcf";

// ---------------------------------------------------------------------------
// Provider Identification
// ---------------------------------------------------------------------------

export type ProviderType = "anthropic" | "openai";

export interface ProviderInfo {
  provider: ProviderType;
  model: string;
  promptVersion: string;
}

// ---------------------------------------------------------------------------
// Explanation Agent Input/Output
// ---------------------------------------------------------------------------

export interface ExplanationInput {
  fcf: FcfJson;
  validation: ValidationResult;
  /** Calculation result - passed through to AI as JSON */
  calculation?: Record<string, unknown>;
  format?: "markdown" | "plain";
}

export interface ExplanationOutput {
  explanation: string;
  warnings: string[];
  providerInfo: ProviderInfo;
  /** Cache hit status for Anthropic prompt caching */
  cacheStatus?: "hit" | "miss" | "disabled";
  /** Token usage for cost tracking */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
}

// ---------------------------------------------------------------------------
// Provider Interface
// ---------------------------------------------------------------------------

export interface AIProvider {
  readonly type: ProviderType;
  readonly model: string;

  /**
   * Generate explanation for an FCF with validation and optional calculation results.
   * @throws AIProviderError on failure
   */
  generateExplanation(input: ExplanationInput): Promise<ExplanationOutput>;

  /**
   * Check if the provider is properly configured and available.
   */
  isAvailable(): boolean;
}

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

export type AIErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED"
  | "INVALID_RESPONSE"
  | "CONTEXT_LENGTH_EXCEEDED"
  | "AUTHENTICATION_FAILED"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code: AIErrorCode,
    public readonly provider: ProviderType,
    public readonly retryable: boolean = false,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "AIProviderError";
  }

  static fromError(
    error: unknown,
    provider: ProviderType,
    context?: string
  ): AIProviderError {
    if (error instanceof AIProviderError) {
      return error;
    }

    const message =
      error instanceof Error
        ? error.message
        : context ?? "Unknown AI provider error";

    // Detect retryable conditions
    const isRateLimit =
      message.toLowerCase().includes("rate limit") ||
      message.toLowerCase().includes("429");
    const isNetworkError =
      message.toLowerCase().includes("network") ||
      message.toLowerCase().includes("timeout") ||
      message.toLowerCase().includes("econnrefused");

    if (isRateLimit) {
      return new AIProviderError(
        message,
        "RATE_LIMITED",
        provider,
        true,
        error instanceof Error ? error : undefined
      );
    }

    if (isNetworkError) {
      return new AIProviderError(
        message,
        "NETWORK_ERROR",
        provider,
        true,
        error instanceof Error ? error : undefined
      );
    }

    if (
      message.toLowerCase().includes("authentication") ||
      message.toLowerCase().includes("api key") ||
      message.toLowerCase().includes("401")
    ) {
      return new AIProviderError(
        message,
        "AUTHENTICATION_FAILED",
        provider,
        false,
        error instanceof Error ? error : undefined
      );
    }

    if (
      message.toLowerCase().includes("context length") ||
      message.toLowerCase().includes("too many tokens")
    ) {
      return new AIProviderError(
        message,
        "CONTEXT_LENGTH_EXCEEDED",
        provider,
        false,
        error instanceof Error ? error : undefined
      );
    }

    return new AIProviderError(
      message,
      "UNKNOWN",
      provider,
      false,
      error instanceof Error ? error : undefined
    );
  }
}

// ---------------------------------------------------------------------------
// Factory Configuration
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  primary: ProviderType;
  fallback?: ProviderType;
  /** Max retries before falling back (default: 2) */
  maxRetries?: number;
  /** Retry delay in ms (default: 1000) */
  retryDelayMs?: number;
}

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  primary: "anthropic",
  fallback: "openai",
  maxRetries: 2,
  retryDelayMs: 1000,
};
