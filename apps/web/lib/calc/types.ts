/**
 * Shared types for GD&T calculators.
 * These types support deterministic calculations for position, flatness,
 * perpendicularity, and profile tolerances per ASME Y14.5-2018.
 */

import { Unit, MaterialConditionSymbol, FeatureType} from "@/lib/fcf/schema";

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Result status for any calculation.
 */
export type PassFailStatus = "pass" | "fail" | "warning";

/**
 * Rounding precision for calculations.
 */
export type Precision = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Base input fields common to all calculators.
 */
export interface BaseCalculatorInput {
  /** Unit system for all dimensional values */
  unit: Unit;
  /** Decimal precision for output rounding (default: 4) */
  precision?: Precision;
}

/**
 * Base output fields common to all calculator results.
 */
export interface BaseCalculatorResult {
  /** Overall pass/fail determination */
  status: PassFailStatus;
  /** Human-readable summary */
  summary: string;
  /** Calculation timestamp (ISO 8601) */
  timestamp: string;
  /** Unit used in calculations */
  unit: Unit;
}

// ============================================================================
// SIZE DIMENSION TYPES
// ============================================================================

/**
 * Size limits derived from nominal and tolerances.
 */
export interface SizeLimits {
  /** Nominal (basic) size */
  nominal: number;
  /** Maximum Material Condition size */
  mmc: number;
  /** Least Material Condition size */
  lmc: number;
  /** Upper size limit */
  upperLimit: number;
  /** Lower size limit */
  lowerLimit: number;
}

/**
 * Input for size dimension calculations.
 */
export interface SizeDimensionInput {
  /** Nominal size */
  nominal: number;
  /** Plus tolerance (bilateral or unilateral) */
  tolerancePlus: number;
  /** Minus tolerance (bilateral or unilateral) */
  toleranceMinus: number;
  /** Feature type determines MMC/LMC interpretation */
  featureType: FeatureType;
}

// ============================================================================
// POSITION CALCULATOR TYPES
// ============================================================================

/**
 * Feature classification for position calculations.
 * - Internal: holes, slots (MMC = smallest size)
 * - External: pins, bosses (MMC = largest size)
 */
export type FeatureClass = "internal" | "external";

/**
 * Measured position data from CMM or inspection.
 */
export interface MeasuredPosition {
  /** Actual X coordinate of feature center */
  actualX: number;
  /** Actual Y coordinate of feature center */
  actualY: number;
  /** Actual Z coordinate (for 3D positioning, optional) */
  actualZ?: number;
  /** Actual measured size (diameter for holes/pins) */
  actualSize: number;
}

/**
 * True (basic) position from drawing.
 */
export interface TruePosition {
  /** Basic X coordinate */
  basicX: number;
  /** Basic Y coordinate */
  basicY: number;
  /** Basic Z coordinate (optional) */
  basicZ?: number;
}

/**
 * Input for position tolerance calculations.
 */
export interface PositionInput extends BaseCalculatorInput {
  /** Stated geometric tolerance at MMC/LMC/RFS */
  geometricTolerance: number;
  /** Material condition modifier on tolerance */
  materialCondition: MaterialConditionSymbol;
  /** Feature type (determines internal/external) */
  featureType: FeatureType;
  /** Size dimension specification */
  sizeDimension: SizeDimensionInput;
  /** True (basic) position from drawing */
  truePosition: TruePosition;
  /** Measured feature data from inspection */
  measured: MeasuredPosition;
  /** Whether tolerance zone is diametral (cylindrical) */
  diametralZone: boolean;
}

/**
 * Position calculation detailed results.
 */
export interface PositionResult extends BaseCalculatorResult {
  /** Input tolerance value */
  statedTolerance: number;
  /** Material condition applied */
  materialCondition: MaterialConditionSymbol;
  /** Calculated size limits */
  sizeLimits: SizeLimits;
  /** Actual measured size */
  actualSize: number;
  /** Bonus tolerance from size departure */
  bonusTolerance: number;
  /** Total allowable tolerance (stated + bonus) */
  totalAllowableTolerance: number;
  /** Virtual condition boundary */
  virtualCondition: number;
  /** Resultant condition boundary */
  resultantCondition: number;
  /** Deviation in X direction */
  deviationX: number;
  /** Deviation in Y direction */
  deviationY: number;
  /** Deviation in Z direction (if applicable) */
  deviationZ?: number;
  /** Total radial deviation (distance from true position) */
  radialDeviation: number;
  /** Actual position tolerance consumed (diametral) */
  actualPositionTolerance: number;
  /** Percentage of tolerance consumed */
  toleranceConsumed: number;
  /** Whether actual size is within size limits */
  sizeConformance: boolean;
  /** Whether position is within total allowable tolerance */
  positionConformance: boolean;
}

// ============================================================================
// FLATNESS CALCULATOR TYPES
// ============================================================================

/**
 * Surface measurement point.
 */
export interface SurfacePoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Input for flatness calculations.
 */
export interface FlatnessInput extends BaseCalculatorInput {
  /** Stated flatness tolerance */
  tolerance: number;
  /** Array of measured surface points */
  measuredPoints: SurfacePoint[];
  /** Optional: pre-calculated total indicator reading */
  totalIndicatorReading?: number;
}

/**
 * Flatness calculation results.
 */
export interface FlatnessResult extends BaseCalculatorResult {
  /** Stated flatness tolerance */
  statedTolerance: number;
  /** Calculated flatness deviation (zone width) */
  measuredFlatness: number;
  /** Highest point deviation from reference plane */
  maxDeviation: number;
  /** Lowest point deviation from reference plane */
  minDeviation: number;
  /** Total zone width (max - min) */
  totalZoneWidth: number;
  /** Percentage of tolerance consumed */
  toleranceConsumed: number;
  /** Number of points analyzed */
  pointCount: number;
}

// ============================================================================
// PERPENDICULARITY CALCULATOR TYPES
// ============================================================================

/**
 * Input for perpendicularity calculations.
 */
export interface PerpendicularityInput extends BaseCalculatorInput {
  /** Stated perpendicularity tolerance */
  tolerance: number;
  /** Material condition modifier (if applicable) */
  materialCondition?: MaterialConditionSymbol;
  /** Feature type */
  featureType: FeatureType;
  /** Size dimension (required for MMC/LMC) */
  sizeDimension?: SizeDimensionInput;
  /** Actual measured size (required for MMC/LMC) */
  actualSize?: number;
  /** Measured angular deviation from perpendicular (degrees) */
  angularDeviation?: number;
  /** Measured linear deviation over specified length */
  linearDeviation?: number;
  /** Length over which linear deviation is measured */
  measurementLength?: number;
}

/**
 * Perpendicularity calculation results.
 */
export interface PerpendicularityResult extends BaseCalculatorResult {
  /** Stated perpendicularity tolerance */
  statedTolerance: number;
  /** Material condition applied */
  materialCondition: MaterialConditionSymbol;
  /** Bonus tolerance (0 for RFS) */
  bonusTolerance: number;
  /** Total allowable tolerance */
  totalAllowableTolerance: number;
  /** Measured deviation */
  measuredDeviation: number;
  /** Virtual condition (for MMC/LMC on FOS) */
  virtualCondition?: number;
  /** Size limits (if FOS) */
  sizeLimits?: SizeLimits;
  /** Percentage of tolerance consumed */
  toleranceConsumed: number;
}

// ============================================================================
// PROFILE CALCULATOR TYPES
// ============================================================================

/**
 * Profile zone type.
 */
export type ProfileZoneType = "bilateral" | "unilateral-outside" | "unilateral-inside" | "unequally-disposed";

/**
 * Profile measurement point with deviation.
 */
export interface ProfilePoint {
  /** Position along profile (parameter or distance) */
  position: number;
  /** Measured deviation from true profile (+ = outside, - = inside) */
  deviation: number;
}

/**
 * Input for profile calculations.
 */
export interface ProfileInput extends BaseCalculatorInput {
  /** Total profile tolerance zone width */
  tolerance: number;
  /** Zone distribution type */
  zoneType: ProfileZoneType;
  /** For unequally disposed: amount outside true profile */
  outsideAmount?: number;
  /** Material condition modifier (rarely used for profile) */
  materialCondition?: MaterialConditionSymbol;
  /** Measured profile points with deviations */
  measuredPoints: ProfilePoint[];
  /** Whether profile controls form only (no datums) */
  formOnly: boolean;
}

/**
 * Profile calculation results.
 */
export interface ProfileResult extends BaseCalculatorResult {
  /** Stated profile tolerance */
  statedTolerance: number;
  /** Zone type applied */
  zoneType: ProfileZoneType;
  /** Allowable deviation outside true profile */
  allowableOutside: number;
  /** Allowable deviation inside true profile */
  allowableInside: number;
  /** Maximum measured deviation outside */
  maxDeviationOutside: number;
  /** Maximum measured deviation inside */
  maxDeviationInside: number;
  /** Total measured zone width */
  totalMeasuredZone: number;
  /** Percentage of tolerance consumed */
  toleranceConsumed: number;
  /** Number of points analyzed */
  pointCount: number;
  /** Points that exceed tolerance (indices) */
  nonConformingPoints: number[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Calculator error with code and details.
 */
export interface CalculatorError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Wrapper for calculator results that may fail.
 */
export type CalculatorResponse<T extends BaseCalculatorResult> =
  | { success: true; result: T }
  | { success: false; errors: CalculatorError[] };
