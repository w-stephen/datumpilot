import Link from "next/link";
import { Plus, Layers, Calculator } from "lucide-react";
import { getStackupAnalyses } from "./actions";
import { StackupCard } from "@/components/stackup";
import { TechnicalPanel } from "@/components/ui/TechnicalPanel";

export const metadata = {
  title: "Stack-Up Analysis | DatumPilot",
  description: "Tolerance stack-up analysis with Worst-Case, RSS, and Six Sigma methods",
};

export default async function StackupPage() {
  const analyses = await getStackupAnalyses();

  const passCount = analyses.filter((a) => a.result?.passesAcceptanceCriteria === true).length;
  const failCount = analyses.filter((a) => a.result?.passesAcceptanceCriteria === false).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">
              STACK.ANALYSIS
            </span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            STACK-UP ANALYSIS
          </h1>
          <p className="text-slate-500 mt-1 font-mono text-sm">
            Tolerance stack-up calculations using Worst-Case, RSS, and Six Sigma methods
          </p>
        </div>
        <Link
          href="/app/stackup/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-slate-950 font-mono text-xs font-semibold hover:bg-accent-400 transition-colors"
          style={{
            clipPath:
              "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          NEW ANALYSIS
        </Link>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 py-3 px-4 bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-accent-500 animate-pulse" />
          <span className="font-mono text-xs text-accent-500">
            {analyses.length} ANALYSIS{analyses.length !== 1 ? "ES" : ""}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
        <span className="font-mono text-[10px] text-accent-500">
          {passCount} PASS
        </span>
        <span className="font-mono text-[10px] text-error-500">
          {failCount} FAIL
        </span>
        <span className="font-mono text-[10px] text-slate-500">
          {analyses.length - passCount - failCount} INCOMPLETE
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto scrollbar-hide pt-6">
        {analyses.length === 0 ? (
          <TechnicalPanel label="NO.ANALYSES" className="h-full">
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 border border-slate-800 mx-auto mb-6 flex items-center justify-center">
                <Layers className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="font-mono text-sm text-slate-500 mb-2">
                NO STACK-UP ANALYSES
              </h3>
              <p className="font-mono text-xs text-slate-600 max-w-sm mb-6">
                Create your first tolerance stack-up analysis to calculate cumulative
                tolerances using industry-standard methods.
              </p>
              <Link
                href="/app/stackup/new"
                className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-slate-950 font-mono text-xs font-semibold hover:bg-accent-400 transition-colors"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                }}
              >
                <Calculator className="w-3.5 h-3.5" />
                CREATE ANALYSIS
              </Link>
            </div>
          </TechnicalPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {analyses.map((analysis, index) => (
              <StackupCard key={analysis.id} analysis={analysis} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
