"use client";

import { cn } from "@/lib/utils/cn";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { TechnicalPanel } from "@/components/ui/TechnicalPanel";
import type {
  StackupResult,
  StackupUnit,
  AnalysisMethod,
  AcceptanceCriteria,
} from "@/lib/stackup";

interface StackupResultsPanelProps {
  result: StackupResult;
  unit: StackupUnit;
  acceptanceCriteria: AcceptanceCriteria;
  showMethodComparison?: boolean;
  allMethodResults?: Record<AnalysisMethod, StackupResult>;
  className?: string;
}

const METHOD_LABELS: Record<AnalysisMethod, string> = {
  "worst-case": "Worst Case",
  rss: "RSS",
  "six-sigma": "Six Sigma",
};

const METHOD_DESCRIPTIONS: Record<AnalysisMethod, string> = {
  "worst-case": "All tolerances at maximum limits simultaneously",
  rss: "Root Sum Square (statistical, assumes normal distribution)",
  "six-sigma": "Statistical with process capability weighting",
};

/**
 * Results panel displaying stack-up calculation output with pass/fail status.
 * Optionally shows comparison across all three analysis methods.
 */
export function StackupResultsPanel({
  result,
  unit,
  acceptanceCriteria,
  showMethodComparison = false,
  allMethodResults,
  className,
}: StackupResultsPanelProps) {
  const decimals = unit === "mm" ? 3 : 4;
  const passes = result.passesAcceptanceCriteria;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Result */}
      <TechnicalPanel label="RESULT" className="p-4">
        <div className="space-y-4">
          {/* Pass/Fail Status */}
          <div className="flex items-center gap-3">
            {passes ? (
              <CheckCircle className="w-6 h-6 text-accent-500" />
            ) : (
              <XCircle className="w-6 h-6 text-error-500" />
            )}
            <div>
              <span
                className={cn(
                  "font-mono text-lg font-bold",
                  passes ? "text-accent-400" : "text-error-400"
                )}
              >
                {passes ? "PASS" : "FAIL"}
              </span>
              <span className="ml-2 text-sm text-slate-500">
                {METHOD_LABELS[result.method]} Analysis
              </span>
            </div>
          </div>

          {/* Main result values */}
          <div className="grid grid-cols-2 gap-4">
            {/* Nominal Result */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Nominal
              </label>
              <p className="font-mono text-xl text-slate-200">
                {result.nominalResult.toFixed(decimals)}{" "}
                <span className="text-sm text-slate-500">{unit}</span>
              </p>
            </div>

            {/* Total Tolerance */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Total Tolerance
              </label>
              <p className="font-mono text-xl text-slate-200">
                ±{result.totalTolerance.toFixed(decimals)}{" "}
                <span className="text-sm text-slate-500">{unit}</span>
              </p>
            </div>
          </div>

          {/* Range */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Result Range
            </label>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg text-error-400">
                {result.minimumValue.toFixed(decimals)}
              </span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full relative overflow-hidden">
                <ResultRangeBar
                  min={result.minimumValue}
                  max={result.maximumValue}
                  acceptMin={acceptanceCriteria.minimum}
                  acceptMax={acceptanceCriteria.maximum}
                />
              </div>
              <span className="font-mono text-lg text-accent-400">
                {result.maximumValue.toFixed(decimals)}
              </span>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Range: {(result.maximumValue - result.minimumValue).toFixed(decimals)} {unit}
            </p>
          </div>

          {/* Acceptance Criteria & Margins */}
          <div className="pt-3 border-t border-slate-800">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
              Acceptance Criteria
            </label>
            <div className="grid grid-cols-2 gap-4">
              {acceptanceCriteria.minimum !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Min Limit</span>
                    <span className="font-mono text-sm text-slate-300">
                      {acceptanceCriteria.minimum.toFixed(decimals)} {unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Margin</span>
                    <span
                      className={cn(
                        "font-mono text-sm",
                        (result.marginToMinimum ?? 0) >= 0
                          ? "text-accent-400"
                          : "text-error-400"
                      )}
                    >
                      {result.marginToMinimum !== undefined
                        ? `${result.marginToMinimum >= 0 ? "+" : ""}${result.marginToMinimum.toFixed(decimals)}`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}
              {acceptanceCriteria.maximum !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Max Limit</span>
                    <span className="font-mono text-sm text-slate-300">
                      {acceptanceCriteria.maximum.toFixed(decimals)} {unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Margin</span>
                    <span
                      className={cn(
                        "font-mono text-sm",
                        (result.marginToMaximum ?? 0) >= 0
                          ? "text-accent-400"
                          : "text-error-400"
                      )}
                    >
                      {result.marginToMaximum !== undefined
                        ? `${result.marginToMaximum >= 0 ? "+" : ""}${result.marginToMaximum.toFixed(decimals)}`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </TechnicalPanel>

      {/* Method Comparison */}
      {showMethodComparison && allMethodResults && (
        <TechnicalPanel label="METHOD COMPARISON" className="p-4">
          <div className="space-y-3">
            {(["worst-case", "rss", "six-sigma"] as AnalysisMethod[]).map(
              (method) => {
                const methodResult = allMethodResults[method];
                if (!methodResult) return null;

                const isSelected = method === result.method;
                const methodPasses = methodResult.passesAcceptanceCriteria;

                return (
                  <div
                    key={method}
                    className={cn(
                      "p-3 rounded border transition-colors",
                      isSelected
                        ? "bg-slate-800/50 border-accent-500/50"
                        : "bg-slate-900/20 border-slate-800"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-mono text-sm font-semibold",
                            isSelected ? "text-accent-400" : "text-slate-300"
                          )}
                        >
                          {METHOD_LABELS[method]}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono text-accent-500 bg-accent-500/20 px-1.5 py-0.5 rounded">
                            SELECTED
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-mono font-semibold px-2 py-0.5 rounded",
                          methodPasses
                            ? "bg-accent-500/20 text-accent-400"
                            : "bg-error-500/20 text-error-400"
                        )}
                      >
                        {methodPasses ? "PASS" : "FAIL"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {methodResult.minimumValue.toFixed(decimals)} to{" "}
                        {methodResult.maximumValue.toFixed(decimals)} {unit}
                      </span>
                      <span className="text-slate-400 font-mono">
                        ±{methodResult.totalTolerance.toFixed(decimals)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {METHOD_DESCRIPTIONS[method]}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </TechnicalPanel>
      )}
    </div>
  );
}

/**
 * Visual range bar showing result range vs acceptance limits
 */
function ResultRangeBar({
  min,
  max,
  acceptMin,
  acceptMax,
}: {
  min: number;
  max: number;
  acceptMin?: number;
  acceptMax?: number;
}) {
  // Calculate display range (include acceptance limits if outside result range)
  const displayMin = Math.min(min, acceptMin ?? min);
  const displayMax = Math.max(max, acceptMax ?? max);
  const range = displayMax - displayMin || 1;

  // Calculate positions as percentages
  const resultStart = ((min - displayMin) / range) * 100;
  const resultEnd = ((max - displayMin) / range) * 100;
  const acceptMinPos =
    acceptMin !== undefined ? ((acceptMin - displayMin) / range) * 100 : null;
  const acceptMaxPos =
    acceptMax !== undefined ? ((acceptMax - displayMin) / range) * 100 : null;

  // Check if result is within limits
  const minOk = acceptMin === undefined || min >= acceptMin;
  const maxOk = acceptMax === undefined || max <= acceptMax;

  return (
    <>
      {/* Acceptance zone background */}
      {(acceptMinPos !== null || acceptMaxPos !== null) && (
        <div
          className="absolute h-full bg-accent-500/20"
          style={{
            left: `${acceptMinPos ?? 0}%`,
            right: `${100 - (acceptMaxPos ?? 100)}%`,
          }}
        />
      )}

      {/* Result range bar */}
      <div
        className={cn(
          "absolute h-full rounded-full",
          minOk && maxOk
            ? "bg-gradient-to-r from-accent-500 to-accent-400"
            : "bg-gradient-to-r from-error-500 to-error-400"
        )}
        style={{
          left: `${resultStart}%`,
          width: `${resultEnd - resultStart}%`,
        }}
      />

      {/* Limit markers */}
      {acceptMinPos !== null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-500"
          style={{ left: `${acceptMinPos}%` }}
        />
      )}
      {acceptMaxPos !== null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-500"
          style={{ left: `${acceptMaxPos}%` }}
        />
      )}
    </>
  );
}
