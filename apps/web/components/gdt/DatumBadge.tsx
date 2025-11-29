"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DatumReference, MaterialConditionSymbol } from "@/lib/fcf/schema";
import { MATERIAL_CONDITION_SYMBOLS } from "@/lib/constants/gdt-symbols";

interface DatumBadgeProps {
  datum: DatumReference;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "secondary" | "tertiary";
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: "min-w-[1.5rem] h-6 px-1.5 text-xs",
  md: "min-w-[1.75rem] h-7 px-2 text-sm",
  lg: "min-w-[2rem] h-8 px-2.5 text-base",
};

const variantClasses = {
  default: "bg-slate-800 border-slate-600 text-accent-500",
  primary: "bg-primary-500/10 border-primary-500/30 text-primary-400",
  secondary: "bg-accent-500/10 border-accent-500/30 text-accent-400",
  tertiary: "bg-slate-700/50 border-slate-600 text-slate-300",
};

export default function DatumBadge({
  datum,
  size = "md",
  variant = "default",
  removable = false,
  onRemove,
  onClick,
  className,
}: DatumBadgeProps) {
  const mcSymbol = datum.materialCondition
    ? MATERIAL_CONDITION_SYMBOLS[datum.materialCondition]
    : "";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-0.5",
        "border-2 rounded font-mono font-bold",
        "transition-all duration-200",
        sizeClasses[size],
        variantClasses[variant],
        onClick && "cursor-pointer hover:border-primary-500 hover:bg-primary-500/10",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Datum ${datum.id}${datum.materialCondition ? ` at ${datum.materialCondition}` : ""}`}
    >
      <span>{datum.id}</span>
      {mcSymbol && (
        <span className="text-xs opacity-80">{mcSymbol}</span>
      )}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded hover:bg-slate-700 transition-colors"
          aria-label={`Remove datum ${datum.id}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/**
 * Datum reference list component - displays multiple datums in order
 */
export function DatumList({
  datums,
  size = "md",
  removable = false,
  onRemove,
  className,
}: {
  datums: DatumReference[];
  size?: "sm" | "md" | "lg";
  removable?: boolean;
  onRemove?: (index: number) => void;
  className?: string;
}) {
  if (datums.length === 0) {
    return (
      <span className="text-sm text-slate-500 italic">
        No datum references
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {datums.map((datum, index) => (
        <div key={`${datum.id}-${index}`} className="flex items-center">
          {index > 0 && <span className="mx-1 text-slate-600">|</span>}
          <DatumBadge
            datum={datum}
            size={size}
            variant={
              index === 0 ? "primary" : index === 1 ? "secondary" : "tertiary"
            }
            removable={removable}
            onRemove={onRemove ? () => onRemove(index) : undefined}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Available datum letters for selection
 */
export const DATUM_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P"] as const;

/**
 * Datum selector component - for adding datum references
 */
export function DatumSelector({
  selectedDatums,
  onSelect,
  onDeselect,
  maxDatums = 3,
  size = "md",
  className,
}: {
  selectedDatums: string[];
  onSelect: (datumId: string) => void;
  onDeselect: (datumId: string) => void;
  maxDatums?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {DATUM_LETTERS.map((letter) => {
        const isSelected = selectedDatums.includes(letter);
        const isDisabled = !isSelected && selectedDatums.length >= maxDatums;

        return (
          <button
            key={letter}
            onClick={() => {
              if (isSelected) {
                onDeselect(letter);
              } else if (!isDisabled) {
                onSelect(letter);
              }
            }}
            disabled={isDisabled}
            className={cn(
              "inline-flex items-center justify-center",
              "border-2 rounded font-mono font-bold",
              "transition-all duration-200",
              sizeClasses[size],
              isSelected
                ? "bg-accent-500/20 border-accent-500 text-accent-400"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300",
              isDisabled && "opacity-40 cursor-not-allowed"
            )}
            aria-pressed={isSelected}
            aria-label={`${isSelected ? "Remove" : "Add"} datum ${letter}`}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}
