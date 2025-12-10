/**
 * OpenAI Provider Implementation
 *
 * Fallback provider using GPT-4.1 for the explanation agent.
 * Used when Anthropic is unavailable or rate limited.
 */

import OpenAI from "openai";
import type { AIProvider, ExplanationInput, ExplanationOutput } from "./types";
import { AIProviderError } from "./types";
import {
  GDT_REFERENCE_CONTENT,
  EXPLANATION_SYSTEM_PROMPT,
  buildExplanationUserPrompt,
  PROMPT_VERSION,
} from "./prompts";

const OPENAI_MODEL = "gpt-4.1";

export class OpenAIProvider implements AIProvider {
  readonly type = "openai" as const;
  readonly model = OPENAI_MODEL;

  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new AIProviderError(
          "OPENAI_API_KEY environment variable is not set",
          "AUTHENTICATION_FAILED",
          "openai",
          false
        );
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async generateExplanation(input: ExplanationInput): Promise<ExplanationOutput> {
    const client = this.getClient();

    // Combine GDT reference with system prompt for OpenAI
    const systemContent = `${GDT_REFERENCE_CONTENT}\n\n${EXPLANATION_SYSTEM_PROMPT}`;

    const userPrompt = buildExplanationUserPrompt({
      fcfJson: JSON.stringify(input.fcf, null, 2),
      validationResult: JSON.stringify(input.validation, null, 2),
      calcResult: input.calculation
        ? JSON.stringify(input.calculation, null, 2)
        : undefined,
      format: input.format,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const completion = await client.chat.completions.create(
        {
          model: this.model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userPrompt },
          ],
        },
        { signal: controller.signal }
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AIProviderError(
          "OpenAI returned no content",
          "INVALID_RESPONSE",
          "openai",
          false
        );
      }

      const parsed = this.parseJsonResponse(content);

      return {
        explanation: parsed.explanation,
        warnings: parsed.warnings ?? [],
        providerInfo: {
          provider: "openai",
          model: this.model,
          promptVersion: PROMPT_VERSION,
        },
        cacheStatus: "disabled", // OpenAI doesn't have prompt caching
        usage: completion.usage
          ? {
              inputTokens: completion.usage.prompt_tokens,
              outputTokens: completion.usage.completion_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw AIProviderError.fromError(error, "openai", "Failed to generate explanation");
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseJsonResponse(text: string): { explanation: string; warnings?: string[] } {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed.explanation !== "string") {
        throw new Error("Missing explanation field");
      }
      return parsed;
    } catch (parseError) {
      throw new AIProviderError(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        "INVALID_RESPONSE",
        "openai",
        false
      );
    }
  }
}

// Singleton instance
let instance: OpenAIProvider | null = null;

export function getOpenAIProvider(): OpenAIProvider {
  if (!instance) {
    instance = new OpenAIProvider();
  }
  return instance;
}
