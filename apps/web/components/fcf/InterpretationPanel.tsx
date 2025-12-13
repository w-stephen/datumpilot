"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BookOpen,
  Calculator,
  Shield,
  X,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson } from "@/lib/fcf/schema";
import type { InterpretFcfResponse, InterpretFcfSuccess } from "@/lib/ai/types";
import { ValidationPanel } from "@/components/gdt/ValidationMessage";

const MAX_INTERPRETATIONS_PER_FCF = 3;

interface InterpretationPanelProps {
  fcf: Partial<FcfJson>;
  onClose?: () => void;
  className?: string;
}

/**
 * Generate a simple hash of FCF data to detect changes
 */
function getFcfHash(fcf: Partial<FcfJson>): string {
  return JSON.stringify({
    characteristic: fcf.characteristic,
    tolerance: fcf.tolerance,
    datums: fcf.datums,
    featureType: fcf.featureType,
    sourceUnit: fcf.sourceUnit,
  });
}

/**
 * Render explanation text with markdown-style formatting:
 * - **bold** for emphasis
 * - Lines starting with ## or ### for section headings
 * - Lines ending with : followed by content for inline headings
 */
function renderExplanationText(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    // Check for markdown headings (## or ###)
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match) {
      elements.push(
        <h3 key={lineIndex} className="font-bold text-[#111827] dark:text-slate-100 text-sm mt-4 mb-2 first:mt-0">
          {h2Match[1]}
        </h3>
      );
      return;
    }

    if (h3Match) {
      elements.push(
        <h4 key={lineIndex} className="font-bold text-[#374151] dark:text-slate-200 text-sm mt-3 mb-1">
          {h3Match[1]}
        </h4>
      );
      return;
    }

    // Check for inline headings (lines like "Summary:" or "Datums & Precedence:")
    const inlineHeadingMatch = line.match(/^([A-Z][A-Za-z\s&]+):(.*)$/);
    if (inlineHeadingMatch && inlineHeadingMatch[1].length < 30) {
      elements.push(
        <div key={lineIndex} className="mt-2 first:mt-0">
          <span className="font-bold text-[#111827] dark:text-slate-100">{inlineHeadingMatch[1]}:</span>
          <span>{renderInlineFormatting(inlineHeadingMatch[2])}</span>
        </div>
      );
      return;
    }

    // Regular line with **bold** formatting
    if (line.trim()) {
      elements.push(
        <p key={lineIndex} className="mt-1 first:mt-0">
          {renderInlineFormatting(line)}
        </p>
      );
    } else {
      elements.push(<br key={lineIndex} />);
    }
  });

  return elements;
}

/**
 * Render inline formatting (**bold**)
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold text-accent-500">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface CalculationDisplay {
  name: string;
  value: number;
  unit: string;
  description?: string;
  formula?: string;
}

// Technical sub-panel
function SubPanel({
  children,
  label,
  headerRight,
  defaultExpanded = true,
}: {
  children: React.ReactNode;
  label: string;
  headerRight?: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-[#E5E7EB] dark:border-slate-800 bg-[#F9FAFB] dark:bg-slate-900/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F3F4F6] dark:hover:bg-slate-800/30 transition-colors"
      >
        <span className="font-mono text-xs text-[#6B7280] dark:text-slate-500 tracking-widest">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {headerRight}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#6B7280] dark:text-slate-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] dark:text-slate-500" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-[#E5E7EB] dark:border-slate-800/50">
          {children}
        </div>
      )}
    </div>
  );
}

export default function InterpretationPanel({
  fcf,
  onClose,
  className,
}: InterpretationPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InterpretFcfSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasInterpreted, setHasInterpreted] = useState(false);
  const [interpretationCount, setInterpretationCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const previousFcfHash = useRef<string>("");

  // Reset interpretation count when FCF changes
  useEffect(() => {
    const currentHash = getFcfHash(fcf);
    if (previousFcfHash.current && previousFcfHash.current !== currentHash) {
      // FCF changed, reset count and clear previous results
      setInterpretationCount(0);
      setResult(null);
      setHasInterpreted(false);
      setError(null);
    }
    previousFcfHash.current = currentHash;
  }, [fcf]);

  const remainingInterpretations = MAX_INTERPRETATIONS_PER_FCF - interpretationCount;
  const canInterpret = remainingInterpretations > 0;

  const handleInterpret = useCallback(async () => {
    if (!canInterpret) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/fcf/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fcf }),
      });

      const data: InterpretFcfResponse = await response.json();

      if (data.status === "ok") {
        setResult(data);
        setHasInterpreted(true);
        setInterpretationCount((prev) => prev + 1);
      } else {
        setError(data.message || "Interpretation failed");
      }
    } catch (err) {
      setError("Failed to connect to interpretation service");
    } finally {
      setIsLoading(false);
    }
  }, [fcf, canInterpret]);

  /**
   * Copy interpretation as plain text to clipboard
   */
  const handleCopyInterpretation = useCallback(async () => {
    if (!result) return;

    const lines: string[] = [];

    // FCF Summary
    lines.push("=== FCF INTERPRETATION ===");
    lines.push("");

    // Validation status
    lines.push(`Validation: ${result.validation.valid ? "VALID" : "INVALID"}`);
    if (result.validation.issues.length > 0) {
      lines.push("Issues:");
      result.validation.issues.forEach((issue) => {
        lines.push(`  - [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    }
    lines.push("");

    // Calculations
    const calculations = getCalculationsForCopy();
    if (calculations.length > 0) {
      lines.push("Calculations:");
      calculations.forEach((calc) => {
        lines.push(`  ${calc.name}: ${calc.value.toFixed(3)} ${calc.unit}`);
        if (calc.description) {
          lines.push(`    (${calc.description})`);
        }
      });
      lines.push("");
    }

    // AI Explanation
    if (result.explanation?.explanation) {
      lines.push("AI Explanation:");
      // Strip markdown formatting for plain text
      const plainExplanation = result.explanation.explanation
        .replace(/\*\*/g, "")
        .replace(/^##\s+/gm, "")
        .replace(/^###\s+/gm, "");
      lines.push(plainExplanation);
      lines.push("");
    }

    // Warnings
    if (result.explanation?.warnings && result.explanation.warnings.length > 0) {
      lines.push("Notes:");
      result.explanation.warnings.forEach((warning) => {
        lines.push(`  - ${warning}`);
      });
    }

    lines.push("");
    lines.push(`Confidence: ${result.confidence.toUpperCase()}`);
    lines.push("Generated by DatumPilot");

    const textToCopy = lines.join("\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [result]);

  /**
   * Helper to get calculations for copy function
   */
  const getCalculationsForCopy = (): CalculationDisplay[] => {
    if (!result?.calcResult) return [];

    const { characteristic, result: calcRes } = result.calcResult;
    const calculations: CalculationDisplay[] = [];
    const unit = fcf.sourceUnit || "mm";

    if (characteristic === "position") {
      const posResult = calcRes as { statedTolerance: number; bonusTolerance?: number; virtualCondition?: number; totalAllowableTolerance?: number };
      calculations.push({ name: "Stated Tolerance", value: posResult.statedTolerance, unit });
      if (posResult.bonusTolerance && posResult.bonusTolerance > 0) {
        calculations.push({ name: "Bonus Tolerance", value: posResult.bonusTolerance, unit });
      }
      if (posResult.totalAllowableTolerance) {
        calculations.push({ name: "Total Allowable", value: posResult.totalAllowableTolerance, unit });
      }
      if (posResult.virtualCondition) {
        calculations.push({ name: "Virtual Condition", value: posResult.virtualCondition, unit });
      }
    } else if (characteristic === "flatness") {
      const flatResult = calcRes as { statedTolerance: number };
      calculations.push({ name: "Tolerance Zone", value: flatResult.statedTolerance, unit });
    } else if (characteristic === "perpendicularity") {
      const perpResult = calcRes as { statedTolerance: number; bonusTolerance?: number };
      calculations.push({ name: "Tolerance Zone", value: perpResult.statedTolerance, unit });
      if (perpResult.bonusTolerance && perpResult.bonusTolerance > 0) {
        calculations.push({ name: "Bonus Tolerance", value: perpResult.bonusTolerance, unit });
      }
    }

    return calculations;
  };

  // Parse calculation results for display
  const getCalculations = (): CalculationDisplay[] => {
    if (!result?.calcResult) return [];

    const { characteristic, result: calcRes } = result.calcResult;
    const calculations: CalculationDisplay[] = [];
    const unit = fcf.sourceUnit || "mm";

    if (characteristic === "position") {
      const posResult = calcRes as { statedTolerance: number; bonusTolerance?: number; virtualCondition?: number; totalAllowableTolerance?: number };
      calculations.push({
        name: "Stated Tolerance",
        value: posResult.statedTolerance,
        unit,
        description: "Base position tolerance",
      });
      if (posResult.bonusTolerance && posResult.bonusTolerance > 0) {
        calculations.push({
          name: "Bonus Tolerance",
          value: posResult.bonusTolerance,
          unit,
          description: "Additional tolerance from MMC departure",
        });
      }
      if (posResult.totalAllowableTolerance) {
        calculations.push({
          name: "Total Allowable",
          value: posResult.totalAllowableTolerance,
          unit,
          description: "Stated + bonus tolerance",
        });
      }
      if (posResult.virtualCondition) {
        calculations.push({
          name: "Virtual Condition",
          value: posResult.virtualCondition,
          unit,
          description: "Worst-case boundary",
        });
      }
    } else if (characteristic === "flatness") {
      const flatResult = calcRes as { statedTolerance: number; measuredFlatness?: number };
      calculations.push({
        name: "Tolerance Zone",
        value: flatResult.statedTolerance,
        unit,
        description: "Distance between parallel planes",
      });
    } else if (characteristic === "perpendicularity") {
      const perpResult = calcRes as { statedTolerance: number; bonusTolerance?: number; totalAllowableTolerance?: number };
      calculations.push({
        name: "Tolerance Zone",
        value: perpResult.statedTolerance,
        unit,
        description: "Cylindrical zone perpendicular to datum",
      });
      if (perpResult.bonusTolerance && perpResult.bonusTolerance > 0) {
        calculations.push({
          name: "Bonus Tolerance",
          value: perpResult.bonusTolerance,
          unit,
          description: "Additional tolerance from MMC departure",
        });
      }
    }

    return calculations;
  };

  const calculations = getCalculations();

  return (
    <div
      className={cn(
        "relative bg-white dark:bg-slate-900/60 border border-[#E5E7EB] dark:border-slate-800",
        className
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#D1D5DB] dark:border-accent-500/50" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#D1D5DB] dark:border-accent-500/50" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#D1D5DB] dark:border-accent-500/50" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#D1D5DB] dark:border-accent-500/50" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent-500" />
          <span className="font-mono text-sm text-[#374151] dark:text-slate-300 tracking-wide">
            FCF INTERPRETATION
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <>
              <span
                className={cn(
                  "font-mono text-xs px-2 py-0.5 border",
                  result.confidence === "high"
                    ? "text-accent-500 border-accent-500/30 bg-accent-500/10"
                    : result.confidence === "medium"
                    ? "text-warning-500 border-warning-500/30 bg-warning-500/10"
                    : "text-error-500 border-error-500/30 bg-error-500/10"
                )}
              >
                {result.confidence.toUpperCase()} CONFIDENCE
              </span>
              <button
                onClick={handleCopyInterpretation}
                className="p-1.5 border border-[#E5E7EB] dark:border-slate-700 hover:bg-[#F3F4F6] dark:hover:bg-slate-800 transition-colors"
                title="Copy interpretation to clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-accent-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#6B7280] dark:text-slate-500" />
                )}
              </button>
            </>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 text-[#6B7280] dark:text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[600px] overflow-auto scrollbar-hide">
        {/* Initial state - show interpret button */}
        {!hasInterpreted && !isLoading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 border border-[#E5E7EB] dark:border-slate-800 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent-500" />
            </div>
            <h3 className="font-mono text-sm text-[#374151] dark:text-slate-300 mb-2">
              READY TO INTERPRET
            </h3>
            <p className="font-mono text-sm text-[#6B7280] dark:text-slate-500 max-w-xs mx-auto mb-6">
              Get AI-powered validation, calculations, and detailed explanations for this FCF.
            </p>
            <button
              onClick={handleInterpret}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-slate-950 font-mono text-xs font-semibold hover:bg-accent-400 transition-colors"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              <Sparkles className="w-4 h-4" />
              INTERPRET FCF
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 border border-[#E5E7EB] dark:border-slate-800 mx-auto mb-4 flex items-center justify-center relative">
              <div className="absolute inset-2 border border-accent-500/30 animate-pulse" />
              <RefreshCw className="w-6 h-6 text-accent-500 animate-spin" />
            </div>
            <h3 className="font-mono text-sm text-[#374151] dark:text-slate-300 mb-2">
              ANALYZING FCF
            </h3>
            <p className="font-mono text-sm text-[#6B7280] dark:text-slate-500">
              Running validation, calculations, and AI analysis...
            </p>
            <div className="flex items-center justify-center gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-accent-500 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 bg-error-500/10 border border-error-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-error-500" />
              <span className="font-mono text-sm text-error-500 font-semibold">
                INTERPRETATION FAILED
              </span>
            </div>
            <p className="font-mono text-sm text-error-400">{error}</p>
            <button
              onClick={handleInterpret}
              className="mt-3 flex items-center gap-2 px-3 py-2 border border-error-500/30 text-error-500 font-mono text-xs hover:bg-error-500/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              RETRY
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Validation */}
            <SubPanel
              label="VALIDATION"
              headerRight={
                <div className="flex items-center gap-1.5">
                  {result.validation.valid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-500" />
                      <span className="font-mono text-xs text-accent-500">
                        VALID
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-error-500" />
                      <span className="font-mono text-xs text-error-500">
                        {result.validation.summary.errorCount} ERROR
                        {result.validation.summary.errorCount !== 1 ? "S" : ""}
                      </span>
                    </>
                  )}
                </div>
              }
            >
              <div className="p-3">
                {result.validation.issues.length > 0 ? (
                  <ValidationPanel
                    issues={result.validation.issues}
                    defaultExpanded
                  />
                ) : (
                  <div className="flex items-center gap-2 text-accent-500">
                    <Shield className="w-4 h-4" />
                    <span className="font-mono text-sm">
                      ASME Y14.5-2018 compliant
                    </span>
                  </div>
                )}
              </div>
            </SubPanel>

            {/* Calculations */}
            {calculations.length > 0 && (
              <SubPanel
                label="CALCULATIONS"
                headerRight={
                  <Calculator className="w-3.5 h-3.5 text-[#6B7280] dark:text-slate-500" />
                }
              >
                <div className="p-3 space-y-2">
                  {calculations.map((calc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-950/50 border border-[#E5E7EB] dark:border-slate-800"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#9CA3AF] dark:text-slate-400">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono text-sm text-[#374151] dark:text-slate-200">
                            {calc.name.toUpperCase()}
                          </span>
                        </div>
                        {calc.description && (
                          <p className="font-mono text-xs text-[#6B7280] dark:text-slate-500 mt-1 ml-6">
                            {calc.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-base font-bold text-accent-500">
                          {calc.value.toFixed(3)}
                        </span>
                        <span className="font-mono text-xs text-[#6B7280] dark:text-slate-500 ml-1">
                          {calc.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </SubPanel>
            )}

            {/* AI Explanation */}
            {result.explanation && (
              <SubPanel
                label="AI EXPLANATION"
                headerRight={
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="font-mono text-xs text-[#6B7280] dark:text-slate-500">
                      CLAUDE
                    </span>
                  </div>
                }
              >
                <div className="p-4">
                  <div className="text-sm text-[#374151] dark:text-slate-300 leading-relaxed font-mono">
                    {renderExplanationText(result.explanation.explanation)}
                  </div>
                  {result.explanation.warnings &&
                    result.explanation.warnings.length > 0 && (
                      <div className="mt-4 p-3 bg-warning-500/10 border border-warning-500/20">
                        <span className="font-mono text-xs text-warning-500 tracking-widest">
                          NOTES
                        </span>
                        <ul className="mt-2 space-y-1">
                          {result.explanation.warnings.map((warning, i) => (
                            <li
                              key={i}
                              className="font-mono text-sm text-warning-500"
                            >
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </SubPanel>
            )}

            {/* Re-interpret button */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={handleInterpret}
                disabled={!canInterpret}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border font-mono text-xs transition-colors",
                  canInterpret
                    ? "border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-400 hover:border-[#D1D5DB] dark:hover:border-slate-600 hover:text-[#374151] dark:hover:text-slate-300"
                    : "border-[#E5E7EB] dark:border-slate-800 text-[#9CA3AF] dark:text-slate-600 cursor-not-allowed opacity-50"
                )}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                RE-INTERPRET
              </button>
              <span className="font-mono text-xs text-[#9CA3AF] dark:text-slate-500">
                {canInterpret
                  ? `${remainingInterpretations} interpretation${remainingInterpretations !== 1 ? "s" : ""} remaining`
                  : "Limit reached • modify FCF to reset"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
