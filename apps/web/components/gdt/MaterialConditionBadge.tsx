"use client";

import { cn } from "@/lib/utils/cn";
import type { MaterialConditionSymbol } from "@/lib/fcf/schema";
import {
  MATERIAL_CONDITION_LABELS,
  MATERIAL_CONDITION_SHORT,
  MATERIAL_CONDITION_SYMBOLS,
} from "@/lib/constants/gdt-symbols";

interface MaterialConditionBadgeProps {
  condition: MaterialConditionSymbol;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "symbol" | "text" | "full";
  className?: string;
}

const sizeClasses = {
  xs: "h-5 px-1 text-xs",
  sm: "h-5 px-1.5 text-xs",
  md: "h-6 px-2 text-sm",
  lg: "h-7 px-2.5 text-base",
};

const conditionStyles: Record<MaterialConditionSymbol, { bg: string; text: string; border: string }> = {
  MMC: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/30",
  },
  LMC: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-500",
    border: "border-cyan-500/30",
  },
  RFS: {
    bg: "bg-[#F3F4F6] dark:bg-slate-700/50",
    text: "text-[#6B7280] dark:text-slate-400",
    border: "border-[#D1D5DB] dark:border-slate-600",
  },
};

export default function MaterialConditionBadge({
  condition,
  size = "md",
  variant = "symbol",
  className,
}: MaterialConditionBadgeProps) {
  const styles = conditionStyles[condition];
  const symbol = MATERIAL_CONDITION_SYMBOLS[condition];
  const short = MATERIAL_CONDITION_SHORT[condition];
  const full = MATERIAL_CONDITION_LABELS[condition];

  let content: React.ReactNode;
  switch (variant) {
    case "symbol":
      content = symbol || short;
      break;
    case "text":
      content = short;
      break;
    case "full":
      content = (
        <span className="flex items-center gap-1">
          {symbol && <span className="font-mono">{symbol}</span>}
          <span>{short}</span>
        </span>
      );
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "rounded font-mono font-medium border",
        sizeClasses[size],
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
      title={full}
      aria-label={full}
    >
      {content}
    </span>
  );
}

/**
 * Material condition selector component
 */
export function MaterialConditionSelector({
  value,
  onChange,
  allowRFS = true,
  size = "md",
  className,
}: {
  value: MaterialConditionSymbol | undefined;
  onChange: (condition: MaterialConditionSymbol | undefined) => void;
  allowRFS?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const conditions: MaterialConditionSymbol[] = allowRFS
    ? ["MMC", "LMC", "RFS"]
    : ["MMC", "LMC"];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {conditions.map((condition) => {
        const isSelected = value === condition;
        const styles = conditionStyles[condition];

        return (
          <button
            key={condition}
            onClick={() => onChange(isSelected ? undefined : condition)}
            className={cn(
              "inline-flex items-center justify-center",
              "font-mono font-medium border",
              "transition-all duration-200",
              sizeClasses[size],
              isSelected
                ? [styles.bg, styles.text, styles.border]
                : "bg-white dark:bg-slate-800 text-[#6B7280] dark:text-slate-500 border-[#E5E7EB] dark:border-slate-700 hover:border-[#D1D5DB] dark:hover:border-slate-600 hover:text-[#374151] dark:hover:text-slate-400"
            )}
            aria-pressed={isSelected}
            aria-label={MATERIAL_CONDITION_LABELS[condition]}
          >
            {MATERIAL_CONDITION_SHORT[condition]}
          </button>
        );
      })}
    </div>
  );
}
