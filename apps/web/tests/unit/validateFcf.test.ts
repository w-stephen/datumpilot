import { describe, expect, it, beforeEach } from "vitest";

import { FcfJson } from "@/lib/fcf/schema";
import {
  validateFcf,
  validateFcfStrict,
  validateByCategory,
  getRules,
  getRulesByCategory,
  ValidationResult,
  ValidationIssue
} from "@/lib/rules/validateFcf";

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Valid position FCF with full datum reference frame.
 */
const validPositionHole: FcfJson = {
  characteristic: "position",
  featureType: "hole",
  sourceUnit: "mm",
  source: { inputType: "builder" },
  tolerance: { value: 0.2, diameter: true, materialCondition: "MMC" },
  datums: [{ id: "A" }, { id: "B" }, { id: "C" }]
};

/**
 * Valid flatness FCF (form tolerance, no datums).
 */
const validFlatness: FcfJson = {
  characteristic: "flatness",
  featureType: "surface",
  sourceUnit: "mm",
  source: { inputType: "builder" },
  tolerance: { value: 0.05, zoneShape: "twoParallelPlanes" }
};

/**
 * Valid perpendicularity FCF.
 */
const validPerpendicularity: FcfJson = {
  characteristic: "perpendicularity",
  featureType: "plane",
  sourceUnit: "mm",
  source: { inputType: "builder" },
  tolerance: { value: 0.1 },
  datums: [{ id: "A" }]
};

/**
 * Valid profile FCF with datums.
 */
const validProfile: FcfJson = {
  characteristic: "profile",
  featureType: "surface",
  sourceUnit: "mm",
  source: { inputType: "builder" },
  tolerance: { value: 0.4 },
  datums: [{ id: "A" }, { id: "B" }]
};

/**
 * Valid composite position FCF.
 */
const validCompositePosition: FcfJson = {
  characteristic: "position",
  featureType: "slot",
  sourceUnit: "mm",
  source: { inputType: "builder" },
  tolerance: { value: 0.25 },
  datums: [{ id: "A" }, { id: "B" }, { id: "C" }],
  pattern: { count: 2, note: "2X" },
  composite: {
    type: "composite",
    segments: [
      { tolerance: { value: 0.25 }, datums: [{ id: "A" }, { id: "B" }, { id: "C" }] },
      { tolerance: { value: 0.1 }, datums: [{ id: "A" }, { id: "B" }] }
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function hasError(result: ValidationResult, code: string): boolean {
  return result.errors.some((e) => e.code === code);
}

function hasWarning(result: ValidationResult, code: string): boolean {
  return result.warnings.some((w) => w.code === code);
}

function getIssue(result: ValidationResult, code: string): ValidationIssue | undefined {
  return result.issues.find((i) => i.code === code);
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe("validateFcf", () => {
  describe("Valid FCFs (no errors)", () => {
    it("accepts valid position with MMC on feature of size", () => {
      const result = validateFcf(validPositionHole);
      expect(result.valid).toBe(true);
      expect(result.summary.errorCount).toBe(0);
    });

    it("accepts valid flatness (form tolerance)", () => {
      const result = validateFcf(validFlatness);
      expect(result.valid).toBe(true);
      expect(result.summary.errorCount).toBe(0);
    });

    it("accepts valid perpendicularity with datum", () => {
      const result = validateFcf(validPerpendicularity);
      expect(result.valid).toBe(true);
    });

    it("accepts valid profile with datums", () => {
      const result = validateFcf(validProfile);
      expect(result.valid).toBe(true);
    });

    it("accepts valid composite position", () => {
      const result = validateFcf(validCompositePosition);
      expect(result.valid).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // E001: Form tolerances cannot use MMC/LMC
  // --------------------------------------------------------------------------
  describe("E001: Form tolerance MMC/LMC restriction", () => {
    it("rejects flatness with MMC on tolerance", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        tolerance: { value: 0.05, materialCondition: "MMC" }
      };
      const result = validateFcf(fcf);
      expect(result.valid).toBe(false);
      expect(hasError(result, "E001")).toBe(true);
      expect(getIssue(result, "E001")?.path).toBe("tolerance.materialCondition");
    });

    it("rejects flatness with LMC on tolerance", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        tolerance: { value: 0.05, materialCondition: "LMC" }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E001")).toBe(true);
    });

    it("allows flatness with RFS (implicit default)", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        tolerance: { value: 0.05, materialCondition: "RFS" }
      };
      const result = validateFcf(fcf);
      // E001 should not trigger for RFS
      expect(hasError(result, "E001")).toBe(false);
      // But W001 warns about explicit RFS
      expect(hasWarning(result, "W001")).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // E002: Form tolerances cannot reference datums
  // --------------------------------------------------------------------------
  describe("E002: Form tolerance datum restriction", () => {
    it("rejects flatness with datum references", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(result.valid).toBe(false);
      expect(hasError(result, "E002")).toBe(true);
      expect(getIssue(result, "E002")?.path).toBe("datums");
      expect(getIssue(result, "E002")?.context?.suggestion).toContain("Remove datum references");
    });

    it("accepts flatness without datums", () => {
      const result = validateFcf(validFlatness);
      expect(hasError(result, "E002")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E006: Orientation/location tolerances require datums
  // --------------------------------------------------------------------------
  describe("E006: Datum requirement for orientation/location", () => {
    it("rejects position without datums", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        datums: undefined
      };
      const result = validateFcf(fcf);
      expect(result.valid).toBe(false);
      expect(hasError(result, "E006")).toBe(true);
    });

    it("rejects position with empty datums array", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        datums: []
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E006")).toBe(true);
    });

    it("rejects perpendicularity without datums", () => {
      const fcf: FcfJson = {
        ...validPerpendicularity,
        datums: undefined
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E006")).toBe(true);
    });

    it("accepts position with at least one datum", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E006")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E007: Material condition requires feature of size
  // --------------------------------------------------------------------------
  describe("E007: MMC/LMC requires feature of size", () => {
    it("rejects MMC on surface (not a feature of size)", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "surface",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.2, materialCondition: "MMC" },
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(result.valid).toBe(false);
      expect(hasError(result, "E007")).toBe(true);
    });

    it("rejects LMC on plane (not a feature of size)", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "plane",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.2, materialCondition: "LMC" },
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E007")).toBe(true);
    });

    it("accepts MMC on hole (feature of size)", () => {
      const result = validateFcf(validPositionHole);
      expect(hasError(result, "E007")).toBe(false);
    });

    it("accepts MMC on slot (feature of size)", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "slot",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.2, materialCondition: "MMC" },
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E007")).toBe(false);
    });

    it("accepts MMC on pin (feature of size)", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "pin",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.15, materialCondition: "MMC" },
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E007")).toBe(false);
    });

    it("accepts MMC on boss (feature of size)", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "boss",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.2, materialCondition: "MMC" },
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E007")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E017: Duplicate datum letters
  // --------------------------------------------------------------------------
  describe("E017: Duplicate datum letters", () => {
    it("rejects duplicate datum letters", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        datums: [{ id: "A" }, { id: "B" }, { id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(result.valid).toBe(false);
      expect(hasError(result, "E017")).toBe(true);
      expect(getIssue(result, "E017")?.path).toBe("datums[2]");
    });

    it("accepts unique datum letters", () => {
      const result = validateFcf(validPositionHole);
      expect(hasError(result, "E017")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E009: Composite frames only for position
  // --------------------------------------------------------------------------
  describe("E009: Composite frames position-only", () => {
    it("rejects composite on flatness", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        composite: {
          type: "composite",
          segments: [
            { tolerance: { value: 0.05 } },
            { tolerance: { value: 0.02 } }
          ]
        }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E009")).toBe(true);
    });

    it("rejects composite on perpendicularity", () => {
      const fcf: FcfJson = {
        ...validPerpendicularity,
        composite: {
          type: "composite",
          segments: [
            { tolerance: { value: 0.1 }, datums: [{ id: "A" }] },
            { tolerance: { value: 0.05 }, datums: [{ id: "A" }] }
          ]
        }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E009")).toBe(true);
    });

    it("accepts composite on position", () => {
      const result = validateFcf(validCompositePosition);
      expect(hasError(result, "E009")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E004: Composite requires minimum 2 segments
  // --------------------------------------------------------------------------
  describe("E004: Composite minimum segments", () => {
    it("rejects composite with only 1 segment", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "hole",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.25 },
        datums: [{ id: "A" }],
        composite: {
          type: "composite",
          segments: [{ tolerance: { value: 0.25 }, datums: [{ id: "A" }] }]
        }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E004")).toBe(true);
    });

    it("accepts composite with 2 segments", () => {
      const result = validateFcf(validCompositePosition);
      expect(hasError(result, "E004")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E021: Composite segment tolerance ordering
  // --------------------------------------------------------------------------
  describe("E021: Composite tolerance ordering", () => {
    it("rejects lower segment with larger tolerance than upper", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "hole",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.25 },
        datums: [{ id: "A" }, { id: "B" }],
        pattern: { count: 2 },
        composite: {
          type: "composite",
          segments: [
            { tolerance: { value: 0.1 }, datums: [{ id: "A" }, { id: "B" }] },
            { tolerance: { value: 0.2 }, datums: [{ id: "A" }] } // Invalid: 0.2 > 0.1
          ]
        }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E021")).toBe(true);
      expect(getIssue(result, "E021")?.path).toBe("composite.segments[1].tolerance.value");
    });

    it("rejects lower segment with equal tolerance", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "hole",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.25 },
        datums: [{ id: "A" }, { id: "B" }],
        pattern: { count: 2 },
        composite: {
          type: "composite",
          segments: [
            { tolerance: { value: 0.1 }, datums: [{ id: "A" }, { id: "B" }] },
            { tolerance: { value: 0.1 }, datums: [{ id: "A" }] } // Invalid: equal
          ]
        }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E021")).toBe(true);
    });

    it("accepts properly ordered tolerances", () => {
      const result = validateFcf(validCompositePosition);
      expect(hasError(result, "E021")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E022: Composite segments share primary datum
  // --------------------------------------------------------------------------
  describe("E022: Composite primary datum consistency", () => {
    it("rejects different primary datums in composite segments", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "hole",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.25 },
        datums: [{ id: "A" }, { id: "B" }],
        pattern: { count: 2 },
        composite: {
          type: "composite",
          segments: [
            { tolerance: { value: 0.25 }, datums: [{ id: "A" }, { id: "B" }] },
            { tolerance: { value: 0.1 }, datums: [{ id: "B" }] } // Invalid: primary is B, not A
          ]
        }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E022")).toBe(true);
    });

    it("accepts matching primary datums", () => {
      const result = validateFcf(validCompositePosition);
      expect(hasError(result, "E022")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E023: Lower segment cannot exceed upper datum count
  // --------------------------------------------------------------------------
  describe("E023: Composite datum count ordering", () => {
    it("rejects lower segment with more datums than upper", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "hole",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.25 },
        datums: [{ id: "A" }, { id: "B" }],
        pattern: { count: 2 },
        composite: {
          type: "composite",
          segments: [
            { tolerance: { value: 0.25 }, datums: [{ id: "A" }] },
            { tolerance: { value: 0.1 }, datums: [{ id: "A" }, { id: "B" }, { id: "C" }] } // Invalid: 3 > 1
          ]
        }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E023")).toBe(true);
    });

    it("accepts equal or fewer datums in lower segment", () => {
      const result = validateFcf(validCompositePosition);
      expect(hasError(result, "E023")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E031: Tolerance value must be non-negative (zero allowed with MMC)
  // --------------------------------------------------------------------------
  describe("E031: Non-negative tolerance value", () => {
    it("accepts zero tolerance value (valid for zero at MMC)", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        tolerance: { value: 0 }
      };
      const result = validateFcf(fcf);
      // Zero tolerance is valid per ASME Y14.5 (zero at MMC concept)
      expect(hasError(result, "E031")).toBe(false);
    });

    it("rejects negative tolerance value", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        tolerance: { value: -0.1 }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E031")).toBe(true);
    });

    it("accepts positive tolerance value", () => {
      const result = validateFcf(validFlatness);
      expect(hasError(result, "E031")).toBe(false);
    });

    it("accepts zero tolerance in composite segment (valid for bonus tolerance)", () => {
      const fcf: FcfJson = {
        ...validCompositePosition,
        composite: {
          type: "composite",
          segments: [
            { tolerance: { value: 0.25 }, datums: [{ id: "A" }, { id: "B" }] },
            { tolerance: { value: 0 }, datums: [{ id: "A" }] } // Valid with bonus tolerance
          ]
        }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E031")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E008: Projected zone requires modifier
  // --------------------------------------------------------------------------
  describe("E008: Projected zone modifier requirement", () => {
    it("rejects projected zone without PROJECTED_TOLERANCE_ZONE modifier", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        projectedZone: { height: 15 }
        // Missing modifiers: ["PROJECTED_TOLERANCE_ZONE"]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E008")).toBe(true);
    });

    it("accepts projected zone with PROJECTED_TOLERANCE_ZONE modifier", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        projectedZone: { height: 15 },
        modifiers: ["PROJECTED_TOLERANCE_ZONE"]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E008")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E034: Projected zone height must be positive
  // --------------------------------------------------------------------------
  describe("E034: Projected zone height", () => {
    it("rejects zero projected zone height", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        projectedZone: { height: 0 },
        modifiers: ["PROJECTED_TOLERANCE_ZONE"]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E034")).toBe(true);
    });

    it("rejects negative projected zone height", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        projectedZone: { height: -5 },
        modifiers: ["PROJECTED_TOLERANCE_ZONE"]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E034")).toBe(true);
    });

    it("accepts positive projected zone height", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        projectedZone: { height: 15 },
        modifiers: ["PROJECTED_TOLERANCE_ZONE"]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E034")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E032: Cylindrical zone for axis features only
  // --------------------------------------------------------------------------
  describe("E032: Cylindrical zone feature type restriction", () => {
    it("rejects cylindrical zone on surface", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "surface",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.2, diameter: true },
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E032")).toBe(true);
    });

    it("rejects cylindrical zone on plane", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "plane",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.2, diameter: true },
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E032")).toBe(true);
    });

    it("accepts cylindrical zone on hole", () => {
      const result = validateFcf(validPositionHole);
      expect(hasError(result, "E032")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // E042: Plane features cannot use material condition
  // --------------------------------------------------------------------------
  describe("E042: Plane material condition restriction", () => {
    it("rejects MMC on plane feature", () => {
      const fcf: FcfJson = {
        characteristic: "perpendicularity",
        featureType: "plane",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.1, materialCondition: "MMC" },
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E042")).toBe(true);
    });

    it("accepts plane without material condition", () => {
      const result = validateFcf(validPerpendicularity);
      expect(hasError(result, "E042")).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Warnings
  // --------------------------------------------------------------------------
  describe("Warnings (non-blocking)", () => {
    it("warns about explicit RFS (W001)", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        tolerance: { value: 0.2, materialCondition: "RFS" }
      };
      const result = validateFcf(fcf);
      expect(result.valid).toBe(true); // Warnings don't make it invalid
      expect(hasWarning(result, "W001")).toBe(true);
    });

    it("warns about position with only primary datum (W002)", () => {
      const fcf: FcfJson = {
        ...validPositionHole,
        datums: [{ id: "A" }],
        tolerance: { value: 0.2 } // Remove MMC to avoid E007 on missing FOS
      };
      const result = validateFcf(fcf);
      expect(hasWarning(result, "W002")).toBe(true);
    });

    it("warns about composite without pattern (W003)", () => {
      const fcf: FcfJson = {
        ...validCompositePosition,
        pattern: undefined
      };
      const result = validateFcf(fcf);
      expect(hasWarning(result, "W003")).toBe(true);
    });

    it("warns about profile without datums (W004)", () => {
      const fcf: FcfJson = {
        ...validProfile,
        datums: undefined
      };
      const result = validateFcf(fcf);
      expect(hasWarning(result, "W004")).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // ValidationResult structure
  // --------------------------------------------------------------------------
  describe("ValidationResult structure", () => {
    it("provides summary counts", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        datums: [{ id: "A" }], // E002
        tolerance: { value: 0, materialCondition: "MMC" } // E031, E001
      };
      const result = validateFcf(fcf);
      expect(result.summary.errorCount).toBeGreaterThan(0);
      expect(result.errors.length).toBe(result.summary.errorCount);
      expect(result.warnings.length).toBe(result.summary.warningCount);
    });

    it("separates errors and warnings", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "hole",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.2, materialCondition: "RFS" }, // W001
        datums: [{ id: "A" }] // W002
      };
      const result = validateFcf(fcf);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("includes context with suggestions", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        datums: [{ id: "A" }]
      };
      const result = validateFcf(fcf);
      const issue = getIssue(result, "E002");
      expect(issue?.context?.suggestion).toBeDefined();
      expect(issue?.context?.characteristic).toBe("flatness");
    });
  });

  // --------------------------------------------------------------------------
  // Utility functions
  // --------------------------------------------------------------------------
  describe("Utility functions", () => {
    it("validateFcfStrict returns boolean", () => {
      expect(validateFcfStrict(validPositionHole)).toBe(true);
      expect(
        validateFcfStrict({
          ...validFlatness,
          datums: [{ id: "A" }]
        })
      ).toBe(false);
    });

    it("validateByCategory filters by category", () => {
      const fcf: FcfJson = {
        ...validFlatness,
        datums: [{ id: "A" }], // datum-requirements
        tolerance: { value: -0.1 } // tolerance-zone - negative triggers E031
      };
      const datumIssues = validateByCategory(fcf, "datum-requirements");
      const toleranceIssues = validateByCategory(fcf, "tolerance-zone");

      expect(datumIssues.some((i) => i.code === "E002")).toBe(true);
      expect(toleranceIssues.some((i) => i.code === "E031")).toBe(true);
    });

    it("getRules returns all rules", () => {
      const rules = getRules();
      expect(rules.length).toBeGreaterThan(10);
    });

    it("getRulesByCategory filters rules", () => {
      const datumRules = getRulesByCategory("datum-requirements");
      expect(datumRules.every((r) => r.category === "datum-requirements")).toBe(true);
      expect(datumRules.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------
  describe("Edge cases", () => {
    it("handles undefined optional fields gracefully", () => {
      const minimal: FcfJson = {
        characteristic: "flatness",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.1 }
      };
      const result = validateFcf(minimal);
      expect(result.valid).toBe(true);
    });

    it("handles multiple errors on same FCF", () => {
      const fcf: FcfJson = {
        characteristic: "flatness",
        featureType: "surface",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0, materialCondition: "MMC" }, // E031, E001
        datums: [{ id: "A" }, { id: "A" }] // E002, E017
      };
      const result = validateFcf(fcf);
      expect(result.valid).toBe(false);
      expect(result.summary.errorCount).toBeGreaterThanOrEqual(3);
    });

    it("validates all composite segments", () => {
      const fcf: FcfJson = {
        characteristic: "position",
        featureType: "hole",
        sourceUnit: "mm",
        source: { inputType: "builder" },
        tolerance: { value: 0.5 },
        datums: [{ id: "A" }, { id: "B" }, { id: "C" }],
        pattern: { count: 3 },
        composite: {
          type: "composite",
          segments: [
            { tolerance: { value: 0.5 }, datums: [{ id: "A" }, { id: "B" }, { id: "C" }] },
            { tolerance: { value: 0.3 }, datums: [{ id: "A" }, { id: "B" }] },
            { tolerance: { value: -0.1 }, datums: [{ id: "A" }] } // Invalid: negative tolerance
          ]
        }
      };
      const result = validateFcf(fcf);
      expect(hasError(result, "E031")).toBe(true);
      expect(result.issues.some((i) => i.path.includes("segments[2]"))).toBe(true);
    });
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe("Integration scenarios", () => {
  it("validates complex real-world position FCF", () => {
    const fcf: FcfJson = {
      characteristic: "position",
      featureType: "hole",
      name: "4X Ø10 THRU HOLES",
      sourceUnit: "mm",
      standard: "ASME_Y14_5_2018",
      source: { inputType: "builder" },
      tolerance: { value: 0.2, diameter: true, materialCondition: "MMC" },
      datums: [
        { id: "A" },
        { id: "B", materialCondition: "MMC" },
        { id: "C", materialCondition: "MMC" }
      ],
      modifiers: ["PROJECTED_TOLERANCE_ZONE"],
      projectedZone: { height: 15 },
      pattern: { count: 4, note: "4X EQ SP ON B.C." },
      sizeDimension: { nominal: 10, tolerancePlus: 0.1, toleranceMinus: 0 }
    };
    const result = validateFcf(fcf);
    expect(result.valid).toBe(true);
    // Should have warnings about datum MC verification
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("validates profile tolerance correctly", () => {
    const fcf: FcfJson = {
      characteristic: "profile",
      featureType: "surface",
      sourceUnit: "mm",
      source: { inputType: "builder" },
      tolerance: { value: 0.5 },
      datums: [{ id: "A" }, { id: "B" }],
      notes: ["Unilateral +0.5, basic surface"]
    };
    const result = validateFcf(fcf);
    expect(result.valid).toBe(true);
  });
});
