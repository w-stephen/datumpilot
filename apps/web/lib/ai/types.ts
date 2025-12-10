import { FcfJson } from "@/lib/fcf/schema";
import { ValidationResult } from "@/lib/rules/validateFcf";
import {
  FlatnessInput,
  FlatnessResult,
  PerpendicularityInput,
  PerpendicularityResult,
  PositionInput,
  PositionResult,
  ProfileInput,
  ProfileResult
} from "@/lib/calc/types";
import type { ProviderType } from "./providers/types";

export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * AI provider metadata returned with explanation responses.
 */
export interface AIMetadata {
  provider: ProviderType;
  model: string;
  cacheStatus?: "hit" | "miss" | "disabled";
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
}

export type CalculationInput =
  | { characteristic: "position"; input: PositionInput }
  | { characteristic: "flatness"; input: FlatnessInput }
  | { characteristic: "perpendicularity"; input: PerpendicularityInput }
  | { characteristic: "profile"; input: ProfileInput };

export type CalcResult =
  | { characteristic: "position"; result: PositionResult }
  | { characteristic: "flatness"; result: FlatnessResult }
  | { characteristic: "perpendicularity"; result: PerpendicularityResult }
  | { characteristic: "profile"; result: ProfileResult };

export interface ExplanationAgentRequest {
  fcf: FcfJson;
  calcResult?: CalcResult;
  validation: ValidationResult;
  format?: "markdown" | "plain";
}

export interface ExplanationAgentResponse {
  explanation: string;
  warnings?: string[];
  promptVersion?: string;
  aiMetadata?: AIMetadata;
}

/**
 * Simplified for v1: accepts FCF JSON directly (no image/text extraction).
 */
export interface InterpretFcfRequest {
  fcf: FcfJson;
  calculationInput?: CalculationInput;
  correlationId?: string;
}

export interface InterpretFcfSuccess {
  status: "ok";
  fcf: FcfJson;
  validation: ValidationResult;
  calcResult?: CalcResult;
  explanation?: ExplanationAgentResponse;
  confidence: ConfidenceLevel;
  warnings?: string[];
  correlationId: string;
  aiMetadata?: AIMetadata;
}

export interface InterpretFcfFailure {
  status: "error";
  stage: "validation" | "calculation" | "explanation";
  message: string;
  validation?: ValidationResult;
  correlationId: string;
}

export type InterpretFcfResponse = InterpretFcfSuccess | InterpretFcfFailure;
