export interface FcfJson {
  source: { inputType: "image" | "builder" | "json"; fileUrl?: string };
  characteristic: string;
  featureType?: string;
  tolerance: { value: number; diameter?: boolean };
  modifiers?: string[];
  datums?: Array<{ id: string; materialCondition?: string }>;
  pattern?: { count?: number; note?: string };
  sizeDimension?: { nominal?: number; tolerancePlus?: number; toleranceMinus?: number };
  projectedZone?: boolean | number;
  composite?: unknown | null;
}
