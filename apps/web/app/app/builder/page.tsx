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
  Settings2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson } from "@/lib/fcf/schema";
import type { ValidationResult } from "@/lib/rules/validateFcf";
import FcfBuilderPanel from "@/components/fcf/FcfBuilderPanel";
import FcfPreview, { FcfPreviewCard } from "@/components/fcf/FcfPreview";

type ViewMode = "split" | "builder" | "preview";

export default function BuilderPage() {
  const [fcf, setFcf] = useState<Partial<FcfJson>>({
    sourceUnit: "mm",
    source: { inputType: "builder" },
    tolerance: { value: 0 },
    datums: [],
  });

  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  // Mock validation - in production this would call the API
  const handleValidate = useCallback(async (fcfData: Partial<FcfJson>) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const issues: ValidationResult["issues"] = [];

    // Basic client-side validation feedback
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

    // Position requires datums
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

    // Perpendicularity requires datums
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

    // Flatness cannot have datums
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

  // Validate on FCF change
  useEffect(() => {
    handleValidate(fcf);
  }, [fcf, handleValidate]);

  // Copy JSON to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(fcf, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fcf]);

  // Reset builder
  const handleReset = useCallback(() => {
    setFcf({
      sourceUnit: "mm",
      source: { inputType: "builder" },
      tolerance: { value: 0 },
      datums: [],
    });
    setValidationResult(null);
  }, []);

  // Download JSON
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
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-mono font-bold text-slate-50 tracking-tight">
            FCF Builder
          </h1>
          <p className="text-slate-400 mt-1">
            Build feature control frames with live preview and ASME Y14.5
            validation
          </p>
        </div>

        {/* View mode toggles */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {(
              [
                { mode: "split", icon: Settings2, label: "Split" },
                { mode: "builder", icon: Code, label: "Builder" },
                { mode: "preview", icon: Eye, label: "Preview" },
              ] as const
            ).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  viewMode === mode
                    ? "bg-primary-500/20 text-primary-400"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-800"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="btn-secondary text-sm"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              className="btn-secondary text-sm"
              title="Copy JSON"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="btn-secondary text-sm"
              title="Download JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="btn-primary text-sm"
              disabled={!validationResult?.valid}
              title={
                validationResult?.valid
                  ? "Save to project"
                  : "Fix validation errors first"
              }
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
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
            <div className="overflow-auto scrollbar-hide pr-2">
              <FcfBuilderPanel
                initialFcf={fcf}
                onChange={setFcf}
                onValidate={handleValidate}
                validationResult={validationResult}
              />
            </div>
          )}

          {/* Preview Panel */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className="flex flex-col gap-6 overflow-auto scrollbar-hide">
              {/* Live Preview */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">Live Preview</h3>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-500" />
                    <span className="text-xs text-slate-500">
                      ASME Y14.5-2018
                    </span>
                  </div>
                </div>
                <div className="p-8 bg-slate-950/50 rounded-lg flex items-center justify-center min-h-[200px]">
                  <FcfPreview fcf={fcf} scale={2} showGrid />
                </div>
              </div>

              {/* JSON Output */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">JSON Output</h3>
                  <button
                    onClick={() => setShowJson(!showJson)}
                    className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showJson ? "Collapse" : "Expand"}
                  </button>
                </div>
                {showJson && (
                  <div className="relative">
                    <pre className="text-xs font-mono text-slate-300 bg-slate-950/50 p-4 rounded-lg overflow-auto max-h-[400px] scrollbar-hide">
                      {JSON.stringify(fcf, null, 2)}
                    </pre>
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 transition-colors"
                      title="Copy JSON"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-success-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                )}
                {!showJson && (
                  <div className="text-sm text-slate-500 italic">
                    Click expand to view FCF JSON output
                  </div>
                )}
              </div>

              {/* Quick Reference */}
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">Quick Reference</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="text-slate-400 mb-2">Characteristics</h4>
                    <ul className="space-y-1 text-slate-500">
                      <li>
                        <span className="gdt-symbol text-primary-400">
                          &#x2295;
                        </span>{" "}
                        Position
                      </li>
                      <li>
                        <span className="gdt-symbol text-success-500">
                          &#x23E5;
                        </span>{" "}
                        Flatness
                      </li>
                      <li>
                        <span className="gdt-symbol text-accent-400">
                          &#x22A5;
                        </span>{" "}
                        Perpendicularity
                      </li>
                      <li>
                        <span className="gdt-symbol text-purple-400">
                          &#x2313;
                        </span>{" "}
                        Profile
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-slate-400 mb-2">Material Conditions</h4>
                    <ul className="space-y-1 text-slate-500">
                      <li>
                        <span className="gdt-symbol text-warning-400">
                          &#x24C2;
                        </span>{" "}
                        MMC
                      </li>
                      <li>
                        <span className="gdt-symbol text-warning-400">
                          &#x24C1;
                        </span>{" "}
                        LMC
                      </li>
                      <li>
                        <span className="text-slate-400">RFS</span> (default)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
