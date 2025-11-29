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
      <span className={cn("font-bold text-slate-50", valueSizeClasses[size])}>
        {formatValue(primaryValue, decimals)}
      </span>

      {/* Unit */}
      <span className="text-slate-400 text-sm">
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
        <span className="text-slate-500 text-sm">
          ({formatValue(secondaryValue, decimals)}{" "}
          {targetUnit === "mm" ? "in" : "mm"})
        </span>
      )}
    </div>
  );
}

/**
 * Tolerance input component for forms
 */
export function ToleranceInput({
  value,
  onChange,
  unit = "mm",
  decimals = 3,
  showDiameter = true,
  showMaterialCondition = true,
  className,
}: {
  value: Partial<ToleranceZone>;
  onChange: (tolerance: Partial<ToleranceZone>) => void;
  unit?: Unit;
  decimals?: number;
  showDiameter?: boolean;
  showMaterialCondition?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Diameter toggle */}
      {showDiameter && (
        <button
          type="button"
          onClick={() => onChange({ ...value, diameter: !value.diameter })}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md border font-mono text-lg",
            "transition-all duration-200",
            value.diameter
              ? "bg-accent-500/20 border-accent-500 text-accent-400"
              : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600"
          )}
          aria-pressed={value.diameter}
          aria-label="Toggle diameter zone"
          title="Diameter zone (cylindrical)"
        >
          {GDT_SYMBOLS.diameter}
        </button>
      )}

      {/* Value input */}
      <div className="relative flex-1">
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
            "input pr-12 font-mono tabular-nums",
            "text-lg font-semibold"
          )}
          placeholder="0.000"
          aria-label="Tolerance value"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
          {unit}
        </span>
      </div>

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
                "w-10 h-8 flex items-center justify-center rounded-md border font-mono text-sm",
                "transition-all duration-200",
                value.materialCondition === mc
                  ? mc === "MMC"
                    ? "bg-amber-500/20 border-amber-500 text-amber-400"
                    : "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                  : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600"
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
