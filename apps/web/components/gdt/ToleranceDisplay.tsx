"use client";

import { cn } from "@/lib/utils/cn";
import type { ToleranceZone, Unit } from "@/lib/fcf/schema";
import { GDT_SYMBOLS } from "@/lib/constants/gdt-symbols";
import MaterialConditionBadge from "./MaterialConditionBadge";

interface ToleranceDisplayProps {
  tolerance: ToleranceZone;
  sourceUnit?: Unit;
  displayUnit?: Unit;
  decimals?: number;
  dualDisplay?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-sm gap-1",
  md: "text-base gap-1.5",
  lg: "text-lg gap-2",
};

const valueSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

/**
 * Convert value between units
 */
function convertUnit(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  if (from === "mm" && to === "inch") return value / 25.4;
  if (from === "inch" && to === "mm") return value * 25.4;
  return value;
}

/**
 * Format a numeric value with specified decimals
 */
function formatValue(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

export default function ToleranceDisplay({
  tolerance,
  sourceUnit = "mm",
  displayUnit,
  decimals = 3,
  dualDisplay = false,
  size = "md",
  className,
}: ToleranceDisplayProps) {
  const unit = tolerance.unit ?? sourceUnit;
  const targetUnit = displayUnit ?? unit;

  const primaryValue = displayUnit
    ? convertUnit(tolerance.value, unit, targetUnit)
    : tolerance.value;

  const secondaryValue = dualDisplay
    ? convertUnit(tolerance.value, unit, targetUnit === "mm" ? "inch" : "mm")
    : null;

  return (
    <div
      className={cn(
        "inline-flex items-center font-mono",
        sizeClasses[size],
        className
      )}
    >
      {/* Diameter symbol if applicable */}
      {tolerance.diameter && (
        <span className="text-accent-500 font-bold">
          {GDT_SYMBOLS.diameter}
        </span>
      )}

      {/* Primary value */}
      <span className={cn("font-bold text-[#111827] dark:text-slate-50", valueSizeClasses[size])}>
        {formatValue(primaryValue, decimals)}
      </span>

      {/* Unit */}
      <span className="text-[#6B7280] dark:text-slate-400 text-sm">
        {targetUnit}
      </span>

      {/* Material condition */}
      {tolerance.materialCondition && (
        <MaterialConditionBadge
          condition={tolerance.materialCondition}
          size={size === "lg" ? "md" : "sm"}
        />
      )}

      {/* Dual display (secondary unit) */}
      {dualDisplay && secondaryValue !== null && (
        <span className="text-[#9CA3AF] dark:text-slate-500 text-sm">
          ({formatValue(secondaryValue, decimals)}{" "}
          {targetUnit === "mm" ? "in" : "mm"})
        </span>
      )}
    </div>
  );
}

/**
 * Tolerance input component for forms - compact horizontal layout
 */
export function ToleranceInput({
  value,
  onChange,
  unit = "mm",
  onUnitChange,
  decimals = 3,
  showDiameter = true,
  showMaterialCondition = true,
  showUnitSelector = false,
  compact = false,
  className,
}: {
  value: Partial<ToleranceZone>;
  onChange: (tolerance: Partial<ToleranceZone>) => void;
  unit?: Unit;
  onUnitChange?: (unit: Unit) => void;
  decimals?: number;
  showDiameter?: boolean;
  showMaterialCondition?: boolean;
  showUnitSelector?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Diameter toggle */}
      {showDiameter && (
        <button
          type="button"
          onClick={() => onChange({ ...value, diameter: !value.diameter })}
          className={cn(
            "flex items-center justify-center border font-mono",
            "transition-all duration-200",
            compact ? "w-7 h-7 text-base" : "w-8 h-8 text-lg",
            value.diameter
              ? "bg-accent-500/20 border-accent-500 text-accent-500"
              : "bg-white dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-500 hover:border-[#D1D5DB] dark:hover:border-slate-600"
          )}
          aria-pressed={value.diameter}
          aria-label="Toggle diameter zone"
          title="Diameter zone (cylindrical)"
        >
          {GDT_SYMBOLS.diameter}
        </button>
      )}

      {/* Value input */}
      <div className={cn("relative", compact ? "w-28" : "flex-1 min-w-[120px]")}>
        <input
          type="number"
          value={value.value ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              value: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          step={Math.pow(10, -decimals)}
          min={0}
          className={cn(
            "font-mono tabular-nums w-full bg-white dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-800 text-[#111827] dark:text-slate-200 placeholder-[#9CA3AF] dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-accent-500/50 focus:border-accent-500/50",
            compact ? "text-sm py-1.5 px-2" : "text-lg font-semibold py-2 px-3 pr-12"
          )}
          placeholder="0.000"
          aria-label="Tolerance value"
        />
        {!showUnitSelector && !compact && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-slate-500 text-sm">
            {unit}
          </span>
        )}
      </div>

      {/* Unit selector dropdown */}
      {showUnitSelector && onUnitChange && (
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as Unit)}
          className={cn(
            "bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 font-mono text-[#374151] dark:text-slate-300",
            "hover:border-[#D1D5DB] dark:hover:border-slate-600 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/50",
            "cursor-pointer appearance-none",
            compact ? "px-2 py-1.5 text-xs w-14" : "px-3 py-2 text-sm w-16"
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 4px center',
            backgroundSize: '16px',
            paddingRight: compact ? '20px' : '24px',
          }}
          aria-label="Unit"
        >
          <option value="mm">mm</option>
          <option value="inch">in</option>
        </select>
      )}

      {/* Material condition selector */}
      {showMaterialCondition && (
        <div className="flex items-center gap-1">
          {(["MMC", "LMC"] as const).map((mc) => (
            <button
              key={mc}
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  materialCondition: value.materialCondition === mc ? undefined : mc,
                })
              }
              className={cn(
                "flex items-center justify-center border font-mono",
                "transition-all duration-200",
                compact ? "w-9 h-7 text-xs" : "w-10 h-8 text-sm",
                value.materialCondition === mc
                  ? mc === "MMC"
                    ? "bg-amber-500/20 border-amber-500 text-amber-500"
                    : "bg-cyan-500/20 border-cyan-500 text-cyan-500"
                  : "bg-white dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-500 hover:border-[#D1D5DB] dark:hover:border-slate-600"
              )}
              aria-pressed={value.materialCondition === mc}
              aria-label={mc === "MMC" ? "Maximum Material Condition" : "Least Material Condition"}
            >
              {mc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
