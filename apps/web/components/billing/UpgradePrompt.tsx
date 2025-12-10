"use client";

import { Zap, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface UpgradePromptProps {
  /** The feature or action being blocked */
  feature: string;
  /** Optional custom message */
  message?: string;
  /** Variant style */
  variant?: "inline" | "banner" | "modal";
  /** Whether to show dismiss button */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

/**
 * Prompts users to upgrade their subscription.
 * Used when hitting tier limits or accessing pro features.
 */
export function UpgradePrompt({
  feature,
  message,
  variant = "inline",
  dismissible = false,
  onDismiss,
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const defaultMessage = `Upgrade to Pro to access ${feature}.`;
  const displayMessage = message || defaultMessage;

  if (variant === "banner") {
    return (
      <div className="relative bg-gradient-to-r from-accent-500/10 to-accent-500/5 border border-accent-500/30 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-accent-500/20 border border-accent-500/30">
              <Zap className="w-4 h-4 text-accent-500" />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                Unlock {feature}
              </p>
              <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600">
                {displayMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="px-3 py-1.5 font-mono text-[10px] font-semibold bg-accent-500 text-slate-950 hover:bg-accent-400 transition-all"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
              }}
            >
              UPGRADE
            </Link>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 max-w-md mx-4">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent-500" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-accent-500" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-accent-500" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent-500" />

          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-accent-500/20 border border-accent-500/30">
              <Zap className="w-6 h-6 text-accent-500" />
            </div>
            <h3 className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Upgrade Required
            </h3>
            <p className="font-mono text-sm text-slate-500 dark:text-slate-600 mb-6">
              {displayMessage}
            </p>
            <div className="flex items-center justify-center gap-3">
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Maybe Later
                </button>
              )}
              <Link
                href="/pricing"
                className="px-4 py-2 font-mono text-xs font-semibold bg-accent-500 text-slate-950 hover:bg-accent-400 transition-all"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                }}
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-accent-500/5 border border-accent-500/20",
        dismissible && "pr-2"
      )}
    >
      <Zap className="w-4 h-4 text-accent-500 flex-shrink-0" />
      <p className="font-mono text-xs text-slate-600 dark:text-slate-400 flex-1">
        {displayMessage}
      </p>
      <Link
        href="/pricing"
        className="px-2.5 py-1 font-mono text-[10px] font-semibold bg-accent-500 text-slate-950 hover:bg-accent-400 transition-all whitespace-nowrap"
      >
        UPGRADE
      </Link>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
