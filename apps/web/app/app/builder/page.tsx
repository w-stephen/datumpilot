"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Save,
  RotateCcw,
  Code,
  Eye,
  Columns,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson } from "@/lib/fcf/schema";
import type { ValidationResult } from "@/lib/rules/validateFcf";
import FcfBuilderPanel from "@/components/fcf/FcfBuilderPanel";
import FcfPreview from "@/components/fcf/FcfPreview";
import InterpretationPanel from "@/components/fcf/InterpretationPanel";

type ViewMode = "split" | "builder" | "preview";

// Technical panel wrapper
function TechnicalPanel({
  children,
  label,
  className,
  headerRight,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className={cn("relative bg-white dark:bg-slate-900/40 border border-[#E5E7EB] dark:border-slate-800", className)}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#D1D5DB] dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#D1D5DB] dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#D1D5DB] dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#D1D5DB] dark:border-slate-700" />

      {(label || headerRight) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] dark:border-slate-800/50">
          {label && (
            <span className="font-mono text-[10px] text-[#6B7280] dark:text-slate-500 tracking-widest">{label}</span>
          )}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

export default function BuilderPage() {
  const [fcf, setFcf] = useState<Partial<FcfJson>>({
    sourceUnit: "mm",
    source: { inputType: "builder" },
    tolerance: { value: 0 },
    datums: [],
  });

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  // Mock validation
  const handleValidate = useCallback(async (fcfData: Partial<FcfJson>) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const issues: ValidationResult["issues"] = [];

    // Guidance message when characteristic not selected (warning, not error)
    if (!fcfData.characteristic) {
      issues.push({
        code: "E000" as any,
        message: "Input required: Select a geometric characteristic to begin",
        path: "characteristic",
        severity: "warning",
      });
    }

    // Reject negative tolerance values (zero is valid for bonus tolerance)
    if (fcfData.tolerance?.value !== undefined && fcfData.tolerance.value < 0) {
      issues.push({
        code: "E031" as any,
        message: "Tolerance value cannot be negative",
        path: "tolerance.value",
        severity: "error",
      });
    }

    if (
      fcfData.characteristic === "position" &&
      (!fcfData.datums || fcfData.datums.length === 0)
    ) {
      issues.push({
        code: "E006" as any,
        message: "Position tolerance requires at least one datum reference",
        path: "datums",
        severity: "error",
        context: {
          characteristic: "position",
          suggestion: "Add a primary datum reference (typically A)",
        },
      });
    }

    if (
      fcfData.characteristic === "perpendicularity" &&
      (!fcfData.datums || fcfData.datums.length === 0)
    ) {
      issues.push({
        code: "E006" as any,
        message: "Perpendicularity requires at least one datum reference",
        path: "datums",
        severity: "error",
        context: {
          characteristic: "perpendicularity",
          suggestion: "Add a datum to reference the perpendicularity",
        },
      });
    }

    if (
      fcfData.characteristic === "flatness" &&
      fcfData.datums &&
      fcfData.datums.length > 0
    ) {
      issues.push({
        code: "E002" as any,
        message: "Form tolerances (flatness) cannot reference datums",
        path: "datums",
        severity: "error",
        context: {
          characteristic: "flatness",
          suggestion: "Remove datum references for form tolerances",
        },
      });
    }

    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning");

    const result: ValidationResult = {
      valid: errors.length === 0,
      issues,
      errors,
      warnings,
      summary: {
        errorCount: errors.length,
        warningCount: warnings.length,
      },
    };

    setValidationResult(result);
    return result;
  }, []);

  useEffect(() => {
    handleValidate(fcf);
  }, [fcf, handleValidate]);

  const handleReset = useCallback(() => {
    setFcf({
      sourceUnit: "mm",
      source: { inputType: "builder" },
      tolerance: { value: 0 },
      datums: [],
    });
    setValidationResult(null);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB] dark:border-slate-800/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">BUILD.FCF</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-[#111827] dark:text-slate-50 tracking-tight">
            FCF BUILDER
          </h1>
          <p className="text-[#374151] dark:text-slate-500 mt-1 font-mono text-sm">
            Build feature control frames with live ASME Y14.5 validation
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View mode toggles */}
          <div className="flex items-center bg-white dark:bg-slate-900/60 border border-[#E5E7EB] dark:border-slate-800">
            {(
              [
                { mode: "split", icon: Columns, label: "SPLIT" },
                { mode: "builder", icon: Code, label: "BUILD" },
                { mode: "preview", icon: Eye, label: "VIEW" },
              ] as const
            ).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 font-mono text-xs transition-all",
                  viewMode === mode
                    ? "bg-accent-500/10 text-accent-500 border-r border-accent-500/30"
                    : "text-[#6B7280] hover:text-[#111827] dark:hover:text-slate-300 hover:bg-[#F3F4F6] dark:hover:bg-slate-800/50 border-r border-[#E5E7EB] dark:border-slate-800 last:border-r-0"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 border border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-400 hover:text-[#111827] dark:hover:text-slate-200 hover:border-[#D1D5DB] dark:hover:border-slate-600 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold transition-all",
                validationResult?.valid
                  ? "bg-accent-500 text-slate-950 hover:bg-accent-400"
                  : "bg-[#E5E7EB] dark:bg-slate-800 text-[#9CA3AF] dark:text-slate-500 cursor-not-allowed"
              )}
              style={{
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
              }}
              disabled={!validationResult?.valid}
              title={validationResult?.valid ? "Save to project" : "Fix validation errors first"}
            >
              <Save className="w-3.5 h-3.5" />
              SAVE
            </button>
          </div>
        </div>
      </div>

      {/* Validation Status Bar */}
      <div className="flex items-center gap-4 py-3 px-4 bg-[#F9FAFB] dark:bg-slate-900/30 border-b border-[#E5E7EB] dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          {validationResult?.valid && (validationResult?.summary.warningCount || 0) === 0 ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-accent-500" />
              <span className="font-mono text-xs text-accent-500">VALID</span>
            </>
          ) : validationResult?.valid && (validationResult?.summary.warningCount || 0) > 0 ? (
            <>
              <AlertCircle className="w-4 h-4 text-warning-500" />
              <span className="font-mono text-xs text-warning-500">
                {validationResult.summary.warningCount} WARNING{validationResult.summary.warningCount !== 1 ? 'S' : ''}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-error-500" />
              <span className="font-mono text-xs text-error-500">
                {validationResult?.summary.errorCount || 0} ERROR{(validationResult?.summary.errorCount || 0) !== 1 ? 'S' : ''}
              </span>
            </>
          )}
        </div>
        <div className="h-4 w-px bg-[#E5E7EB] dark:bg-slate-700" />
        <span className="font-mono text-xs text-[#6B7280] dark:text-slate-500">
          REF: ASME Y14.5-2018
        </span>
        {fcf.characteristic && (
          <>
            <div className="h-4 w-px bg-[#E5E7EB] dark:bg-slate-700" />
            <span className="font-mono text-xs text-[#374151] dark:text-slate-400">
              CHAR: {fcf.characteristic.toUpperCase()}
            </span>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden pt-6">
        <div
          className={cn(
            "h-full grid gap-6",
            viewMode === "split" && "grid-cols-1 lg:grid-cols-2",
            viewMode === "builder" && "grid-cols-1",
            viewMode === "preview" && "grid-cols-1"
          )}
        >
          {/* Builder Panel */}
          {(viewMode === "split" || viewMode === "builder") && (
            <div className="overflow-auto scrollbar-hide">
              <TechnicalPanel label="INPUT.PARAMS">
                <div className="p-4">
                  <FcfBuilderPanel
                    initialFcf={fcf}
                    onChange={setFcf}
                    onValidate={handleValidate}
                    validationResult={validationResult}
                  />
                </div>
              </TechnicalPanel>
            </div>
          )}

          {/* Preview Panel */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className="flex flex-col gap-6 overflow-auto scrollbar-hide">
              {/* Live Preview */}
              <TechnicalPanel
                label="LIVE.PREVIEW"
                headerRight={
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-accent-500" />
                    <span className="font-mono text-[10px] text-[#6B7280] dark:text-slate-500">ASME Y14.5-2018</span>
                  </div>
                }
              >
                <div className="p-8 flex items-center justify-center min-h-[200px]">
                  <div className="relative">
                    {/* Grid background */}
                    <div
                      className="absolute inset-0 opacity-[0.03] -m-8"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, #00D4AA 1px, transparent 1px),
                          linear-gradient(to bottom, #00D4AA 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px',
                      }}
                    />
                    <FcfPreview fcf={fcf} scale={2} showGrid />
                  </div>
                </div>
              </TechnicalPanel>

              {/* Interpretation Panel - Always visible */}
              <InterpretationPanel fcf={fcf} />

              {/* Quick Reference */}
              <TechnicalPanel label="REF.SYMBOLS">
                <div className="grid grid-cols-2 gap-6 p-4">
                  <div>
                    <h4 className="font-mono text-xs text-[#6B7280] dark:text-slate-500 tracking-widest mb-3">CHARACTERISTICS</h4>
                    <div className="space-y-2">
                      {[
                        { symbol: "⊕", name: "Position", color: "text-primary-500" },
                        { symbol: "⏥", name: "Flatness", color: "text-success-500" },
                        { symbol: "⊥", name: "Perpendicularity", color: "text-warning-500" },
                        { symbol: "⌓", name: "Profile", color: "text-purple-500" },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800/50 flex items-center justify-center">
                            <span className={cn("text-lg", item.color)}>{item.symbol}</span>
                          </div>
                          <span className="font-mono text-sm text-[#374151] dark:text-slate-400">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-mono text-xs text-[#6B7280] dark:text-slate-500 tracking-widest mb-3">MODIFIERS</h4>
                    <div className="space-y-2">
                      {[
                        { symbol: "Ⓜ", name: "MMC", color: "text-amber-500" },
                        { symbol: "Ⓛ", name: "LMC", color: "text-cyan-500" },
                        { symbol: "—", name: "RFS (default)", color: "text-[#6B7280]" },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-[#E5E7EB] dark:border-slate-700 bg-[#F9FAFB] dark:bg-slate-800/50 flex items-center justify-center">
                            <span className={cn("text-sm font-bold", item.color)}>{item.symbol}</span>
                          </div>
                          <span className="font-mono text-sm text-[#374151] dark:text-slate-400">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TechnicalPanel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
