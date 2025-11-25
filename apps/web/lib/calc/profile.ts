/**
 * Profile Tolerance Calculator
 *
 * Implements ASME Y14.5-2018 profile tolerance calculations.
 *
 * Profile tolerances can control form, orientation, location, and size
 * of a feature depending on how they are specified:
 * - Without datums: Controls form only
 * - With datums: Controls form + orientation + location
 *
 * Zone types:
 * - Bilateral (default): Equal distribution on both sides of true profile
 * - Unilateral outside: All tolerance on outside of true profile
 * - Unilateral inside: All tolerance on inside of true profile
 * - Unequally disposed: Asymmetric distribution using U modifier
 *
 * Key concepts:
 * - Profile of a surface: 3D control
 * - Profile of a line: 2D cross-section control
 * - True profile defined by basic dimensions
 * - Deviations measured normal to true profile
 */

import {
  ProfileInput,
  ProfileResult,
  ProfilePoint,
  ProfileZoneType,
  CalculatorError,
  CalculatorResponse,
  Precision
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PRECISION: Precision = 4;

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
 * Calculate allowable zone boundaries based on zone type.
 *
 * Returns the allowable deviation in each direction (outside/inside)
 * from the true profile. Convention: + = outside, - = inside.
 */
export function calculateZoneBoundaries(
  tolerance: number,
  zoneType: ProfileZoneType,
  outsideAmount?: number
): { allowableOutside: number; allowableInside: number } {
  switch (zoneType) {
    case "bilateral":
      // Equal distribution: half on each side
      return {
        allowableOutside: tolerance / 2,
        allowableInside: tolerance / 2
      };

    case "unilateral-outside":
      // All tolerance on outside (material added)
      return {
        allowableOutside: tolerance,
        allowableInside: 0
      };

    case "unilateral-inside":
      // All tolerance on inside (material removed)
      return {
        allowableOutside: 0,
        allowableInside: tolerance
      };

    case "unequally-disposed":
      // Asymmetric: outsideAmount specified, rest on inside
      const outside = outsideAmount ?? tolerance / 2;
      const inside = tolerance - outside;
      return {
        allowableOutside: Math.max(0, outside),
        allowableInside: Math.max(0, inside)
      };

    default:
      // Default to bilateral
      return {
        allowableOutside: tolerance / 2,
        allowableInside: tolerance / 2
      };
  }
}

/**
 * Check if a single point conforms to the profile tolerance zone.
 */
function isPointConforming(
  deviation: number,
  allowableOutside: number,
  allowableInside: number
): boolean {
  // Positive deviation = outside true profile
  // Negative deviation = inside true profile
  if (deviation > 0) {
    return deviation <= allowableOutside;
  } else {
    return Math.abs(deviation) <= allowableInside;
  }
}

/**
 * Analyze an array of profile points for conformance.
 */
function analyzeProfilePoints(
  points: ProfilePoint[],
  allowableOutside: number,
  allowableInside: number
): {
  maxDeviationOutside: number;
  maxDeviationInside: number;
  nonConformingIndices: number[];
} {
  let maxDeviationOutside = 0;
  let maxDeviationInside = 0;
  const nonConformingIndices: number[] = [];

  points.forEach((point, index) => {
    const { deviation } = point;

    if (deviation > 0) {
      // Outside deviation
      maxDeviationOutside = Math.max(maxDeviationOutside, deviation);
      if (deviation > allowableOutside) {
        nonConformingIndices.push(index);
      }
    } else {
      // Inside deviation (negative)
      const absDeviation = Math.abs(deviation);
      maxDeviationInside = Math.max(maxDeviationInside, absDeviation);
      if (absDeviation > allowableInside) {
        nonConformingIndices.push(index);
      }
    }
  });

  return {
    maxDeviationOutside,
    maxDeviationInside,
    nonConformingIndices
  };
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate profile calculator inputs.
 */
function validateProfileInput(input: ProfileInput): CalculatorError[] {
  const errors: CalculatorError[] = [];

  if (input.tolerance <= 0) {
    errors.push({
      code: "INVALID_TOLERANCE",
      message: "Profile tolerance must be greater than zero",
      field: "tolerance"
    });
  }

  if (input.measuredPoints.length === 0) {
    errors.push({
      code: "NO_MEASUREMENTS",
      message: "At least one measured point is required",
      field: "measuredPoints"
    });
  }

  if (input.zoneType === "unequally-disposed") {
    if (input.outsideAmount === undefined) {
      errors.push({
        code: "MISSING_OUTSIDE_AMOUNT",
        message: "Outside amount is required for unequally disposed zones",
        field: "outsideAmount"
      });
    } else if (input.outsideAmount < 0 || input.outsideAmount > input.tolerance) {
      errors.push({
        code: "INVALID_OUTSIDE_AMOUNT",
        message: "Outside amount must be between 0 and total tolerance",
        field: "outsideAmount"
      });
    }
  }

  return errors;
}

// ============================================================================
// MAIN CALCULATOR FUNCTION
// ============================================================================

/**
 * Calculate profile tolerance conformance.
 *
 * Analyzes measured profile deviations against the specified
 * tolerance zone type (bilateral, unilateral, or unequally disposed).
 *
 * @param input - Profile calculation inputs
 * @returns Detailed profile calculation results or validation errors
 */
export function calculateProfile(input: ProfileInput): CalculatorResponse<ProfileResult> {
  const precision = input.precision ?? DEFAULT_PRECISION;

  // Validate inputs
  const errors = validateProfileInput(input);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Calculate zone boundaries
  const { allowableOutside, allowableInside } = calculateZoneBoundaries(
    input.tolerance,
    input.zoneType,
    input.outsideAmount
  );

  // Analyze all points
  const analysis = analyzeProfilePoints(
    input.measuredPoints,
    allowableOutside,
    allowableInside
  );

  // Round values
  const maxDeviationOutside = round(analysis.maxDeviationOutside, precision);
  const maxDeviationInside = round(analysis.maxDeviationInside, precision);

  // Total measured zone (actual spread of deviations)
  const totalMeasuredZone = round(maxDeviationOutside + maxDeviationInside, precision);

  // Determine pass/fail
  const pass = analysis.nonConformingIndices.length === 0;

  // Calculate tolerance consumed (as percentage of total zone)
  // Use the worst case: max of (outside/allowable, inside/allowable)
  const outsideConsumed = allowableOutside > 0 ? maxDeviationOutside / allowableOutside : 0;
  const insideConsumed = allowableInside > 0 ? maxDeviationInside / allowableInside : 0;
  const toleranceConsumed = round(Math.max(outsideConsumed, insideConsumed) * 100, 1);

  // Generate summary
  const summary = generateProfileSummary(
    pass,
    maxDeviationOutside,
    maxDeviationInside,
    allowableOutside,
    allowableInside,
    input.zoneType,
    analysis.nonConformingIndices.length
  );

  const result: ProfileResult = {
    status: pass ? "pass" : "fail",
    summary,
    timestamp: new Date().toISOString(),
    unit: input.unit,
    statedTolerance: input.tolerance,
    zoneType: input.zoneType,
    allowableOutside: round(allowableOutside, precision),
    allowableInside: round(allowableInside, precision),
    maxDeviationOutside,
    maxDeviationInside,
    totalMeasuredZone,
    toleranceConsumed,
    pointCount: input.measuredPoints.length,
    nonConformingPoints: analysis.nonConformingIndices
  };

  return { success: true, result };
}

/**
 * Generate human-readable summary for profile result.
 */
function generateProfileSummary(
  pass: boolean,
  maxOutside: number,
  maxInside: number,
  allowOutside: number,
  allowInside: number,
  zoneType: ProfileZoneType,
  nonConformingCount: number
): string {
  const lines: string[] = [];

  if (pass) {
    lines.push(`PASS: Profile tolerance satisfied.`);
  } else {
    lines.push(`FAIL: Profile tolerance exceeded at ${nonConformingCount} point(s).`);
  }

  const zoneDesc = getZoneDescription(zoneType);
  lines.push(`Zone type: ${zoneDesc}`);

  lines.push(
    `Max outside: ${maxOutside.toFixed(4)} (allowed: ${allowOutside.toFixed(4)})`
  );
  lines.push(
    `Max inside: ${maxInside.toFixed(4)} (allowed: ${allowInside.toFixed(4)})`
  );

  return lines.join(" ");
}

/**
 * Get human-readable zone type description.
 */
function getZoneDescription(zoneType: ProfileZoneType): string {
  switch (zoneType) {
    case "bilateral":
      return "Bilateral (equally disposed)";
    case "unilateral-outside":
      return "Unilateral (all outside)";
    case "unilateral-inside":
      return "Unilateral (all inside)";
    case "unequally-disposed":
      return "Unequally disposed";
    default:
      return zoneType;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Legacy function for backward compatibility.
 *
 * @deprecated Use calculateProfile() for full functionality.
 */
export function evaluateProfile(measured: number, tolerance: number) {
  const pass = measured <= tolerance;
  return { pass };
}

/**
 * Quick profile check with bilateral zone.
 */
export function quickProfileBilateral(
  maxDeviationOutside: number,
  maxDeviationInside: number,
  tolerance: number
): { pass: boolean; consumed: number } {
  const halfTol = tolerance / 2;
  const pass = maxDeviationOutside <= halfTol && maxDeviationInside <= halfTol;
  const consumed = Math.max(maxDeviationOutside, maxDeviationInside) / halfTol * 100;
  return { pass, consumed };
}

/**
 * Quick profile check with unilateral zone.
 */
export function quickProfileUnilateral(
  maxDeviation: number,
  tolerance: number,
  direction: "outside" | "inside"
): { pass: boolean; consumed: number } {
  const pass = maxDeviation <= tolerance;
  const consumed = (maxDeviation / tolerance) * 100;
  return { pass, consumed };
}

/**
 * Convert profile deviation from single value to bilateral.
 *
 * Some inspection reports give total deviation rather than +/- from true profile.
 */
export function totalToBilateral(
  totalDeviation: number
): { outside: number; inside: number } {
  // Assume symmetric distribution
  return {
    outside: totalDeviation / 2,
    inside: totalDeviation / 2
  };
}

/**
 * Create profile points from min/max deviation values.
 *
 * Useful when you only have the envelope rather than individual points.
 */
export function createEnvelopePoints(
  maxOutside: number,
  maxInside: number
): ProfilePoint[] {
  return [
    { position: 0, deviation: maxOutside },
    { position: 1, deviation: -maxInside }
  ];
}
