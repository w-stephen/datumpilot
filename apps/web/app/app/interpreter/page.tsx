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
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-mono font-bold text-slate-50 tracking-tight">
            FCF Interpreter
          </h1>
          <p className="text-slate-400 mt-1">
            Paste or load FCF JSON for validation, calculation, and AI-powered explanation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            className="btn-secondary text-sm"
          >
            <FileJson className="w-4 h-4" />
            Load Sample
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden pt-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="flex flex-col gap-4 overflow-auto">
            {/* JSON Input */}
            <div className="panel flex-1">
              <div className="panel-header">
                <h3 className="panel-title">JSON Input</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-slate-700 transition-colors"
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="relative flex-1">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`Paste FCF JSON here or click "Load Sample" to see an example...

{
  "characteristic": "position",
  "tolerance": { "value": 0.25, "diameter": true },
  "datums": [{ "id": "A" }],
  ...
}`}
                  className="w-full h-[300px] bg-slate-950/50 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  spellCheck={false}
                />
              </div>

              {/* Parse error */}
              {parseError && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-error-500/10 border border-error-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-error-400" />
                  <span className="text-sm text-error-400">{parseError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleParse}
                  disabled={!jsonInput.trim()}
                  className="btn-secondary"
                >
                  <Upload className="w-4 h-4" />
                  Parse JSON
                </button>
                <button
                  onClick={handleInterpret}
                  disabled={!fcf || isProcessing}
                  className="btn-primary"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isProcessing ? "Processing..." : "Interpret"}
                </button>
              </div>
            </div>

            {/* Parsed FCF Preview */}
            {fcf && (
              <div className="panel">
                <div className="panel-header">
                  <h3 className="panel-title">Parsed FCF</h3>
                </div>
                <div className="space-y-4">
                  {/* Visual preview */}
                  <div className="p-6 bg-slate-950/50 rounded-lg flex items-center justify-center">
                    <FcfPreview fcf={fcf} scale={1.5} />
                  </div>

                  {/* FCF details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Characteristic:</span>
                      <CharacteristicIcon
                        characteristic={fcf.characteristic}
                        size="sm"
                        showLabel
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Feature:</span>
                      <span className="text-slate-300 capitalize">
                        {fcf.featureType || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Tolerance:</span>
                      <ToleranceDisplay
                        tolerance={fcf.tolerance}
                        sourceUnit={fcf.sourceUnit}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Datums:</span>
                      {fcf.datums && fcf.datums.length > 0 ? (
                        <DatumList datums={fcf.datums} size="sm" />
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-4 overflow-auto scrollbar-hide">
            {/* Validation Results */}
            {validationResult && (
              <ValidationPanel
                issues={validationResult.issues}
                title="Validation Results"
                defaultExpanded
              />
            )}

            {/* Calculations */}
            {calculations.length > 0 && (
              <div className="panel">
                <div className="panel-header">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-accent-500" />
                    <h3 className="panel-title">Calculations</h3>
                  </div>
                  <button
                    onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                    className="text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    {showCalculationDetails ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Details
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-3">
                  {calculations.map((calc, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {calc.name}
                          </span>
                          {showCalculationDetails && calc.formula && (
                            <span className="text-xs text-slate-500 font-mono">
                              ({calc.formula})
                            </span>
                          )}
                        </div>
                        {showCalculationDetails && (
                          <p className="text-xs text-slate-500 mt-1">
                            {calc.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-accent-400">
                          {calc.value.toFixed(3)}
                        </span>
                        <span className="text-sm text-slate-500 ml-1">
                          {calc.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            {aiExplanation && (
              <div className="panel">
                <div className="panel-header">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="panel-title">AI Explanation</h3>
                  </div>
                  <span className="text-xs text-slate-500">GPT-5.1</span>
                </div>
                <div className="prose prose-sm prose-invert max-w-none">
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {aiExplanation.split("**").map((part, i) =>
                      i % 2 === 1 ? (
                        <strong key={i} className="text-slate-100">
                          {part}
                        </strong>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!validationResult && !calculations.length && !aiExplanation && (
              <div className="panel flex-1 flex items-center justify-center">
                <div className="text-center py-12">
                  <Info className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-400 mb-2">
                    No Results Yet
                  </h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Paste FCF JSON in the input panel and click{" "}
                    <span className="text-primary-400">Interpret</span> to see
                    validation results, calculations, and AI-powered explanations.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
