"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { TechnicalPanel } from "@/components/ui/TechnicalPanel";
import type { StackupDimension, DimensionContribution } from "@/lib/stackup";

interface StackupContributionChartProps {
  dimensions: StackupDimension[];
  contributions: DimensionContribution[];
  className?: string;
}

/**
 * Pareto-style bar chart showing each dimension's contribution to total tolerance.
 * Bars sorted by contribution percentage (largest first).
 */
export function StackupContributionChart({
  dimensions,
  contributions,
  className,
}: StackupContributionChartProps) {
  // Sort contributions by percentage (descending) and join with dimension names
  const sortedData = useMemo(() => {
    return contributions
      .map((contrib) => {
        const dim = dimensions.find((d) => d.id === contrib.dimensionId);
        return {
          ...contrib,
          name: dim?.name ?? "Unknown",
          sign: dim?.sign ?? "positive",
        };
      })
      .sort((a, b) => b.percentContribution - a.percentContribution);
  }, [dimensions, contributions]);

  // Calculate cumulative percentages for Pareto line
  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    return sortedData.map((item) => {
      cumulative += item.percentContribution;
      return { ...item, cumulative };
    });
  }, [sortedData]);

  // Find max for scale (should be close to 100 but handle edge cases)
  const maxContribution = Math.max(
    ...sortedData.map((d) => d.percentContribution),
    1
  );

  return (
    <TechnicalPanel label="CONTRIBUTION ANALYSIS" className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Chart */}
        <div className="space-y-2">
          {cumulativeData.map((item, index) => (
            <div key={item.dimensionId} className="group">
              {/* Label row */}
              <div className="flex items-center justify-between text-xs mb-1">
                <span
                  className={cn(
                    "font-mono truncate max-w-[60%]",
                    item.sign === "positive"
                      ? "text-slate-300"
                      : "text-slate-400"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block w-4 text-center mr-1",
                      item.sign === "positive"
                        ? "text-accent-400"
                        : "text-error-400"
                    )}
                  >
                    {item.sign === "positive" ? "+" : "−"}
                  </span>
                  {item.name}
                </span>
                <span className="font-mono text-slate-400">
                  {item.percentContribution.toFixed(1)}%
                </span>
              </div>

              {/* Bar */}
              <div className="h-4 bg-slate-800 rounded relative overflow-hidden">
                {/* Main bar */}
                <div
                  className={cn(
                    "absolute left-0 top-0 h-full rounded transition-all duration-300",
                    getBarColor(index, sortedData.length)
                  )}
                  style={{
                    width: `${(item.percentContribution / maxContribution) * 100}%`,
                  }}
                />

                {/* Cumulative marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-warning-500/50"
                  style={{ left: `${item.cumulative}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-primary-500" />
              Individual %
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-warning-500" />
              Cumulative
            </span>
          </div>
          <span>
            {sortedData.length} dimension{sortedData.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Top contributors summary */}
        {sortedData.length > 0 && (
          <div className="bg-slate-900/50 rounded p-3 space-y-2">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Top Contributors
            </p>
            <div className="space-y-1">
              {sortedData.slice(0, 3).map((item, index) => (
                <div
                  key={item.dimensionId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-slate-300">
                    #{index + 1} {item.name}
                  </span>
                  <span
                    className={cn(
                      "font-mono font-semibold",
                      index === 0
                        ? "text-primary-400"
                        : index === 1
                          ? "text-primary-400/70"
                          : "text-primary-400/50"
                    )}
                  >
                    {item.percentContribution.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            {sortedData.length > 3 && (
              <p className="text-xs text-slate-600">
                Top 3 account for{" "}
                {sortedData
                  .slice(0, 3)
                  .reduce((sum, d) => sum + d.percentContribution, 0)
                  .toFixed(1)}
                % of total variance
              </p>
            )}
          </div>
        )}
      </div>
    </TechnicalPanel>
  );
}

/**
 * Get gradient color for bar based on index (Pareto coloring)
 */
function getBarColor(index: number, total: number): string {
  // Top contributor gets strongest color, fades out
  if (index === 0) return "bg-primary-500";
  if (index === 1) return "bg-primary-500/80";
  if (index === 2) return "bg-primary-500/60";
  if (index < total * 0.5) return "bg-primary-500/40";
  return "bg-primary-500/25";
}
