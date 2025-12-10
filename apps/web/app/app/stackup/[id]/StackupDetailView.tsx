"use client";

import { useState, useMemo } from "react";
import { Edit, Save, X, Copy, Trash2, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { TechnicalPanel } from "@/components/ui/TechnicalPanel";
import {
  StackupDimensionTable,
  StackupResultsPanel,
  StackupContributionChart,
} from "@/components/stackup";
import {
  updateStackupAnalysis,
  deleteStackupAnalysis,
  duplicateStackupAnalysis,
} from "../actions";
import {
  calculateStackup,
  compareAllMethods,
  type StackupAnalysis,
  type StackupResult,
  type StackupDimension,
  type AnalysisMethod,
} from "@/lib/stackup";

interface StackupDetailViewProps {
  analysis: StackupAnalysis;
  result: StackupResult;
}

export function StackupDetailView({
  analysis: initialAnalysis,
  result: initialResult,
}: StackupDetailViewProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMethodComparison, setShowMethodComparison] = useState(false);

  // Recalculate result when dimensions change
  const result = useMemo(() => {
    if (analysis.dimensions.length < 2) return initialResult;
    return calculateStackup(analysis);
  }, [analysis, initialResult]);

  // Get all method results for comparison
  const allMethodResults = useMemo(() => {
    if (!showMethodComparison || analysis.dimensions.length < 2) return undefined;
    return compareAllMethods(analysis);
  }, [analysis, showMethodComparison]);

  // Update dimensions
  const handleDimensionsChange = (dimensions: StackupDimension[]) => {
    setAnalysis((prev) => ({ ...prev, dimensions }));
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateStackupAnalysis(analysis.id, {
        dimensions: analysis.dimensions,
        analysisMethod: analysis.analysisMethod,
        acceptanceCriteria: analysis.acceptanceCriteria,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setAnalysis(initialAnalysis);
    setIsEditing(false);
  };

  // Duplicate
  const handleDuplicate = async () => {
    try {
      const duplicate = await duplicateStackupAnalysis(analysis.id);
      if (duplicate) {
        router.push(`/app/stackup/${duplicate.id}`);
      }
    } catch (error) {
      console.error("Failed to duplicate:", error);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this analysis?")) return;
    try {
      await deleteStackupAnalysis(analysis.id);
      router.push("/app/stackup");
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Method change
  const handleMethodChange = (method: AnalysisMethod) => {
    setAnalysis((prev) => ({ ...prev, analysisMethod: method }));
  };

  return (
    <div className="flex-1 overflow-auto py-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {/* Method selector */}
          <div className="flex items-center gap-1 border border-slate-800 rounded">
            {(["worst-case", "rss", "six-sigma"] as AnalysisMethod[]).map(
              (method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleMethodChange(method)}
                  disabled={!isEditing}
                  className={cn(
                    "px-3 py-1.5 font-mono text-[10px] uppercase transition-colors",
                    analysis.analysisMethod === method
                      ? "bg-accent-500/20 text-accent-400"
                      : isEditing
                        ? "text-slate-500 hover:text-slate-300"
                        : "text-slate-600 cursor-not-allowed"
                  )}
                >
                  {method}
                </button>
              )
            )}
          </div>

          {/* Compare toggle */}
          <button
            type="button"
            onClick={() => setShowMethodComparison(!showMethodComparison)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded font-mono text-[10px] uppercase transition-colors",
              showMethodComparison
                ? "border-primary-500 bg-primary-500/20 text-primary-400"
                : "border-slate-800 text-slate-500 hover:text-slate-300"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Compare
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-800 text-slate-500 hover:text-slate-300 font-mono text-xs transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-1.5 bg-accent-500 text-slate-950 font-mono text-xs font-semibold hover:bg-accent-400 transition-colors"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                }}
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? "SAVING..." : "SAVE"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-800 text-slate-500 hover:text-slate-300 font-mono text-xs transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                DUPLICATE
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-1.5 border border-error-500/50 text-error-400 hover:bg-error-500/10 font-mono text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                DELETE
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-accent-500 text-slate-950 font-mono text-xs font-semibold hover:bg-accent-400 transition-colors"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                }}
              >
                <Edit className="w-3.5 h-3.5" />
                EDIT
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Dimensions */}
        <div className="xl:col-span-2 space-y-6">
          <TechnicalPanel label="DIMENSIONS" className="p-4">
            <StackupDimensionTable
              dimensions={analysis.dimensions}
              onChange={handleDimensionsChange}
              unit={analysis.unit}
              contributions={result.contributions}
              readOnly={!isEditing}
            />
          </TechnicalPanel>

          {/* Contribution Chart */}
          {result.contributions.length > 0 && (
            <StackupContributionChart
              dimensions={analysis.dimensions}
              contributions={result.contributions}
            />
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          <StackupResultsPanel
            result={result}
            unit={analysis.unit}
            acceptanceCriteria={analysis.acceptanceCriteria}
            showMethodComparison={showMethodComparison}
            allMethodResults={allMethodResults}
          />

          {/* Analysis Info */}
          <TechnicalPanel label="INFO" className="p-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Unit</span>
                <span className="font-mono text-slate-300">{analysis.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Direction</span>
                <span className="font-mono text-slate-300 text-xs">
                  {analysis.positiveDirection}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created</span>
                <span className="font-mono text-slate-300 text-xs">
                  {new Date(analysis.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Updated</span>
                <span className="font-mono text-slate-300 text-xs">
                  {new Date(analysis.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </TechnicalPanel>
        </div>
      </div>
    </div>
  );
}
