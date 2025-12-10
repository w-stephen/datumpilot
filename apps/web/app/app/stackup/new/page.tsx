"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  Layers,
  Target,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { TechnicalPanel } from "@/components/ui/TechnicalPanel";
import { StackupDimensionTable } from "@/components/stackup";
import { createStackupAnalysis } from "../actions";
import type {
  StackupDimension,
  AnalysisMethod,
  StackupUnit,
  PositiveDirection,
  AcceptanceCriteria,
  CreateStackupInput,
} from "@/lib/stackup";

type WizardStep = "basics" | "dimensions" | "criteria" | "review";

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: "basics", label: "Basics", icon: Settings },
  { id: "dimensions", label: "Dimensions", icon: Layers },
  { id: "criteria", label: "Criteria", icon: Target },
  { id: "review", label: "Review", icon: Calculator },
];

const METHOD_OPTIONS: { value: AnalysisMethod; label: string; description: string }[] = [
  {
    value: "worst-case",
    label: "Worst Case",
    description: "All tolerances at maximum limits (most conservative)",
  },
  {
    value: "rss",
    label: "RSS",
    description: "Root Sum Square statistical method",
  },
  {
    value: "six-sigma",
    label: "Six Sigma",
    description: "Statistical with process capability weighting",
  },
];

const DIRECTION_OPTIONS: { value: PositiveDirection; label: string }[] = [
  { value: "left-to-right", label: "Left → Right" },
  { value: "right-to-left", label: "Right → Left" },
  { value: "bottom-to-top", label: "Bottom → Top" },
  { value: "top-to-bottom", label: "Top → Bottom" },
];

export default function NewStackupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>("basics");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [measurementObjective, setMeasurementObjective] = useState("");
  const [analysisMethod, setAnalysisMethod] = useState<AnalysisMethod>("worst-case");
  const [unit, setUnit] = useState<StackupUnit>("mm");
  const [positiveDirection, setPositiveDirection] =
    useState<PositiveDirection>("left-to-right");
  const [dimensions, setDimensions] = useState<StackupDimension[]>([
    {
      id: crypto.randomUUID(),
      name: "Dimension 1",
      nominal: 0,
      tolerancePlus: 0,
      toleranceMinus: 0,
      sign: "positive",
      sensitivityCoefficient: 1,
    },
    {
      id: crypto.randomUUID(),
      name: "Dimension 2",
      nominal: 0,
      tolerancePlus: 0,
      toleranceMinus: 0,
      sign: "negative",
      sensitivityCoefficient: 1,
    },
  ]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriteria>({
    minimum: 0,
  });

  // Step navigation
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < STEPS.length - 1;

  const goToStep = (step: WizardStep) => setCurrentStep(step);
  const goBack = () => canGoBack && setCurrentStep(STEPS[currentStepIndex - 1].id);
  const goForward = () => canGoForward && setCurrentStep(STEPS[currentStepIndex + 1].id);

  // Validation per step
  const isStepValid = (step: WizardStep): boolean => {
    switch (step) {
      case "basics":
        return name.trim().length > 0 && measurementObjective.trim().length > 0;
      case "dimensions":
        return dimensions.length >= 2;
      case "criteria":
        return (
          acceptanceCriteria.minimum !== undefined ||
          acceptanceCriteria.maximum !== undefined
        );
      case "review":
        return isStepValid("basics") && isStepValid("dimensions") && isStepValid("criteria");
      default:
        return false;
    }
  };

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!isStepValid("review")) return;

    setIsSubmitting(true);
    try {
      const input: CreateStackupInput = {
        projectId: "proj-001", // TODO: Get from context/params
        name,
        description: description || undefined,
        measurementObjective,
        acceptanceCriteria,
        positiveDirection,
        dimensions,
        analysisMethod,
        unit,
      };

      const analysis = await createStackupAnalysis(input);
      router.push(`/app/stackup/${analysis.id}`);
    } catch (error) {
      console.error("Failed to create analysis:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name,
    description,
    measurementObjective,
    acceptanceCriteria,
    positiveDirection,
    dimensions,
    analysisMethod,
    unit,
    router,
  ]);

  const decimals = unit === "mm" ? 3 : 4;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <Link
            href="/app/stackup"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-xs">BACK TO ANALYSES</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">
              NEW.ANALYSIS
            </span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            CREATE STACK-UP
          </h1>
        </div>
      </div>

      {/* Step Progress */}
      <div className="py-4 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isComplete = index < currentStepIndex;
            const isValid = isStepValid(step.id);

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded transition-colors",
                    isActive
                      ? "bg-accent-500/20 text-accent-400"
                      : isComplete && isValid
                        ? "bg-slate-800 text-accent-400"
                        : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center border",
                      isActive
                        ? "border-accent-500 bg-accent-500/20"
                        : isComplete && isValid
                          ? "border-accent-500 bg-accent-500"
                          : "border-slate-700"
                    )}
                  >
                    {isComplete && isValid ? (
                      <Check className="w-3.5 h-3.5 text-slate-900" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="font-mono text-xs uppercase">{step.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-px mx-2",
                      index < currentStepIndex ? "bg-accent-500" : "bg-slate-700"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-auto py-6">
        {currentStep === "basics" && (
          <TechnicalPanel label="BASICS" className="max-w-2xl mx-auto p-6">
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Analysis Name <span className="text-error-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none"
                  placeholder="e.g., Bearing Housing Clearance"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none resize-none"
                  placeholder="Optional description..."
                />
              </div>

              {/* Measurement Objective */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Measurement Objective <span className="text-error-400">*</span>
                </label>
                <input
                  type="text"
                  value={measurementObjective}
                  onChange={(e) => setMeasurementObjective(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none"
                  placeholder="e.g., Gap between bearing OD and housing bore"
                />
              </div>

              {/* Method & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Analysis Method
                  </label>
                  <div className="space-y-2">
                    {METHOD_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAnalysisMethod(option.value)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded border transition-colors",
                          analysisMethod === option.value
                            ? "bg-accent-500/20 border-accent-500 text-accent-400"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                        )}
                      >
                        <span className="font-mono text-sm font-semibold block">
                          {option.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {option.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Unit */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Unit System
                    </label>
                    <div className="flex gap-2">
                      {(["mm", "inch"] as StackupUnit[]).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnit(u)}
                          className={cn(
                            "flex-1 px-3 py-2 rounded border font-mono text-sm transition-colors",
                            unit === u
                              ? "bg-accent-500/20 border-accent-500 text-accent-400"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                          )}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direction */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Positive Direction
                    </label>
                    <select
                      value={positiveDirection}
                      onChange={(e) =>
                        setPositiveDirection(e.target.value as PositiveDirection)
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none"
                    >
                      {DIRECTION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </TechnicalPanel>
        )}

        {currentStep === "dimensions" && (
          <TechnicalPanel label="DIMENSIONS" className="max-w-4xl mx-auto p-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Add dimensions to your stack-up. Use{" "}
                <span className="text-accent-400 font-mono">+</span> for dimensions that
                increase the closing gap and{" "}
                <span className="text-error-400 font-mono">−</span> for dimensions that
                decrease it.
              </p>
              <StackupDimensionTable
                dimensions={dimensions}
                onChange={setDimensions}
                unit={unit}
              />
            </div>
          </TechnicalPanel>
        )}

        {currentStep === "criteria" && (
          <TechnicalPanel label="ACCEPTANCE CRITERIA" className="max-w-2xl mx-auto p-6">
            <div className="space-y-6">
              <p className="text-sm text-slate-500">
                Define pass/fail limits for your stack-up result. At least one limit is
                required.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {/* Minimum */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Minimum Limit ({unit})
                  </label>
                  <input
                    type="number"
                    value={acceptanceCriteria.minimum ?? ""}
                    onChange={(e) =>
                      setAcceptanceCriteria((prev) => ({
                        ...prev,
                        minimum: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    step={unit === "mm" ? 0.001 : 0.0001}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none"
                    placeholder="e.g., 0"
                  />
                  <p className="text-[10px] text-slate-600">
                    Result must be ≥ this value
                  </p>
                </div>

                {/* Maximum */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Maximum Limit ({unit})
                  </label>
                  <input
                    type="number"
                    value={acceptanceCriteria.maximum ?? ""}
                    onChange={(e) =>
                      setAcceptanceCriteria((prev) => ({
                        ...prev,
                        maximum: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    step={unit === "mm" ? 0.001 : 0.0001}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-300 focus:border-accent-500 outline-none"
                    placeholder="e.g., 0.05"
                  />
                  <p className="text-[10px] text-slate-600">
                    Result must be ≤ this value
                  </p>
                </div>
              </div>
            </div>
          </TechnicalPanel>
        )}

        {currentStep === "review" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <TechnicalPanel label="REVIEW" className="p-6">
              <div className="space-y-6">
                {/* Summary */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Name
                    </label>
                    <p className="font-mono text-sm text-slate-300">{name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Objective
                    </label>
                    <p className="font-mono text-sm text-slate-300">
                      {measurementObjective}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Method
                      </label>
                      <p className="font-mono text-sm text-accent-400 uppercase">
                        {analysisMethod}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Unit
                      </label>
                      <p className="font-mono text-sm text-slate-300">{unit}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Dimensions
                      </label>
                      <p className="font-mono text-sm text-slate-300">
                        {dimensions.length}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Acceptance Criteria
                    </label>
                    <p className="font-mono text-sm text-slate-300">
                      {acceptanceCriteria.minimum !== undefined &&
                        `Min: ${acceptanceCriteria.minimum.toFixed(decimals)} ${unit}`}
                      {acceptanceCriteria.minimum !== undefined &&
                        acceptanceCriteria.maximum !== undefined &&
                        " | "}
                      {acceptanceCriteria.maximum !== undefined &&
                        `Max: ${acceptanceCriteria.maximum.toFixed(decimals)} ${unit}`}
                    </p>
                  </div>
                </div>

                {/* Dimension list */}
                <div className="border-t border-slate-800 pt-4">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-3">
                    Dimensions
                  </label>
                  <div className="space-y-2">
                    {dimensions.map((dim, i) => (
                      <div
                        key={dim.id}
                        className="flex items-center justify-between py-2 px-3 bg-slate-900/50 rounded"
                      >
                        <span className="font-mono text-sm text-slate-300">
                          <span
                            className={cn(
                              "inline-block w-4 text-center mr-2",
                              dim.sign === "positive"
                                ? "text-accent-400"
                                : "text-error-400"
                            )}
                          >
                            {dim.sign === "positive" ? "+" : "−"}
                          </span>
                          {dim.name}
                        </span>
                        <span className="font-mono text-sm text-slate-500">
                          {dim.nominal.toFixed(decimals)} +{dim.tolerancePlus.toFixed(decimals)}/
                          -{dim.toleranceMinus.toFixed(decimals)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TechnicalPanel>

            {/* Validation messages */}
            {!isStepValid("review") && (
              <div className="bg-error-500/10 border border-error-500/30 rounded p-4">
                <p className="font-mono text-sm text-error-400">
                  Please complete all required fields before creating the analysis.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between py-4 border-t border-slate-200/50 dark:border-slate-800/50">
        <button
          type="button"
          onClick={goBack}
          disabled={!canGoBack}
          className={cn(
            "flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors",
            canGoBack
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-700 cursor-not-allowed"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </button>

        {currentStep === "review" ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isStepValid("review") || isSubmitting}
            className={cn(
              "flex items-center gap-2 px-6 py-2 font-mono text-xs font-semibold transition-colors",
              isStepValid("review") && !isSubmitting
                ? "bg-accent-500 text-slate-950 hover:bg-accent-400"
                : "bg-slate-800 text-slate-600 cursor-not-allowed"
            )}
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            <Calculator className="w-4 h-4" />
            {isSubmitting ? "CREATING..." : "CREATE ANALYSIS"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goForward}
            disabled={!canGoForward || !isStepValid(currentStep)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold transition-colors",
              canGoForward && isStepValid(currentStep)
                ? "bg-accent-500 text-slate-950 hover:bg-accent-400"
                : "bg-slate-800 text-slate-600 cursor-not-allowed"
            )}
            style={{
              clipPath:
                "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            NEXT
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
