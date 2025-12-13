import {
  FcfJson,
  FeatureType,
  MaterialConditionSymbol,
  Characteristic,
  frameModifierSchema
} from "@/lib/fcf/schema";
import { errorCodes, ErrorCode } from "./errorCodes";

// ============================================================================
// VALIDATION MODEL
// ============================================================================

export type Severity = "error" | "warning";

/**
 * Structured validation issue with full traceability.
 */
export type ValidationIssue = {
  /** Error/warning code from errorCodes catalog */
  code: ErrorCode;
  /** Human-readable message */
  message: string;
  /** JSON path to the offending field (e.g., "datums[0].materialCondition") */
  path: string;
  /** Severity level */
  severity: Severity;
  /** Optional context for AI/UI to provide guidance */
  context?: {
    characteristic?: Characteristic;
    featureType?: FeatureType;
    suggestion?: string;
  };
};

/**
 * Result of FCF validation containing overall validity and structured issues.
 */
export type ValidationResult = {
  /** True if no errors (warnings allowed) */
  valid: boolean;
  /** List of all issues found */
  issues: ValidationIssue[];
  /** Convenience accessors */
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  /** Summary counts */
  summary: {
    errorCount: number;
    warningCount: number;
  };
};

// ============================================================================
// RULE DEFINITION
// ============================================================================

/**
 * Rule category for organization and filtering.
 */
export type RuleCategory =
  | "material-condition"
  | "datum-requirements"
  | "composite-configuration"
  | "tolerance-zone"
  | "feature-type"
  | "modifier-compatibility";

/**
 * A validation rule is a pure function with metadata.
 */
export type Rule = {
  /** Unique rule ID matching error code */
  code: ErrorCode;
  /** Rule category for grouping */
  category: RuleCategory;
  /** Human-readable description */
  description: string;
  /** Default severity */
  severity: Severity;
  /** Quick guard: returns true if rule is applicable to this FCF */
  applies: (fcf: FcfJson) => boolean;
  /** Evaluation: returns zero or more issues */
  evaluate: (fcf: FcfJson) => ValidationIssue[];
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Features of size that can use material condition modifiers */
const featureOfSizeTypes: FeatureType[] = ["hole", "slot", "pin", "boss"];

/** Form tolerances that cannot reference datums or use MMC/LMC */
const formCharacteristics: Characteristic[] = ["flatness"];
// Note: straightness, circularity, cylindricity would be added when schema expands

/** Orientation tolerances requiring datum reference */
const orientationCharacteristics: Characteristic[] = ["perpendicularity"];
// Note: parallelism, angularity would be added when schema expands

/** Location tolerances requiring datum reference */
const locationCharacteristics: Characteristic[] = ["position"];
// Note: Concentricity and Symmetry were removed from ASME Y14.5-2018

/**
 * Check if FCF uses material condition anywhere (tolerance or datums).
 */
function usesMaterialCondition(fcf: FcfJson): boolean {
  const toleranceHasMc = fcf.tolerance.materialCondition !== undefined;
  const datumsHaveMc = (fcf.datums ?? []).some((d) => d.materialCondition !== undefined);
  const compositeHasMc = fcf.composite
    ? fcf.composite.segments.some(
        (seg) =>
          seg.tolerance.materialCondition !== undefined ||
          (seg.datums ?? []).some((d) => d.materialCondition !== undefined)
      )
    : false;
  return toleranceHasMc || datumsHaveMc || compositeHasMc;
}

/**
 * Check if tolerance uses MMC or LMC (not RFS).
 */
function usesMMCOrLMC(mc: MaterialConditionSymbol | undefined): boolean {
  return mc === "MMC" || mc === "LMC";
}

/**
 * Check if feature type is a feature of size.
 */
function isFeatureOfSize(featureType: FeatureType | undefined): boolean {
  return featureType !== undefined && featureOfSizeTypes.includes(featureType);
}

/**
 * Create a validation issue helper.
 */
function issue(
  code: ErrorCode,
  path: string,
  severity: Severity,
  context?: ValidationIssue["context"]
): ValidationIssue {
  return {
    code,
    message: errorCodes[code],
    path,
    severity,
    ...(context && { context })
  };
}

// ============================================================================
// RULE CATALOG
// ============================================================================

/**
 * Complete rule catalog organized by category.
 * Rules are evaluated in registration order; independent rules can be parallelized.
 */
const rules: Rule[] = [
  // ---------------------------------------------------------------------------
  // CATEGORY: Material Condition & Modifier Compatibility
  // ---------------------------------------------------------------------------
  {
    code: "E001",
    category: "material-condition",
    description: "Form tolerances (flatness, etc.) cannot use MMC/LMC modifiers",
    severity: "error",
    applies: (fcf) => formCharacteristics.includes(fcf.characteristic),
    evaluate: (fcf) => {
      const issues: ValidationIssue[] = [];
      if (usesMMCOrLMC(fcf.tolerance.materialCondition)) {
        issues.push(
          issue("E001", "tolerance.materialCondition", "error", {
            characteristic: fcf.characteristic,
            suggestion: "Remove material condition modifier; form tolerances apply RFS"
          })
        );
      }
      (fcf.datums ?? []).forEach((d, i) => {
        if (usesMMCOrLMC(d.materialCondition)) {
          issues.push(issue("E001", `datums[${i}].materialCondition`, "error"));
        }
      });
      return issues;
    }
  },
  {
    code: "E007",
    category: "material-condition",
    description: "Material condition (MMC/LMC) requires a feature of size",
    severity: "error",
    applies: (fcf) => usesMaterialCondition(fcf),
    evaluate: (fcf) => {
      if (isFeatureOfSize(fcf.featureType)) return [];
      const issues: ValidationIssue[] = [];
      if (usesMMCOrLMC(fcf.tolerance.materialCondition)) {
        issues.push(
          issue("E007", "tolerance.materialCondition", "error", {
            featureType: fcf.featureType,
            suggestion: "Set featureType to hole, slot, pin, or boss for MMC/LMC"
          })
        );
      }
      return issues;
    }
  },
  {
    code: "E003",
    category: "material-condition",
    description: "Material condition on datum requires datum feature of size",
    severity: "error",
    applies: (fcf) => (fcf.datums ?? []).some((d) => usesMMCOrLMC(d.materialCondition)),
    evaluate: (fcf) => {
      // This rule flags when datum has MC but we can't verify datum is FOS
      // In practice, the drawing would need to confirm datum is a feature of size
      const issues: ValidationIssue[] = [];
      (fcf.datums ?? []).forEach((d, i) => {
        if (usesMMCOrLMC(d.materialCondition)) {
          // Warning: we can't fully verify datum is FOS without external data
          // This is informational - actual validation depends on datum definition
          issues.push(
            issue("E003", `datums[${i}].materialCondition`, "warning" as Severity, {
              suggestion: `Verify datum ${d.id} is a feature of size to use ${d.materialCondition}`
            })
          );
        }
      });
      // Downgrade to warning since we can't fully validate
      return issues.map((i) => ({ ...i, severity: "warning" as Severity }));
    }
  },

  // ---------------------------------------------------------------------------
  // CATEGORY: Datum Requirements
  // ---------------------------------------------------------------------------
  {
    code: "E002",
    category: "datum-requirements",
    description: "Form tolerances cannot reference datums",
    severity: "error",
    applies: (fcf) => formCharacteristics.includes(fcf.characteristic),
    evaluate: (fcf) =>
      fcf.datums && fcf.datums.length > 0
        ? [
            issue("E002", "datums", "error", {
              characteristic: fcf.characteristic,
              suggestion: "Remove datum references; form tolerances are datum-independent"
            })
          ]
        : []
  },
  {
    code: "E006",
    category: "datum-requirements",
    description: "Orientation/location tolerances require datum reference",
    severity: "error",
    applies: (fcf) =>
      orientationCharacteristics.includes(fcf.characteristic) ||
      locationCharacteristics.includes(fcf.characteristic),
    evaluate: (fcf) =>
      !fcf.datums || fcf.datums.length === 0
        ? [
            issue("E006", "datums", "error", {
              characteristic: fcf.characteristic,
              suggestion: "Add at least a primary datum reference"
            })
          ]
        : []
  },
  {
    code: "E017",
    category: "datum-requirements",
    description: "Datum reference frame cannot have duplicate datum letters",
    severity: "error",
    applies: (fcf) => (fcf.datums ?? []).length > 1,
    evaluate: (fcf) => {
      const datums = fcf.datums ?? [];
      const seen = new Set<string>();
      const duplicates: number[] = [];
      datums.forEach((d, i) => {
        if (seen.has(d.id)) {
          duplicates.push(i);
        }
        seen.add(d.id);
      });
      return duplicates.map((i) =>
        issue("E017", `datums[${i}]`, "error", {
          suggestion: `Datum ${datums[i].id} appears multiple times; each datum should be unique`
        })
      );
    }
  },
  {
    code: "E019",
    category: "datum-requirements",
    description: "Standard datum reference frame limited to 3 datums",
    severity: "warning",
    applies: (fcf) => (fcf.datums ?? []).length > 3,
    evaluate: (fcf) => [
      issue("E019", "datums", "warning", {
        suggestion: "Consider if all datum references are necessary; typically max 3 (primary, secondary, tertiary)"
      })
    ]
  },

  // ---------------------------------------------------------------------------
  // CATEGORY: Composite & Segment Configuration
  // ---------------------------------------------------------------------------
  {
    code: "E009",
    category: "composite-configuration",
    description: "Composite frames only valid for position characteristic",
    severity: "error",
    applies: (fcf) => fcf.composite !== undefined,
    evaluate: (fcf) =>
      fcf.characteristic !== "position"
        ? [
            issue("E009", "composite", "error", {
              characteristic: fcf.characteristic,
              suggestion: "Composite tolerancing is specific to position; use single frame for other characteristics"
            })
          ]
        : []
  },
  {
    code: "E004",
    category: "composite-configuration",
    description: "Composite configuration requires at least 2 segments",
    severity: "error",
    applies: (fcf) => fcf.composite !== undefined,
    evaluate: (fcf) =>
      fcf.composite && fcf.composite.segments.length < 2
        ? [
            issue("E004", "composite.segments", "error", {
              suggestion: "Add a second segment or remove composite structure"
            })
          ]
        : []
  },
  {
    code: "E021",
    category: "composite-configuration",
    description: "Lower composite segment tolerance must be tighter than upper",
    severity: "error",
    applies: (fcf) => fcf.composite !== undefined && fcf.composite.segments.length >= 2,
    evaluate: (fcf) => {
      if (!fcf.composite || fcf.composite.segments.length < 2) return [];
      const issues: ValidationIssue[] = [];
      for (let i = 1; i < fcf.composite.segments.length; i++) {
        const upper = fcf.composite.segments[i - 1].tolerance.value;
        const lower = fcf.composite.segments[i].tolerance.value;
        if (lower >= upper) {
          issues.push(
            issue("E021", `composite.segments[${i}].tolerance.value`, "error", {
              suggestion: `Segment ${i + 1} tolerance (${lower}) must be less than segment ${i} (${upper})`
            })
          );
        }
      }
      return issues;
    }
  },
  {
    code: "E022",
    category: "composite-configuration",
    description: "Composite segments must share the primary datum",
    severity: "error",
    applies: (fcf) =>
      fcf.composite !== undefined &&
      fcf.composite.type === "composite" &&
      fcf.composite.segments.length >= 2,
    evaluate: (fcf) => {
      if (!fcf.composite || fcf.composite.segments.length < 2) return [];
      const segments = fcf.composite.segments;
      const firstPrimary = segments[0].datums?.[0]?.id;
      if (!firstPrimary) return [];

      const issues: ValidationIssue[] = [];
      for (let i = 1; i < segments.length; i++) {
        const segPrimary = segments[i].datums?.[0]?.id;
        if (segPrimary && segPrimary !== firstPrimary) {
          issues.push(
            issue("E022", `composite.segments[${i}].datums[0]`, "error", {
              suggestion: `Primary datum must be ${firstPrimary} to match upper segment`
            })
          );
        }
      }
      return issues;
    }
  },
  {
    code: "E023",
    category: "composite-configuration",
    description: "Lower composite segment cannot have more datums than upper",
    severity: "error",
    applies: (fcf) => fcf.composite !== undefined && fcf.composite.segments.length >= 2,
    evaluate: (fcf) => {
      if (!fcf.composite || fcf.composite.segments.length < 2) return [];
      const issues: ValidationIssue[] = [];
      const upperCount = fcf.composite.segments[0].datums?.length ?? 0;
      for (let i = 1; i < fcf.composite.segments.length; i++) {
        const lowerCount = fcf.composite.segments[i].datums?.length ?? 0;
        if (lowerCount > upperCount) {
          issues.push(
            issue("E023", `composite.segments[${i}].datums`, "error", {
              suggestion: `Lower segment has ${lowerCount} datums but upper has ${upperCount}; lower cannot exceed upper`
            })
          );
        }
      }
      return issues;
    }
  },

  // ---------------------------------------------------------------------------
  // CATEGORY: Tolerance Zone & Value Constraints
  // ---------------------------------------------------------------------------
  {
    code: "E031",
    category: "tolerance-zone",
    description: "Tolerance value must be non-negative (zero allowed with MMC for bonus tolerance)",
    severity: "error",
    applies: () => true,
    evaluate: (fcf) => {
      const issues: ValidationIssue[] = [];
      // Zero tolerance is valid when MMC is specified (bonus tolerance concept)
      // Only reject negative values
      if (fcf.tolerance.value < 0) {
        issues.push(
          issue("E031", "tolerance.value", "error", {
            suggestion: "Tolerance value cannot be negative"
          })
        );
      }
      fcf.composite?.segments.forEach((seg, i) => {
        if (seg.tolerance.value < 0) {
          issues.push(issue("E031", `composite.segments[${i}].tolerance.value`, "error"));
        }
      });
      return issues;
    }
  },
  {
    code: "E034",
    category: "tolerance-zone",
    description: "Projected zone height must be positive",
    severity: "error",
    applies: (fcf) => fcf.projectedZone !== undefined,
    evaluate: (fcf) =>
      fcf.projectedZone && fcf.projectedZone.height <= 0
        ? [
            issue("E034", "projectedZone.height", "error", {
              suggestion: "Projected zone height must be greater than zero"
            })
          ]
        : []
  },
  {
    code: "E008",
    category: "tolerance-zone",
    description: "Projected zone requires PROJECTED_TOLERANCE_ZONE modifier",
    severity: "error",
    applies: (fcf) => fcf.projectedZone !== undefined,
    evaluate: (fcf) =>
      !(fcf.modifiers ?? []).includes("PROJECTED_TOLERANCE_ZONE")
        ? [
            issue("E008", "modifiers", "error", {
              suggestion: "Add PROJECTED_TOLERANCE_ZONE to modifiers when using projectedZone"
            })
          ]
        : []
  },
  {
    code: "E032",
    category: "tolerance-zone",
    description: "Cylindrical zone only valid for axis/center features",
    severity: "error",
    applies: (fcf) => fcf.tolerance.diameter === true || fcf.tolerance.zoneShape === "cylindrical",
    evaluate: (fcf) => {
      // Cylindrical zone is valid for holes, pins, bosses (axis features)
      // Invalid for surfaces, planes, edges
      const invalidForCylindrical: FeatureType[] = ["surface", "plane", "edge"];
      if (fcf.featureType && invalidForCylindrical.includes(fcf.featureType)) {
        return [
          issue("E032", "tolerance.diameter", "error", {
            featureType: fcf.featureType,
            suggestion: `${fcf.featureType} cannot use cylindrical tolerance zone; use planar zone`
          })
        ];
      }
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // CATEGORY: Feature Type Constraints
  // ---------------------------------------------------------------------------
  {
    code: "E041",
    category: "feature-type",
    description: "Surface features cannot use cylindrical tolerance zone",
    severity: "error",
    applies: (fcf) => fcf.featureType === "surface",
    evaluate: (fcf) =>
      fcf.tolerance.diameter === true
        ? [
            issue("E041", "tolerance.diameter", "error", {
              suggestion: "Remove diameter modifier; surfaces use planar zones"
            })
          ]
        : []
  },
  {
    code: "E042",
    category: "feature-type",
    description: "Plane features cannot use material condition modifiers",
    severity: "error",
    applies: (fcf) => fcf.featureType === "plane",
    evaluate: (fcf) =>
      usesMMCOrLMC(fcf.tolerance.materialCondition)
        ? [
            issue("E042", "tolerance.materialCondition", "error", {
              suggestion: "Remove material condition; planes are not features of size"
            })
          ]
        : []
  },

  // ---------------------------------------------------------------------------
  // CATEGORY: Modifier Compatibility
  // ---------------------------------------------------------------------------
  {
    code: "E005",
    category: "modifier-compatibility",
    description: "Frame modifiers must be recognized",
    severity: "error",
    applies: (fcf) => (fcf.modifiers ?? []).length > 0,
    evaluate: (fcf) => {
      const parse = frameModifierSchema.array().safeParse(fcf.modifiers);
      return parse.success
        ? []
        : [
            issue("E005", "modifiers", "error", {
              suggestion: "Use valid modifiers: FREE_STATE, PROJECTED_TOLERANCE_ZONE, TANGENT_PLANE, UNEQUALLY_DISPOSED"
            })
          ];
    }
  },

  // ---------------------------------------------------------------------------
  // WARNINGS (Non-blocking but informative)
  // ---------------------------------------------------------------------------
  {
    code: "W001",
    category: "material-condition",
    description: "RFS is implicit in ASME Y14.5-2018",
    severity: "warning",
    applies: (fcf) => fcf.tolerance.materialCondition === "RFS",
    evaluate: (fcf) => [
      issue("W001", "tolerance.materialCondition", "warning", {
        suggestion: "RFS is the default; explicit RFS notation is redundant per ASME Y14.5-2018"
      })
    ]
  },
  {
    code: "W002",
    category: "datum-requirements",
    description: "Position with only primary datum may allow rotation",
    severity: "warning",
    applies: (fcf) =>
      fcf.characteristic === "position" && fcf.datums?.length === 1 && !fcf.composite,
    evaluate: (fcf) => [
      issue("W002", "datums", "warning", {
        suggestion: "Consider adding secondary datum to constrain rotation"
      })
    ]
  },
  {
    code: "W003",
    category: "composite-configuration",
    description: "Composite position typically applies to patterns",
    severity: "warning",
    applies: (fcf) => fcf.composite !== undefined && !fcf.pattern,
    evaluate: (fcf) => [
      issue("W003", "pattern", "warning", {
        suggestion: "Composite tolerancing is typically used with feature patterns; consider adding pattern spec"
      })
    ]
  },
  {
    code: "W004",
    category: "datum-requirements",
    description: "Profile without datums controls form only",
    severity: "warning",
    applies: (fcf) => fcf.characteristic === "profile" && (!fcf.datums || fcf.datums.length === 0),
    evaluate: (fcf) => [
      issue("W004", "datums", "warning", {
        suggestion: "Profile without datums controls form only; add datums to control orientation/location"
      })
    ]
  }
];

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

/**
 * Deterministic validation: executes rule catalog and returns structured results.
 * This does not re-check Zod schema shape but enforces GD&T-specific constraints.
 */
export function validateFcf(fcf: FcfJson): ValidationResult {
  const issues = rules.flatMap((rule) => (rule.applies(fcf) ? rule.evaluate(fcf) : []));

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length
    }
  };
}

/**
 * Validate only errors (skip warnings) for quick pass/fail.
 */
export function validateFcfStrict(fcf: FcfJson): boolean {
  return validateFcf(fcf).valid;
}

/**
 * Get issues filtered by category.
 */
export function validateByCategory(fcf: FcfJson, category: RuleCategory): ValidationIssue[] {
  return rules
    .filter((rule) => rule.category === category)
    .flatMap((rule) => (rule.applies(fcf) ? rule.evaluate(fcf) : []));
}

// ============================================================================
// RULE REGISTRATION (for extensibility)
// ============================================================================

/**
 * Register additional rules at runtime (e.g., for experiments or custom rules).
 */
export function registerRule(rule: Rule): void {
  rules.push(rule);
}

/**
 * Get all registered rules (for introspection/testing).
 */
export function getRules(): readonly Rule[] {
  return rules;
}

/**
 * Get rules by category.
 */
export function getRulesByCategory(category: RuleCategory): readonly Rule[] {
  return rules.filter((r) => r.category === category);
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export { featureOfSizeTypes, formCharacteristics, orientationCharacteristics, locationCharacteristics };
