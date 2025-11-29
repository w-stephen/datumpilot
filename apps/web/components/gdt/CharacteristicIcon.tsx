"use client";

import { cn } from "@/lib/utils/cn";
import type { Characteristic } from "@/lib/fcf/schema";
import {
  CHARACTERISTIC_COLORS,
  CHARACTERISTIC_BG_COLORS,
  CHARACTERISTIC_LABELS,
  GDT_SYMBOLS,
} from "@/lib/constants/gdt-symbols";

interface CharacteristicIconProps {
  characteristic: Characteristic;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "outline" | "filled";
  active?: boolean;
  interactive?: boolean;
  showLabel?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-6 h-6 text-sm",
  md: "w-8 h-8 text-base",
  lg: "w-10 h-10 text-lg",
  xl: "w-12 h-12 text-xl",
};

const labelSizeClasses = {
  sm: "text-2xs",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
};

function CharacteristicIconComponent({
  characteristic,
  size = "md",
  variant = "default",
  active = false,
  interactive = false,
  showLabel = false,
  className,
  onClick,
}: CharacteristicIconProps) {
  const color = CHARACTERISTIC_COLORS[characteristic];
  const bgColor = CHARACTERISTIC_BG_COLORS[characteristic];
  const symbol = getSymbol(characteristic);
  const label = CHARACTERISTIC_LABELS[characteristic];

  const content = (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-mono font-bold",
        "transition-all duration-200",
        sizeClasses[size],
        variant === "filled" && "text-slate-950",
        variant === "outline" && "border-2",
        variant === "default" && "bg-slate-800 border border-slate-700",
        interactive && "cursor-pointer hover:scale-105",
        active && "ring-2 ring-offset-2 ring-offset-slate-950",
        className
      )}
      style={{
        color: variant === "filled" ? "#0F1419" : color,
        backgroundColor: variant === "filled" ? color : bgColor,
        borderColor: variant === "outline" ? color : undefined,
        boxShadow: active ? `0 0 20px ${color}40` : undefined,
        // @ts-expect-error - Tailwind CSS variable for ring color
        "--tw-ring-color": active ? color : undefined,
      }}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Select ${label}` : label}
    >
      {symbol}
    </div>
  );

  if (showLabel) {
    return (
      <div className="flex flex-col items-center gap-1">
        {content}
        <span
          className={cn(
            "font-medium text-slate-400",
            labelSizeClasses[size]
          )}
        >
          {label}
        </span>
      </div>
    );
  }

  return content;
}

/**
 * Get the display symbol for a characteristic.
 * Uses Unicode symbols for proper ASME Y14.5 representation.
 */
function getSymbol(characteristic: Characteristic): string {
  switch (characteristic) {
    case "position":
      return GDT_SYMBOLS.position;
    case "flatness":
      return GDT_SYMBOLS.flatness;
    case "perpendicularity":
      return GDT_SYMBOLS.perpendicularity;
    case "profile":
      return GDT_SYMBOLS.profile;
    default:
      return "?";
  }
}

// Named export alias
export const CharacteristicIcon = CharacteristicIconComponent;

/**
 * Characteristic picker component - shows all available characteristics
 */
export function CharacteristicPicker({
  value,
  onChange,
  size = "lg",
  className,
}: {
  value: Characteristic | null;
  onChange: (characteristic: Characteristic) => void;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const characteristics: Characteristic[] = ["position", "flatness", "perpendicularity", "profile"];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {characteristics.map((char) => (
        <CharacteristicIcon
          key={char}
          characteristic={char}
          size={size}
          variant={value === char ? "filled" : "default"}
          active={value === char}
          interactive
          showLabel
          onClick={() => onChange(char)}
        />
      ))}
    </div>
  );
}

export default CharacteristicIconComponent;
