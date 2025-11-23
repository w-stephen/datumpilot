import { FcfJson, FeatureType, MaterialConditionSymbol } from "@/lib/fcf/schema";
import { errorCodes } from "./errorCodes";

type ValidationIssue = { code: keyof typeof errorCodes; message: string };

const featureOfSizeTypes: FeatureType[] = ["hole", "slot", "pin", "boss"];

function usesMaterialCondition(fcf: FcfJson): boolean {
  const toleranceHasMc: MaterialConditionSymbol | undefined = fcf.tolerance.materialCondition;
  const datumsHaveMc = (fcf.datums ?? []).some((d) => d.materialCondition);
  const compositeHasMc = fcf.composite
    ? fcf.composite.segments.some(
        (seg) => seg.tolerance.materialCondition || (seg.datums ?? []).some((d) => d.materialCondition)
      )
    : false;
  return Boolean(toleranceHasMc || datumsHaveMc || compositeHasMc);
}

export function validateFcf(fcf: FcfJson): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  // Characteristic-specific checks.
  if (fcf.characteristic === "flatness") {
    if (fcf.datums && fcf.datums.length > 0) {
      issues.push({ code: "E002", message: errorCodes.E002 });
    }
    if (usesMaterialCondition(fcf)) {
      issues.push({ code: "E001", message: errorCodes.E001 });
    }
  }

  if (fcf.characteristic === "position" || fcf.characteristic === "perpendicularity") {
    if (!fcf.datums || fcf.datums.length === 0) {
      issues.push({ code: "E006", message: errorCodes.E006 });
    }
  }

  if (fcf.composite && fcf.characteristic !== "position") {
    issues.push({ code: "E009", message: errorCodes.E009 });
  }

  // Modifiers and feature-of-size coupling.
  if (usesMaterialCondition(fcf) && (!fcf.featureType || !featureOfSizeTypes.includes(fcf.featureType))) {
    issues.push({ code: "E007", message: errorCodes.E007 });
  }

  if (fcf.projectedZone && !(fcf.modifiers ?? []).includes("PROJECTED_TOLERANCE_ZONE")) {
    issues.push({ code: "E008", message: errorCodes.E008 });
  }

  // Composite sanity check.
  if (fcf.composite && (fcf.composite.segments.length < 2 || !fcf.composite.segments[0])) {
    issues.push({ code: "E004", message: errorCodes.E004 });
  }

  return { valid: issues.length === 0, issues };
}
