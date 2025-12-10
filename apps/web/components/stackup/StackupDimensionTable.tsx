"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  StackupDimension,
  DimensionContribution,
  StackupUnit,
} from "@/lib/stackup";

interface StackupDimensionTableProps {
  dimensions: StackupDimension[];
  onChange: (dimensions: StackupDimension[]) => void;
  unit: StackupUnit;
  contributions?: DimensionContribution[];
  readOnly?: boolean;
  className?: string;
}

/**
 * Editable dimension table for stack-up analysis.
 * Supports add/edit/remove/reorder with expandable rows for advanced options.
 */
export function StackupDimensionTable({
  dimensions,
  onChange,
  unit,
  contributions,
  readOnly = false,
  className,
}: StackupDimensionTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const decimals = unit === "mm" ? 3 : 4;

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Update a single dimension
  const updateDimension = useCallback(
    (id: string, updates: Partial<StackupDimension>) => {
      onChange(
        dimensions.map((d) => (d.id === id ? { ...d, ...updates } : d))
      );
    },
    [dimensions, onChange]
  );

  // Add new dimension
  const addDimension = useCallback(() => {
    const newDim: StackupDimension = {
      id: crypto.randomUUID(),
      name: `Dimension ${dimensions.length + 1}`,
      nominal: 0,
      tolerancePlus: 0,
      toleranceMinus: 0,
      sign: "positive",
      sensitivityCoefficient: 1,
    };
    onChange([...dimensions, newDim]);
  }, [dimensions, onChange]);

  // Remove dimension
  const removeDimension = useCallback(
    (id: string) => {
      onChange(dimensions.filter((d) => d.id !== id));
    },
    [dimensions, onChange]
  );

  // Move dimension up/down
  const moveDimension = useCallback(
    (id: string, direction: "up" | "down") => {
      const index = dimensions.findIndex((d) => d.id === id);
      if (index === -1) return;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= dimensions.length) return;

      const newDimensions = [...dimensions];
      [newDimensions[index], newDimensions[newIndex]] = [
        newDimensions[newIndex],
        newDimensions[index],
      ];
      onChange(newDimensions);
    },
    [dimensions, onChange]
  );

  // Get contribution for a dimension
  const getContribution = (id: string) => {
    return contributions?.find((c) => c.dimensionId === id);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 px-2 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
        <div className="w-6" /> {/* Expand toggle */}
        <div>Name</div>
        <div className="w-24 text-right">Nominal</div>
        <div className="w-20 text-right">+Tol</div>
        <div className="w-20 text-right">-Tol</div>
        <div className="w-16 text-center">Sign</div>
        {contributions && <div className="w-16 text-right">%</div>}
        {!readOnly && <div className="w-20" />} {/* Actions */}
      </div>

      {/* Dimension rows */}
      <div className="space-y-1">
        {dimensions.map((dim, index) => {
          const isExpanded = expandedRows.has(dim.id);
          const contribution = getContribution(dim.id);

          return (
            <div
              key={dim.id}
              className="bg-slate-900/40 border border-slate-800 rounded"
            >
              {/* Main row */}
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 items-center px-2 py-2">
                {/* Expand toggle */}
                <button
                  type="button"
                  onClick={() => toggleExpand(dim.id)}
                  className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-300"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Name */}
                {readOnly ? (
                  <span className="font-mono text-sm text-slate-300 truncate">
                    {dim.name}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={dim.name}
                    onChange={(e) =>
                      updateDimension(dim.id, { name: e.target.value })
                    }
                    className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-accent-500 outline-none font-mono text-sm text-slate-300 truncate"
                    placeholder="Dimension name"
                  />
                )}

                {/* Nominal */}
                {readOnly ? (
                  <span className="w-24 text-right font-mono text-sm text-slate-300">
                    {dim.nominal.toFixed(decimals)}
                  </span>
                ) : (
                  <input
                    type="number"
                    value={dim.nominal}
                    onChange={(e) =>
                      updateDimension(dim.id, {
                        nominal: parseFloat(e.target.value) || 0,
                      })
                    }
                    step={unit === "mm" ? 0.001 : 0.0001}
                    className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right font-mono text-sm text-slate-300 focus:border-accent-500 outline-none"
                  />
                )}

                {/* +Tolerance */}
                {readOnly ? (
                  <span className="w-20 text-right font-mono text-sm text-accent-400">
                    +{dim.tolerancePlus.toFixed(decimals)}
                  </span>
                ) : (
                  <div className="w-20 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-accent-400 font-mono text-sm">
                      +
                    </span>
                    <input
                      type="number"
                      value={dim.tolerancePlus}
                      onChange={(e) =>
                        updateDimension(dim.id, {
                          tolerancePlus:
                            Math.abs(parseFloat(e.target.value)) || 0,
                        })
                      }
                      min={0}
                      step={unit === "mm" ? 0.001 : 0.0001}
                      className="w-full bg-slate-800 border border-slate-700 rounded pl-5 pr-2 py-1 text-right font-mono text-sm text-accent-400 focus:border-accent-500 outline-none"
                    />
                  </div>
                )}

                {/* -Tolerance */}
                {readOnly ? (
                  <span className="w-20 text-right font-mono text-sm text-error-400">
                    -{dim.toleranceMinus.toFixed(decimals)}
                  </span>
                ) : (
                  <div className="w-20 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-error-400 font-mono text-sm">
                      -
                    </span>
                    <input
                      type="number"
                      value={dim.toleranceMinus}
                      onChange={(e) =>
                        updateDimension(dim.id, {
                          toleranceMinus:
                            Math.abs(parseFloat(e.target.value)) || 0,
                        })
                      }
                      min={0}
                      step={unit === "mm" ? 0.001 : 0.0001}
                      className="w-full bg-slate-800 border border-slate-700 rounded pl-5 pr-2 py-1 text-right font-mono text-sm text-error-400 focus:border-accent-500 outline-none"
                    />
                  </div>
                )}

                {/* Sign toggle */}
                {readOnly ? (
                  <span
                    className={cn(
                      "w-16 text-center font-mono text-xs font-semibold px-2 py-1 rounded",
                      dim.sign === "positive"
                        ? "bg-accent-500/20 text-accent-400"
                        : "bg-error-500/20 text-error-400"
                    )}
                  >
                    {dim.sign === "positive" ? "+" : "−"}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      updateDimension(dim.id, {
                        sign: dim.sign === "positive" ? "negative" : "positive",
                      })
                    }
                    className={cn(
                      "w-16 font-mono text-xs font-semibold px-2 py-1 rounded border transition-colors",
                      dim.sign === "positive"
                        ? "bg-accent-500/20 border-accent-500/50 text-accent-400 hover:bg-accent-500/30"
                        : "bg-error-500/20 border-error-500/50 text-error-400 hover:bg-error-500/30"
                    )}
                  >
                    {dim.sign === "positive" ? "+" : "−"}
                  </button>
                )}

                {/* Contribution % */}
                {contributions && (
                  <span className="w-16 text-right font-mono text-sm text-slate-400">
                    {contribution
                      ? `${contribution.percentContribution.toFixed(1)}%`
                      : "—"}
                  </span>
                )}

                {/* Actions */}
                {!readOnly && (
                  <div className="w-20 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => moveDimension(dim.id, "up")}
                      disabled={index === 0}
                      className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDimension(dim.id, "down")}
                      disabled={index === dimensions.length - 1}
                      className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDimension(dim.id)}
                      disabled={dimensions.length <= 2}
                      className="p-1 text-slate-500 hover:text-error-400 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove dimension"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-8 py-3 border-t border-slate-800 bg-slate-900/20 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Description
                      </label>
                      {readOnly ? (
                        <p className="text-sm text-slate-400">
                          {dim.description || "—"}
                        </p>
                      ) : (
                        <input
                          type="text"
                          value={dim.description || ""}
                          onChange={(e) =>
                            updateDimension(dim.id, {
                              description: e.target.value || undefined,
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300 focus:border-accent-500 outline-none"
                          placeholder="Optional description"
                        />
                      )}
                    </div>

                    {/* Sensitivity Coefficient */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Sensitivity Coefficient
                      </label>
                      {readOnly ? (
                        <p className="text-sm font-mono text-slate-400">
                          {dim.sensitivityCoefficient}
                        </p>
                      ) : (
                        <input
                          type="number"
                          value={dim.sensitivityCoefficient}
                          onChange={(e) =>
                            updateDimension(dim.id, {
                              sensitivityCoefficient:
                                parseFloat(e.target.value) || 1,
                            })
                          }
                          step={0.1}
                          className="w-32 bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Process Capability (Cp) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Process Capability (Cp)
                      </label>
                      {readOnly ? (
                        <p className="text-sm font-mono text-slate-400">
                          {dim.processCapability ?? "Default (1.33)"}
                        </p>
                      ) : (
                        <input
                          type="number"
                          value={dim.processCapability ?? ""}
                          onChange={(e) =>
                            updateDimension(dim.id, {
                              processCapability: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          step={0.01}
                          min={0}
                          placeholder="1.33"
                          className="w-32 bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none placeholder:text-slate-600"
                        />
                      )}
                    </div>

                    {/* Source Drawing */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Source Drawing
                      </label>
                      {readOnly ? (
                        <p className="text-sm font-mono text-slate-400">
                          {dim.sourceDrawing || "—"}
                        </p>
                      ) : (
                        <input
                          type="text"
                          value={dim.sourceDrawing || ""}
                          onChange={(e) =>
                            updateDimension(dim.id, {
                              sourceDrawing: e.target.value || undefined,
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none"
                          placeholder="Drawing #"
                        />
                      )}
                    </div>

                    {/* Source Revision */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Revision
                      </label>
                      {readOnly ? (
                        <p className="text-sm font-mono text-slate-400">
                          {dim.sourceRevision || "—"}
                        </p>
                      ) : (
                        <input
                          type="text"
                          value={dim.sourceRevision || ""}
                          onChange={(e) =>
                            updateDimension(dim.id, {
                              sourceRevision: e.target.value || undefined,
                            })
                          }
                          className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none"
                          placeholder="Rev"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add dimension button */}
      {!readOnly && (
        <button
          type="button"
          onClick={addDimension}
          className="w-full py-2 border border-dashed border-slate-700 rounded text-slate-500 hover:border-accent-500/50 hover:text-accent-400 transition-colors flex items-center justify-center gap-2 text-sm font-mono"
        >
          <Plus className="w-4 h-4" />
          Add Dimension
        </button>
      )}

      {/* Summary row */}
      {dimensions.length >= 2 && (
        <div className="flex items-center justify-between px-2 py-2 border-t border-slate-800 text-xs font-mono text-slate-500">
          <span>{dimensions.length} dimensions</span>
          <span>
            {dimensions.filter((d) => d.sign === "positive").length} positive,{" "}
            {dimensions.filter((d) => d.sign === "negative").length} negative
          </span>
        </div>
      )}
    </div>
  );
}
