/**
 * Position Tolerance Calculator
 *
 * Implements ASME Y14.5-2018 position tolerance calculations including:
 * - MMC (Maximum Material Condition) with bonus tolerance
 * - LMC (Least Material Condition) with bonus tolerance
 * - RFS (Regardless of Feature Size) - no bonus
 * - Virtual Condition and Resultant Condition boundaries
 * - Cylindrical (diametral) and planar tolerance zones
 *
 * Key formulas:
 * - Bonus (MMC, internal): Actual Size - MMC Size
 * - Bonus (MMC, external): MMC Size - Actual Size
 * - Bonus (LMC, internal): LMC Size - Actual Size
 * - Bonus (LMC, external): Actual Size - LMC Size
 * - Total Allowable = Stated Tolerance + Bonus
 * - Radial Deviation = 2 * sqrt(dx² + dy²) for cylindrical zone
 * - Virtual Condition (MMC, internal) = MMC - Tolerance
 * - Virtual Condition (MMC, external) = MMC + Tolerance
 */

import { FeatureType } from "@/lib/fcf/schema";
import {
  PositionInput,
  PositionResult,
  SizeLimits,
  SizeDimensionInput,
  FeatureClass,
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
 * Determine feature class (internal/external) from feature type.
 */
function getFeatureClass(featureType: FeatureType): FeatureClass | null {
  if (INTERNAL_FEATURES.includes(featureType)) return "internal";
  if (EXTERNAL_FEATURES.includes(featureType)) return "external";
  return null;
}

/**
 * Calculate size limits (MMC, LMC, upper, lower) from size dimension.
 */
export function calculateSizeLimits(
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
    // Internal features (holes, slots): MMC = smallest, LMC = largest
    mmc = lowerLimit;
    lmc = upperLimit;
  } else if (featureClass === "external") {
    // External features (pins, bosses): MMC = largest, LMC = smallest
    mmc = upperLimit;
    lmc = lowerLimit;
  } else {
    // Default: treat as internal
    mmc = lowerLimit;
    lmc = upperLimit;
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
 * Calculate bonus tolerance based on material condition and actual size.
 *
 * MMC Bonus (internal): actualSize - mmcSize (larger hole = more bonus)
 * MMC Bonus (external): mmcSize - actualSize (smaller pin = more bonus)
 * LMC Bonus (internal): lmcSize - actualSize (smaller hole = more bonus)
 * LMC Bonus (external): actualSize - lmcSize (larger pin = more bonus)
 */
export function calculateBonusTolerance(
  actualSize: number,
  sizeLimits: SizeLimits,
  materialCondition: "MMC" | "LMC" | "RFS",
  featureClass: FeatureClass,
  precision: Precision = DEFAULT_PRECISION
): number {
  if (materialCondition === "RFS") {
    return 0;
  }

  let bonus: number;

  if (materialCondition === "MMC") {
    if (featureClass === "internal") {
      // Internal at MMC: bonus = actual - MMC (actual is larger than MMC)
      bonus = actualSize - sizeLimits.mmc;
    } else {
      // External at MMC: bonus = MMC - actual (actual is smaller than MMC)
      bonus = sizeLimits.mmc - actualSize;
    }
  } else {
    // LMC
    if (featureClass === "internal") {
      // Internal at LMC: bonus = LMC - actual (actual is smaller than LMC)
      bonus = sizeLimits.lmc - actualSize;
    } else {
      // External at LMC: bonus = actual - LMC (actual is larger than LMC)
      bonus = actualSize - sizeLimits.lmc;
    }
  }

  // Bonus cannot be negative (would mean actual size violates size limits)
  return round(Math.max(0, bonus), precision);
}

/**
 * Calculate Virtual Condition boundary.
 *
 * Virtual Condition is the worst-case boundary for assembly clearance.
 * MMC, internal: VC = MMC - Tolerance (smallest hole with max position error)
 * MMC, external: VC = MMC + Tolerance (largest pin with max position error)
 * LMC, internal: VC = LMC + Tolerance
 * LMC, external: VC = LMC - Tolerance
 */
export function calculateVirtualCondition(
  sizeLimits: SizeLimits,
  tolerance: number,
  materialCondition: "MMC" | "LMC" | "RFS",
  featureClass: FeatureClass,
  precision: Precision = DEFAULT_PRECISION
): number {
  if (materialCondition === "RFS") {
    // RFS has no fixed virtual condition (it varies with actual size)
    // Return MMC as reference
    return round(sizeLimits.mmc, precision);
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
 * Calculate Resultant Condition boundary.
 *
 * Resultant Condition is the opposite extreme from Virtual Condition.
 * MMC, internal: RC = LMC + Tolerance
 * MMC, external: RC = LMC - Tolerance
 * LMC, internal: RC = MMC - Tolerance
 * LMC, external: RC = MMC + Tolerance
 */
export function calculateResultantCondition(
  sizeLimits: SizeLimits,
  tolerance: number,
  materialCondition: "MMC" | "LMC" | "RFS",
  featureClass: FeatureClass,
  precision: Precision = DEFAULT_PRECISION
): number {
  if (materialCondition === "RFS") {
    return round(sizeLimits.lmc, precision);
  }

  let rc: number;

  if (materialCondition === "MMC") {
    if (featureClass === "internal") {
      rc = sizeLimits.lmc + tolerance;
    } else {
      rc = sizeLimits.lmc - tolerance;
    }
  } else {
    // LMC
    if (featureClass === "internal") {
      rc = sizeLimits.mmc - tolerance;
    } else {
      rc = sizeLimits.mmc + tolerance;
    }
  }

  return round(rc, precision);
}

/**
 * Calculate position deviation (actual vs true position).
 *
 * For cylindrical zone: deviation = 2 * sqrt(dx² + dy² + dz²)
 * For planar zone: deviation = 2 * max(|dx|, |dy|) or similar
 */
export function calculatePositionDeviation(
  actualX: number,
  actualY: number,
  basicX: number,
  basicY: number,
  actualZ?: number,
  basicZ?: number,
  diametral: boolean = true,
  precision: Precision = DEFAULT_PRECISION
): { dx: number; dy: number; dz?: number; radial: number; diametral: number } {
  const dx = round(actualX - basicX, precision);
  const dy = round(actualY - basicY, precision);
  const dz = actualZ !== undefined && basicZ !== undefined
    ? round(actualZ - basicZ, precision)
    : undefined;

  let radial: number;
  if (dz !== undefined) {
    radial = Math.sqrt(dx * dx + dy * dy + dz * dz);
  } else {
    radial = Math.sqrt(dx * dx + dy * dy);
  }

  // Diametral position tolerance = 2 * radial deviation
  const diametralValue = diametral ? 2 * radial : radial;

  return {
    dx,
    dy,
    dz,
    radial: round(radial, precision),
    diametral: round(diametralValue, precision)
  };
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate position calculator inputs.
 */
function validatePositionInput(input: PositionInput): CalculatorError[] {
  const errors: CalculatorError[] = [];

  if (input.geometricTolerance <= 0) {
    errors.push({
      code: "INVALID_TOLERANCE",
      message: "Geometric tolerance must be greater than zero",
      field: "geometricTolerance"
    });
  }

  if (input.sizeDimension.nominal <= 0) {
    errors.push({
      code: "INVALID_SIZE",
      message: "Nominal size must be greater than zero",
      field: "sizeDimension.nominal"
    });
  }

  if (input.sizeDimension.tolerancePlus < 0 || input.sizeDimension.toleranceMinus < 0) {
    errors.push({
      code: "INVALID_SIZE_TOLERANCE",
      message: "Size tolerances cannot be negative",
      field: "sizeDimension"
    });
  }

  if (input.measured.actualSize <= 0) {
    errors.push({
      code: "INVALID_ACTUAL_SIZE",
      message: "Actual measured size must be greater than zero",
      field: "measured.actualSize"
    });
  }

  const featureClass = getFeatureClass(input.featureType);
  if (!featureClass && input.materialCondition !== "RFS") {
    errors.push({
      code: "INVALID_FEATURE_TYPE",
      message: `Feature type '${input.featureType}' is not valid for ${input.materialCondition} calculations`,
      field: "featureType"
    });
  }

  return errors;
}

// ============================================================================
// MAIN CALCULATOR FUNCTION
// ============================================================================

/**
 * Calculate position tolerance conformance with full analysis.
 *
 * This is the main entry point for position tolerance calculations.
 * Supports MMC, LMC, and RFS material conditions.
 *
 * @param input - Position calculation inputs
 * @returns Detailed position calculation results or validation errors
 */
export function calculatePosition(input: PositionInput): CalculatorResponse<PositionResult> {
  const precision = input.precision ?? DEFAULT_PRECISION;

  // Validate inputs
  const errors = validatePositionInput(input);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Calculate size limits
  const sizeLimits = calculateSizeLimits(input.sizeDimension, precision);

  // Determine feature class
  const featureClass = getFeatureClass(input.featureType) ?? "internal";

  // Check size conformance
  const actualSize = input.measured.actualSize;
  const sizeConformance =
    actualSize >= sizeLimits.lowerLimit && actualSize <= sizeLimits.upperLimit;

  // Calculate bonus tolerance
  const bonusTolerance = calculateBonusTolerance(
    actualSize,
    sizeLimits,
    input.materialCondition,
    featureClass,
    precision
  );

  // Calculate total allowable tolerance
  const totalAllowableTolerance = round(
    input.geometricTolerance + bonusTolerance,
    precision
  );

  // Calculate virtual and resultant conditions
  const virtualCondition = calculateVirtualCondition(
    sizeLimits,
    input.geometricTolerance,
    input.materialCondition,
    featureClass,
    precision
  );

  const resultantCondition = calculateResultantCondition(
    sizeLimits,
    input.geometricTolerance,
    input.materialCondition,
    featureClass,
    precision
  );

  // Calculate position deviation
  const deviation = calculatePositionDeviation(
    input.measured.actualX,
    input.measured.actualY,
    input.truePosition.basicX,
    input.truePosition.basicY,
    input.measured.actualZ,
    input.truePosition.basicZ,
    input.diametralZone,
    precision
  );

  // Actual position tolerance consumed (diametral for cylindrical zone)
  const actualPositionTolerance = deviation.diametral;

  // Position conformance: actual position tolerance <= total allowable
  const positionConformance = actualPositionTolerance <= totalAllowableTolerance;

  // Overall status
  const overallPass = sizeConformance && positionConformance;
  const status = overallPass ? "pass" : "fail";

  // Calculate percentage of tolerance consumed
  const toleranceConsumed = round(
    (actualPositionTolerance / totalAllowableTolerance) * 100,
    1
  );

  // Generate summary
  const summary = generatePositionSummary(
    status,
    actualPositionTolerance,
    totalAllowableTolerance,
    bonusTolerance,
    input.materialCondition,
    sizeConformance,
    positionConformance
  );

  const result: PositionResult = {
    status,
    summary,
    timestamp: new Date().toISOString(),
    unit: input.unit,
    statedTolerance: input.geometricTolerance,
    materialCondition: input.materialCondition,
    sizeLimits,
    actualSize: round(actualSize, precision),
    bonusTolerance,
    totalAllowableTolerance,
    virtualCondition,
    resultantCondition,
    deviationX: deviation.dx,
    deviationY: deviation.dy,
    deviationZ: deviation.dz,
    radialDeviation: deviation.radial,
    actualPositionTolerance,
    toleranceConsumed,
    sizeConformance,
    positionConformance
  };

  return { success: true, result };
}

/**
 * Generate human-readable summary for position result.
 */
function generatePositionSummary(
  status: "pass" | "fail" | "warning",
  actualTolerance: number,
  totalAllowable: number,
  bonus: number,
  materialCondition: string,
  sizeOk: boolean,
  positionOk: boolean
): string {
  const lines: string[] = [];

  if (status === "pass") {
    lines.push(`PASS: Position tolerance satisfied.`);
  } else {
    lines.push(`FAIL: Position tolerance exceeded.`);
  }

  lines.push(
    `Actual position: Ø${actualTolerance.toFixed(4)} vs Allowable: Ø${totalAllowable.toFixed(4)}`
  );

  if (materialCondition !== "RFS" && bonus > 0) {
    lines.push(`Bonus tolerance: ${bonus.toFixed(4)} (${materialCondition})`);
  }

  if (!sizeOk) {
    lines.push(`WARNING: Actual size is outside size limits.`);
  }

  if (!positionOk) {
    lines.push(`Position deviation exceeds total allowable tolerance.`);
  }

  return lines.join(" ");
}

// ============================================================================
// CONVENIENCE FUNCTIONS (Legacy API compatibility)
// ============================================================================

/**
 * Legacy interface for backward compatibility.
 */
export interface PositionInputs {
  nominalSize?: number;
  mmcSize?: number;
  actualSize?: number;
  geoToleranceAtMmc: number;
  radialLocationError: number;
}

/**
 * Legacy function for simple MMC position calculation.
 * Maintained for backward compatibility.
 *
 * @deprecated Use calculatePosition() for full functionality.
 */
export function calculatePositionAtMmc(inputs: PositionInputs) {
  const bonus =
    inputs.actualSize && inputs.mmcSize
      ? Math.abs(inputs.actualSize - inputs.mmcSize)
      : 0;
  const effectiveTolerance = inputs.geoToleranceAtMmc + bonus;
  const pass = inputs.radialLocationError <= effectiveTolerance / 2;
  return { bonus, effectiveTolerance, pass };
}

// ============================================================================
// QUICK CALCULATION HELPERS
// ============================================================================

/**
 * Quick calculation for position at MMC with minimal inputs.
 */
export function quickPositionMmc(
  statedTolerance: number,
  mmcSize: number,
  actualSize: number,
  deviationX: number,
  deviationY: number,
  featureClass: FeatureClass = "internal"
): { pass: boolean; bonus: number; totalTolerance: number; actualPosition: number } {
  // Calculate bonus
  let bonus: number;
  if (featureClass === "internal") {
    bonus = Math.max(0, actualSize - mmcSize);
  } else {
    bonus = Math.max(0, mmcSize - actualSize);
  }

  const totalTolerance = statedTolerance + bonus;
  const radial = Math.sqrt(deviationX * deviationX + deviationY * deviationY);
  const actualPosition = 2 * radial; // Diametral

  return {
    pass: actualPosition <= totalTolerance,
    bonus,
    totalTolerance,
    actualPosition
  };
}

/**
 * Quick calculation for position at LMC with minimal inputs.
 */
export function quickPositionLmc(
  statedTolerance: number,
  lmcSize: number,
  actualSize: number,
  deviationX: number,
  deviationY: number,
  featureClass: FeatureClass = "internal"
): { pass: boolean; bonus: number; totalTolerance: number; actualPosition: number } {
  // Calculate bonus
  let bonus: number;
  if (featureClass === "internal") {
    bonus = Math.max(0, lmcSize - actualSize);
  } else {
    bonus = Math.max(0, actualSize - lmcSize);
  }

  const totalTolerance = statedTolerance + bonus;
  const radial = Math.sqrt(deviationX * deviationX + deviationY * deviationY);
  const actualPosition = 2 * radial; // Diametral

  return {
    pass: actualPosition <= totalTolerance,
    bonus,
    totalTolerance,
    actualPosition
  };
}

/**
 * Quick calculation for position at RFS with minimal inputs.
 */
export function quickPositionRfs(
  statedTolerance: number,
  deviationX: number,
  deviationY: number
): { pass: boolean; actualPosition: number } {
  const radial = Math.sqrt(deviationX * deviationX + deviationY * deviationY);
  const actualPosition = 2 * radial; // Diametral

  return {
    pass: actualPosition <= statedTolerance,
    actualPosition
  };
}
