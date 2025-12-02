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
    <div className={cn("space-y-3", className)}>
      {/* Compact row: Notation dropdown + inputs */}
      <div className="flex items-center gap-3">
        {/* Notation selector dropdown */}
        <select
          value={notation}
          onChange={(e) => handleNotationChange(e.target.value as ToleranceNotation)}
          className={cn(
            "bg-slate-800 border border-slate-700 rounded-md font-mono text-slate-300 text-xs",
            "hover:border-slate-600 focus:border-primary-500 focus:outline-none",
            "cursor-pointer appearance-none px-2 py-1.5 w-32"
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 4px center',
            backgroundSize: '14px',
            paddingRight: '20px',
          }}
          aria-label="Tolerance notation"
        >
          <option value="symmetric">± Symmetric</option>
          <option value="asymmetric">+/- Asymmetric</option>
          <option value="limits">Limits</option>
        </select>

        {/* Symmetric mode - inline inputs */}
        {notation === "symmetric" && (
          <>
            <div className="flex-1 min-w-0">
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
                  className="input w-full text-sm py-1.5 font-mono tabular-nums"
                  placeholder="Nominal"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
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
                  className="input w-full pl-6 text-sm py-1.5 font-mono tabular-nums"
                  placeholder="Tol"
                />
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">{unit}</span>
          </>
        )}

        {/* Asymmetric mode - inline inputs */}
        {notation === "asymmetric" && (
          <>
            <div className="w-24">
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
                className="input w-full text-sm py-1.5 font-mono tabular-nums"
                placeholder="Nom"
              />
            </div>
            <div className="w-20">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-accent-400 font-mono text-sm">
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
                  className="input w-full pl-5 text-sm py-1.5 font-mono tabular-nums"
                  placeholder="+"
                />
              </div>
            </div>
            <div className="w-20">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-error-400 font-mono text-sm">
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
                  className="input w-full pl-5 text-sm py-1.5 font-mono tabular-nums"
                  placeholder="-"
                />
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">{unit}</span>
          </>
        )}

        {/* Limits mode - inline inputs */}
        {notation === "limits" && (
          <>
            <div className="flex-1 min-w-0">
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
                className="input w-full text-sm py-1.5 font-mono tabular-nums"
                placeholder="Max"
              />
            </div>
            <div className="flex-1 min-w-0">
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
                className="input w-full text-sm py-1.5 font-mono tabular-nums"
                placeholder="Min"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">{unit}</span>
          </>
        )}
      </div>

      {/* Limits mode - error/info display */}
      {notation === "limits" && upperLimit !== undefined && lowerLimit !== undefined && (
        upperLimit >= lowerLimit ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Info className="w-3 h-3 text-slate-500" />
            <span>
              → {((upperLimit + lowerLimit) / 2).toFixed(decimals)} ±{((upperLimit - lowerLimit) / 2).toFixed(decimals)} {unit}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-error-400">
            <Info className="w-3 h-3" />
            <span>Upper must be ≥ lower</span>
          </div>
        )
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
 * Size summary component - compact version showing limits and MMC/LMC
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

  const isInternal = featureType === "hole" || featureType === "slot";

  return (
    <div className="pt-2 border-t border-slate-800/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono">
      <span className="text-slate-500">
        Limits: <span className="text-slate-400">{sizeLimits.lowerLimit.toFixed(decimals)}–{sizeLimits.upperLimit.toFixed(decimals)}</span>
      </span>
      <span className="text-slate-500">
        <span className="text-amber-400" title={isInternal ? "Smallest (max material)" : "Largest (max material)"}>
          MMC {sizeLimits.mmc.toFixed(decimals)}
        </span>
        {" / "}
        <span className="text-cyan-400" title={isInternal ? "Largest (least material)" : "Smallest (least material)"}>
          LMC {sizeLimits.lmc.toFixed(decimals)}
        </span>
        <span className="text-slate-600 ml-1">{unit}</span>
      </span>
    </div>
  );
}
