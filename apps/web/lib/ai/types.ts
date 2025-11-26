import { FcfJson, FeatureType, GeometricStandard } from "@/lib/fcf/schema";
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

export interface ExtractionAgentRequest {
  imageUrl?: string;
  text?: string;
  hints?: {
    featureType?: FeatureType;
    standard?: GeometricStandard;
  };
}

export interface ExtractionAgentResponse {
  fcf: FcfJson;
  parseConfidence: number; // 0.0–1.0 signal from the model
  notes?: string[];
  rawText?: string;
  promptVersion?: string;
}

export interface ExplanationAgentRequest {
  fcf: FcfJson;
  calcResult: CalcResult;
  validation: ValidationResult;
  parseConfidence?: number;
  format?: "markdown" | "plain";
}

export interface ExplanationAgentResponse {
  explanation: string;
  warnings?: string[];
  promptVersion?: string;
}

export interface InterpretFcfRequest {
  imageUrl?: string;
  text?: string;
  fcf?: FcfJson;
  calculationInput?: CalculationInput;
  parseConfidenceOverride?: number;
  correlationId?: string;
}

export interface InterpretFcfSuccess {
  status: "ok";
  fcf: FcfJson;
  parseConfidence: number;
  validation: ValidationResult;
  calcResult?: CalcResult;
  explanation?: ExplanationAgentResponse;
  confidence: ConfidenceLevel;
  warnings?: string[];
  correlationId: string;
}

export interface InterpretFcfFailure {
  status: "error";
  stage: "extraction" | "validation" | "calculation" | "explanation";
  message: string;
  parseConfidence?: number;
  validation?: ValidationResult;
  correlationId: string;
  notes?: string[];
}

export type InterpretFcfResponse = InterpretFcfSuccess | InterpretFcfFailure;
