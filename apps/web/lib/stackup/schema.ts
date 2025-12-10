import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export type StackupSign = "positive" | "negative";
export type PositiveDirection = "left-to-right" | "right-to-left" | "bottom-to-top" | "top-to-bottom";
export type AnalysisMethod = "worst-case" | "rss" | "six-sigma";
export type StackupUnit = "mm" | "inch";

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const stackupSignSchema = z.enum(["positive", "negative"]);
const positiveDirectionSchema = z.enum([
  "left-to-right",
  "right-to-left",
  "bottom-to-top",
  "top-to-bottom",
]);
const analysisMethodSchema = z.enum(["worst-case", "rss", "six-sigma"]);
const stackupUnitSchema = z.enum(["mm", "inch"]);

/**
 * Individual dimension in the tolerance stack.
 * Each dimension contributes to the overall assembly gap/closure.
 */
export const StackupDimensionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  /** Nominal dimension value in specified units */
  nominal: z.number(),
  /** Plus tolerance (always stored as positive value) */
  tolerancePlus: z.number().nonnegative(),
  /** Minus tolerance (always stored as positive value) */
  toleranceMinus: z.number().nonnegative(),
  /**
   * Sign convention:
   * - positive: increasing this dimension increases the closing gap
   * - negative: increasing this dimension decreases the closing gap
   */
  sign: stackupSignSchema,
  /** Sensitivity coefficient for non-1:1 relationships (default: 1) */
  sensitivityCoefficient: z.number().default(1),
  /** Process capability (Cp) for Six Sigma method */
  processCapability: z.number().positive().optional(),
  /** Source drawing reference */
  sourceDrawing: z.string().max(100).optional(),
  /** Drawing revision */
  sourceRevision: z.string().max(20).optional(),
});

/**
 * Acceptance criteria for the stack-up result.
 * At least one limit (min or max) must be specified.
 */
export const AcceptanceCriteriaSchema = z
  .object({
    /** Minimum acceptable value (e.g., minimum clearance) */
    minimum: z.number().optional(),
    /** Maximum acceptable value (e.g., maximum interference) */
    maximum: z.number().optional(),
  })
  .refine((data) => data.minimum !== undefined || data.maximum !== undefined, {
    message: "At least one acceptance limit required",
  });

/**
 * Complete stack-up analysis definition.
 * Contains all dimensions and configuration for calculating tolerance accumulation.
 */
export const StackupAnalysisSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  /** What is being measured (e.g., "Gap between bearing and housing") */
  measurementObjective: z.string().min(1).max(500),
  /** Pass/fail criteria for the analysis */
  acceptanceCriteria: AcceptanceCriteriaSchema,
  /** Reference direction for positive sign convention */
  positiveDirection: positiveDirectionSchema,
  /** List of dimensions in the stack (2-50 required) */
  dimensions: z.array(StackupDimensionSchema).min(2).max(50),
  /** Statistical method for tolerance calculation */
  analysisMethod: analysisMethodSchema,
  /** Unit system for all dimensions */
  unit: stackupUnitSchema,
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// ============================================================================
// CALCULATION RESULT SCHEMAS (computed, not stored)
// ============================================================================

/**
 * Contribution of a single dimension to the overall tolerance.
 */
export const DimensionContributionSchema = z.object({
  dimensionId: z.string().uuid(),
  /** Percentage of total variance contributed by this dimension */
  percentContribution: z.number().min(0).max(100),
  /** Absolute variance contribution (tolerance² for RSS) */
  varianceContribution: z.number().nonnegative(),
});

/**
 * Complete result of a stack-up calculation.
 * Generated on-demand, not persisted.
 */
export const StackupResultSchema = z.object({
  /** Sum of (sign × nominal × sensitivity) for all dimensions */
  nominalResult: z.number(),
  /** Total tolerance based on analysis method */
  totalTolerance: z.number().nonnegative(),
  /** Nominal + tolerance (or max statistical limit) */
  maximumValue: z.number(),
  /** Nominal - tolerance (or min statistical limit) */
  minimumValue: z.number(),
  /** Whether result meets acceptance criteria */
  passesAcceptanceCriteria: z.boolean(),
  /** Distance from minimumValue to acceptance minimum (if defined) */
  marginToMinimum: z.number().optional(),
  /** Distance from maximumValue to acceptance maximum (if defined) */
  marginToMaximum: z.number().optional(),
  /** Per-dimension contribution breakdown */
  contributions: z.array(DimensionContributionSchema),
  /** Method used for this calculation */
  method: analysisMethodSchema,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type StackupDimension = z.infer<typeof StackupDimensionSchema>;
export type AcceptanceCriteria = z.infer<typeof AcceptanceCriteriaSchema>;
export type StackupAnalysis = z.infer<typeof StackupAnalysisSchema>;
export type DimensionContribution = z.infer<typeof DimensionContributionSchema>;
export type StackupResult = z.infer<typeof StackupResultSchema>;

/** Input type for creating a new stack-up (omits server-generated fields) */
export type CreateStackupInput = Omit<
  StackupAnalysis,
  "id" | "createdBy" | "createdAt" | "updatedAt"
>;

/** Input type for updating an existing stack-up */
export type UpdateStackupInput = Partial<
  Omit<StackupAnalysis, "id" | "projectId" | "createdBy" | "createdAt">
>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse and validate raw data as a StackupAnalysis.
 * @throws ZodError if validation fails
 */
export function parseStackupAnalysis(raw: unknown): StackupAnalysis {
  return StackupAnalysisSchema.parse(raw);
}

/**
 * Type guard for StackupAnalysis.
 */
export function isStackupAnalysis(raw: unknown): raw is StackupAnalysis {
  return StackupAnalysisSchema.safeParse(raw).success;
}

/**
 * Parse and validate raw data as a StackupDimension.
 * @throws ZodError if validation fails
 */
export function parseStackupDimension(raw: unknown): StackupDimension {
  return StackupDimensionSchema.parse(raw);
}

/**
 * Type guard for StackupDimension.
 */
export function isStackupDimension(raw: unknown): raw is StackupDimension {
  return StackupDimensionSchema.safeParse(raw).success;
}

/**
 * Default process capability (Cp) for Six Sigma calculations.
 * 1.33 represents typical manufacturing capability.
 */
export const DEFAULT_PROCESS_CAPABILITY = 1.33;

// ============================================================================
// VALIDATION NOTES
// ============================================================================

/**
 * Key validation rules for stack-up analyses:
 * - Sign convention: positive dims increase gap, negative dims decrease gap
 * - Tolerances stored as positive values; bilateral = equal plus/minus
 * - Unilateral tolerances: one value is 0
 * - Six Sigma requires processCapability per dimension (defaults to 1.33)
 * - Verification: Sum of (sign × nominal × sensitivity) = nominal closing dimension
 */
export const stackupConstraintNotes: string[] = [
  "Positive sign means increasing this dimension increases the closing gap/result.",
  "Negative sign means increasing this dimension decreases the closing gap/result.",
  "Tolerances are always stored as positive values (tolerancePlus, toleranceMinus).",
  "For symmetric bilateral tolerance: tolerancePlus = toleranceMinus.",
  "For unilateral tolerance: set one value to 0.",
  "Six Sigma method uses Cp (process capability) per dimension; defaults to 1.33 if not specified.",
  "RSS method assumes normal distribution and calculates root-sum-square of tolerances.",
  "Worst-case adds all tolerances directly (most conservative).",
];
