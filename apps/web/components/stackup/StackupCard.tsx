import Link from "next/link";
import { CheckCircle, XCircle, Layers, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { StackupAnalysis, StackupResult } from "@/lib/stackup";

interface StackupCardProps {
  analysis: StackupAnalysis & { result?: StackupResult };
  index?: number;
}

/**
 * Card component displaying a stack-up analysis summary with pass/fail indicator.
 */
export function StackupCard({ analysis, index = 0 }: StackupCardProps) {
  const result = analysis.result;
  const passes = result?.passesAcceptanceCriteria;
  const decimals = analysis.unit === "mm" ? 3 : 4;

  return (
    <Link
      href={`/app/stackup/${analysis.id}`}
      className="group relative bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-accent-500/50 transition-all"
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 dark:border-slate-700" />

      {/* Index label */}
      <div className="absolute -top-2.5 left-4 px-2 bg-slate-50 dark:bg-[#0D1117] font-mono text-[10px] text-slate-500 dark:text-slate-600 tracking-widest">
        STACK.{String(index + 1).padStart(2, "0")}
      </div>

      <div className="p-5 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 truncate uppercase">
              {analysis.name}
            </h3>
            <p className="font-mono text-[10px] text-slate-500 line-clamp-2 mt-1">
              {analysis.measurementObjective}
            </p>
          </div>

          {/* Pass/Fail Badge */}
          <div
            className={cn(
              "shrink-0 px-2 py-0.5 text-[10px] font-mono font-semibold rounded",
              passes === true && "bg-accent-500/20 text-accent-400",
              passes === false && "bg-error-500/20 text-error-400",
              passes === undefined && "bg-slate-200 dark:bg-slate-800 text-slate-500"
            )}
          >
            {passes === true ? "PASS" : passes === false ? "FAIL" : "N/A"}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 mb-3">
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>{analysis.dimensions.length} dims</span>
          </div>
          <span
            className={cn(
              "px-1.5 py-0.5 uppercase border",
              analysis.analysisMethod === "worst-case" &&
                "border-warning-500/50 text-warning-500",
              analysis.analysisMethod === "rss" &&
                "border-primary-500/50 text-primary-500",
              analysis.analysisMethod === "six-sigma" &&
                "border-accent-500/50 text-accent-500"
            )}
          >
            {analysis.analysisMethod}
          </span>
          <span>{analysis.unit}</span>
        </div>

        {/* Result Preview */}
        {result && (
          <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
              {result.nominalResult.toFixed(decimals)} ±{" "}
              {result.totalTolerance.toFixed(decimals)}{" "}
              <span className="text-slate-500">{analysis.unit}</span>
            </div>
            <div className="font-mono text-[10px] text-slate-500 mt-1">
              Range: {result.minimumValue.toFixed(decimals)} to{" "}
              {result.maximumValue.toFixed(decimals)}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/50 dark:border-slate-800/50">
          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            {passes === true ? (
              <CheckCircle className="w-3.5 h-3.5 text-accent-500" />
            ) : passes === false ? (
              <XCircle className="w-3.5 h-3.5 text-error-500" />
            ) : (
              <div className="w-3.5 h-3.5 border border-slate-500 rounded-full" />
            )}
            <span
              className={cn(
                "font-mono text-[10px]",
                passes === true && "text-accent-500",
                passes === false && "text-error-500",
                passes === undefined && "text-slate-500"
              )}
            >
              {passes === true
                ? "CRITERIA MET"
                : passes === false
                  ? "OUT OF SPEC"
                  : "INCOMPLETE"}
            </span>
          </div>

          {/* Updated time */}
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
            <Clock className="w-3 h-3" />
            {new Date(analysis.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Link>
  );
}
