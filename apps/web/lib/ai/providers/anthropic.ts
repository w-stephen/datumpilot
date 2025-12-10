/**
 * Anthropic Claude Provider Implementation
 *
 * Uses Claude Opus 4.5 with prompt caching for the explanation agent.
 * The GDT reference content is cached to reduce costs on repeated calls.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ExplanationInput, ExplanationOutput } from "./types";
import { AIProviderError } from "./types";
import {
  GDT_REFERENCE_CONTENT,
  EXPLANATION_SYSTEM_PROMPT,
  buildExplanationUserPrompt,
  PROMPT_VERSION,
} from "./prompts";

const CLAUDE_MODEL = "claude-opus-4-5-20250514";

export class AnthropicProvider implements AIProvider {
  readonly type = "anthropic" as const;
  readonly model = CLAUDE_MODEL;

  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AIProviderError(
          "ANTHROPIC_API_KEY environment variable is not set",
          "AUTHENTICATION_FAILED",
          "anthropic",
          false
        );
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async generateExplanation(input: ExplanationInput): Promise<ExplanationOutput> {
    const client = this.getClient();

    const userPrompt = buildExplanationUserPrompt({
      fcfJson: JSON.stringify(input.fcf, null, 2),
      validationResult: JSON.stringify(input.validation, null, 2),
      calcResult: input.calculation
        ? JSON.stringify(input.calculation, null, 2)
        : undefined,
      format: input.format,
    });

    try {
      const response = await client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: GDT_REFERENCE_CONTENT,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: EXPLANATION_SYSTEM_PROMPT,
          },
        ],
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      // Extract text content from response
      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new AIProviderError(
          "No text response from Claude",
          "INVALID_RESPONSE",
          "anthropic",
          false
        );
      }

      // Parse JSON response
      const parsed = this.parseJsonResponse(textBlock.text);

      // Determine cache status from usage
      const usage = response.usage;
      let cacheStatus: "hit" | "miss" | "disabled" = "disabled";
      if (usage.cache_creation_input_tokens && usage.cache_creation_input_tokens > 0) {
        cacheStatus = "miss"; // Cache was created
      } else if (usage.cache_read_input_tokens && usage.cache_read_input_tokens > 0) {
        cacheStatus = "hit"; // Cache was used
      }

      return {
        explanation: parsed.explanation,
        warnings: parsed.warnings ?? [],
        providerInfo: {
          provider: "anthropic",
          model: this.model,
          promptVersion: PROMPT_VERSION,
        },
        cacheStatus,
        usage: {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          cacheCreationInputTokens: usage.cache_creation_input_tokens ?? undefined,
          cacheReadInputTokens: usage.cache_read_input_tokens ?? undefined,
        },
      };
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw AIProviderError.fromError(error, "anthropic", "Failed to generate explanation");
    }
  }

  private parseJsonResponse(text: string): { explanation: string; warnings?: string[] } {
    // Remove any potential markdown code fences
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    try {
      const parsed = JSON.parse(cleanedText);
      if (typeof parsed.explanation !== "string") {
        throw new Error("Missing explanation field");
      }
      return parsed;
    } catch (parseError) {
      throw new AIProviderError(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        "INVALID_RESPONSE",
        "anthropic",
        false
      );
    }
  }
}

// Singleton instance
let instance: AnthropicProvider | null = null;

export function getAnthropicProvider(): AnthropicProvider {
  if (!instance) {
    instance = new AnthropicProvider();
  }
  return instance;
}
