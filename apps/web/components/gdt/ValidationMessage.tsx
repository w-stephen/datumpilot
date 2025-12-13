"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { ValidationIssue, Severity } from "@/lib/rules/validateFcf";

interface ValidationMessageProps {
  issue: ValidationIssue;
  dismissable?: boolean;
  onDismiss?: () => void;
  expanded?: boolean;
  className?: string;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    bgClass: "bg-error-500/10",
    borderClass: "border-error-500/20",
    textClass: "text-error-500",
    codeClass: "bg-error-500/20 text-error-500",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-warning-500/10",
    borderClass: "border-warning-500/20",
    textClass: "text-warning-500",
    codeClass: "bg-warning-500/20 text-warning-500",
  },
};

export default function ValidationMessage({
  issue,
  dismissable = false,
  onDismiss,
  expanded: initialExpanded = false,
  className,
}: ValidationMessageProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        config.bgClass,
        config.borderClass,
        className
      )}
      role="alert"
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.textClass)} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Error code badge */}
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-xs font-mono font-medium",
              config.codeClass
            )}
          >
            {issue.code}
          </span>

          {/* Message */}
          <span className={cn("text-sm", config.textClass)}>
            {issue.message}
          </span>
        </div>

        {/* Path (field location) */}
        {issue.path && (
          <p className="text-xs text-[#6B7280] dark:text-slate-500 mt-1 font-mono">
            at: {issue.path}
          </p>
        )}

        {/* Context/Suggestion */}
        {issue.context?.suggestion && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-slate-400 hover:text-[#374151] dark:hover:text-slate-300 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {expanded ? "Hide suggestion" : "Show suggestion"}
            </button>
            {expanded && (
              <div className="mt-2 p-2 bg-[#F9FAFB] dark:bg-slate-800/50 border border-[#E5E7EB] dark:border-slate-700">
                <p className="text-sm text-[#374151] dark:text-slate-300">
                  <Info className="w-3.5 h-3.5 inline mr-1 text-primary-500" />
                  {issue.context.suggestion}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissable && onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-slate-700/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-[#6B7280] dark:text-slate-500" />
        </button>
      )}
    </div>
  );
}

/**
 * Validation summary panel - shows all validation issues
 */
export function ValidationPanel({
  issues,
  title = "Validation Results",
  collapsible = true,
  defaultExpanded = true,
  className,
}: {
  issues: ValidationIssue[];
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const isValid = errors.length === 0;

  return (
    <div className={cn("border overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => collapsible && setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between p-4",
          "transition-colors",
          isValid
            ? "bg-success-500/10 border-b border-success-500/20"
            : "bg-error-500/10 border-b border-error-500/20",
          collapsible && "cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-slate-800/50"
        )}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-3">
          {isValid ? (
            <CheckCircle2 className="w-5 h-5 text-success-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-error-500" />
          )}
          <span className="font-medium text-[#111827] dark:text-slate-200">{title}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Counts */}
          <div className="flex items-center gap-2 text-sm">
            {errors.length > 0 && (
              <span className="text-error-500">
                {errors.length} error{errors.length !== 1 ? "s" : ""}
              </span>
            )}
            {warnings.length > 0 && (
              <span className="text-warning-500">
                {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
              </span>
            )}
            {isValid && warnings.length === 0 && (
              <span className="text-success-500">Valid</span>
            )}
          </div>

          {collapsible && (
            expanded ? (
              <ChevronUp className="w-4 h-4 text-[#6B7280] dark:text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6B7280] dark:text-slate-400" />
            )
          )}
        </div>
      </button>

      {/* Issues list */}
      {expanded && issues.length > 0 && (
        <div className="p-4 space-y-3 bg-[#F9FAFB] dark:bg-slate-900/50">
          {errors.map((issue, index) => (
            <ValidationMessage key={`error-${index}`} issue={issue} />
          ))}
          {warnings.map((issue, index) => (
            <ValidationMessage key={`warning-${index}`} issue={issue} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {expanded && issues.length === 0 && (
        <div className="p-6 text-center bg-[#F9FAFB] dark:bg-slate-900/50">
          <CheckCircle2 className="w-8 h-8 text-success-500 mx-auto mb-2" />
          <p className="text-sm text-[#6B7280] dark:text-slate-400">
            No validation issues found
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline validation status indicator
 */
export function ValidationStatus({
  valid,
  errorCount = 0,
  warningCount = 0,
  size = "md",
  className,
}: {
  valid: boolean;
  errorCount?: number;
  warningCount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (valid) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-success-500",
          textSizes[size],
          className
        )}
      >
        <CheckCircle2 className={iconSizes[size]} />
        <span className="font-medium">Valid</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        textSizes[size],
        className
      )}
    >
      {errorCount > 0 && (
        <span className="inline-flex items-center gap-1 text-error-400">
          <AlertCircle className={iconSizes[size]} />
          <span>{errorCount}</span>
        </span>
      )}
      {warningCount > 0 && (
        <span className="inline-flex items-center gap-1 text-warning-400">
          <AlertTriangle className={iconSizes[size]} />
          <span>{warningCount}</span>
        </span>
      )}
    </span>
  );
}
