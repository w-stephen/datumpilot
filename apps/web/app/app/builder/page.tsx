"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Download,
  Copy,
  Check,
  Save,
  RotateCcw,
  Code,
  Eye,
  Columns,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson } from "@/lib/fcf/schema";
import type { ValidationResult } from "@/lib/rules/validateFcf";
import FcfBuilderPanel from "@/components/fcf/FcfBuilderPanel";
import FcfPreview from "@/components/fcf/FcfPreview";

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
    <div className={cn("relative bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800", className)}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 dark:border-slate-700" />

      {(label || headerRight) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50">
          {label && (
            <span className="font-mono text-[10px] text-slate-500 tracking-widest">{label}</span>
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
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Mock validation
  const handleValidate = useCallback(async (fcfData: Partial<FcfJson>) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const issues: ValidationResult["issues"] = [];

    if (!fcfData.characteristic) {
      issues.push({
        code: "E000" as any,
        message: "Select a characteristic type",
        path: "characteristic",
        severity: "error",
      });
    }

    if (!fcfData.tolerance?.value || fcfData.tolerance.value <= 0) {
      issues.push({
        code: "E031" as any,
        message: "Tolerance value must be greater than zero",
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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(fcf, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fcf]);

  const handleReset = useCallback(() => {
    setFcf({
      sourceUnit: "mm",
      source: { inputType: "builder" },
      tolerance: { value: 0 },
      datums: [],
    });
    setValidationResult(null);
  }, []);

  const handleDownload = useCallback(() => {
    const blob = new Blob([JSON.stringify(fcf, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fcf-${fcf.name || "untitled"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fcf]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">BUILD.FCF</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            FCF BUILDER
          </h1>
          <p className="text-slate-500 mt-1 font-mono text-sm">
            Build feature control frames with live ASME Y14.5 validation
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View mode toggles */}
          <div className="flex items-center bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
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
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 last:border-r-0"
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
              className="p-2 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className="p-2 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              title="Copy JSON"
            >
              {copied ? (
                <Check className="w-4 h-4 text-accent-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              title="Download JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold transition-all",
                validationResult?.valid
                  ? "bg-accent-500 text-slate-950 hover:bg-accent-400"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
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
      <div className="flex items-center gap-4 py-3 px-4 bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          {validationResult?.valid ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-accent-500" />
              <span className="font-mono text-xs text-accent-500">VALID</span>
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
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
        <span className="font-mono text-[10px] text-slate-500">
          REF: ASME Y14.5-2018
        </span>
        {fcf.characteristic && (
          <>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
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
                    <span className="font-mono text-[10px] text-slate-500">ASME Y14.5-2018</span>
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

              {/* JSON Output */}
              <TechnicalPanel
                label="OUTPUT.JSON"
                headerRight={
                  <button
                    onClick={() => setShowJson(!showJson)}
                    className="font-mono text-[10px] text-slate-500 hover:text-accent-500 transition-colors flex items-center gap-1"
                  >
                    {showJson ? "COLLAPSE" : "EXPAND"}
                    <ChevronRight className={cn("w-3 h-3 transition-transform", showJson && "rotate-90")} />
                  </button>
                }
              >
                {showJson ? (
                  <div className="relative">
                    <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 p-4 overflow-auto max-h-[400px] scrollbar-hide">
                      {JSON.stringify(fcf, null, 2)}
                    </pre>
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                      title="Copy JSON"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-accent-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-600">
                    Click EXPAND to view FCF JSON output
                  </div>
                )}
              </TechnicalPanel>

              {/* Quick Reference */}
              <TechnicalPanel label="REF.SYMBOLS">
                <div className="grid grid-cols-2 gap-6 p-4">
                  <div>
                    <h4 className="font-mono text-[10px] text-slate-500 tracking-widest mb-3">CHARACTERISTICS</h4>
                    <div className="space-y-2">
                      {[
                        { symbol: "⊕", name: "Position", color: "text-primary-400" },
                        { symbol: "⏥", name: "Flatness", color: "text-success-400" },
                        { symbol: "⊥", name: "Perpendicularity", color: "text-warning-400" },
                        { symbol: "⌓", name: "Profile", color: "text-purple-400" },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center">
                            <span className={cn("text-lg", item.color)}>{item.symbol}</span>
                          </div>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-mono text-[10px] text-slate-500 tracking-widest mb-3">MODIFIERS</h4>
                    <div className="space-y-2">
                      {[
                        { symbol: "Ⓜ", name: "MMC", color: "text-amber-400" },
                        { symbol: "Ⓛ", name: "LMC", color: "text-cyan-400" },
                        { symbol: "—", name: "RFS (default)", color: "text-slate-500" },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-8 h-8 border border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center">
                            <span className={cn("text-sm font-bold", item.color)}>{item.symbol}</span>
                          </div>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{item.name}</span>
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
