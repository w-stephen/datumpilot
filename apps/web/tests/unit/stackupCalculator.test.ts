import { describe, it, expect } from "vitest";

import {
  calculateStackup,
  calculateNominal,
  calculateMeanShift,
  calculateWorstCase,
  calculateRSS,
  calculateSixSigma,
  calculateContributions,
  checkAcceptance,
  validateStackupInput,
  getBilateralTolerance,
  compareAllMethods,
  roundTo,
  formatResult,
  getDefaultProcessCapability,
} from "@/lib/stackup/calculator";
import type { StackupDimension, StackupAnalysis } from "@/lib/stackup/schema";

// ============================================================================
// TEST HELPERS
// ============================================================================

function createDimension(
  overrides: Partial<StackupDimension> = {}
): StackupDimension {
  return {
    id: crypto.randomUUID(),
    name: "Test Dimension",
    nominal: 10,
    tolerancePlus: 0.1,
    toleranceMinus: 0.1,
    sign: "positive",
    sensitivityCoefficient: 1,
    ...overrides,
  };
}

function createAnalysis(
  overrides: Partial<StackupAnalysis> = {}
): StackupAnalysis {
  return {
    id: crypto.randomUUID(),
    projectId: crypto.randomUUID(),
    name: "Test Stack",
    measurementObjective: "Test gap",
    acceptanceCriteria: { minimum: 0, maximum: 1 },
    positiveDirection: "left-to-right",
    dimensions: [
      createDimension({ name: "Dim 1", sign: "positive" }),
      createDimension({ name: "Dim 2", sign: "negative" }),
    ],
    analysisMethod: "worst-case",
    unit: "mm",
    createdBy: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe("getBilateralTolerance", () => {
  it("calculates symmetric tolerance", () => {
    const dim = createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1 });
    expect(getBilateralTolerance(dim)).toBe(0.1);
  });

  it("calculates asymmetric tolerance", () => {
    const dim = createDimension({ tolerancePlus: 0.2, toleranceMinus: 0.1 });
    expect(getBilateralTolerance(dim)).toBeCloseTo(0.15, 10);
  });

  it("handles unilateral tolerance (plus only)", () => {
    const dim = createDimension({ tolerancePlus: 0.1, toleranceMinus: 0 });
    expect(getBilateralTolerance(dim)).toBe(0.05);
  });

  it("handles unilateral tolerance (minus only)", () => {
    const dim = createDimension({ tolerancePlus: 0, toleranceMinus: 0.1 });
    expect(getBilateralTolerance(dim)).toBe(0.05);
  });

  it("handles zero tolerance", () => {
    const dim = createDimension({ tolerancePlus: 0, toleranceMinus: 0 });
    expect(getBilateralTolerance(dim)).toBe(0);
  });
});

describe("roundTo", () => {
  it("rounds to specified decimals", () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(3.14159, 3)).toBe(3.142);
    expect(roundTo(3.14159, 0)).toBe(3);
  });

  it("handles negative numbers", () => {
    expect(roundTo(-3.14159, 2)).toBe(-3.14);
  });

  it("handles rounding up", () => {
    expect(roundTo(3.145, 2)).toBe(3.15);
  });
});

describe("formatResult", () => {
  it("formats with mm unit", () => {
    expect(formatResult(0.123456, 3, "mm")).toBe("0.123 mm");
  });

  it("formats with inch unit", () => {
    expect(formatResult(0.00485, 4, "inch")).toBe("0.0049 inch");
  });
});

describe("getDefaultProcessCapability", () => {
  it("returns 1.33", () => {
    expect(getDefaultProcessCapability()).toBe(1.33);
  });
});

// ============================================================================
// NOMINAL CALCULATION TESTS
// ============================================================================

describe("calculateNominal", () => {
  it("sums positive dimensions", () => {
    const dims = [
      createDimension({ nominal: 10, sign: "positive" }),
      createDimension({ nominal: 5, sign: "positive" }),
    ];
    expect(calculateNominal(dims)).toBe(15);
  });

  it("subtracts negative dimensions", () => {
    const dims = [
      createDimension({ nominal: 10, sign: "positive" }),
      createDimension({ nominal: 3, sign: "negative" }),
    ];
    expect(calculateNominal(dims)).toBe(7);
  });

  it("handles mixed signs", () => {
    const dims = [
      createDimension({ nominal: 50, sign: "positive" }),
      createDimension({ nominal: 20, sign: "negative" }),
      createDimension({ nominal: 15, sign: "positive" }),
      createDimension({ nominal: 10, sign: "negative" }),
    ];
    // 50 - 20 + 15 - 10 = 35
    expect(calculateNominal(dims)).toBe(35);
  });

  it("applies sensitivity coefficients", () => {
    const dims = [
      createDimension({ nominal: 10, sign: "positive", sensitivityCoefficient: 2 }),
    ];
    expect(calculateNominal(dims)).toBe(20);
  });

  it("handles fractional sensitivity", () => {
    const dims = [
      createDimension({ nominal: 10, sign: "positive", sensitivityCoefficient: 0.5 }),
    ];
    expect(calculateNominal(dims)).toBe(5);
  });

  it("handles negative sensitivity with negative sign", () => {
    const dims = [
      createDimension({ nominal: 10, sign: "negative", sensitivityCoefficient: 2 }),
    ];
    expect(calculateNominal(dims)).toBe(-20);
  });

  it("returns 0 for empty array", () => {
    expect(calculateNominal([])).toBe(0);
  });

  it("uses default sensitivity of 1", () => {
    const dims = [
      { ...createDimension({ nominal: 10, sign: "positive" }), sensitivityCoefficient: undefined as unknown as number },
    ];
    expect(calculateNominal(dims)).toBe(10);
  });
});

// ============================================================================
// MEAN SHIFT CALCULATION TESTS
// ============================================================================

describe("calculateMeanShift", () => {
  it("returns 0 for symmetric tolerances", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1, sign: "positive" }),
      createDimension({ tolerancePlus: 0.2, toleranceMinus: 0.2, sign: "negative" }),
    ];
    expect(calculateMeanShift(dims)).toBe(0);
  });

  it("calculates positive shift for plus-only tolerance", () => {
    // 50 +0.1/-0 has center at 50.05, shift = +0.05
    const dims = [
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0, sign: "positive" }),
    ];
    expect(calculateMeanShift(dims)).toBe(0.05);
  });

  it("calculates negative shift for minus-only tolerance", () => {
    // 50 +0/-0.1 has center at 49.95, shift = -0.05
    const dims = [
      createDimension({ tolerancePlus: 0, toleranceMinus: 0.1, sign: "positive" }),
    ];
    expect(calculateMeanShift(dims)).toBe(-0.05);
  });

  it("accounts for sign convention", () => {
    // For negative dimension, shift is inverted
    const dims = [
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0, sign: "negative" }),
    ];
    // Dimension subtracts, so shift = -0.05
    expect(calculateMeanShift(dims)).toBe(-0.05);
  });

  it("calculates combined shift for bearing clearance scenario", () => {
    // Housing bore: 50 +0.025/-0 (positive dimension)
    // - Shift = (0.025 - 0) / 2 = +0.0125
    // Bearing OD: 50 +0/-0.013 (negative dimension)
    // - Shift = (0 - 0.013) / 2 = -0.0065, but dimension is negative so contributes +0.0065
    const dims = [
      createDimension({
        name: "Housing Bore",
        tolerancePlus: 0.025,
        toleranceMinus: 0,
        sign: "positive",
      }),
      createDimension({
        name: "Bearing OD",
        tolerancePlus: 0,
        toleranceMinus: 0.013,
        sign: "negative",
      }),
    ];
    // Total shift = 0.0125 - (-0.0065) = 0.019
    expect(calculateMeanShift(dims)).toBeCloseTo(0.019, 10);
  });

  it("applies sensitivity coefficients", () => {
    const dims = [
      createDimension({
        tolerancePlus: 0.1,
        toleranceMinus: 0,
        sign: "positive",
        sensitivityCoefficient: 2,
      }),
    ];
    // Shift = 0.05 × 2 = 0.1
    expect(calculateMeanShift(dims)).toBe(0.1);
  });

  it("returns 0 for empty array", () => {
    expect(calculateMeanShift([])).toBe(0);
  });
});

// ============================================================================
// WORST-CASE METHOD TESTS
// ============================================================================

describe("calculateWorstCase", () => {
  it("sums absolute tolerances", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1 }),
      createDimension({ tolerancePlus: 0.2, toleranceMinus: 0.2 }),
    ];
    expect(calculateWorstCase(dims)).toBeCloseTo(0.3, 10);
  });

  it("handles asymmetric tolerances", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.2, toleranceMinus: 0.1 }), // bilateral = 0.15
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.3 }), // bilateral = 0.2
    ];
    expect(calculateWorstCase(dims)).toBeCloseTo(0.35, 10);
  });

  it("applies sensitivity coefficients", () => {
    const dims = [
      createDimension({
        tolerancePlus: 0.1,
        toleranceMinus: 0.1,
        sensitivityCoefficient: 2,
      }),
    ];
    expect(calculateWorstCase(dims)).toBe(0.2);
  });

  it("ignores sign (uses absolute)", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1, sign: "positive" }),
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1, sign: "negative" }),
    ];
    expect(calculateWorstCase(dims)).toBe(0.2);
  });

  it("returns 0 for zero tolerances", () => {
    const dims = [
      createDimension({ tolerancePlus: 0, toleranceMinus: 0 }),
      createDimension({ tolerancePlus: 0, toleranceMinus: 0 }),
    ];
    expect(calculateWorstCase(dims)).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(calculateWorstCase([])).toBe(0);
  });
});

// ============================================================================
// RSS METHOD TESTS
// ============================================================================

describe("calculateRSS", () => {
  it("calculates root sum square (3-4-5 triangle)", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.3, toleranceMinus: 0.3 }),
      createDimension({ tolerancePlus: 0.4, toleranceMinus: 0.4 }),
    ];
    // √(0.3² + 0.4²) = √(0.09 + 0.16) = √0.25 = 0.5
    expect(calculateRSS(dims)).toBe(0.5);
  });

  it("RSS is always less than or equal to worst-case", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1 }),
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1 }),
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1 }),
    ];
    expect(calculateRSS(dims)).toBeLessThanOrEqual(calculateWorstCase(dims));
  });

  it("RSS equals worst-case for single dimension", () => {
    const dims = [createDimension({ tolerancePlus: 0.5, toleranceMinus: 0.5 })];
    expect(calculateRSS(dims)).toBe(calculateWorstCase(dims));
  });

  it("applies sensitivity coefficients", () => {
    const dims = [
      createDimension({
        tolerancePlus: 0.3,
        toleranceMinus: 0.3,
        sensitivityCoefficient: 2,
      }),
      createDimension({
        tolerancePlus: 0.4,
        toleranceMinus: 0.4,
        sensitivityCoefficient: 1,
      }),
    ];
    // √((0.3*2)² + (0.4*1)²) = √(0.36 + 0.16) = √0.52
    expect(calculateRSS(dims)).toBeCloseTo(Math.sqrt(0.52), 10);
  });

  it("returns 0 for empty array", () => {
    expect(calculateRSS([])).toBe(0);
  });

  it("handles many small tolerances", () => {
    const dims = Array(10)
      .fill(null)
      .map(() => createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1 }));
    // √(10 × 0.1²) = √0.1 ≈ 0.316
    expect(calculateRSS(dims)).toBeCloseTo(Math.sqrt(0.1), 10);
  });
});

// ============================================================================
// SIX SIGMA METHOD TESTS
// ============================================================================

describe("calculateSixSigma", () => {
  it("uses process capability", () => {
    const dims = [
      createDimension({
        tolerancePlus: 0.3,
        toleranceMinus: 0.3,
        processCapability: 1.0,
      }),
    ];
    // σ = 0.3 / (3 × 1.0) = 0.1
    // T = 3 × √(0.1²) = 3 × 0.1 = 0.3
    expect(calculateSixSigma(dims)).toBeCloseTo(0.3, 10);
  });

  it("defaults to Cp = 1.33", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.399, toleranceMinus: 0.399 }),
    ];
    // σ = 0.399 / (3 × 1.33) = 0.399 / 3.99 = 0.1
    // T = 3 × √(0.1²) = 0.3
    expect(calculateSixSigma(dims)).toBeCloseTo(0.3, 5);
  });

  it("higher Cp gives tighter tolerance", () => {
    const lowCp = [
      createDimension({
        tolerancePlus: 0.3,
        toleranceMinus: 0.3,
        processCapability: 1.0,
      }),
    ];
    const highCp = [
      createDimension({
        tolerancePlus: 0.3,
        toleranceMinus: 0.3,
        processCapability: 2.0,
      }),
    ];
    expect(calculateSixSigma(highCp)).toBeLessThan(calculateSixSigma(lowCp));
  });

  it("combines multiple dimensions", () => {
    const dims = [
      createDimension({
        tolerancePlus: 0.3,
        toleranceMinus: 0.3,
        processCapability: 1.0,
      }),
      createDimension({
        tolerancePlus: 0.3,
        toleranceMinus: 0.3,
        processCapability: 1.0,
      }),
    ];
    // σ₁ = σ₂ = 0.3 / 3 = 0.1
    // T = 3 × √(0.1² + 0.1²) = 3 × √0.02 ≈ 0.424
    expect(calculateSixSigma(dims)).toBeCloseTo(3 * Math.sqrt(0.02), 10);
  });

  it("applies sensitivity coefficients", () => {
    const dims = [
      createDimension({
        tolerancePlus: 0.15,
        toleranceMinus: 0.15,
        sensitivityCoefficient: 2,
        processCapability: 1.0,
      }),
    ];
    // σ = (0.15 × 2) / (3 × 1.0) = 0.3 / 3 = 0.1
    // T = 3 × 0.1 = 0.3
    expect(calculateSixSigma(dims)).toBeCloseTo(0.3, 10);
  });

  it("returns 0 for empty array", () => {
    expect(calculateSixSigma([])).toBe(0);
  });
});

// ============================================================================
// CONTRIBUTION ANALYSIS TESTS
// ============================================================================

describe("calculateContributions", () => {
  it("percentages sum to 100 for RSS", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1 }),
      createDimension({ tolerancePlus: 0.2, toleranceMinus: 0.2 }),
      createDimension({ tolerancePlus: 0.3, toleranceMinus: 0.3 }),
    ];
    const contributions = calculateContributions(dims, "rss");
    const total = contributions.reduce((sum, c) => sum + c.percentContribution, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it("percentages sum to 100 for worst-case", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1 }),
      createDimension({ tolerancePlus: 0.2, toleranceMinus: 0.2 }),
    ];
    const contributions = calculateContributions(dims, "worst-case");
    const total = contributions.reduce((sum, c) => sum + c.percentContribution, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it("percentages sum to 100 for six-sigma", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.1, toleranceMinus: 0.1, processCapability: 1.5 }),
      createDimension({ tolerancePlus: 0.2, toleranceMinus: 0.2, processCapability: 1.0 }),
    ];
    const contributions = calculateContributions(dims, "six-sigma");
    const total = contributions.reduce((sum, c) => sum + c.percentContribution, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it("larger tolerance has larger contribution (RSS)", () => {
    const dims = [
      createDimension({ id: "small", tolerancePlus: 0.1, toleranceMinus: 0.1 }),
      createDimension({ id: "large", tolerancePlus: 0.3, toleranceMinus: 0.3 }),
    ];
    const contributions = calculateContributions(dims, "rss");
    const small = contributions.find((c) => c.dimensionId === "small")!;
    const large = contributions.find((c) => c.dimensionId === "large")!;
    expect(large.percentContribution).toBeGreaterThan(small.percentContribution);
  });

  it("equal tolerances have equal contributions", () => {
    const dims = [
      createDimension({ id: "a", tolerancePlus: 0.1, toleranceMinus: 0.1 }),
      createDimension({ id: "b", tolerancePlus: 0.1, toleranceMinus: 0.1 }),
    ];
    const contributions = calculateContributions(dims, "rss");
    expect(contributions[0].percentContribution).toBeCloseTo(
      contributions[1].percentContribution,
      10
    );
    expect(contributions[0].percentContribution).toBeCloseTo(50, 10);
  });

  it("variance contribution is provided", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.3, toleranceMinus: 0.3 }),
    ];
    const contributions = calculateContributions(dims, "rss");
    expect(contributions[0].varianceContribution).toBeCloseTo(0.09, 10); // 0.3²
  });

  it("handles zero tolerances gracefully", () => {
    const dims = [
      createDimension({ tolerancePlus: 0, toleranceMinus: 0 }),
      createDimension({ tolerancePlus: 0, toleranceMinus: 0 }),
    ];
    const contributions = calculateContributions(dims, "rss");
    expect(contributions[0].percentContribution).toBe(0);
  });
});

// ============================================================================
// ACCEPTANCE CRITERIA TESTS
// ============================================================================

describe("checkAcceptance", () => {
  it("passes when within limits", () => {
    const result = checkAcceptance(0.5, 1.5, { minimum: 0, maximum: 2 });
    expect(result.passes).toBe(true);
    expect(result.marginToMinimum).toBe(0.5);
    expect(result.marginToMaximum).toBe(0.5);
  });

  it("fails when below minimum", () => {
    const result = checkAcceptance(-0.1, 0.5, { minimum: 0, maximum: 1 });
    expect(result.passes).toBe(false);
    expect(result.marginToMinimum).toBe(-0.1);
  });

  it("fails when above maximum", () => {
    const result = checkAcceptance(0.5, 1.5, { minimum: 0, maximum: 1 });
    expect(result.passes).toBe(false);
    expect(result.marginToMaximum).toBe(-0.5);
  });

  it("passes with only minimum specified", () => {
    const result = checkAcceptance(0.5, 10, { minimum: 0 });
    expect(result.passes).toBe(true);
    expect(result.marginToMinimum).toBe(0.5);
    expect(result.marginToMaximum).toBeUndefined();
  });

  it("passes with only maximum specified", () => {
    const result = checkAcceptance(-10, 0.5, { maximum: 1 });
    expect(result.passes).toBe(true);
    expect(result.marginToMinimum).toBeUndefined();
    expect(result.marginToMaximum).toBe(0.5);
  });

  it("handles exact boundary (min)", () => {
    const result = checkAcceptance(0, 1, { minimum: 0, maximum: 2 });
    expect(result.passes).toBe(true);
    expect(result.marginToMinimum).toBe(0);
  });

  it("handles exact boundary (max)", () => {
    const result = checkAcceptance(0, 2, { minimum: 0, maximum: 2 });
    expect(result.passes).toBe(true);
    expect(result.marginToMaximum).toBe(0);
  });

  it("handles negative limits (interference fit)", () => {
    const result = checkAcceptance(-0.03, -0.01, { minimum: -0.05, maximum: 0 });
    expect(result.passes).toBe(true);
    expect(result.marginToMinimum).toBeCloseTo(0.02, 10);
    expect(result.marginToMaximum).toBeCloseTo(0.01, 10);
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe("validateStackupInput", () => {
  it("valid with two dimensions", () => {
    const analysis = createAnalysis();
    const result = validateStackupInput(analysis);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("errors on single dimension", () => {
    const analysis = createAnalysis({
      dimensions: [createDimension()],
    });
    const result = validateStackupInput(analysis);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Stack-up requires at least 2 dimensions");
  });

  it("errors on empty dimensions", () => {
    const analysis = createAnalysis({
      dimensions: [],
    });
    const result = validateStackupInput(analysis);
    expect(result.valid).toBe(false);
  });

  it("warns on zero tolerance", () => {
    const analysis = createAnalysis({
      dimensions: [
        createDimension({ name: "Basic", tolerancePlus: 0, toleranceMinus: 0 }),
        createDimension(),
      ],
    });
    const result = validateStackupInput(analysis);
    expect(result.warnings.some((w) => w.includes("Zero tolerance"))).toBe(true);
  });

  it("warns on zero sensitivity", () => {
    const analysis = createAnalysis({
      dimensions: [
        createDimension({ name: "NoEffect", sensitivityCoefficient: 0 }),
        createDimension(),
      ],
    });
    const result = validateStackupInput(analysis);
    expect(result.warnings.some((w) => w.includes("Zero sensitivity"))).toBe(true);
  });

  it("warns on same-sign dimensions", () => {
    const analysis = createAnalysis({
      dimensions: [
        createDimension({ sign: "positive" }),
        createDimension({ sign: "positive" }),
      ],
    });
    const result = validateStackupInput(analysis);
    expect(result.warnings.some((w) => w.includes("same sign"))).toBe(true);
  });

  it("warns on low Cp for six-sigma", () => {
    const analysis = createAnalysis({
      analysisMethod: "six-sigma",
      dimensions: [
        createDimension({ processCapability: 0.8 }),
        createDimension({ sign: "negative" }),
      ],
    });
    const result = validateStackupInput(analysis);
    expect(result.warnings.some((w) => w.includes("Cp < 1.0"))).toBe(true);
  });

  it("no Cp warning for non-six-sigma methods", () => {
    const analysis = createAnalysis({
      analysisMethod: "worst-case",
      dimensions: [
        createDimension({ processCapability: 0.8 }),
        createDimension({ sign: "negative" }),
      ],
    });
    const result = validateStackupInput(analysis);
    expect(result.warnings.some((w) => w.includes("Cp < 1.0"))).toBe(false);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("calculateStackup (integration)", () => {
  it("calculates complete result for worst-case", () => {
    const analysis = createAnalysis({
      dimensions: [
        createDimension({
          nominal: 25,
          tolerancePlus: 0.1,
          toleranceMinus: 0.1,
          sign: "positive",
        }),
        createDimension({
          nominal: 20,
          tolerancePlus: 0.1,
          toleranceMinus: 0.1,
          sign: "negative",
        }),
      ],
      acceptanceCriteria: { minimum: 4, maximum: 6 },
      analysisMethod: "worst-case",
    });

    const result = calculateStackup(analysis);

    expect(result.nominalResult).toBe(5); // 25 - 20
    expect(result.totalTolerance).toBe(0.2); // 0.1 + 0.1
    expect(result.maximumValue).toBe(5.2);
    expect(result.minimumValue).toBe(4.8);
    expect(result.passesAcceptanceCriteria).toBe(true);
    expect(result.method).toBe("worst-case");
  });

  it("calculates complete result for RSS", () => {
    const analysis = createAnalysis({
      dimensions: [
        createDimension({
          nominal: 25,
          tolerancePlus: 0.3,
          toleranceMinus: 0.3,
          sign: "positive",
        }),
        createDimension({
          nominal: 20,
          tolerancePlus: 0.4,
          toleranceMinus: 0.4,
          sign: "negative",
        }),
      ],
      acceptanceCriteria: { minimum: 4, maximum: 6 },
      analysisMethod: "rss",
    });

    const result = calculateStackup(analysis);

    expect(result.nominalResult).toBe(5);
    expect(result.totalTolerance).toBeCloseTo(0.5, 10); // √(0.3² + 0.4²)
    expect(result.method).toBe("rss");
  });

  it("includes contribution data", () => {
    const analysis = createAnalysis();
    const result = calculateStackup(analysis);

    expect(result.contributions).toHaveLength(2);
    expect(result.contributions[0]).toHaveProperty("dimensionId");
    expect(result.contributions[0]).toHaveProperty("percentContribution");
    expect(result.contributions[0]).toHaveProperty("varianceContribution");
  });

  it("calculates margins correctly", () => {
    const analysis = createAnalysis({
      dimensions: [
        createDimension({ nominal: 10, sign: "positive" }),
        createDimension({ nominal: 5, sign: "negative" }),
      ],
      acceptanceCriteria: { minimum: 4, maximum: 6 },
      analysisMethod: "worst-case",
    });

    const result = calculateStackup(analysis);

    expect(result.marginToMinimum).toBeDefined();
    expect(result.marginToMaximum).toBeDefined();
  });
});

describe("compareAllMethods", () => {
  it("returns results for all three methods", () => {
    const analysis = createAnalysis();
    const results = compareAllMethods(analysis);

    expect(results).toHaveProperty("worst-case");
    expect(results).toHaveProperty("rss");
    expect(results).toHaveProperty("six-sigma");
  });

  it("worst-case >= RSS >= six-sigma (with high Cp)", () => {
    const analysis = createAnalysis({
      dimensions: [
        createDimension({
          tolerancePlus: 0.1,
          toleranceMinus: 0.1,
          processCapability: 2.0,
        }),
        createDimension({
          tolerancePlus: 0.1,
          toleranceMinus: 0.1,
          processCapability: 2.0,
          sign: "negative",
        }),
      ],
    });
    const results = compareAllMethods(analysis);

    expect(results["worst-case"].totalTolerance).toBeGreaterThanOrEqual(
      results["rss"].totalTolerance
    );
    expect(results["rss"].totalTolerance).toBeGreaterThanOrEqual(
      results["six-sigma"].totalTolerance
    );
  });

  it("all methods have same nominal", () => {
    const analysis = createAnalysis();
    const results = compareAllMethods(analysis);

    expect(results["worst-case"].nominalResult).toBe(results["rss"].nominalResult);
    expect(results["rss"].nominalResult).toBe(results["six-sigma"].nominalResult);
  });
});

// ============================================================================
// REAL-WORLD SCENARIO TESTS
// ============================================================================

describe("Real-world: Bearing Clearance Stack", () => {
  it("calculates bearing housing clearance with asymmetric tolerances", () => {
    // Housing bore: 50.000 +0.025/-0.000
    //   - Nominal = 50.0, Mean = 50.0125, bilateral tolerance = 0.0125
    //   - Min = 50.000, Max = 50.025
    // Bearing OD: 50.000 +0.000/-0.013
    //   - Nominal = 50.0, Mean = 49.9935, bilateral tolerance = 0.0065
    //   - Min = 49.987, Max = 50.000
    //
    // Theoretical Max Clearance: 50.025 - 49.987 = 0.038
    // Theoretical Min Clearance: 50.000 - 50.000 = 0.000

    const analysis = createAnalysis({
      name: "Bearing Clearance",
      measurementObjective: "Clearance between bearing OD and housing bore",
      dimensions: [
        createDimension({
          name: "Housing Bore",
          nominal: 50.0,
          tolerancePlus: 0.025,
          toleranceMinus: 0.0,
          sign: "positive",
        }),
        createDimension({
          name: "Bearing OD",
          nominal: 50.0,
          tolerancePlus: 0.0,
          toleranceMinus: 0.013,
          sign: "negative",
        }),
      ],
      acceptanceCriteria: { minimum: 0 }, // No interference allowed
      analysisMethod: "worst-case",
    });

    const result = calculateStackup(analysis);

    // Nominal (drawing value): 50 - 50 = 0
    expect(result.nominalResult).toBe(0);

    // Bilateral tolerances: housing = 0.0125, bearing = 0.0065
    // Worst case tolerance: 0.0125 + 0.0065 = 0.019
    expect(result.totalTolerance).toBeCloseTo(0.019, 10);

    // With mean shift correction:
    // Mean shift = 0.0125 + 0.0065 = 0.019 (housing shifts up, bearing shifts down)
    // Centered nominal = 0 + 0.019 = 0.019
    // Max = 0.019 + 0.019 = 0.038
    // Min = 0.019 - 0.019 = 0.000
    expect(result.maximumValue).toBeCloseTo(0.038, 10);
    expect(result.minimumValue).toBeCloseTo(0.0, 10);

    // Now passes acceptance criteria (no interference)!
    expect(result.passesAcceptanceCriteria).toBe(true);
  });

  it("calculates bearing housing clearance with RSS", () => {
    const analysis = createAnalysis({
      dimensions: [
        createDimension({
          name: "Housing Bore",
          nominal: 50.0,
          tolerancePlus: 0.025,
          toleranceMinus: 0.0,
          sign: "positive",
        }),
        createDimension({
          name: "Bearing OD",
          nominal: 50.0,
          tolerancePlus: 0.0,
          toleranceMinus: 0.013,
          sign: "negative",
        }),
      ],
      acceptanceCriteria: { minimum: 0 },
      analysisMethod: "rss",
    });

    const result = calculateStackup(analysis);

    // RSS will be less conservative than worst-case
    expect(result.totalTolerance).toBeLessThan(0.019);

    // RSS tolerance = √(0.0125² + 0.0065²) ≈ 0.0141
    const expectedRSS = Math.sqrt(Math.pow(0.0125, 2) + Math.pow(0.0065, 2));
    expect(result.totalTolerance).toBeCloseTo(expectedRSS, 10);

    // With mean shift (0.019), min = 0.019 - 0.0141 ≈ 0.0049
    // This is greater than 0, so it passes
    expect(result.minimumValue).toBeGreaterThan(0);
    expect(result.passesAcceptanceCriteria).toBe(true);
  });
});

describe("Real-world: Bolt Pattern Alignment", () => {
  it("calculates bolt hole alignment", () => {
    const analysis = createAnalysis({
      name: "Bolt Hole Alignment",
      measurementObjective: "Maximum positional error at bolt pattern",
      dimensions: [
        createDimension({
          name: "Base Plate Hole Position",
          nominal: 0,
          tolerancePlus: 0.15,
          toleranceMinus: 0.15,
          sign: "positive",
        }),
        createDimension({
          name: "Cover Plate Hole Position",
          nominal: 0,
          tolerancePlus: 0.2,
          toleranceMinus: 0.2,
          sign: "positive",
        }),
      ],
      acceptanceCriteria: { maximum: 0.5 },
      positiveDirection: "bottom-to-top",
      analysisMethod: "worst-case",
    });

    const result = calculateStackup(analysis);

    // Both contribute positively, nominal is 0
    expect(result.nominalResult).toBe(0);
    // Total: 0.15 + 0.2 = 0.35
    expect(result.totalTolerance).toBe(0.35);
    // Max: 0.35, passes 0.5 limit
    expect(result.passesAcceptanceCriteria).toBe(true);
    expect(result.marginToMaximum).toBeCloseTo(0.15, 10);
  });
});

describe("Real-world: Shaft in Housing with Multiple Parts", () => {
  it("calculates multi-part stack", () => {
    const analysis = createAnalysis({
      name: "Shaft End Play",
      measurementObjective: "Axial play of shaft in housing",
      dimensions: [
        createDimension({
          name: "Housing Depth",
          nominal: 100.0,
          tolerancePlus: 0.1,
          toleranceMinus: 0.1,
          sign: "positive",
        }),
        createDimension({
          name: "Bearing A Width",
          nominal: 25.0,
          tolerancePlus: 0.05,
          toleranceMinus: 0.05,
          sign: "negative",
        }),
        createDimension({
          name: "Spacer",
          nominal: 10.0,
          tolerancePlus: 0.08,
          toleranceMinus: 0.08,
          sign: "negative",
        }),
        createDimension({
          name: "Bearing B Width",
          nominal: 25.0,
          tolerancePlus: 0.05,
          toleranceMinus: 0.05,
          sign: "negative",
        }),
        createDimension({
          name: "Shaft Length",
          nominal: 39.5,
          tolerancePlus: 0.1,
          toleranceMinus: 0.1,
          sign: "negative",
        }),
      ],
      acceptanceCriteria: { minimum: 0.1, maximum: 0.8 },
      analysisMethod: "rss",
    });

    const result = calculateStackup(analysis);

    // Nominal: 100 - 25 - 10 - 25 - 39.5 = 0.5
    expect(result.nominalResult).toBe(0.5);

    // RSS of all tolerances: √(0.1² + 0.05² + 0.08² + 0.05² + 0.1²)
    const expectedRSS = Math.sqrt(0.01 + 0.0025 + 0.0064 + 0.0025 + 0.01);
    expect(result.totalTolerance).toBeCloseTo(expectedRSS, 10);

    // Check contributions add to 100%
    const totalContrib = result.contributions.reduce(
      (sum, c) => sum + c.percentContribution,
      0
    );
    expect(totalContrib).toBeCloseTo(100, 5);
  });
});

describe("Edge cases", () => {
  it("handles very small tolerances", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.001, toleranceMinus: 0.001 }),
      createDimension({ tolerancePlus: 0.001, toleranceMinus: 0.001, sign: "negative" }),
    ];
    expect(calculateWorstCase(dims)).toBeCloseTo(0.002, 10);
    expect(calculateRSS(dims)).toBeCloseTo(Math.sqrt(0.000002), 10);
  });

  it("handles very large tolerances", () => {
    const dims = [
      createDimension({ tolerancePlus: 100, toleranceMinus: 100 }),
      createDimension({ tolerancePlus: 100, toleranceMinus: 100, sign: "negative" }),
    ];
    expect(calculateWorstCase(dims)).toBe(200);
    expect(calculateRSS(dims)).toBeCloseTo(Math.sqrt(20000), 10);
  });

  it("handles mixed very small and large tolerances", () => {
    const dims = [
      createDimension({ tolerancePlus: 0.001, toleranceMinus: 0.001 }),
      createDimension({ tolerancePlus: 10, toleranceMinus: 10, sign: "negative" }),
    ];
    const contributions = calculateContributions(dims, "rss");

    // Large tolerance should dominate
    const small = contributions[0];
    const large = contributions[1];
    expect(large.percentContribution).toBeGreaterThan(99);
    expect(small.percentContribution).toBeLessThan(1);
  });
});
