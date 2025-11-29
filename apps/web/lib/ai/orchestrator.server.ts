import { randomUUID } from "crypto";

import { FcfJson } from "@/lib/fcf/schema";
import { validateFcf, ValidationResult } from "@/lib/rules/validateFcf";
import { calculateFlatness } from "@/lib/calc/flatness";
import { calculatePerpendicularity } from "@/lib/calc/perpendicularity";
import { calculatePosition } from "@/lib/calc/position";
import { calculateProfile } from "@/lib/calc/profile";

import { runExtractionAgent } from "./extractionAgent";
import { runExplanationAgent } from "./explanationAgent";
import {
  CalcResult,
  CalculationInput,
  ConfidenceLevel,
  InterpretFcfRequest,
  InterpretFcfResponse
} from "./types";

function deriveConfidence(parseConfidence: number, validation: ValidationResult): ConfidenceLevel {
  const hasErrors = validation.summary.errorCount > 0;
  const hasWarnings = validation.summary.warningCount > 0;
  if (hasErrors) return "low";
  if (parseConfidence >= 0.9 && !hasWarnings) return "high";
  if (parseConfidence >= 0.7 && !hasErrors) return "medium";
  return "low";
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

export async function orchestrateFcfInterpretation(
  request: InterpretFcfRequest
): Promise<InterpretFcfResponse> {
  const correlationId = request.correlationId ?? randomUUID();
  let parseConfidence = request.parseConfidenceOverride ?? (request.fcf ? 1 : 0);
  let fcf: FcfJson;

  if (request.fcf) {
    fcf = request.fcf;
  } else if (request.imageUrl || request.text) {
    try {
      const extraction = await runExtractionAgent({
        imageUrl: request.imageUrl,
        text: request.text,
        hints: request.hints
      });
      fcf = extraction.fcf;
      parseConfidence = request.parseConfidenceOverride ?? extraction.parseConfidence;
    } catch (error) {
      return {
        status: "error",
        stage: "extraction",
        message: error instanceof Error ? error.message : "Extraction failed",
        correlationId
      };
    }
  } else {
    return {
      status: "error",
      stage: "extraction",
      message: "Provide an FCF JSON payload or an image/text for extraction",
      correlationId
    };
  }

  const validation = validateFcf(fcf);
  if (!validation.valid) {
    return {
      status: "error",
      stage: "validation",
      message: "FCF failed deterministic validation",
      parseConfidence,
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
        parseConfidence,
        validation,
        correlationId
      };
    }
    calcResult = calcOutcome.calcResult;
  }

  const warnings = validation.warnings.map((issue) => `${issue.code}: ${issue.message}`);
  const confidence = deriveConfidence(parseConfidence, validation);

  // Always run explanation agent (with or without calcResult)
  try {
    const explanation = await runExplanationAgent({
      fcf,
      calcResult,
      validation,
      parseConfidence
    });

    return {
      status: "ok",
      fcf,
      parseConfidence,
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
      parseConfidence,
      validation,
      correlationId
    };
  }
}
