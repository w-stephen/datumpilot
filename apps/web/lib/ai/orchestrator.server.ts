import { randomUUID } from "crypto";

import { FcfJson } from "@/lib/fcf/schema";
import { validateFcf, ValidationResult } from "@/lib/rules/validateFcf";
import { calculateFlatness } from "@/lib/calc/flatness";
import { calculatePerpendicularity } from "@/lib/calc/perpendicularity";
import { calculatePosition } from "@/lib/calc/position";
import { calculateProfile } from "@/lib/calc/profile";

import { runExplanationAgent } from "./explanationAgent";
import {
  CalcResult,
  CalculationInput,
  ConfidenceLevel,
  InterpretFcfRequest,
  InterpretFcfResponse
} from "./types";

/**
 * Derives confidence level based on validation results.
 * Simplified: no longer considers parseConfidence from extraction.
 */
function deriveConfidence(validation: ValidationResult): ConfidenceLevel {
  if (validation.summary.errorCount > 0) return "low";
  if (validation.summary.warningCount > 0) return "medium";
  return "high";
}

type CalcOutcome = { ok: true; calcResult: CalcResult } | { ok: false; message: string };

function runDeterministicCalculation(input: CalculationInput): CalcOutcome {
  switch (input.characteristic) {
    case "position": {
      const response = calculatePosition(input.input);
      if (!response.success) {
        return { ok: false, message: response.errors.map((err) => err.message).join("; ") };
      }
      return { ok: true, calcResult: { characteristic: "position", result: response.result } };
    }
    case "flatness": {
      const response = calculateFlatness(input.input);
      if (!response.success) {
        return { ok: false, message: response.errors.map((err) => err.message).join("; ") };
      }
      return { ok: true, calcResult: { characteristic: "flatness", result: response.result } };
    }
    case "perpendicularity": {
      const response = calculatePerpendicularity(input.input);
      if (!response.success) {
        return { ok: false, message: response.errors.map((err) => err.message).join("; ") };
      }
      return { ok: true, calcResult: { characteristic: "perpendicularity", result: response.result } };
    }
    case "profile": {
      const response = calculateProfile(input.input);
      if (!response.success) {
        return { ok: false, message: response.errors.map((err) => err.message).join("; ") };
      }
      return { ok: true, calcResult: { characteristic: "profile", result: response.result } };
    }
    default: {
      const _exhaustiveCheck: never = input;
      return { ok: false, message: `Unsupported characteristic: ${(_exhaustiveCheck as CalculationInput).characteristic}` };
    }
  }
}

/**
 * Orchestrates FCF interpretation: validation → calculation → explanation.
 * Simplified for v1: accepts FCF JSON directly (no image/text extraction).
 */
export async function orchestrateFcfInterpretation(
  request: InterpretFcfRequest
): Promise<InterpretFcfResponse> {
  const correlationId = request.correlationId ?? randomUUID();

  // FCF is required - no extraction from image/text
  if (!request.fcf) {
    return {
      status: "error",
      stage: "validation",
      message: "FCF JSON payload is required",
      correlationId
    };
  }

  const fcf = request.fcf;
  const validation = validateFcf(fcf);

  if (!validation.valid) {
    return {
      status: "error",
      stage: "validation",
      message: "FCF failed deterministic validation",
      validation,
      correlationId
    };
  }

  let calcResult: CalcResult | undefined;
  if (request.calculationInput) {
    const calcOutcome = runDeterministicCalculation(request.calculationInput);
    if (!calcOutcome.ok) {
      return {
        status: "error",
        stage: "calculation",
        message: calcOutcome.message,
        validation,
        correlationId
      };
    }
    calcResult = calcOutcome.calcResult;
  }

  const warnings = validation.warnings.map((issue) => `${issue.code}: ${issue.message}`);
  const confidence = deriveConfidence(validation);

  try {
    const explanation = await runExplanationAgent({
      fcf,
      calcResult,
      validation
    });

    return {
      status: "ok",
      fcf,
      validation,
      calcResult,
      explanation,
      confidence,
      warnings: warnings.length ? warnings : undefined,
      correlationId
    };
  } catch (error) {
    return {
      status: "error",
      stage: "explanation",
      message: error instanceof Error ? error.message : "Explanation failed",
      validation,
      correlationId
    };
  }
}
