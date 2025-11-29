"use client";

import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Confidence } from "@/lib/database/types";
import { CONFIDENCE_COLORS, CONFIDENCE_LABELS } from "@/lib/constants/gdt-symbols";

interface ConfidenceIndicatorProps {
  confidence: Confidence;
  parseConfidence?: number;
  showPercentage?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "inline" | "detailed";
  className?: string;
}

const sizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const iconSizes = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const ConfidenceIcons: Record<Confidence, React.ElementType> = {
  high: CheckCircle2,
  medium: AlertCircle,
  low: XCircle,
};

export default function ConfidenceIndicator({
  confidence,
  parseConfidence,
  showPercentage = false,
  showLabel = true,
  size = "md",
  variant = "badge",
  className,
}: ConfidenceIndicatorProps) {
  const colors = CONFIDENCE_COLORS[confidence];
  const label = CONFIDENCE_LABELS[confidence];
  const Icon = ConfidenceIcons[confidence];

  // Calculate percentage display (0-100)
  const percentage = parseConfidence !== undefined
    ? Math.round(parseConfidence * 100)
    : null;

  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1",
          sizeClasses[size],
          className
        )}
        style={{ color: colors.text }}
      >
        <Icon className={iconSizes[size]} />
        {showLabel && <span>{label}</span>}
        {showPercentage && percentage !== null && (
          <span className="font-mono">({percentage}%)</span>
        )}
      </span>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          className
        )}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
        }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full"
          style={{ backgroundColor: `${colors.text}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: colors.text }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="font-medium"
              style={{ color: colors.text }}
            >
              {label}
            </span>
            {percentage !== null && (
              <span
                className="font-mono text-sm"
                style={{ color: colors.text }}
              >
                {percentage}%
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            {confidence === "high" && "Extraction completed with high accuracy"}
            {confidence === "medium" && "Some fields may need review"}
            {confidence === "low" && "Manual verification recommended"}
          </p>
        </div>
      </div>
    );
  }

  // Default: badge variant
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span className="font-medium">{label}</span>}
      {showPercentage && percentage !== null && (
        <span className="font-mono">({percentage}%)</span>
      )}
    </span>
  );
}

/**
 * Mini confidence indicator for use in lists/tables
 */
export function ConfidenceDot({
  confidence,
  className,
}: {
  confidence: Confidence;
  className?: string;
}) {
  const colors = CONFIDENCE_COLORS[confidence];
  const label = CONFIDENCE_LABELS[confidence];

  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        className
      )}
      style={{ backgroundColor: colors.text }}
      title={label}
      aria-label={label}
    />
  );
}

/**
 * Confidence progress bar
 */
export function ConfidenceBar({
  parseConfidence,
  size = "md",
  showValue = true,
  className,
}: {
  parseConfidence: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}) {
  const percentage = Math.round(parseConfidence * 100);
  const confidence: Confidence =
    parseConfidence >= 0.8 ? "high" : parseConfidence >= 0.5 ? "medium" : "low";
  const colors = CONFIDENCE_COLORS[confidence];

  const heightClasses = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full rounded-full bg-slate-800 overflow-hidden",
          heightClasses[size]
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: colors.text,
          }}
        />
      </div>
      {showValue && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-500">Confidence</span>
          <span
            className="text-xs font-mono"
            style={{ color: colors.text }}
          >
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
}
