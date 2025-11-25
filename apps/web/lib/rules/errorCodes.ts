/**
 * Standardized error codes for FCF validation.
 * Organized by category:
 *   E001-E010: Material condition and modifier compatibility
 *   E011-E020: Datum reference requirements
 *   E021-E030: Composite and segment configuration
 *   E031-E040: Tolerance zone and value constraints
 *   E041-E050: Feature type constraints
 *   W001-W010: Warnings (non-blocking but noteworthy)
 */
export const errorCodes = {
  // === Material Condition & Modifier Compatibility (E001-E010) ===
  E001: "MMC/LMC not permitted for form tolerances (flatness, straightness, circularity, cylindricity)",
  E002: "Datums not allowed for form tolerances",
  E003: "Material condition on datum requires datum feature of size",
  E004: "Invalid composite configuration: minimum 2 segments required",
  E005: "Unrecognized frame modifier",
  E006: "Datum reference required for this characteristic",
  E007: "Material condition (MMC/LMC) requires a feature of size",
  E008: "Projected tolerance zone requires PROJECTED_TOLERANCE_ZONE modifier",
  E009: "Composite frames are only valid for position characteristic",
  E010: "FREE_STATE modifier only applies to non-rigid parts",

  // === Datum Reference Requirements (E011-E020) ===
  E011: "Position requires at least one datum reference",
  E012: "Perpendicularity requires at least one datum reference",
  E013: "Parallelism requires at least one datum reference",
  E014: "Angularity requires at least one datum reference",
  E015: "Runout requires a datum axis reference",
  E016: "Concentricity requires a datum axis reference",
  E017: "Duplicate datum letter in reference frame",
  E018: "Datum reference order matters: primary must precede secondary/tertiary",
  E019: "Maximum 3 datum references allowed in standard datum reference frame",

  // === Composite & Segment Configuration (E021-E030) ===
  E021: "Composite lower segment tolerance must be smaller than upper segment",
  E022: "Composite segments must share the primary datum",
  E023: "Lower composite segment cannot have more datums than upper segment",
  E024: "Multiple single segments require consistent primary datum",

  // === Tolerance Zone & Value Constraints (E031-E040) ===
  E031: "Tolerance value must be greater than zero",
  E032: "Cylindrical (diameter) zone only valid for position of axis/center plane features",
  E033: "Spherical zone only valid for position of spherical features",
  E034: "Projected zone height must be greater than zero",
  E035: "UNEQUALLY_DISPOSED modifier requires non-symmetric tolerance distribution",

  // === Feature Type Constraints (E041-E050) ===
  E041: "Surface features cannot use cylindrical tolerance zone",
  E042: "Plane features cannot use material condition modifiers",
  E043: "Edge features have limited GD&T applicability",

  // === Warnings (W001-W010) ===
  W001: "RFS is implicit per ASME Y14.5-2018; explicit RFS is redundant",
  W002: "Position without secondary datum may allow unwanted rotation",
  W003: "Composite position typically used for pattern features; consider adding pattern spec",
  W004: "Profile tolerance without datums controls form only",
  W005: "Large tolerance value relative to typical GD&T practice"
} as const;

export type ErrorCode = keyof typeof errorCodes;
