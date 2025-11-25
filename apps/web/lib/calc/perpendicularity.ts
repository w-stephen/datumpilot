/**
 * Perpendicularity Tolerance Calculator
 *
 * Implements ASME Y14.5-2018 perpendicularity tolerance calculations.
 *
 * Perpendicularity is an orientation tolerance that controls the
 * orientation of a surface or axis relative to a datum plane or axis
 * at exactly 90 degrees.
 *
 * Key concepts:
 * - Always requires at least one datum reference
 * - For surfaces: tolerance zone is two parallel planes perpendicular to datum
 * - For axes (FOS): tolerance zone can be cylindrical with MMC/LMC bonus
 * - MMC/LMC only applies to features of size (holes, pins, etc.)
 */

import { FeatureType } from "@/lib/fcf/schema";
import {
  PerpendicularityInput,
  PerpendicularityResult,
  SizeLimits,
  SizeDimensionInput,
  CalculatorError,
  CalculatorResponse,
  Precision
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PRECISION: Precision = 4;

// Features where MMC = smallest size (internal features)
const INTERNAL_FEATURES: FeatureType[] = ["hole", "slot"];

// Features where MMC = largest size (external features)
const EXTERNAL_FEATURES: FeatureType[] = ["pin", "boss"];

// Features that are surfaces (no bonus tolerance)
const SURFACE_FEATURES: FeatureType[] = ["surface", "plane", "edge"];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Round a number to specified decimal places.
 */
function round(value: number, precision: Precision): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Determine if feature is internal or external.
 */
function getFeatureClass(featureType: FeatureType): "internal" | "external" | "surface" {
  if (INTERNAL_FEATURES.includes(featureType)) return "internal";
  if (EXTERNAL_FEATURES.includes(featureType)) return "external";
  return "surface";
}

/**
 * Check if feature type supports material condition modifiers.
 */
function supportsMaterialCondition(featureType: FeatureType): boolean {
  return !SURFACE_FEATURES.includes(featureType);
}

/**
 * Calculate size limits from size dimension input.
 */
function calculateSizeLimits(
  input: SizeDimensionInput,
  precision: Precision = DEFAULT_PRECISION
): SizeLimits {
  const { nominal, tolerancePlus, toleranceMinus, featureType } = input;

  const upperLimit = round(nominal + tolerancePlus, precision);
  const lowerLimit = round(nominal - toleranceMinus, precision);

  const featureClass = getFeatureClass(featureType);

  let mmc: number;
  let lmc: number;

  if (featureClass === "internal") {
    mmc = lowerLimit;
    lmc = upperLimit;
  } else if (featureClass === "external") {
    mmc = upperLimit;
    lmc = lowerLimit;
  } else {
    // Surface - no MMC/LMC concept
    mmc = nominal;
    lmc = nominal;
  }

  return {
    nominal: round(nominal, precision),
    mmc: round(mmc, precision),
    lmc: round(lmc, precision),
    upperLimit,
    lowerLimit
  };
}

/**
 * Calculate bonus tolerance for perpendicularity.
 */
function calculateBonusTolerance(
  actualSize: number,
  sizeLimits: SizeLimits,
  materialCondition: "MMC" | "LMC" | "RFS",
  featureClass: "internal" | "external" | "surface",
  precision: Precision = DEFAULT_PRECISION
): number {
  if (materialCondition === "RFS" || featureClass === "surface") {
    return 0;
  }

  let bonus: number;

  if (materialCondition === "MMC") {
    if (featureClass === "internal") {
      bonus = actualSize - sizeLimits.mmc;
    } else {
      bonus = sizeLimits.mmc - actualSize;
    }
  } else {
    // LMC
    if (featureClass === "internal") {
      bonus = sizeLimits.lmc - actualSize;
    } else {
      bonus = actualSize - sizeLimits.lmc;
    }
  }

  return round(Math.max(0, bonus), precision);
}

/**
 * Calculate Virtual Condition for perpendicularity.
 */
function calculateVirtualCondition(
  sizeLimits: SizeLimits,
  tolerance: number,
  materialCondition: "MMC" | "LMC" | "RFS",
  featureClass: "internal" | "external" | "surface",
  precision: Precision = DEFAULT_PRECISION
): number | undefined {
  if (materialCondition === "RFS" || featureClass === "surface") {
    return undefined;
  }

  let vc: number;

  if (materialCondition === "MMC") {
    if (featureClass === "internal") {
      vc = sizeLimits.mmc - tolerance;
    } else {
      vc = sizeLimits.mmc + tolerance;
    }
  } else {
    // LMC
    if (featureClass === "internal") {
      vc = sizeLimits.lmc + tolerance;
    } else {
      vc = sizeLimits.lmc - tolerance;
    }
  }

  return round(vc, precision);
}

/**
 * Convert angular deviation to linear deviation over a length.
 */
export function angularToLinear(angleDegrees: number, length: number): number {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  return length * Math.tan(angleRadians);
}

/**
 * Convert linear deviation to angular deviation.
 */
export function linearToAngular(linearDeviation: number, length: number): number {
  const angleRadians = Math.atan(linearDeviation / length);
  return (angleRadians * 180) / Math.PI;
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate perpendicularity calculator inputs.
 */
function validatePerpendicularityInput(input: PerpendicularityInput): CalculatorError[] {
  const errors: CalculatorError[] = [];

  if (input.tolerance <= 0) {
    errors.push({
      code: "INVALID_TOLERANCE",
      message: "Perpendicularity tolerance must be greater than zero",
      field: "tolerance"
    });
  }

  // Check if material condition requires size info
  const materialCondition = input.materialCondition ?? "RFS";
  if (materialCondition !== "RFS") {
    if (!input.sizeDimension) {
      errors.push({
        code: "MISSING_SIZE_DIMENSION",
        message: "Size dimension is required for MMC/LMC calculations",
        field: "sizeDimension"
      });
    }
    if (input.actualSize === undefined) {
      errors.push({
        code: "MISSING_ACTUAL_SIZE",
        message: "Actual size is required for MMC/LMC calculations",
        field: "actualSize"
      });
    }
    if (!supportsMaterialCondition(input.featureType)) {
      errors.push({
        code: "INVALID_MATERIAL_CONDITION",
        message: `Feature type '${input.featureType}' does not support ${materialCondition}`,
        field: "materialCondition"
      });
    }
  }

  // Check for measurement input
  if (input.linearDeviation === undefined && input.angularDeviation === undefined) {
    errors.push({
      code: "NO_MEASUREMENTS",
      message: "Either linear deviation or angular deviation must be provided",
      field: "linearDeviation"
    });
  }

  if (input.angularDeviation !== undefined && input.measurementLength === undefined) {
    errors.push({
      code: "MISSING_MEASUREMENT_LENGTH",
      message: "Measurement length is required when using angular deviation",
      field: "measurementLength"
    });
  }

  return errors;
}

// ============================================================================
// MAIN CALCULATOR FUNCTION
// ============================================================================

/**
 * Calculate perpendicularity tolerance conformance.
 *
 * Supports both surface perpendicularity (RFS only) and axis
 * perpendicularity (MMC/LMC with bonus).
 *
 * @param input - Perpendicularity calculation inputs
 * @returns Detailed perpendicularity calculation results or validation errors
 */
export function calculatePerpendicularity(
  input: PerpendicularityInput
): CalculatorResponse<PerpendicularityResult> {
  const precision = input.precision ?? DEFAULT_PRECISION;

  // Validate inputs
  const errors = validatePerpendicularityInput(input);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const materialCondition = input.materialCondition ?? "RFS";
  const featureClass = getFeatureClass(input.featureType);

  // Calculate size limits and bonus if applicable
  let sizeLimits: SizeLimits | undefined;
  let bonusTolerance = 0;
  let virtualCondition: number | undefined;

  if (input.sizeDimension && input.actualSize !== undefined) {
    sizeLimits = calculateSizeLimits(input.sizeDimension, precision);
    bonusTolerance = calculateBonusTolerance(
      input.actualSize,
      sizeLimits,
      materialCondition,
      featureClass,
      precision
    );
    virtualCondition = calculateVirtualCondition(
      sizeLimits,
      input.tolerance,
      materialCondition,
      featureClass,
      precision
    );
  }

  // Calculate total allowable tolerance
  const totalAllowableTolerance = round(input.tolerance + bonusTolerance, precision);

  // Determine measured deviation
  let measuredDeviation: number;

  if (input.linearDeviation !== undefined) {
    measuredDeviation = input.linearDeviation;
  } else if (input.angularDeviation !== undefined && input.measurementLength !== undefined) {
    measuredDeviation = angularToLinear(input.angularDeviation, input.measurementLength);
  } else {
    // Should not reach here due to validation
    measuredDeviation = 0;
  }

  measuredDeviation = round(Math.abs(measuredDeviation), precision);

  // Determine pass/fail
  const pass = measuredDeviation <= totalAllowableTolerance;

  // Calculate percentage of tolerance consumed
  const toleranceConsumed = round((measuredDeviation / totalAllowableTolerance) * 100, 1);

  // Generate summary
  const summary = generatePerpendcularitySummary(
    pass,
    measuredDeviation,
    totalAllowableTolerance,
    bonusTolerance,
    materialCondition
  );

  const result: PerpendicularityResult = {
    status: pass ? "pass" : "fail",
    summary,
    timestamp: new Date().toISOString(),
    unit: input.unit,
    statedTolerance: input.tolerance,
    materialCondition,
    bonusTolerance,
    totalAllowableTolerance,
    measuredDeviation,
    virtualCondition,
    sizeLimits,
    toleranceConsumed
  };

  return { success: true, result };
}

/**
 * Generate human-readable summary for perpendicularity result.
 */
function generatePerpendcularitySummary(
  pass: boolean,
  measured: number,
  totalAllowable: number,
  bonus: number,
  materialCondition: string
): string {
  const lines: string[] = [];

  if (pass) {
    lines.push(`PASS: Perpendicularity ${measured.toFixed(4)} is within tolerance ${totalAllowable.toFixed(4)}`);
  } else {
    lines.push(`FAIL: Perpendicularity ${measured.toFixed(4)} exceeds tolerance ${totalAllowable.toFixed(4)}`);
  }

  if (materialCondition !== "RFS" && bonus > 0) {
    lines.push(`(includes ${bonus.toFixed(4)} bonus from ${materialCondition})`);
  }

  return lines.join(" ");
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Legacy function for backward compatibility.
 *
 * @deprecated Use calculatePerpendicularity() for full functionality.
 */
export function evaluatePerpendicularity(deviation: number, tolerance: number) {
  const pass = deviation <= tolerance;
  return { pass };
}

/**
 * Quick perpendicularity check at RFS.
 */
export function quickPerpendicularityRfs(
  deviation: number,
  tolerance: number
): { pass: boolean; consumed: number } {
  const pass = deviation <= tolerance;
  const consumed = (deviation / tolerance) * 100;
  return { pass, consumed };
}

/**
 * Quick perpendicularity check at MMC with bonus.
 */
export function quickPerpendicularityMmc(
  deviation: number,
  statedTolerance: number,
  mmcSize: number,
  actualSize: number,
  featureClass: "internal" | "external"
): { pass: boolean; bonus: number; totalTolerance: number } {
  let bonus: number;
  if (featureClass === "internal") {
    bonus = Math.max(0, actualSize - mmcSize);
  } else {
    bonus = Math.max(0, mmcSize - actualSize);
  }

  const totalTolerance = statedTolerance + bonus;
  const pass = deviation <= totalTolerance;

  return { pass, bonus, totalTolerance };
}
