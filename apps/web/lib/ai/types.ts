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

export type ConfidenceLevel = "high" | "medium" | "low";

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
}

export interface InterpretFcfFailure {
  status: "error";
  stage: "validation" | "calculation" | "explanation";
  message: string;
  validation?: ValidationResult;
  correlationId: string;
}

export type InterpretFcfResponse = InterpretFcfSuccess | InterpretFcfFailure;
