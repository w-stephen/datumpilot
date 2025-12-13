"use client";

import { cn } from "@/lib/utils/cn";
import type { Characteristic } from "@/lib/fcf/schema";
import {
  CHARACTERISTIC_COLORS,
  CHARACTERISTIC_BG_COLORS,
  CHARACTERISTIC_LABELS,
  CHARACTERISTIC_DESCRIPTIONS,
  CHARACTERISTIC_CATEGORIES,
  CATEGORY_LABELS,
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
  sm: "text-xs",
  md: "text-sm",
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
        "inline-flex items-center justify-center font-mono font-bold",
        "transition-all duration-200",
        sizeClasses[size],
        variant === "filled" && "text-slate-950",
        variant === "outline" && "border-2",
        variant === "default" && "bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700",
        interactive && "cursor-pointer hover:scale-105",
        active && "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950",
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
            "font-medium text-[#374151] dark:text-slate-400",
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
  const symbols: Record<Characteristic, string> = {
    position: GDT_SYMBOLS.position,
    flatness: GDT_SYMBOLS.flatness,
    straightness: GDT_SYMBOLS.straightness,
    circularity: GDT_SYMBOLS.circularity,
    cylindricity: GDT_SYMBOLS.cylindricity,
    perpendicularity: GDT_SYMBOLS.perpendicularity,
    parallelism: GDT_SYMBOLS.parallelism,
    angularity: GDT_SYMBOLS.angularity,
    profile: GDT_SYMBOLS.profile,
    runout: GDT_SYMBOLS.runout,
    totalRunout: GDT_SYMBOLS.totalRunout,
    other: "?",
  };
  return symbols[characteristic] || "?";
}

// Named export alias
export const CharacteristicIcon = CharacteristicIconComponent;

/**
 * Single characteristic card for the picker - larger, more touch-friendly
 */
function CharacteristicCard({
  characteristic,
  selected,
  onClick,
  showDescription = false,
}: {
  characteristic: Characteristic;
  selected: boolean;
  onClick: () => void;
  showDescription?: boolean;
}) {
  const color = CHARACTERISTIC_COLORS[characteristic];
  const bgColor = CHARACTERISTIC_BG_COLORS[characteristic];
  const symbol = getSymbol(characteristic);
  const label = CHARACTERISTIC_LABELS[characteristic];
  const description = CHARACTERISTIC_DESCRIPTIONS[characteristic];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-lg border-2 transition-all duration-200",
        "hover:shadow-md hover:scale-[1.02]",
        selected
          ? "border-current shadow-lg"
          : "border-[#E5E7EB] dark:border-slate-700 hover:border-[#D1D5DB] dark:hover:border-slate-600"
      )}
      style={{
        backgroundColor: selected ? bgColor : undefined,
        borderColor: selected ? color : undefined,
      }}
      aria-pressed={selected}
    >
      {/* Symbol */}
      <div
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-lg font-mono text-xl font-bold flex-shrink-0",
          selected ? "" : "bg-[#F9FAFB] dark:bg-slate-800"
        )}
        style={{
          color: color,
          backgroundColor: selected ? `${color}20` : undefined,
        }}
      >
        {symbol}
      </div>

      {/* Label and description */}
      <div className="flex-1 text-left min-w-0">
        <div
          className={cn(
            "font-medium text-sm",
            selected ? "" : "text-[#374151] dark:text-slate-300"
          )}
          style={{ color: selected ? color : undefined }}
        >
          {label}
        </div>
        {showDescription && (
          <div className="text-xs text-[#6B7280] dark:text-slate-500 truncate">
            {description}
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * Characteristic picker component - shows all available characteristics grouped by category
 */
export function CharacteristicPicker({
  value,
  onChange,
  size = "lg",
  compact = false,
  showLabels = true,
  equallySpaced = false,
  showCategories = false,
  showDescriptions = false,
  className,
}: {
  value: Characteristic | null;
  onChange: (characteristic: Characteristic) => void;
  size?: "sm" | "md" | "lg" | "xl";
  compact?: boolean;
  showLabels?: boolean;
  equallySpaced?: boolean;
  showCategories?: boolean;
  showDescriptions?: boolean;
  className?: string;
}) {
  // Full categorized view
  if (showCategories) {
    return (
      <div className={cn("space-y-4", className)}>
        {(Object.keys(CHARACTERISTIC_CATEGORIES) as Array<keyof typeof CHARACTERISTIC_CATEGORIES>).map((category) => (
          <div key={category}>
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#6B7280] dark:text-slate-500 mb-2">
              {CATEGORY_LABELS[category]}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {CHARACTERISTIC_CATEGORIES[category].map((char) => (
                <CharacteristicCard
                  key={char}
                  characteristic={char}
                  selected={value === char}
                  onClick={() => onChange(char)}
                  showDescription={showDescriptions}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Compact grid view - all characteristics in a responsive grid
  if (compact) {
    const allCharacteristics: Characteristic[] = [
      ...CHARACTERISTIC_CATEGORIES.location,
      ...CHARACTERISTIC_CATEGORIES.form,
      ...CHARACTERISTIC_CATEGORIES.orientation,
      ...CHARACTERISTIC_CATEGORIES.profile,
      ...CHARACTERISTIC_CATEGORIES.runout,
    ];

    return (
      <div className={cn("grid grid-cols-4 sm:grid-cols-6 gap-2", className)}>
        {allCharacteristics.map((char) => {
          const color = CHARACTERISTIC_COLORS[char];
          const bgColor = CHARACTERISTIC_BG_COLORS[char];
          const symbol = getSymbol(char);
          const label = CHARACTERISTIC_LABELS[char];
          const isSelected = value === char;

          return (
            <button
              key={char}
              type="button"
              onClick={() => onChange(char)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-200",
                "hover:shadow-md",
                isSelected
                  ? "border-current shadow-md"
                  : "border-[#E5E7EB] dark:border-slate-700 hover:border-[#D1D5DB] dark:hover:border-slate-600"
              )}
              style={{
                backgroundColor: isSelected ? bgColor : undefined,
                borderColor: isSelected ? color : undefined,
              }}
              aria-pressed={isSelected}
              title={label}
            >
              <span
                className="text-lg font-mono font-bold"
                style={{ color }}
              >
                {symbol}
              </span>
              {showLabels && (
                <span
                  className={cn(
                    "text-[10px] font-medium truncate w-full text-center",
                    isSelected ? "" : "text-[#6B7280] dark:text-slate-500"
                  )}
                  style={{ color: isSelected ? color : undefined }}
                >
                  {label.length > 8 ? label.slice(0, 7) + "…" : label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Original inline view for backwards compatibility
  const effectiveSize = size;
  const characteristics: Characteristic[] = [
    ...CHARACTERISTIC_CATEGORIES.location,
    ...CHARACTERISTIC_CATEGORIES.form,
    ...CHARACTERISTIC_CATEGORIES.orientation,
    ...CHARACTERISTIC_CATEGORIES.profile,
    ...CHARACTERISTIC_CATEGORIES.runout,
  ];

  return (
    <div className={cn(
      "flex items-center flex-wrap",
      equallySpaced ? "justify-evenly flex-1" : "gap-2",
      className
    )}>
      {characteristics.map((char) => (
        <CharacteristicIcon
          key={char}
          characteristic={char}
          size={effectiveSize}
          variant={value === char ? "filled" : "default"}
          active={value === char}
          interactive
          showLabel={showLabels}
          onClick={() => onChange(char)}
        />
      ))}
    </div>
  );
}

export default CharacteristicIconComponent;
