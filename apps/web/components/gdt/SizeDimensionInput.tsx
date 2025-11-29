"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Unit, FeatureType } from "@/lib/fcf/schema";
import type { SizeDimensionInput as SizeDimensionType } from "@/lib/calc/types";
import { calculateSizeLimits } from "@/lib/calc/position";

type ToleranceNotation = "symmetric" | "asymmetric" | "limits";

interface SizeDimensionInputProps {
  value?: Partial<Omit<SizeDimensionType, "featureType">>;
  onChange: (value: Partial<Omit<SizeDimensionType, "featureType">>) => void;
  featureType?: FeatureType;
  unit?: Unit;
  decimals?: number;
  className?: string;
}

/**
 * Size Dimension Input component with notation toggle.
 * Supports symmetric (±), asymmetric (+/-), and limits notation.
 * All notations convert to canonical format: { nominal, tolerancePlus, toleranceMinus }
 */
export default function SizeDimensionInput({
  value,
  onChange,
  featureType,
  unit = "mm",
  decimals = 3,
  className,
}: SizeDimensionInputProps) {
  // Determine initial notation from existing values
  const getInitialNotation = (): ToleranceNotation => {
    if (!value?.tolerancePlus && !value?.toleranceMinus) return "symmetric";
    if (value.tolerancePlus === value.toleranceMinus) return "symmetric";
    return "asymmetric";
  };

  const [notation, setNotation] = useState<ToleranceNotation>(getInitialNotation);

  // For limits mode, track the actual limit values
  const [upperLimit, setUpperLimit] = useState<number | undefined>(
    value?.nominal !== undefined && value?.tolerancePlus !== undefined
      ? value.nominal + value.tolerancePlus
      : undefined
  );
  const [lowerLimit, setLowerLimit] = useState<number | undefined>(
    value?.nominal !== undefined && value?.toleranceMinus !== undefined
      ? value.nominal - value.toleranceMinus
      : undefined
  );

  // Symmetric tolerance value (when tolerancePlus === toleranceMinus)
  const symmetricTolerance = value?.tolerancePlus ?? value?.toleranceMinus ?? 0;

  // Handle notation change
  const handleNotationChange = useCallback((newNotation: ToleranceNotation) => {
    setNotation(newNotation);

    // Convert existing values to new notation format
    if (newNotation === "symmetric" && value?.tolerancePlus !== value?.toleranceMinus) {
      // Average the tolerances for symmetric
      const avg = ((value?.tolerancePlus ?? 0) + (value?.toleranceMinus ?? 0)) / 2;
      onChange({
        ...value,
        tolerancePlus: avg,
        toleranceMinus: avg,
      });
    } else if (newNotation === "limits" && value?.nominal !== undefined) {
      // Update limit values from current nominal/tolerance
      setUpperLimit(value.nominal + (value.tolerancePlus ?? 0));
      setLowerLimit(value.nominal - (value.toleranceMinus ?? 0));
    }
  }, [value, onChange]);

  // Handle symmetric tolerance change
  const handleSymmetricChange = useCallback((tolerance: number | undefined) => {
    onChange({
      ...value,
      tolerancePlus: tolerance,
      toleranceMinus: tolerance,
    });
  }, [value, onChange]);

  // Handle limits change - convert to nominal + tolerances
  const handleLimitsChange = useCallback((upper: number | undefined, lower: number | undefined) => {
    setUpperLimit(upper);
    setLowerLimit(lower);

    if (upper !== undefined && lower !== undefined && upper >= lower) {
      const nominal = (upper + lower) / 2;
      const tolerancePlus = upper - nominal;
      const toleranceMinus = nominal - lower;
      onChange({
        ...value,
        nominal,
        tolerancePlus,
        toleranceMinus,
      });
    }
  }, [value, onChange]);

  // Update limits when nominal/tolerance changes externally
  useEffect(() => {
    if (notation === "limits" && value?.nominal !== undefined) {
      if (value.tolerancePlus !== undefined) {
        setUpperLimit(value.nominal + value.tolerancePlus);
      }
      if (value.toleranceMinus !== undefined) {
        setLowerLimit(value.nominal - value.toleranceMinus);
      }
    }
  }, [notation, value?.nominal, value?.tolerancePlus, value?.toleranceMinus]);

  const step = Math.pow(10, -decimals);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Notation selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 w-20">Notation:</span>
        <div className="flex items-center gap-1">
          {(
            [
              { key: "symmetric", label: "± Symmetric" },
              { key: "asymmetric", label: "+/- Asymmetric" },
              { key: "limits", label: "Limits" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleNotationChange(key)}
              className={cn(
                "px-3 py-1.5 text-xs font-mono rounded-md border transition-colors",
                notation === key
                  ? "bg-primary-500/20 border-primary-500 text-primary-400"
                  : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Symmetric mode */}
      {notation === "symmetric" && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">Nominal</label>
            <div className="relative">
              <input
                type="number"
                value={value?.nominal ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    nominal: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                step={step}
                className="input pr-12 font-mono tabular-nums"
                placeholder="0.000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                {unit}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">Tolerance (±)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                ±
              </span>
              <input
                type="number"
                value={symmetricTolerance || ""}
                onChange={(e) =>
                  handleSymmetricChange(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                step={step}
                min={0}
                className="input pl-8 pr-12 font-mono tabular-nums"
                placeholder="0.000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                {unit}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Asymmetric mode */}
      {notation === "asymmetric" && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Nominal</label>
            <div className="relative max-w-[200px]">
              <input
                type="number"
                value={value?.nominal ?? ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    nominal: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                step={step}
                className="input pr-12 font-mono tabular-nums"
                placeholder="0.000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                {unit}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Upper (+)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400 font-mono">
                  +
                </span>
                <input
                  type="number"
                  value={value?.tolerancePlus ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      tolerancePlus: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  step={step}
                  min={0}
                  className="input pl-8 pr-12 font-mono tabular-nums"
                  placeholder="0.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  {unit}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Lower (-)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-error-400 font-mono">
                  -
                </span>
                <input
                  type="number"
                  value={value?.toleranceMinus ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      toleranceMinus: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  step={step}
                  min={0}
                  className="input pl-8 pr-12 font-mono tabular-nums"
                  placeholder="0.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  {unit}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Limits mode */}
      {notation === "limits" && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Upper Limit (Max)</label>
              <div className="relative">
                <input
                  type="number"
                  value={upperLimit ?? ""}
                  onChange={(e) =>
                    handleLimitsChange(
                      e.target.value ? parseFloat(e.target.value) : undefined,
                      lowerLimit
                    )
                  }
                  step={step}
                  className="input pr-12 font-mono tabular-nums"
                  placeholder="0.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  {unit}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">Lower Limit (Min)</label>
              <div className="relative">
                <input
                  type="number"
                  value={lowerLimit ?? ""}
                  onChange={(e) =>
                    handleLimitsChange(
                      upperLimit,
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  step={step}
                  className="input pr-12 font-mono tabular-nums"
                  placeholder="0.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  {unit}
                </span>
              </div>
            </div>
          </div>

          {/* Calculated values display */}
          {upperLimit !== undefined && lowerLimit !== undefined && upperLimit >= lowerLimit && (
            <div className="flex items-center gap-2 p-2 bg-slate-800/50 border border-slate-700 rounded">
              <Info className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-400 font-mono">
                Calculated: {((upperLimit + lowerLimit) / 2).toFixed(decimals)} ±
                {((upperLimit - lowerLimit) / 2).toFixed(decimals)} {unit}
              </span>
            </div>
          )}

          {upperLimit !== undefined && lowerLimit !== undefined && upperLimit < lowerLimit && (
            <div className="flex items-center gap-2 p-2 bg-error-500/10 border border-error-500/30 rounded">
              <Info className="w-3 h-3 text-error-400" />
              <span className="text-xs text-error-400">
                Upper limit must be greater than or equal to lower limit
              </span>
            </div>
          )}
        </div>
      )}

      {/* Size summary - use calculateSizeLimits for correct MMC/LMC based on feature type */}
      {value?.nominal !== undefined && (value?.tolerancePlus !== undefined || value?.toleranceMinus !== undefined) && featureType && (
        <SizeSummary
          nominal={value.nominal}
          tolerancePlus={value.tolerancePlus ?? 0}
          toleranceMinus={value.toleranceMinus ?? 0}
          featureType={featureType}
          unit={unit}
          decimals={decimals}
        />
      )}
    </div>
  );
}

/**
 * Size summary component that correctly calculates MMC/LMC based on feature type.
 */
function SizeSummary({
  nominal,
  tolerancePlus,
  toleranceMinus,
  featureType,
  unit,
  decimals,
}: {
  nominal: number;
  tolerancePlus: number;
  toleranceMinus: number;
  featureType: FeatureType;
  unit: Unit;
  decimals: number;
}) {
  const sizeLimits = useMemo(() => {
    return calculateSizeLimits(
      { nominal, tolerancePlus, toleranceMinus, featureType },
      decimals as 1 | 2 | 3 | 4 | 5 | 6
    );
  }, [nominal, tolerancePlus, toleranceMinus, featureType, decimals]);

  // Determine if internal or external for display text
  const isInternal = featureType === "hole" || featureType === "slot";

  return (
    <div className="pt-3 border-t border-slate-800 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Size Limits:</span>
        <div className="font-mono text-slate-300">
          <span className="text-slate-400">
            Max: {sizeLimits.upperLimit.toFixed(decimals)}
          </span>
          <span className="text-slate-600 mx-2">|</span>
          <span className="text-slate-400">
            Min: {sizeLimits.lowerLimit.toFixed(decimals)}
          </span>
          <span className="text-slate-500 ml-1">{unit}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Material Conditions:</span>
        <div className="font-mono text-slate-300">
          <span className="text-amber-400" title={isInternal ? "Smallest size (max material)" : "Largest size (max material)"}>
            MMC: {sizeLimits.mmc.toFixed(decimals)}
          </span>
          <span className="text-slate-600 mx-2">|</span>
          <span className="text-cyan-400" title={isInternal ? "Largest size (least material)" : "Smallest size (least material)"}>
            LMC: {sizeLimits.lmc.toFixed(decimals)}
          </span>
          <span className="text-slate-500 ml-1">{unit}</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-600 italic">
        {isInternal
          ? `For ${featureType}: MMC = smallest (${sizeLimits.mmc.toFixed(decimals)}), LMC = largest (${sizeLimits.lmc.toFixed(decimals)})`
          : `For ${featureType}: MMC = largest (${sizeLimits.mmc.toFixed(decimals)}), LMC = smallest (${sizeLimits.lmc.toFixed(decimals)})`}
      </p>
    </div>
  );
}
