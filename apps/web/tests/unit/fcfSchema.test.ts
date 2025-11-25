import { describe, expect, it } from "vitest";

import {
  FcfJson,
  fcfJsonSchema,
  isFcfJson,
  parseFcfJson,
  validateSchemaOnly
} from "@/lib/fcf/schema";

const basePosition: FcfJson = {
  characteristic: "position",
  featureType: "hole",
  sourceUnit: "mm",
  source: { inputType: "builder" },
  tolerance: { value: 0.1, diameter: true },
  datums: [{ id: "A" }]
};

describe("fcfJsonSchema", () => {
  it("accepts a valid position FCF", () => {
    const parsed = parseFcfJson(basePosition);
    expect(parsed.characteristic).toBe("position");
    expect(isFcfJson(basePosition)).toBe(true);
    expect(validateSchemaOnly(basePosition)).toHaveLength(0);
  });

  it("rejects invalid characteristic", () => {
    const invalid = { ...basePosition, characteristic: "invalid" } as unknown;
    expect(isFcfJson(invalid)).toBe(false);
    expect(() => parseFcfJson(invalid)).toThrow();
  });

  it("rejects missing tolerance value", () => {
    const invalid = { ...basePosition, tolerance: {} } as unknown;
    expect(fcfJsonSchema.safeParse(invalid).success).toBe(false);
  });

  it("flags missing datums for position in schema-only validation", () => {
    const noDatums = { ...basePosition, datums: [] };
    const issues = validateSchemaOnly(noDatums);
    expect(issues).toContain("Datum references are required for position/perpendicularity.");
  });
});
