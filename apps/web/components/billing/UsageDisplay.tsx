"use client";

import { cn } from "@/lib/utils/cn";

interface UsageDisplayProps {
  label: string;
  current: number;
  limit: number;
  compact?: boolean;
}

/**
 * Displays usage progress for a resource limit.
 * Shows current/limit with a progress bar.
 */
export function UsageDisplay({
  label,
  current,
  limit,
  compact = false,
}: UsageDisplayProps) {
  const isUnlimited = limit === -1 || limit === Infinity;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && current >= limit;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-600">
          {label}:
        </span>
        <span
          className={cn(
            "font-mono text-[10px] font-semibold",
            isAtLimit
              ? "text-error-500"
              : isNearLimit
                ? "text-warning-500"
                : "text-slate-700 dark:text-slate-300"
          )}
        >
          {current}
          {isUnlimited ? "" : `/${limit}`}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-xs font-semibold",
            isAtLimit
              ? "text-error-500"
              : isNearLimit
                ? "text-warning-500"
                : "text-slate-900 dark:text-slate-100"
          )}
        >
          {current.toLocaleString()}
          {isUnlimited ? " (unlimited)" : ` / ${limit.toLocaleString()}`}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
        {isUnlimited ? (
          <div className="h-full bg-accent-500/30 w-full" />
        ) : (
          <div
            className={cn(
              "h-full transition-all",
              isAtLimit
                ? "bg-error-500"
                : isNearLimit
                  ? "bg-warning-500"
                  : "bg-accent-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
