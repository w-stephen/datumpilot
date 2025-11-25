import { z } from "zod";

// Enumerations kept tight to the current product scope and the v2 data model.
export type Characteristic = "position" | "flatness" | "perpendicularity" | "profile" | "other";
export type Unit = "mm" | "inch";
export type FeatureType = "hole" | "slot" | "pin" | "boss" | "surface" | "plane" | "edge";
export type MaterialConditionSymbol = "MMC" | "LMC" | "RFS";
export type FrameModifier =
  | "FREE_STATE"
  | "PROJECTED_TOLERANCE_ZONE"
  | "TANGENT_PLANE"
  | "UNEQUALLY_DISPOSED";
export type GeometricStandard = "ASME_Y14_5_2018" | "ISO_1101";

export type DatumReference = {
  id: string; // Letter ID from the drawing (e.g., "A", "B", "C").
  materialCondition?: MaterialConditionSymbol; // Optional M/L/R material condition for datum feature of size.
};

export type ToleranceZone = {
  value: number; // Numeric tolerance value in source units.
  unit?: Unit; // Optional override; otherwise use FcfJson.sourceUnit.
  diameter?: boolean; // True when zone is cylindrical (e.g., position of a hole).
  materialCondition?: MaterialConditionSymbol; // M/L/R applied to the tolerance itself.
  zoneShape?: "cylindrical" | "spherical" | "twoParallelPlanes" | "twoParallelLines";
};

export type PatternSpec = {
  count?: number; // Number of repeated features (e.g., 4X).
  note?: string; // Optional pattern note (e.g., "2X EQ SP").
};

export type SizeDimension = {
  nominal: number; // Nominal size of the feature of size (e.g., hole diameter).
  tolerancePlus?: number; // Plus tolerance on size (for bilateral/limit).
  toleranceMinus?: number; // Minus tolerance on size.
  unit?: Unit;
  note?: string;
};

export type ProjectedZone = {
  height: number; // Projection height for fasteners, measured along the axis.
  unit?: Unit;
};

export type CompositeSegment = {
  tolerance: ToleranceZone; // Each segment has its own tolerance value and modifiers.
  datums?: DatumReference[]; // Datums per segment (secondary/tertiary may differ).
  modifiers?: FrameModifier[]; // Segment-level modifiers (e.g., tangent plane).
};

export type CompositeFrame =
  | {
      type: "composite"; // Two segments share primary datum, second refines orientation/location.
      segments: CompositeSegment[];
    }
  | {
      type: "multipleSingleSegments"; // Multiple single-segment frames tied to a pattern.
      segments: CompositeSegment[];
    };

export type SourceInfo = {
  inputType: "image" | "builder" | "json"; // How this FCF was captured.
  fileUrl?: string; // Optional reference to the source image/file.
  uploadId?: string; // Optional link to uploads table/storage metadata.
  notes?: string;
};

/**
 * Canonical Feature Control Frame JSON used across UI, validation, calculators, AI prompts, and storage.
 * Fields are kept explicit to avoid ambiguity across characteristics and feature types.
 */
export type FcfJson = {
  characteristic: Characteristic; // Geometric characteristic symbol.
  featureType?: FeatureType; // Helps drive rule checks (e.g., datum eligibility, modifiers).
  name?: string; // Human-friendly label (unique per project in persistence layer).
  sourceUnit: Unit; // Source drawing unit; downstream conversions derive from this.
  standard?: GeometricStandard; // Defaults to ASME Y14.5-2018 if omitted.
  source: SourceInfo; // Capture path/context for traceability.
  tolerance: ToleranceZone; // Core tolerance block.
  datums?: DatumReference[]; // Primary/secondary/tertiary datum references (ordered).
  modifiers?: FrameModifier[]; // Frame-level modifiers (projected zone, free state, etc.).
  pattern?: PatternSpec; // Pattern context if applicable.
  sizeDimension?: SizeDimension; // Feature-of-size info (enables MMC/LMC rules).
  projectedZone?: ProjectedZone; // Projection height when required for fasteners.
  composite?: CompositeFrame; // Composite or multiple single segments when needed.
  notes?: string[]; // Free-form annotations (e.g., "basic angle 30°").
};

const characteristicSchema = z.enum(["position", "flatness", "perpendicularity", "profile", "other"]);
const unitSchema = z.enum(["mm", "inch"]);
const featureTypeSchema = z.enum(["hole", "slot", "pin", "boss", "surface", "plane", "edge"]);
const materialConditionSchema = z.enum(["MMC", "LMC", "RFS"]);
const frameModifierSchema = z.enum([
  "FREE_STATE",
  "PROJECTED_TOLERANCE_ZONE",
  "TANGENT_PLANE",
  "UNEQUALLY_DISPOSED"
]);
const geometricStandardSchema = z.enum(["ASME_Y14_5_2018", "ISO_1101"]);
const zoneShapeSchema = z.enum(["cylindrical", "spherical", "twoParallelPlanes", "twoParallelLines"]);
const sourceInputTypeSchema = z.enum(["image", "builder", "json"]);

const datumReferenceSchema = z.object({
  id: z.string().min(1),
  materialCondition: materialConditionSchema.optional()
});

const toleranceZoneSchema = z.object({
  value: z.number(),
  unit: unitSchema.optional(),
  diameter: z.boolean().optional(),
  materialCondition: materialConditionSchema.optional(),
  zoneShape: zoneShapeSchema.optional()
});

const patternSpecSchema = z.object({
  count: z.number().optional(),
  note: z.string().optional()
});

const sizeDimensionSchema = z.object({
  nominal: z.number(),
  tolerancePlus: z.number().optional(),
  toleranceMinus: z.number().optional(),
  unit: unitSchema.optional(),
  note: z.string().optional()
});

const projectedZoneSchema = z.object({
  height: z.number(),
  unit: unitSchema.optional()
});

const compositeSegmentSchema = z.object({
  tolerance: toleranceZoneSchema,
  datums: datumReferenceSchema.array().optional(),
  modifiers: frameModifierSchema.array().optional()
});

const compositeFrameSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("composite"),
    segments: z.array(compositeSegmentSchema).min(1)
  }),
  z.object({
    type: z.literal("multipleSingleSegments"),
    segments: z.array(compositeSegmentSchema).min(1)
  })
]);

const sourceInfoSchema = z.object({
  inputType: sourceInputTypeSchema,
  fileUrl: z.string().optional(),
  uploadId: z.string().optional(),
  notes: z.string().optional()
});

export const fcfJsonSchema: z.ZodType<FcfJson> = z.object({
  characteristic: characteristicSchema,
  featureType: featureTypeSchema.optional(),
  name: z.string().optional(),
  sourceUnit: unitSchema,
  standard: geometricStandardSchema.optional(),
  source: sourceInfoSchema,
  tolerance: toleranceZoneSchema,
  datums: datumReferenceSchema.array().optional(),
  modifiers: frameModifierSchema.array().optional(),
  pattern: patternSpecSchema.optional(),
  sizeDimension: sizeDimensionSchema.optional(),
  projectedZone: projectedZoneSchema.optional(),
  composite: compositeFrameSchema.optional(),
  notes: z.array(z.string()).optional()
});

export function parseFcfJson(raw: unknown): FcfJson {
  return fcfJsonSchema.parse(raw);
}

export function isFcfJson(raw: unknown): raw is FcfJson {
  return fcfJsonSchema.safeParse(raw).success;
}

export function validateSchemaOnly(fcf: FcfJson): string[] {
  const issues: string[] = [];

  if (!fcf.characteristic) {
    issues.push("Characteristic is required.");
  }

  if (!fcf.sourceUnit) {
    issues.push("Source unit is required.");
  }

  if (!fcf.tolerance || typeof fcf.tolerance.value !== "number") {
    issues.push("Tolerance value is required.");
  }

  if (
    (fcf.characteristic === "position" || fcf.characteristic === "perpendicularity") &&
    (!fcf.datums || fcf.datums.length === 0)
  ) {
    issues.push("Datum references are required for position/perpendicularity.");
  }

  return issues;
}

// Examples (annotated) to exercise common characteristics.
export const exampleFcfs: Record<string, FcfJson> = {
  // Position of a hole on a bolt circle, cylindrical zone at MMC, projected for stack-up.
  positionHole: {
    characteristic: "position",
    featureType: "hole",
    name: "Ø10 THRU @ B.C.",
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
    sizeDimension: { nominal: 10, tolerancePlus: 0.1, toleranceMinus: 0, note: "THRU" }
  },

  // Flatness of a surface, no datums allowed, applies regardless of size.
  flatnessSurface: {
    characteristic: "flatness",
    featureType: "surface",
    name: "TOP FACE FLATNESS",
    sourceUnit: "mm",
    source: { inputType: "builder" },
    tolerance: { value: 0.05, zoneShape: "twoParallelPlanes" },
    notes: ["Controlled surface must lie within 0.05mm zone"]
  },

  // Perpendicularity of a slot relative to datum A, RFS, tied to size dimension.
  perpendicularitySlot: {
    characteristic: "perpendicularity",
    featureType: "slot",
    name: "SLOT PERP TO A",
    sourceUnit: "mm",
    source: { inputType: "builder" },
    tolerance: { value: 0.1, zoneShape: "twoParallelPlanes" },
    datums: [{ id: "A" }],
    sizeDimension: { nominal: 20, tolerancePlus: 0.2, toleranceMinus: 0.2 }
  },

  // Profile of a surface with bilateral tolerance and datum A|B reference.
  profileSurface: {
    characteristic: "profile",
    featureType: "surface",
    name: "PROFILE OF HOUSING",
    sourceUnit: "mm",
    source: { inputType: "builder" },
    tolerance: { value: 0.4 },
    datums: [{ id: "A" }, { id: "B" }],
    notes: ["Profile controls form/orientation/location relative to A|B"]
  },

  // Composite position for a 2X slot pattern: upper segment locates to A|B|C, lower refines to A|B.
  compositePositionSlots: {
    characteristic: "position",
    featureType: "slot",
    name: "2X SLOT COMPOSITE POS",
    sourceUnit: "mm",
    source: { inputType: "builder" },
    tolerance: { value: 0.25, diameter: false },
    datums: [
      { id: "A" },
      { id: "B" },
      { id: "C" }
    ],
    pattern: { count: 2, note: "2X" },
    composite: {
      type: "composite",
      segments: [
        {
          tolerance: { value: 0.25 },
          datums: [
            { id: "A" },
            { id: "B" },
            { id: "C" }
          ]
        },
        {
          tolerance: { value: 0.1 },
          datums: [
            { id: "A" },
            { id: "B" }
          ]
        }
      ]
    }
  }
};

// Constraint notes (for validators/prompts) summarizing key GD&T rules in scope.
export const constraintNotes: string[] = [
  "Position and perpendicularity require a primary datum; add secondary/tertiary as needed for full location.",
  "Flatness cannot reference datums and cannot use MMC/LMC modifiers.",
  "MMC/LMC on the tolerance or datums require a feature of size (e.g., hole, pin, slot) with a declared sizeDimension.",
  "Cylindrical zone (diameter symbol) is valid for position and certain profile-of-line cases; default is planar/linear.",
  "Projected tolerance zone applies to fastener stacks and patterns; include projectedZone.height when used.",
  "Composite frames share the primary datum; lower segments refine orientation/location and usually drop tertiary datums."
];
