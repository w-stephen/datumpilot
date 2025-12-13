/**
 * GD&T Symbol Constants
 *
 * SVG paths and Unicode characters for Geometric Dimensioning & Tolerancing symbols
 * following ASME Y14.5-2018 standard conventions.
 */

import type { Characteristic, MaterialConditionSymbol, FeatureType, FrameModifier } from "@/lib/fcf/schema";

// ============================================================================
// UNICODE SYMBOLS
// ============================================================================

export const GDT_SYMBOLS = {
  // Characteristic symbols
  position: "⊕",
  flatness: "⏥",
  perpendicularity: "⊥",
  profile: "⌓",
  circularity: "○",
  cylindricity: "⌭",
  straightness: "⎯",
  parallelism: "∥",
  angularity: "∠",
  runout: "↗",
  totalRunout: "↗↗",

  // Modifiers
  diameter: "⌀",
  mmc: "Ⓜ",
  lmc: "Ⓛ",
  rfs: "Ⓢ",
  projectedTolerance: "Ⓟ",
  freeState: "Ⓕ",
  tangentPlane: "Ⓣ",
  unequallyDisposed: "Ⓤ",

  // Datum symbols
  datum: "▼",
  basicDimension: "□",
} as const;

// ============================================================================
// CHARACTERISTIC COLORS
// ============================================================================

export const CHARACTERISTIC_COLORS: Record<Characteristic, string> = {
  position: "#3B82F6",      // Electric blue
  flatness: "#10B981",      // Green
  perpendicularity: "#F59E0B", // Amber
  profile: "#8B5CF6",       // Purple
  other: "#6B7280",         // Gray
};

export const CHARACTERISTIC_BG_COLORS: Record<Characteristic, string> = {
  position: "rgba(59, 130, 246, 0.1)",
  flatness: "rgba(16, 185, 129, 0.1)",
  perpendicularity: "rgba(245, 158, 11, 0.1)",
  profile: "rgba(139, 92, 246, 0.1)",
  other: "rgba(107, 114, 128, 0.1)",
};

// ============================================================================
// CHARACTERISTIC LABELS
// ============================================================================

export const CHARACTERISTIC_LABELS: Record<Characteristic, string> = {
  position: "Position",
  flatness: "Flatness",
  perpendicularity: "Perpendicularity",
  profile: "Profile",
  other: "Other",
};

export const CHARACTERISTIC_DESCRIPTIONS: Record<Characteristic, string> = {
  position: "Controls location relative to datum reference frame",
  flatness: "Controls surface flatness within tolerance zone",
  perpendicularity: "Controls orientation perpendicular to datum",
  profile: "Controls form, orientation, and/or location of a surface",
  other: "Other geometric characteristic",
};

// ============================================================================
// MATERIAL CONDITION LABELS
// ============================================================================

export const MATERIAL_CONDITION_LABELS: Record<MaterialConditionSymbol, string> = {
  MMC: "Maximum Material Condition",
  LMC: "Least Material Condition",
  RFS: "Regardless of Feature Size",
};

export const MATERIAL_CONDITION_SHORT: Record<MaterialConditionSymbol, string> = {
  MMC: "MMC",
  LMC: "LMC",
  RFS: "RFS",
};

export const MATERIAL_CONDITION_SYMBOLS: Record<MaterialConditionSymbol, string> = {
  MMC: "Ⓜ",
  LMC: "Ⓛ",
  RFS: "",  // RFS is implicit in ASME Y14.5-2018
};

// ============================================================================
// FEATURE TYPE LABELS
// ============================================================================

export const FEATURE_TYPE_LABELS: Record<FeatureType, string> = {
  hole: "Hole",
  slot: "Slot",
  pin: "Pin",
  boss: "Boss",
  surface: "Surface",
  plane: "Plane",
  edge: "Edge",
};

export const FEATURE_TYPE_DESCRIPTIONS: Record<FeatureType, string> = {
  hole: "Internal cylindrical feature",
  slot: "Elongated internal feature",
  pin: "External cylindrical feature",
  boss: "External raised feature",
  surface: "Planar or contoured surface",
  plane: "Flat datum surface",
  edge: "Linear feature boundary",
};

// ============================================================================
// FRAME MODIFIER LABELS
// ============================================================================

export const FRAME_MODIFIER_LABELS: Record<FrameModifier, string> = {
  FREE_STATE: "Free State",
  PROJECTED_TOLERANCE_ZONE: "Projected Tolerance Zone",
  TANGENT_PLANE: "Tangent Plane",
  UNEQUALLY_DISPOSED: "Unequally Disposed",
};

export const FRAME_MODIFIER_SYMBOLS: Record<FrameModifier, string> = {
  FREE_STATE: "Ⓕ",
  PROJECTED_TOLERANCE_ZONE: "Ⓟ",
  TANGENT_PLANE: "Ⓣ",
  UNEQUALLY_DISPOSED: "Ⓤ",
};

// ============================================================================
// SVG PATHS FOR CHARACTERISTIC ICONS
// ============================================================================

/**
 * SVG path data for characteristic symbols.
 * All paths are designed for a 24x24 viewBox.
 */
export const CHARACTERISTIC_SVG_PATHS: Record<Characteristic, string> = {
  // Position: Circle with crosshairs (⊕)
  position: "M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-1-6V8h2v4h4v2h-4v4h-2v-4H7v-2h4z",

  // Flatness: Two parallel horizontal lines (⏥)
  flatness: "M4 8h16v2H4V8zm0 6h16v2H4v-2z",

  // Perpendicularity: Inverted T (⊥)
  perpendicularity: "M11 4h2v14h-2V4zm-6 14v2h14v-2H5z",

  // Profile: Curved line between two parallel lines (⌓)
  profile: "M4 6h16v2H4V6zM4 16h16v2H4v-2zM6 12c0-3.31 2.69-6 6-6s6 2.69 6 6H6z",

  // Other: Question mark in circle
  other: "M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-11c-1.66 0-3 1.34-3 3h2c0-.55.45-1 1-1s1 .45 1 1c0 1-2 .88-2 3h2c0-1.25 2-1.5 2-3 0-1.66-1.34-3-3-3zm-1 8h2v2h-2v-2z",
};

// ============================================================================
// CONFIDENCE LEVELS
// ============================================================================

export const CONFIDENCE_COLORS = {
  high: {
    text: "#10B981",
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  medium: {
    text: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  low: {
    text: "#EF4444",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.2)",
  },
};

export const CONFIDENCE_LABELS = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Low Confidence",
};
