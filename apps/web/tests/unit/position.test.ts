import { describe, expect, it } from "vitest";

import {
  calculatePosition,
  calculateSizeLimits,
  calculateBonusTolerance,
  calculateVirtualCondition,
  calculateResultantCondition,
  calculatePositionDeviation,
  calculatePositionAtMmc,
  quickPositionMmc,
  quickPositionLmc,
  quickPositionRfs
} from "@/lib/calc/position";
import { PositionInput, SizeDimensionInput, SizeLimits } from "@/lib/calc/types";

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Standard hole at MMC scenario:
 * - Ø10 +0.1/-0 hole (MMC = 10.0, LMC = 10.1)
 * - Position tolerance: Ø0.2 at MMC
 * - True position at (50, 25)
 */
const holeAtMmcInput: PositionInput = {
  unit: "mm",
  geometricTolerance: 0.2,
  materialCondition: "MMC",
  featureType: "hole",
  diametralZone: true,
  sizeDimension: {
    nominal: 10,
    tolerancePlus: 0.1,
    toleranceMinus: 0,
    featureType: "hole"
  },
  truePosition: {
    basicX: 50,
    basicY: 25
  },
  measured: {
    actualX: 50.05,
    actualY: 25.03,
    actualSize: 10.05 // Departed 0.05 from MMC
  }
};

/**
 * Pin at MMC scenario:
 * - Ø8 +0/-0.1 pin (MMC = 8.0, LMC = 7.9)
 * - Position tolerance: Ø0.15 at MMC
 */
const pinAtMmcInput: PositionInput = {
  unit: "mm",
  geometricTolerance: 0.15,
  materialCondition: "MMC",
  featureType: "pin",
  diametralZone: true,
  sizeDimension: {
    nominal: 8,
    tolerancePlus: 0,
    toleranceMinus: 0.1,
    featureType: "pin"
  },
  truePosition: {
    basicX: 100,
    basicY: 50
  },
  measured: {
    actualX: 100.02,
    actualY: 50.01,
    actualSize: 7.95 // Departed 0.05 from MMC
  }
};

// ============================================================================
// SIZE LIMITS TESTS
// ============================================================================

describe("calculateSizeLimits", () => {
  describe("Internal features (holes, slots)", () => {
    it("calculates MMC as smallest size for holes", () => {
      const input: SizeDimensionInput = {
        nominal: 10,
        tolerancePlus: 0.1,
        toleranceMinus: 0,
        featureType: "hole"
      };
      const limits = calculateSizeLimits(input);

      expect(limits.nominal).toBe(10);
      expect(limits.upperLimit).toBe(10.1);
      expect(limits.lowerLimit).toBe(10);
      expect(limits.mmc).toBe(10); // Smallest for internal
      expect(limits.lmc).toBe(10.1); // Largest for internal
    });

    it("calculates MMC as smallest size for slots", () => {
      const input: SizeDimensionInput = {
        nominal: 20,
        tolerancePlus: 0.2,
        toleranceMinus: 0.2,
        featureType: "slot"
      };
      const limits = calculateSizeLimits(input);

      expect(limits.mmc).toBe(19.8); // 20 - 0.2
      expect(limits.lmc).toBe(20.2); // 20 + 0.2
    });
  });

  describe("External features (pins, bosses)", () => {
    it("calculates MMC as largest size for pins", () => {
      const input: SizeDimensionInput = {
        nominal: 8,
        tolerancePlus: 0,
        toleranceMinus: 0.1,
        featureType: "pin"
      };
      const limits = calculateSizeLimits(input);

      expect(limits.mmc).toBe(8); // Largest for external
      expect(limits.lmc).toBe(7.9); // Smallest for external
    });

    it("calculates MMC as largest size for bosses", () => {
      const input: SizeDimensionInput = {
        nominal: 15,
        tolerancePlus: 0.05,
        toleranceMinus: 0.05,
        featureType: "boss"
      };
      const limits = calculateSizeLimits(input);

      expect(limits.mmc).toBe(15.05); // 15 + 0.05
      expect(limits.lmc).toBe(14.95); // 15 - 0.05
    });
  });
});

// ============================================================================
// BONUS TOLERANCE TESTS
// ============================================================================

describe("calculateBonusTolerance", () => {
  const holeLimits: SizeLimits = {
    nominal: 10,
    mmc: 10,
    lmc: 10.1,
    upperLimit: 10.1,
    lowerLimit: 10
  };

  const pinLimits: SizeLimits = {
    nominal: 8,
    mmc: 8,
    lmc: 7.9,
    upperLimit: 8,
    lowerLimit: 7.9
  };

  describe("MMC for internal features (holes)", () => {
    it("returns zero bonus at MMC size", () => {
      const bonus = calculateBonusTolerance(10.0, holeLimits, "MMC", "internal");
      expect(bonus).toBe(0);
    });

    it("returns positive bonus when actual > MMC", () => {
      const bonus = calculateBonusTolerance(10.05, holeLimits, "MMC", "internal");
      expect(bonus).toBe(0.05);
    });

    it("returns maximum bonus at LMC", () => {
      const bonus = calculateBonusTolerance(10.1, holeLimits, "MMC", "internal");
      expect(bonus).toBe(0.1);
    });

    it("returns zero bonus when actual < MMC (undersized)", () => {
      const bonus = calculateBonusTolerance(9.95, holeLimits, "MMC", "internal");
      expect(bonus).toBe(0); // Clamped to 0
    });
  });

  describe("MMC for external features (pins)", () => {
    it("returns zero bonus at MMC size", () => {
      const bonus = calculateBonusTolerance(8.0, pinLimits, "MMC", "external");
      expect(bonus).toBe(0);
    });

    it("returns positive bonus when actual < MMC", () => {
      const bonus = calculateBonusTolerance(7.95, pinLimits, "MMC", "external");
      expect(bonus).toBe(0.05);
    });

    it("returns maximum bonus at LMC", () => {
      const bonus = calculateBonusTolerance(7.9, pinLimits, "MMC", "external");
      expect(bonus).toBe(0.1);
    });
  });

  describe("LMC for internal features (holes)", () => {
    it("returns zero bonus at LMC size", () => {
      const bonus = calculateBonusTolerance(10.1, holeLimits, "LMC", "internal");
      expect(bonus).toBe(0);
    });

    it("returns positive bonus when actual < LMC", () => {
      const bonus = calculateBonusTolerance(10.05, holeLimits, "LMC", "internal");
      expect(bonus).toBe(0.05);
    });

    it("returns maximum bonus at MMC", () => {
      const bonus = calculateBonusTolerance(10.0, holeLimits, "LMC", "internal");
      expect(bonus).toBe(0.1);
    });
  });

  describe("RFS", () => {
    it("always returns zero bonus for RFS", () => {
      expect(calculateBonusTolerance(10.0, holeLimits, "RFS", "internal")).toBe(0);
      expect(calculateBonusTolerance(10.05, holeLimits, "RFS", "internal")).toBe(0);
      expect(calculateBonusTolerance(10.1, holeLimits, "RFS", "internal")).toBe(0);
    });
  });
});

// ============================================================================
// VIRTUAL CONDITION TESTS
// ============================================================================

describe("calculateVirtualCondition", () => {
  const holeLimits: SizeLimits = {
    nominal: 10,
    mmc: 10,
    lmc: 10.1,
    upperLimit: 10.1,
    lowerLimit: 10
  };

  const pinLimits: SizeLimits = {
    nominal: 8,
    mmc: 8,
    lmc: 7.9,
    upperLimit: 8,
    lowerLimit: 7.9
  };

  it("calculates VC for hole at MMC: MMC - tolerance", () => {
    const vc = calculateVirtualCondition(holeLimits, 0.2, "MMC", "internal");
    expect(vc).toBe(9.8); // 10 - 0.2
  });

  it("calculates VC for pin at MMC: MMC + tolerance", () => {
    const vc = calculateVirtualCondition(pinLimits, 0.15, "MMC", "external");
    expect(vc).toBe(8.15); // 8 + 0.15
  });

  it("calculates VC for hole at LMC: LMC + tolerance", () => {
    const vc = calculateVirtualCondition(holeLimits, 0.2, "LMC", "internal");
    expect(vc).toBe(10.3); // 10.1 + 0.2
  });

  it("calculates VC for pin at LMC: LMC - tolerance", () => {
    const vc = calculateVirtualCondition(pinLimits, 0.15, "LMC", "external");
    expect(vc).toBe(7.75); // 7.9 - 0.15
  });
});

// ============================================================================
// RESULTANT CONDITION TESTS
// ============================================================================

describe("calculateResultantCondition", () => {
  const holeLimits: SizeLimits = {
    nominal: 10,
    mmc: 10,
    lmc: 10.1,
    upperLimit: 10.1,
    lowerLimit: 10
  };

  it("calculates RC for hole at MMC: LMC + tolerance", () => {
    const rc = calculateResultantCondition(holeLimits, 0.2, "MMC", "internal");
    expect(rc).toBe(10.3); // 10.1 + 0.2
  });

  it("calculates RC for hole at LMC: MMC - tolerance", () => {
    const rc = calculateResultantCondition(holeLimits, 0.2, "LMC", "internal");
    expect(rc).toBe(9.8); // 10 - 0.2
  });
});

// ============================================================================
// POSITION DEVIATION TESTS
// ============================================================================

describe("calculatePositionDeviation", () => {
  it("calculates 2D deviation correctly", () => {
    const result = calculatePositionDeviation(50.03, 25.04, 50, 25);

    expect(result.dx).toBe(0.03);
    expect(result.dy).toBe(0.04);
    expect(result.radial).toBe(0.05); // sqrt(0.03² + 0.04²) = 0.05
    expect(result.diametral).toBe(0.1); // 2 * 0.05
  });

  it("calculates 3D deviation when Z provided", () => {
    const result = calculatePositionDeviation(50, 25, 50, 25, 10.05, 10);

    expect(result.dz).toBe(0.05);
    expect(result.radial).toBeCloseTo(0.05, 4);
  });

  it("handles zero deviation", () => {
    const result = calculatePositionDeviation(50, 25, 50, 25);

    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
    expect(result.radial).toBe(0);
    expect(result.diametral).toBe(0);
  });

  it("handles negative deviations", () => {
    const result = calculatePositionDeviation(49.97, 24.96, 50, 25);

    expect(result.dx).toBe(-0.03);
    expect(result.dy).toBe(-0.04);
    expect(result.radial).toBe(0.05);
  });
});

// ============================================================================
// MAIN CALCULATOR TESTS
// ============================================================================

describe("calculatePosition", () => {
  describe("MMC Position for Holes", () => {
    it("passes when position is within total allowable tolerance", () => {
      const response = calculatePosition(holeAtMmcInput);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.status).toBe("pass");
        expect(response.result.bonusTolerance).toBe(0.05); // 10.05 - 10.0
        expect(response.result.totalAllowableTolerance).toBe(0.25); // 0.2 + 0.05
        expect(response.result.positionConformance).toBe(true);
      }
    });

    it("calculates correct virtual condition for hole at MMC", () => {
      const response = calculatePosition(holeAtMmcInput);

      expect(response.success).toBe(true);
      if (response.success) {
        // VC = MMC - tolerance = 10.0 - 0.2 = 9.8
        expect(response.result.virtualCondition).toBe(9.8);
      }
    });

    it("fails when position exceeds total allowable tolerance", () => {
      const failingInput: PositionInput = {
        ...holeAtMmcInput,
        measured: {
          actualX: 50.2, // Large deviation
          actualY: 25.15,
          actualSize: 10.0 // At MMC, no bonus
        }
      };

      const response = calculatePosition(failingInput);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.status).toBe("fail");
        expect(response.result.bonusTolerance).toBe(0);
        expect(response.result.positionConformance).toBe(false);
      }
    });

    it("passes at exact boundary (actual = allowable)", () => {
      // Set up for exactly 0.2 diametral deviation with no bonus
      const boundaryInput: PositionInput = {
        ...holeAtMmcInput,
        measured: {
          actualX: 50.1, // Creates exactly 0.1 radial = 0.2 diametral
          actualY: 25.0,
          actualSize: 10.0 // At MMC
        }
      };

      const response = calculatePosition(boundaryInput);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.status).toBe("pass");
        expect(response.result.actualPositionTolerance).toBe(0.2);
        expect(response.result.totalAllowableTolerance).toBe(0.2);
      }
    });

    it("calculates maximum bonus when hole is at LMC", () => {
      const lmcHoleInput: PositionInput = {
        ...holeAtMmcInput,
        measured: {
          actualX: 50.1,
          actualY: 25.0,
          actualSize: 10.1 // At LMC
        }
      };

      const response = calculatePosition(lmcHoleInput);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.bonusTolerance).toBe(0.1); // 10.1 - 10.0
        expect(response.result.totalAllowableTolerance).toBe(0.3); // 0.2 + 0.1
      }
    });
  });

  describe("MMC Position for Pins", () => {
    it("calculates bonus correctly for undersized pin", () => {
      const response = calculatePosition(pinAtMmcInput);

      expect(response.success).toBe(true);
      if (response.success) {
        // Pin MMC = 8.0, actual = 7.95, bonus = 8.0 - 7.95 = 0.05
        expect(response.result.bonusTolerance).toBe(0.05);
        expect(response.result.totalAllowableTolerance).toBe(0.2); // 0.15 + 0.05
      }
    });

    it("calculates virtual condition for pin at MMC", () => {
      const response = calculatePosition(pinAtMmcInput);

      expect(response.success).toBe(true);
      if (response.success) {
        // VC = MMC + tolerance = 8.0 + 0.15 = 8.15
        expect(response.result.virtualCondition).toBe(8.15);
      }
    });
  });

  describe("LMC Position", () => {
    it("calculates bonus correctly for hole at LMC", () => {
      const lmcInput: PositionInput = {
        ...holeAtMmcInput,
        materialCondition: "LMC",
        measured: {
          actualX: 50.05,
          actualY: 25.03,
          actualSize: 10.0 // At MMC = furthest from LMC
        }
      };

      const response = calculatePosition(lmcInput);

      expect(response.success).toBe(true);
      if (response.success) {
        // LMC bonus for hole: LMC - actual = 10.1 - 10.0 = 0.1
        expect(response.result.bonusTolerance).toBe(0.1);
        expect(response.result.materialCondition).toBe("LMC");
      }
    });
  });

  describe("RFS Position", () => {
    it("has no bonus tolerance at RFS", () => {
      const rfsInput: PositionInput = {
        ...holeAtMmcInput,
        materialCondition: "RFS",
        measured: {
          actualX: 50.05,
          actualY: 25.03,
          actualSize: 10.05
        }
      };

      const response = calculatePosition(rfsInput);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.bonusTolerance).toBe(0);
        expect(response.result.totalAllowableTolerance).toBe(0.2);
      }
    });
  });

  describe("Size Conformance", () => {
    it("flags size non-conformance when hole is undersized", () => {
      const undersizedInput: PositionInput = {
        ...holeAtMmcInput,
        measured: {
          actualX: 50.05,
          actualY: 25.03,
          actualSize: 9.95 // Below lower limit of 10.0
        }
      };

      const response = calculatePosition(undersizedInput);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.sizeConformance).toBe(false);
        expect(response.result.status).toBe("fail");
      }
    });

    it("flags size non-conformance when hole is oversized", () => {
      const oversizedInput: PositionInput = {
        ...holeAtMmcInput,
        measured: {
          actualX: 50.0,
          actualY: 25.0,
          actualSize: 10.15 // Above upper limit of 10.1
        }
      };

      const response = calculatePosition(oversizedInput);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.sizeConformance).toBe(false);
      }
    });
  });

  describe("Input Validation", () => {
    it("rejects zero tolerance", () => {
      const invalidInput: PositionInput = {
        ...holeAtMmcInput,
        geometricTolerance: 0
      };

      const response = calculatePosition(invalidInput);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.errors.some((e) => e.code === "INVALID_TOLERANCE")).toBe(true);
      }
    });

    it("rejects negative tolerance", () => {
      const invalidInput: PositionInput = {
        ...holeAtMmcInput,
        geometricTolerance: -0.1
      };

      const response = calculatePosition(invalidInput);

      expect(response.success).toBe(false);
    });

    it("rejects zero actual size", () => {
      const invalidInput: PositionInput = {
        ...holeAtMmcInput,
        measured: {
          ...holeAtMmcInput.measured,
          actualSize: 0
        }
      };

      const response = calculatePosition(invalidInput);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.errors.some((e) => e.code === "INVALID_ACTUAL_SIZE")).toBe(true);
      }
    });
  });

  describe("Tolerance Consumed Percentage", () => {
    it("calculates tolerance consumed correctly", () => {
      const response = calculatePosition(holeAtMmcInput);

      expect(response.success).toBe(true);
      if (response.success) {
        // actualPosition / totalAllowable * 100
        const expected =
          (response.result.actualPositionTolerance /
            response.result.totalAllowableTolerance) *
          100;
        expect(response.result.toleranceConsumed).toBeCloseTo(expected, 0);
      }
    });
  });
});

// ============================================================================
// QUICK FUNCTION TESTS
// ============================================================================

describe("quickPositionMmc", () => {
  it("calculates pass with bonus for internal feature", () => {
    const result = quickPositionMmc(0.2, 10.0, 10.05, 0.03, 0.04, "internal");

    expect(result.bonus).toBeCloseTo(0.05, 4);
    expect(result.totalTolerance).toBeCloseTo(0.25, 4);
    expect(result.actualPosition).toBeCloseTo(0.1, 4); // 2 * sqrt(0.03² + 0.04²)
    expect(result.pass).toBe(true);
  });

  it("calculates pass with bonus for external feature", () => {
    const result = quickPositionMmc(0.15, 8.0, 7.95, 0.02, 0.01, "external");

    expect(result.bonus).toBeCloseTo(0.05, 4); // MMC - actual = 8.0 - 7.95
    expect(result.totalTolerance).toBeCloseTo(0.2, 4);
    expect(result.pass).toBe(true);
  });

  it("calculates fail when position exceeds tolerance", () => {
    const result = quickPositionMmc(0.2, 10.0, 10.0, 0.15, 0.0, "internal");

    expect(result.bonus).toBe(0);
    expect(result.totalTolerance).toBeCloseTo(0.2, 4);
    expect(result.actualPosition).toBeCloseTo(0.3, 4); // 2 * 0.15
    expect(result.pass).toBe(false);
  });
});

describe("quickPositionLmc", () => {
  it("calculates bonus for internal feature at LMC", () => {
    const result = quickPositionLmc(0.2, 10.1, 10.0, 0.05, 0.0, "internal");

    expect(result.bonus).toBeCloseTo(0.1, 4); // LMC - actual = 10.1 - 10.0
    expect(result.totalTolerance).toBeCloseTo(0.3, 4);
  });

  it("calculates bonus for external feature at LMC", () => {
    const result = quickPositionLmc(0.15, 7.9, 8.0, 0.02, 0.01, "external");

    expect(result.bonus).toBeCloseTo(0.1, 4); // actual - LMC = 8.0 - 7.9
    expect(result.totalTolerance).toBeCloseTo(0.25, 4);
  });
});

describe("quickPositionRfs", () => {
  it("calculates position without bonus", () => {
    const result = quickPositionRfs(0.2, 0.03, 0.04);

    expect(result.actualPosition).toBe(0.1);
    expect(result.pass).toBe(true);
  });

  it("fails when exceeds stated tolerance", () => {
    const result = quickPositionRfs(0.2, 0.15, 0.0);

    expect(result.actualPosition).toBe(0.3);
    expect(result.pass).toBe(false);
  });
});

// ============================================================================
// LEGACY API TESTS
// ============================================================================

describe("calculatePositionAtMmc (legacy)", () => {
  it("maintains backward compatibility", () => {
    const result = calculatePositionAtMmc({
      mmcSize: 10.0,
      actualSize: 10.05,
      geoToleranceAtMmc: 0.2,
      radialLocationError: 0.1
    });

    expect(result.bonus).toBeCloseTo(0.05, 4);
    expect(result.effectiveTolerance).toBeCloseTo(0.25, 4);
    expect(result.pass).toBe(true); // 0.1 <= 0.25/2 = 0.125
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe("Edge cases", () => {
  it("handles very small tolerances with high precision", () => {
    const input: PositionInput = {
      ...holeAtMmcInput,
      geometricTolerance: 0.001,
      precision: 6,
      measured: {
        actualX: 50.0003,
        actualY: 25.0004,
        actualSize: 10.0
      }
    };

    const response = calculatePosition(input);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.result.radialDeviation).toBeCloseTo(0.0005, 4);
    }
  });

  it("handles inch units correctly", () => {
    const inchInput: PositionInput = {
      ...holeAtMmcInput,
      unit: "inch",
      geometricTolerance: 0.008,
      sizeDimension: {
        nominal: 0.5,
        tolerancePlus: 0.004,
        toleranceMinus: 0,
        featureType: "hole"
      },
      truePosition: { basicX: 2.0, basicY: 1.0 },
      measured: {
        actualX: 2.002,
        actualY: 1.001,
        actualSize: 0.502
      }
    };

    const response = calculatePosition(inchInput);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.result.unit).toBe("inch");
      expect(response.result.bonusTolerance).toBe(0.002);
    }
  });

  it("handles exact zero deviation", () => {
    const perfectInput: PositionInput = {
      ...holeAtMmcInput,
      measured: {
        actualX: 50.0,
        actualY: 25.0,
        actualSize: 10.0
      }
    };

    const response = calculatePosition(perfectInput);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.result.actualPositionTolerance).toBe(0);
      expect(response.result.status).toBe("pass");
      expect(response.result.toleranceConsumed).toBe(0);
    }
  });
});
