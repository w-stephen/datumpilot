"use client";

import { useState, useCallback } from "react";
import {
  FileJson,
  Upload,
  Play,
  Copy,
  Check,
  AlertCircle,
  Calculator,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson } from "@/lib/fcf/schema";
import FcfPreview from "@/components/fcf/FcfPreview";
import { ValidationPanel } from "@/components/gdt/ValidationMessage";
import { CharacteristicIcon } from "@/components/gdt/CharacteristicIcon";
import { DatumList } from "@/components/gdt/DatumBadge";
import ToleranceDisplay from "@/components/gdt/ToleranceDisplay";
import type { ValidationResult } from "@/lib/rules/validateFcf";

// Sample FCF for demo
const sampleFcf: FcfJson = {
  name: "Position - Mounting Hole",
  characteristic: "position",
  featureType: "hole",
  tolerance: {
    value: 0.25,
    diameter: true,
    materialCondition: "MMC",
  },
  datums: [
    { id: "A" },
    { id: "B" },
    { id: "C" },
  ],
  sourceUnit: "mm",
  source: { inputType: "builder" },
};

interface CalculationResult {
  name: string;
  value: number;
  unit: string;
  description: string;
  formula?: string;
}

// Technical panel wrapper
function TechnicalPanel({
  children,
  label,
  className,
  headerRight,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className={cn("relative bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800", className)}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 dark:border-slate-700" />

      {(label || headerRight) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50">
          {label && (
            <span className="font-mono text-[10px] text-slate-500 tracking-widest">{label}</span>
          )}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

export default function InterpreterPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [fcf, setFcf] = useState<FcfJson | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  // Parse JSON input
  const handleParse = useCallback(() => {
    setParseError(null);
    setValidationResult(null);
    setCalculations([]);
    setAiExplanation(null);

    try {
      const parsed = JSON.parse(jsonInput);
      setFcf(parsed as FcfJson);
    } catch {
      setParseError("Invalid JSON format. Please check your input.");
      setFcf(null);
    }
  }, [jsonInput]);

  // Load sample FCF
  const handleLoadSample = useCallback(() => {
    setJsonInput(JSON.stringify(sampleFcf, null, 2));
    setFcf(sampleFcf);
    setParseError(null);
    setValidationResult(null);
    setCalculations([]);
    setAiExplanation(null);
  }, []);

  // Run interpretation (validation + calculations + AI explanation)
  const handleInterpret = useCallback(async () => {
    if (!fcf) return;

    setIsProcessing(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock validation result
    const mockValidation: ValidationResult = {
      valid: true,
      issues: [],
      errors: [],
      warnings: [
        {
          code: "W001" as any,
          message: "RFS is implicit in ASME Y14.5-2018",
          path: "datums[0].materialCondition",
          severity: "warning",
          context: {
            suggestion: "RFS is the default; explicit notation is redundant",
          },
        },
      ],
      summary: {
        errorCount: 0,
        warningCount: 1,
      },
    };
    setValidationResult(mockValidation);

    // Mock calculation results based on characteristic
    const mockCalculations: CalculationResult[] = [];

    if (fcf.characteristic === "position") {
      mockCalculations.push(
        {
          name: "Tolerance Zone",
          value: fcf.tolerance.value,
          unit: fcf.sourceUnit,
          description: "Cylindrical tolerance zone diameter",
          formula: fcf.tolerance.diameter ? "Diametral zone" : "Linear zone",
        },
        {
          name: "Bonus Tolerance (MMC)",
          value: 0.05,
          unit: fcf.sourceUnit,
          description: "Additional tolerance when feature departs from MMC",
          formula: "Actual Size - MMC Size",
        },
        {
          name: "Virtual Condition",
          value: 9.75,
          unit: fcf.sourceUnit,
          description: "MMC size minus position tolerance",
          formula: "MMC (10.0) - Tolerance (0.25)",
        },
        {
          name: "Available Tolerance",
          value: 0.30,
          unit: fcf.sourceUnit,
          description: "Total tolerance including bonus",
          formula: "Base (0.25) + Bonus (0.05)",
        }
      );
    } else if (fcf.characteristic === "flatness") {
      mockCalculations.push(
        {
          name: "Tolerance Zone",
          value: fcf.tolerance.value,
          unit: fcf.sourceUnit,
          description: "Distance between two parallel planes",
        },
        {
          name: "Peak-to-Valley",
          value: fcf.tolerance.value,
          unit: fcf.sourceUnit,
          description: "Maximum allowed surface deviation",
        }
      );
    } else if (fcf.characteristic === "perpendicularity") {
      mockCalculations.push(
        {
          name: "Tolerance Zone",
          value: fcf.tolerance.value,
          unit: fcf.sourceUnit,
          description: "Cylindrical zone perpendicular to datum",
        },
        {
          name: "Angular Equivalent",
          value: 0.014,
          unit: "degrees",
          description: "Approximate angular deviation",
          formula: "atan(tolerance / feature_length)",
        }
      );
    }

    setCalculations(mockCalculations);

    // Mock AI explanation
    const explanations: Record<string, string> = {
      position: `This Feature Control Frame specifies a **Position tolerance** of ${fcf.tolerance.value}${fcf.sourceUnit} at MMC for a hole feature.

**Key Points:**
- The tolerance zone is cylindrical (indicated by the diameter symbol)
- MMC modifier allows bonus tolerance as the hole departs from its maximum material condition
- The datum reference frame (A, B, C) establishes the coordinate system for locating the hole

**Practical Interpretation:**
When inspecting, the hole's axis must fall within a cylinder of ${fcf.tolerance.value}${fcf.sourceUnit} diameter when the hole is at MMC. As the actual hole size increases from MMC, additional position tolerance becomes available.`,

      flatness: `This Feature Control Frame specifies a **Flatness tolerance** of ${fcf.tolerance.value}${fcf.sourceUnit}.

**Key Points:**
- Flatness is a form tolerance - it controls only the shape of the surface
- No datum references allowed (form tolerances are self-referencing)
- The surface must lie between two parallel planes ${fcf.tolerance.value}${fcf.sourceUnit} apart

**Practical Interpretation:**
The entire surface must fit between two parallel planes separated by ${fcf.tolerance.value}${fcf.sourceUnit}. This tolerance controls only flatness, not the surface's orientation or location relative to other features.`,

      perpendicularity: `This Feature Control Frame specifies a **Perpendicularity tolerance** of ${fcf.tolerance.value}${fcf.sourceUnit} to datum ${fcf.datums?.[0]?.id || "A"}.

**Key Points:**
- Perpendicularity is an orientation tolerance
- The tolerance zone is perpendicular to the referenced datum
- The feature axis must lie within this zone

**Practical Interpretation:**
The axis of the controlled feature must fall within a cylindrical tolerance zone of ${fcf.tolerance.value}${fcf.sourceUnit} diameter that is perfectly perpendicular to datum ${fcf.datums?.[0]?.id || "A"}.`,
    };

    setAiExplanation(
      explanations[fcf.characteristic] || "Interpretation not available for this characteristic type."
    );

    setIsProcessing(false);
  }, [fcf]);

  // Copy JSON
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [jsonInput]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">INTERPRET.FCF</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            FCF INTERPRETER
          </h1>
          <p className="text-slate-500 mt-1 font-mono text-sm">
            Parse, validate, and calculate with AI-powered explanations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 font-mono text-xs transition-colors"
          >
            <FileJson className="w-3.5 h-3.5" />
            LOAD SAMPLE
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 py-3 px-4 bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          {fcf ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-accent-500" />
              <span className="font-mono text-xs text-accent-500">PARSED</span>
            </>
          ) : (
            <>
              <Info className="w-4 h-4 text-slate-600" />
              <span className="font-mono text-xs text-slate-600">AWAITING INPUT</span>
            </>
          )}
        </div>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
        <span className="font-mono text-[10px] text-slate-500">
          REF: ASME Y14.5-2018
        </span>
        {fcf?.characteristic && (
          <>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
              CHAR: {fcf.characteristic.toUpperCase()}
            </span>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden pt-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="flex flex-col gap-6 overflow-auto scrollbar-hide">
            {/* JSON Input */}
            <TechnicalPanel
              label="INPUT.JSON"
              headerRight={
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-slate-800 transition-colors"
                  title="Copy"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-accent-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              }
            >
              <div className="p-4">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`// Paste FCF JSON here or click "LOAD SAMPLE"

{
  "characteristic": "position",
  "tolerance": { "value": 0.25, "diameter": true },
  "datums": [{ "id": "A" }],
  ...
}`}
                  className="w-full h-[250px] bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 font-mono text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-accent-500/50 focus:border-accent-500/50"
                  spellCheck={false}
                />

                {/* Parse error */}
                {parseError && (
                  <div className="flex items-center gap-2 mt-4 p-3 bg-error-500/10 border border-error-500/30">
                    <AlertCircle className="w-4 h-4 text-error-500" />
                    <span className="font-mono text-xs text-error-400">{parseError}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={handleParse}
                    disabled={!jsonInput.trim()}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all",
                      jsonInput.trim()
                        ? "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100"
                        : "border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    )}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    PARSE
                  </button>
                  <button
                    onClick={handleInterpret}
                    disabled={!fcf || isProcessing}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold transition-all",
                      fcf && !isProcessing
                        ? "bg-accent-500 text-slate-950 hover:bg-accent-400"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    )}
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                    }}
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    {isProcessing ? "PROCESSING..." : "INTERPRET"}
                  </button>
                </div>
              </div>
            </TechnicalPanel>

            {/* Parsed FCF Preview */}
            {fcf && (
              <TechnicalPanel label="PARSED.PREVIEW">
                <div className="p-4 space-y-4">
                  {/* Visual preview */}
                  <div className="p-6 bg-slate-950/50 flex items-center justify-center relative">
                    {/* Grid background */}
                    <div
                      className="absolute inset-0 opacity-[0.03]"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, #00D4AA 1px, transparent 1px),
                          linear-gradient(to bottom, #00D4AA 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px',
                      }}
                    />
                    <FcfPreview fcf={fcf} scale={1.5} />
                  </div>

                  {/* FCF details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900/50 border border-slate-800">
                      <span className="font-mono text-[10px] text-slate-600 tracking-widest">CHARACTERISTIC</span>
                      <div className="mt-2 flex items-center gap-2">
                        <CharacteristicIcon
                          characteristic={fcf.characteristic}
                          size="sm"
                        />
                        <span className="font-mono text-xs text-slate-300 uppercase">
                          {fcf.characteristic}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900/50 border border-slate-800">
                      <span className="font-mono text-[10px] text-slate-600 tracking-widest">FEATURE</span>
                      <div className="mt-2">
                        <span className="font-mono text-xs text-slate-300 uppercase">
                          {fcf.featureType || "NOT SPECIFIED"}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900/50 border border-slate-800">
                      <span className="font-mono text-[10px] text-slate-600 tracking-widest">TOLERANCE</span>
                      <div className="mt-2">
                        <ToleranceDisplay
                          tolerance={fcf.tolerance}
                          sourceUnit={fcf.sourceUnit}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900/50 border border-slate-800">
                      <span className="font-mono text-[10px] text-slate-600 tracking-widest">DATUMS</span>
                      <div className="mt-2">
                        {fcf.datums && fcf.datums.length > 0 ? (
                          <DatumList datums={fcf.datums} size="sm" />
                        ) : (
                          <span className="font-mono text-xs text-slate-500">NONE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TechnicalPanel>
            )}
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-6 overflow-auto scrollbar-hide">
            {/* Validation Results */}
            {validationResult && (
              <TechnicalPanel
                label="VALIDATION.RESULT"
                headerRight={
                  <div className="flex items-center gap-2">
                    {validationResult.valid ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-500" />
                        <span className="font-mono text-[10px] text-accent-500">VALID</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-error-500" />
                        <span className="font-mono text-[10px] text-error-500">INVALID</span>
                      </>
                    )}
                  </div>
                }
              >
                <div className="p-4">
                  <ValidationPanel
                    issues={validationResult.issues}
                    defaultExpanded
                  />
                </div>
              </TechnicalPanel>
            )}

            {/* Calculations */}
            {calculations.length > 0 && (
              <TechnicalPanel
                label="CALC.OUTPUT"
                headerRight={
                  <button
                    onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                    className="font-mono text-[10px] text-slate-500 hover:text-accent-500 transition-colors flex items-center gap-1"
                  >
                    {showCalculationDetails ? "COLLAPSE" : "EXPAND"}
                    {showCalculationDetails ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                }
              >
                <div className="p-4 space-y-2">
                  {calculations.map((calc, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-slate-950/50 border border-slate-800"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-600">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="font-mono text-xs text-slate-200">
                            {calc.name.toUpperCase()}
                          </span>
                        </div>
                        {showCalculationDetails && (
                          <>
                            {calc.formula && (
                              <span className="font-mono text-[10px] text-slate-500 mt-1 block ml-6">
                                {calc.formula}
                              </span>
                            )}
                            <p className="font-mono text-[10px] text-slate-600 mt-1 ml-6">
                              {calc.description}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-accent-400">
                          {calc.value.toFixed(3)}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 ml-1">
                          {calc.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </TechnicalPanel>
            )}

            {/* AI Explanation */}
            {aiExplanation && (
              <TechnicalPanel
                label="AI.EXPLANATION"
                headerRight={
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-mono text-[10px] text-slate-500">GPT-5.1</span>
                  </div>
                }
              >
                <div className="p-4">
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                    {aiExplanation.split("**").map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className="text-accent-400">
                          {part}
                        </strong>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </div>
                </div>
              </TechnicalPanel>
            )}

            {/* Empty state */}
            {!validationResult && !calculations.length && !aiExplanation && (
              <TechnicalPanel label="OUTPUT.PENDING" className="flex-1">
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border border-slate-800 mx-auto mb-4 flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-slate-700" />
                    </div>
                    <h3 className="font-mono text-sm text-slate-500 mb-2">
                      AWAITING INPUT
                    </h3>
                    <p className="font-mono text-xs text-slate-600 max-w-xs">
                      Paste FCF JSON and click{" "}
                      <span className="text-accent-500">INTERPRET</span> to see
                      validation, calculations, and AI explanations.
                    </p>
                  </div>
                </div>
              </TechnicalPanel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
