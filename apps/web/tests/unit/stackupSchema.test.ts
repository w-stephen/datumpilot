import { describe, expect, it } from "vitest";

import {
  StackupDimensionSchema,
  StackupAnalysisSchema,
  AcceptanceCriteriaSchema,
  parseStackupAnalysis,
  parseStackupDimension,
  isStackupAnalysis,
  isStackupDimension,
  DEFAULT_PROCESS_CAPABILITY,
  type StackupAnalysis,
  type StackupDimension,
} from "@/lib/stackup/schema";

// Test fixtures
const validDimension: StackupDimension = {
  id: crypto.randomUUID(),
  name: "Shaft Diameter",
  nominal: 25.0,
  tolerancePlus: 0.025,
  toleranceMinus: 0.025,
  sign: "positive",
  sensitivityCoefficient: 1,
};

const validDimension2: StackupDimension = {
  id: crypto.randomUUID(),
  name: "Housing Bore",
  nominal: 25.1,
  tolerancePlus: 0.03,
  toleranceMinus: 0.02,
  sign: "negative",
  sensitivityCoefficient: 1,
};

const createValidAnalysis = (): StackupAnalysis => ({
  id: crypto.randomUUID(),
  projectId: crypto.randomUUID(),
  name: "Bearing Clearance Stack",
  description: "Analysis of bearing-to-housing fit",
  measurementObjective: "Gap between bearing outer race and housing bore",
  acceptanceCriteria: { minimum: 0.01, maximum: 0.1 },
  positiveDirection: "left-to-right",
  dimensions: [validDimension, validDimension2],
  analysisMethod: "rss",
  unit: "mm",
  createdBy: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe("StackupDimensionSchema", () => {
  it("validates a complete dimension", () => {
    const result = StackupDimensionSchema.safeParse(validDimension);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Shaft Diameter");
      expect(result.data.nominal).toBe(25.0);
    }
  });

  it("validates dimension with optional fields", () => {
    const dim = {
      ...validDimension,
      description: "Main shaft diameter at bearing location",
      processCapability: 1.33,
      sourceDrawing: "DWG-001",
      sourceRevision: "A",
    };
    const result = StackupDimensionSchema.safeParse(dim);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.processCapability).toBe(1.33);
      expect(result.data.sourceDrawing).toBe("DWG-001");
    }
  });

  it("rejects negative tolerancePlus", () => {
    const dim = {
      ...validDimension,
      tolerancePlus: -0.1,
    };
    const result = StackupDimensionSchema.safeParse(dim);
    expect(result.success).toBe(false);
  });

  it("rejects negative toleranceMinus", () => {
    const dim = {
      ...validDimension,
      toleranceMinus: -0.1,
    };
    const result = StackupDimensionSchema.safeParse(dim);
    expect(result.success).toBe(false);
  });

  it("rejects invalid sign value", () => {
    const dim = {
      ...validDimension,
      sign: "invalid",
    };
    const result = StackupDimensionSchema.safeParse(dim);
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const dim = {
      ...validDimension,
      name: "",
    };
    const result = StackupDimensionSchema.safeParse(dim);
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 100 characters", () => {
    const dim = {
      ...validDimension,
      name: "A".repeat(101),
    };
    const result = StackupDimensionSchema.safeParse(dim);
    expect(result.success).toBe(false);
  });

  it("rejects non-positive processCapability", () => {
    const dim = {
      ...validDimension,
      processCapability: 0,
    };
    const result = StackupDimensionSchema.safeParse(dim);
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const dim = {
      ...validDimension,
      id: "not-a-uuid",
    };
    const result = StackupDimensionSchema.safeParse(dim);
    expect(result.success).toBe(false);
  });

  it("allows zero tolerance (unilateral case)", () => {
    const dim = {
      ...validDimension,
      tolerancePlus: 0.05,
      toleranceMinus: 0,
    };
    const result = StackupDimensionSchema.safeParse(dim);
    expect(result.success).toBe(true);
  });

  it("parseStackupDimension throws on invalid input", () => {
    expect(() => parseStackupDimension({ id: "bad" })).toThrow();
  });

  it("isStackupDimension returns false for invalid input", () => {
    expect(isStackupDimension({ id: "bad" })).toBe(false);
    expect(isStackupDimension(validDimension)).toBe(true);
  });
});

describe("AcceptanceCriteriaSchema", () => {
  it("requires at least one limit", () => {
    expect(AcceptanceCriteriaSchema.safeParse({}).success).toBe(false);
  });

  it("accepts minimum only", () => {
    const result = AcceptanceCriteriaSchema.safeParse({ minimum: 0.01 });
    expect(result.success).toBe(true);
  });

  it("accepts maximum only", () => {
    const result = AcceptanceCriteriaSchema.safeParse({ maximum: 0.5 });
    expect(result.success).toBe(true);
  });

  it("accepts both minimum and maximum", () => {
    const result = AcceptanceCriteriaSchema.safeParse({
      minimum: 0.01,
      maximum: 0.5,
    });
    expect(result.success).toBe(true);
  });

  it("allows negative values (for interference fits)", () => {
    const result = AcceptanceCriteriaSchema.safeParse({
      minimum: -0.05,
      maximum: -0.01,
    });
    expect(result.success).toBe(true);
  });

  it("allows zero as a limit", () => {
    const result = AcceptanceCriteriaSchema.safeParse({ minimum: 0 });
    expect(result.success).toBe(true);
  });
});

describe("StackupAnalysisSchema", () => {
  it("validates a complete analysis", () => {
    const analysis = createValidAnalysis();
    const result = StackupAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Bearing Clearance Stack");
      expect(result.data.dimensions).toHaveLength(2);
    }
  });

  it("requires at least 2 dimensions", () => {
    const analysis = createValidAnalysis();
    analysis.dimensions = [validDimension];
    const result = StackupAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 dimensions", () => {
    const analysis = createValidAnalysis();
    analysis.dimensions = Array(51)
      .fill(null)
      .map(() => ({
        ...validDimension,
        id: crypto.randomUUID(),
      }));
    const result = StackupAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(false);
  });

  it("validates all analysis methods", () => {
    const methods = ["worst-case", "rss", "six-sigma"] as const;
    for (const method of methods) {
      const analysis = createValidAnalysis();
      analysis.analysisMethod = method;
      const result = StackupAnalysisSchema.safeParse(analysis);
      expect(result.success).toBe(true);
    }
  });

  it("validates all positive directions", () => {
    const directions = [
      "left-to-right",
      "right-to-left",
      "bottom-to-top",
      "top-to-bottom",
    ] as const;
    for (const direction of directions) {
      const analysis = createValidAnalysis();
      analysis.positiveDirection = direction;
      const result = StackupAnalysisSchema.safeParse(analysis);
      expect(result.success).toBe(true);
    }
  });

  it("validates both unit options", () => {
    for (const unit of ["mm", "inch"] as const) {
      const analysis = createValidAnalysis();
      analysis.unit = unit;
      const result = StackupAnalysisSchema.safeParse(analysis);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid analysis method", () => {
    const analysis = createValidAnalysis();
    (analysis as unknown as { analysisMethod: string }).analysisMethod =
      "monte-carlo";
    const result = StackupAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(false);
  });

  it("rejects empty measurement objective", () => {
    const analysis = createValidAnalysis();
    analysis.measurementObjective = "";
    const result = StackupAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding 200 characters", () => {
    const analysis = createValidAnalysis();
    analysis.name = "A".repeat(201);
    const result = StackupAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 2000 characters", () => {
    const analysis = createValidAnalysis();
    analysis.description = "A".repeat(2001);
    const result = StackupAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(false);
  });

  it("parseStackupAnalysis returns valid data", () => {
    const analysis = createValidAnalysis();
    const parsed = parseStackupAnalysis(analysis);
    expect(parsed.name).toBe(analysis.name);
    expect(parsed.dimensions).toHaveLength(2);
  });

  it("parseStackupAnalysis throws on invalid input", () => {
    expect(() => parseStackupAnalysis({ id: "bad" })).toThrow();
  });

  it("isStackupAnalysis type guard works correctly", () => {
    const analysis = createValidAnalysis();
    expect(isStackupAnalysis(analysis)).toBe(true);
    expect(isStackupAnalysis({ id: "bad" })).toBe(false);
    expect(isStackupAnalysis(null)).toBe(false);
  });
});

describe("Constants", () => {
  it("DEFAULT_PROCESS_CAPABILITY is 1.33", () => {
    expect(DEFAULT_PROCESS_CAPABILITY).toBe(1.33);
  });
});

describe("Integration scenarios", () => {
  it("validates a realistic bearing clearance analysis", () => {
    const analysis: StackupAnalysis = {
      id: crypto.randomUUID(),
      projectId: crypto.randomUUID(),
      name: "Bearing-Housing Fit",
      measurementObjective: "Radial clearance between bearing OD and housing bore",
      acceptanceCriteria: { minimum: 0.005, maximum: 0.025 },
      positiveDirection: "left-to-right",
      dimensions: [
        {
          id: crypto.randomUUID(),
          name: "Housing Bore Diameter",
          description: "Inner diameter of housing at bearing seat",
          nominal: 62.0,
          tolerancePlus: 0.03,
          toleranceMinus: 0,
          sign: "positive",
          sensitivityCoefficient: 0.5, // Half for diametral to radial
          processCapability: 1.5,
          sourceDrawing: "HSG-001",
          sourceRevision: "B",
        },
        {
          id: crypto.randomUUID(),
          name: "Bearing OD",
          description: "Outer diameter of bearing",
          nominal: 62.0,
          tolerancePlus: 0,
          toleranceMinus: 0.013,
          sign: "negative",
          sensitivityCoefficient: 0.5,
          processCapability: 2.0, // Bearing manufacturer Cp
          sourceDrawing: "6212-2RS",
        },
      ],
      analysisMethod: "six-sigma",
      unit: "mm",
      createdBy: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = StackupAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(true);
  });

  it("validates a bolt pattern worst-case stack", () => {
    const analysis: StackupAnalysis = {
      id: crypto.randomUUID(),
      projectId: crypto.randomUUID(),
      name: "Bolt Hole Alignment",
      measurementObjective: "Maximum positional error at bolt pattern",
      acceptanceCriteria: { maximum: 0.5 },
      positiveDirection: "bottom-to-top",
      dimensions: [
        {
          id: crypto.randomUUID(),
          name: "Base Plate Hole Position",
          nominal: 0,
          tolerancePlus: 0.15,
          toleranceMinus: 0.15,
          sign: "positive",
          sensitivityCoefficient: 1,
        },
        {
          id: crypto.randomUUID(),
          name: "Cover Plate Hole Position",
          nominal: 0,
          tolerancePlus: 0.2,
          toleranceMinus: 0.2,
          sign: "positive",
          sensitivityCoefficient: 1,
        },
      ],
      analysisMethod: "worst-case",
      unit: "mm",
      createdBy: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = StackupAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(true);
  });
});
