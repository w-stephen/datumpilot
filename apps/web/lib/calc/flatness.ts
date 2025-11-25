/**
 * Flatness Tolerance Calculator
 *
 * Implements ASME Y14.5-2018 flatness tolerance calculations.
 *
 * Flatness is a form tolerance that controls how flat a surface is.
 * The tolerance zone is defined by two parallel planes within which
 * all points of the surface must lie.
 *
 * Key concepts:
 * - Flatness is always RFS (no MMC/LMC modifiers allowed)
 * - No datum reference allowed (it's a form tolerance)
 * - Zone is defined by two parallel planes separated by the tolerance value
 * - Measurement: Total Indicator Reading (TIR) or point cloud analysis
 */

import {
  FlatnessInput,
  FlatnessResult,
  SurfacePoint,
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
 * Fit a best-fit plane to a set of 3D points using least squares.
 * Returns plane coefficients (a, b, c, d) for equation: ax + by + cz + d = 0
 *
 * For flatness, we fit a plane and measure deviations from it.
 */
function fitPlane(points: SurfacePoint[]): { a: number; b: number; c: number; d: number } {
  const n = points.length;

  if (n < 3) {
    // Not enough points for a plane - return horizontal plane at mean Z
    const meanZ = points.reduce((sum, p) => sum + p.z, 0) / n;
    return { a: 0, b: 0, c: 1, d: -meanZ };
  }

  // Calculate centroids
  let sumX = 0, sumY = 0, sumZ = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumZ += p.z;
  }
  const centroidX = sumX / n;
  const centroidY = sumY / n;
  const centroidZ = sumZ / n;

  // Build covariance matrix elements
  let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
  for (const p of points) {
    const dx = p.x - centroidX;
    const dy = p.y - centroidY;
    const dz = p.z - centroidZ;
    xx += dx * dx;
    xy += dx * dy;
    xz += dx * dz;
    yy += dy * dy;
    yz += dy * dz;
    zz += dz * dz;
  }

  // Solve for plane normal using simplified approach
  // For most flatness measurements, surface is roughly horizontal
  // Use the dominant direction perpendicular to surface
  const det_x = yy * zz - yz * yz;
  const det_y = xx * zz - xz * xz;
  const det_z = xx * yy - xy * xy;

  let a: number, b: number, c: number;

  if (det_z >= det_x && det_z >= det_y) {
    // Z-direction is most significant (surface roughly horizontal)
    a = (xy * yz - xz * yy) / det_z;
    b = (xy * xz - yz * xx) / det_z;
    c = 1;
  } else if (det_y >= det_x) {
    // Y-direction is most significant
    a = (yz * xy - xz * yy) / det_y;
    b = 1;
    c = (xy * xz - yz * xx) / det_y;
  } else {
    // X-direction is most significant
    a = 1;
    b = (xz * yz - xy * zz) / det_x;
    c = (xy * yz - xz * yy) / det_x;
  }

  // Normalize the normal vector
  const length = Math.sqrt(a * a + b * b + c * c);
  a /= length;
  b /= length;
  c /= length;

  // Calculate d from centroid
  const d = -(a * centroidX + b * centroidY + c * centroidZ);

  return { a, b, c, d };
}

/**
 * Calculate the signed distance from a point to a plane.
 * Positive = above plane (in direction of normal), Negative = below plane.
 */
function pointToPlaneDistance(
  point: SurfacePoint,
  plane: { a: number; b: number; c: number; d: number }
): number {
  return plane.a * point.x + plane.b * point.y + plane.c * point.z + plane.d;
}

/**
 * Calculate deviations of all points from a reference plane.
 */
function calculateDeviations(
  points: SurfacePoint[],
  plane: { a: number; b: number; c: number; d: number }
): number[] {
  return points.map(p => pointToPlaneDistance(p, plane));
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate flatness calculator inputs.
 */
function validateFlatnessInput(input: FlatnessInput): CalculatorError[] {
  const errors: CalculatorError[] = [];

  if (input.tolerance <= 0) {
    errors.push({
      code: "INVALID_TOLERANCE",
      message: "Flatness tolerance must be greater than zero",
      field: "tolerance"
    });
  }

  if (input.measuredPoints.length === 0 && input.totalIndicatorReading === undefined) {
    errors.push({
      code: "NO_MEASUREMENTS",
      message: "Either measured points or total indicator reading must be provided",
      field: "measuredPoints"
    });
  }

  if (input.totalIndicatorReading !== undefined && input.totalIndicatorReading < 0) {
    errors.push({
      code: "INVALID_TIR",
      message: "Total indicator reading cannot be negative",
      field: "totalIndicatorReading"
    });
  }

  return errors;
}

// ============================================================================
// MAIN CALCULATOR FUNCTION
// ============================================================================

/**
 * Calculate flatness tolerance conformance.
 *
 * Analyzes surface points to determine if they fall within the
 * specified flatness tolerance zone (two parallel planes).
 *
 * @param input - Flatness calculation inputs
 * @returns Detailed flatness calculation results or validation errors
 */
export function calculateFlatness(input: FlatnessInput): CalculatorResponse<FlatnessResult> {
  const precision = input.precision ?? DEFAULT_PRECISION;

  // Validate inputs
  const errors = validateFlatnessInput(input);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  let measuredFlatness: number;
  let maxDeviation: number;
  let minDeviation: number;

  if (input.totalIndicatorReading !== undefined) {
    // Use pre-calculated TIR
    measuredFlatness = input.totalIndicatorReading;
    maxDeviation = input.totalIndicatorReading / 2;
    minDeviation = -input.totalIndicatorReading / 2;
  } else {
    // Calculate from point cloud
    const plane = fitPlane(input.measuredPoints);
    const deviations = calculateDeviations(input.measuredPoints, plane);

    maxDeviation = Math.max(...deviations);
    minDeviation = Math.min(...deviations);
    measuredFlatness = maxDeviation - minDeviation;
  }

  // Round values
  measuredFlatness = round(measuredFlatness, precision);
  maxDeviation = round(maxDeviation, precision);
  minDeviation = round(minDeviation, precision);

  const totalZoneWidth = round(maxDeviation - minDeviation, precision);

  // Determine pass/fail
  const pass = measuredFlatness <= input.tolerance;

  // Calculate percentage of tolerance consumed
  const toleranceConsumed = round((measuredFlatness / input.tolerance) * 100, 1);

  // Generate summary
  const summary = generateFlatnessSummary(
    pass,
    measuredFlatness,
    input.tolerance,
    toleranceConsumed
  );

  const result: FlatnessResult = {
    status: pass ? "pass" : "fail",
    summary,
    timestamp: new Date().toISOString(),
    unit: input.unit,
    statedTolerance: input.tolerance,
    measuredFlatness,
    maxDeviation,
    minDeviation,
    totalZoneWidth,
    toleranceConsumed,
    pointCount: input.measuredPoints.length
  };

  return { success: true, result };
}

/**
 * Generate human-readable summary for flatness result.
 */
function generateFlatnessSummary(
  pass: boolean,
  measured: number,
  tolerance: number,
  consumed: number
): string {
  if (pass) {
    return `PASS: Flatness ${measured.toFixed(4)} is within tolerance ${tolerance.toFixed(4)} (${consumed.toFixed(1)}% consumed)`;
  } else {
    return `FAIL: Flatness ${measured.toFixed(4)} exceeds tolerance ${tolerance.toFixed(4)} (${consumed.toFixed(1)}% consumed)`;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Legacy function for backward compatibility.
 *
 * @deprecated Use calculateFlatness() for full functionality.
 */
export function evaluateFlatness(measuredVariation: number, tolerance: number) {
  const pass = measuredVariation <= tolerance;
  return { pass };
}

/**
 * Quick flatness check with minimal inputs.
 */
export function quickFlatness(
  totalIndicatorReading: number,
  tolerance: number
): { pass: boolean; consumed: number } {
  const pass = totalIndicatorReading <= tolerance;
  const consumed = (totalIndicatorReading / tolerance) * 100;
  return { pass, consumed };
}

/**
 * Calculate flatness from min/max deviations.
 */
export function flatnessFromMinMax(
  minDeviation: number,
  maxDeviation: number,
  tolerance: number
): { flatness: number; pass: boolean } {
  const flatness = maxDeviation - minDeviation;
  return {
    flatness,
    pass: flatness <= tolerance
  };
}
