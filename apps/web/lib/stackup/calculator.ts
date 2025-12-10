import type {
  StackupAnalysis,
  StackupDimension,
  StackupResult,
  DimensionContribution,
  AcceptanceCriteria,
  AnalysisMethod,
} from "./schema";

// Default process capability if not specified (typical manufacturing capability)
const DEFAULT_CP = 1.33;

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate stack-up results for the given analysis.
 * Pure function with no side effects.
 *
 * Handles asymmetric tolerances correctly by calculating the mean shift
 * from the drawing nominal to the center of each tolerance zone.
 */
export function calculateStackup(analysis: StackupAnalysis): StackupResult {
  const { dimensions, analysisMethod, acceptanceCriteria } = analysis;

  // 1. Calculate nominal result (sum of signed drawing nominals)
  const nominalResult = calculateNominal(dimensions);

  // 2. Calculate mean shift for asymmetric tolerances
  // e.g., 50 +0.025/-0 is centered at 50.0125, not 50.0
  const meanShift = calculateMeanShift(dimensions);

  // 3. The "centered nominal" accounts for asymmetric tolerances
  const centeredNominal = nominalResult + meanShift;

  // 4. Calculate total tolerance based on method
  const totalTolerance = calculateTotalTolerance(dimensions, analysisMethod);

  // 5. Calculate min/max values from the centered nominal
  const maximumValue = centeredNominal + totalTolerance;
  const minimumValue = centeredNominal - totalTolerance;

  // 6. Calculate contribution percentages
  const contributions = calculateContributions(dimensions, analysisMethod);

  // 7. Check acceptance criteria
  const { passes, marginToMinimum, marginToMaximum } = checkAcceptance(
    minimumValue,
    maximumValue,
    acceptanceCriteria
  );

  return {
    nominalResult, // Return drawing nominal for display
    totalTolerance,
    maximumValue,
    minimumValue,
    passesAcceptanceCriteria: passes,
    marginToMinimum,
    marginToMaximum,
    contributions,
    method: analysisMethod,
  };
}

// ============================================================================
// NOMINAL & MEAN SHIFT CALCULATIONS
// ============================================================================

/**
 * Calculate nominal closing dimension based on drawing nominals.
 * Sum of (sign * nominal * sensitivityCoefficient) for each dimension.
 */
export function calculateNominal(dimensions: StackupDimension[]): number {
  return dimensions.reduce((sum, dim) => {
    const signMultiplier = dim.sign === "positive" ? 1 : -1;
    const sensitivity = dim.sensitivityCoefficient ?? 1;
    return sum + signMultiplier * dim.nominal * sensitivity;
  }, 0);
}

/**
 * Calculate the mean shift caused by asymmetric tolerances.
 *
 * For asymmetric tolerances, the center of the tolerance zone is shifted
 * from the drawing nominal. For example:
 * - 50 +0.025/-0 has center at 50.0125 (shift = +0.0125)
 * - 50 +0/-0.013 has center at 49.9935 (shift = -0.0065)
 *
 * Formula: shift = (tolerancePlus - toleranceMinus) / 2
 *
 * The total mean shift accounts for the sign convention:
 * - Positive dimensions: shift adds directly
 * - Negative dimensions: shift subtracts (because the dimension subtracts from the gap)
 */
export function calculateMeanShift(dimensions: StackupDimension[]): number {
  return dimensions.reduce((sum, dim) => {
    const signMultiplier = dim.sign === "positive" ? 1 : -1;
    const sensitivity = dim.sensitivityCoefficient ?? 1;

    // The shift of the center point relative to nominal
    const shift = (dim.tolerancePlus - dim.toleranceMinus) / 2;

    return sum + signMultiplier * shift * sensitivity;
  }, 0);
}

// ============================================================================
// TOLERANCE CALCULATIONS BY METHOD
// ============================================================================

/**
 * Calculate total tolerance using the specified method.
 */
export function calculateTotalTolerance(
  dimensions: StackupDimension[],
  method: AnalysisMethod
): number {
  switch (method) {
    case "worst-case":
      return calculateWorstCase(dimensions);
    case "rss":
      return calculateRSS(dimensions);
    case "six-sigma":
      return calculateSixSigma(dimensions);
  }
}

/**
 * Worst-Case (Arithmetic) Method
 * T_wc = Σ|t_i × S_i|
 *
 * All tolerances add directly. Guarantees 100% assembly success.
 */
export function calculateWorstCase(dimensions: StackupDimension[]): number {
  return dimensions.reduce((sum, dim) => {
    const bilateralTol = getBilateralTolerance(dim);
    const sensitivity = dim.sensitivityCoefficient ?? 1;
    return sum + Math.abs(bilateralTol * sensitivity);
  }, 0);
}

/**
 * RSS (Root Sum Square) Method
 * T_rss = √(Σ(t_i × S_i)²)
 *
 * Statistical combination assuming normal distribution.
 * Results in approximately 99.73% (3σ) assembly success.
 */
export function calculateRSS(dimensions: StackupDimension[]): number {
  const sumOfSquares = dimensions.reduce((sum, dim) => {
    const bilateralTol = getBilateralTolerance(dim);
    const sensitivity = dim.sensitivityCoefficient ?? 1;
    return sum + Math.pow(bilateralTol * sensitivity, 2);
  }, 0);

  return Math.sqrt(sumOfSquares);
}

/**
 * Six Sigma Method
 * σ_i = t_i / (3 × Cp_i)
 * T_6σ = 3 × √(Σσ_i²)
 *
 * Uses actual process capability for more realistic prediction.
 */
export function calculateSixSigma(dimensions: StackupDimension[]): number {
  const sumOfVariances = dimensions.reduce((sum, dim) => {
    const bilateralTol = getBilateralTolerance(dim);
    const sensitivity = dim.sensitivityCoefficient ?? 1;
    const cp = dim.processCapability ?? DEFAULT_CP;

    // Standard deviation for this dimension
    // σ = t / (3 × Cp) where t is the bilateral tolerance
    const sigma = (bilateralTol * sensitivity) / (3 * cp);

    return sum + Math.pow(sigma, 2);
  }, 0);

  // Total tolerance at 3σ level
  return 3 * Math.sqrt(sumOfVariances);
}

// ============================================================================
// CONTRIBUTION ANALYSIS
// ============================================================================

/**
 * Calculate percent contribution of each dimension to total variation.
 * Based on variance contribution: %C_i = (t_i² × S_i²) / Σ(t_n² × S_n²) × 100%
 */
export function calculateContributions(
  dimensions: StackupDimension[],
  method: AnalysisMethod
): DimensionContribution[] {
  // For worst-case, contribution is based on absolute tolerance proportion
  if (method === "worst-case") {
    return calculateWorstCaseContributions(dimensions);
  }

  // For RSS and Six Sigma, contribution is based on variance
  return calculateVarianceContributions(dimensions, method);
}

function calculateWorstCaseContributions(
  dimensions: StackupDimension[]
): DimensionContribution[] {
  const tolerances = dimensions.map((dim) => {
    const bilateralTol = getBilateralTolerance(dim);
    const sensitivity = dim.sensitivityCoefficient ?? 1;
    return {
      id: dim.id,
      absoluteTol: Math.abs(bilateralTol * sensitivity),
    };
  });

  const totalTol = tolerances.reduce((sum, t) => sum + t.absoluteTol, 0);

  return tolerances.map((t) => ({
    dimensionId: t.id,
    varianceContribution: Math.pow(t.absoluteTol, 2), // For consistency
    percentContribution: totalTol > 0 ? (t.absoluteTol / totalTol) * 100 : 0,
  }));
}

function calculateVarianceContributions(
  dimensions: StackupDimension[],
  method: "rss" | "six-sigma"
): DimensionContribution[] {
  const variances = dimensions.map((dim) => {
    const bilateralTol = getBilateralTolerance(dim);
    const sensitivity = dim.sensitivityCoefficient ?? 1;

    let variance: number;
    if (method === "six-sigma") {
      const cp = dim.processCapability ?? DEFAULT_CP;
      const sigma = (bilateralTol * sensitivity) / (3 * cp);
      variance = Math.pow(sigma, 2);
    } else {
      variance = Math.pow(bilateralTol * sensitivity, 2);
    }

    return { id: dim.id, variance };
  });

  const totalVariance = variances.reduce((sum, v) => sum + v.variance, 0);

  return variances.map((v) => ({
    dimensionId: v.id,
    varianceContribution: v.variance,
    percentContribution: totalVariance > 0 ? (v.variance / totalVariance) * 100 : 0,
  }));
}

// ============================================================================
// ACCEPTANCE CRITERIA
// ============================================================================

interface AcceptanceResult {
  passes: boolean;
  marginToMinimum?: number;
  marginToMaximum?: number;
}

/**
 * Check if results meet acceptance criteria and calculate margins.
 */
export function checkAcceptance(
  minimumValue: number,
  maximumValue: number,
  criteria: AcceptanceCriteria
): AcceptanceResult {
  let passes = true;
  let marginToMinimum: number | undefined;
  let marginToMaximum: number | undefined;

  if (criteria.minimum !== undefined) {
    marginToMinimum = minimumValue - criteria.minimum;
    if (minimumValue < criteria.minimum) {
      passes = false;
    }
  }

  if (criteria.maximum !== undefined) {
    marginToMaximum = criteria.maximum - maximumValue;
    if (maximumValue > criteria.maximum) {
      passes = false;
    }
  }

  return { passes, marginToMinimum, marginToMaximum };
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface StackupValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate stack-up input before calculation.
 */
export function validateStackupInput(
  analysis: StackupAnalysis
): StackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Minimum dimensions
  if (analysis.dimensions.length < 2) {
    errors.push("Stack-up requires at least 2 dimensions");
  }

  // Check for valid tolerances
  analysis.dimensions.forEach((dim, index) => {
    if (dim.tolerancePlus < 0 || dim.toleranceMinus < 0) {
      errors.push(
        `Dimension ${index + 1} "${dim.name}": Tolerances must be non-negative`
      );
    }

    if (dim.tolerancePlus === 0 && dim.toleranceMinus === 0) {
      warnings.push(
        `Dimension ${index + 1} "${dim.name}": Zero tolerance (basic dimension)`
      );
    }

    if (dim.sensitivityCoefficient === 0) {
      warnings.push(
        `Dimension ${index + 1} "${dim.name}": Zero sensitivity (no contribution)`
      );
    }

    if (
      analysis.analysisMethod === "six-sigma" &&
      dim.processCapability !== undefined
    ) {
      if (dim.processCapability < 1.0) {
        warnings.push(
          `Dimension ${index + 1} "${dim.name}": Cp < 1.0 indicates incapable process`
        );
      }
    }
  });

  // Sign convention check (optional but helpful)
  const hasPositive = analysis.dimensions.some((d) => d.sign === "positive");
  const hasNegative = analysis.dimensions.some((d) => d.sign === "negative");

  if (!hasPositive || !hasNegative) {
    warnings.push("All dimensions have same sign. Verify sign convention is correct.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert plus/minus tolerance to bilateral (mean) tolerance.
 */
export function getBilateralTolerance(dim: StackupDimension): number {
  return (dim.tolerancePlus + dim.toleranceMinus) / 2;
}

/**
 * Round to specified decimal places.
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format result with unit.
 */
export function formatResult(
  value: number,
  decimals: number,
  unit: "mm" | "inch"
): string {
  return `${roundTo(value, decimals)} ${unit}`;
}

/**
 * Compare methods side-by-side.
 */
export function compareAllMethods(
  analysis: StackupAnalysis
): Record<AnalysisMethod, StackupResult> {
  return {
    "worst-case": calculateStackup({ ...analysis, analysisMethod: "worst-case" }),
    rss: calculateStackup({ ...analysis, analysisMethod: "rss" }),
    "six-sigma": calculateStackup({ ...analysis, analysisMethod: "six-sigma" }),
  };
}

/**
 * Get default process capability constant.
 */
export function getDefaultProcessCapability(): number {
  return DEFAULT_CP;
}
