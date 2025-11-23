import { FcfJson } from "@/lib/fcf/schema";
import { errorCodes } from "./errorCodes";

type ValidationIssue = { code: keyof typeof errorCodes; message: string };

export function validateFcf(fcf: FcfJson): { valid: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!fcf.characteristic) {
    issues.push({ code: "E003", message: errorCodes.E003 });
  }
  return { valid: issues.length === 0, issues };
}
