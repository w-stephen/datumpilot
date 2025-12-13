"use client";

import { useState, useCallback, useEffect } from "react";
import { Info, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson, Characteristic, FeatureType, Unit, DatumReference, ToleranceZone, FrameModifier } from "@/lib/fcf/schema";
import { CharacteristicPicker } from "@/components/gdt/CharacteristicIcon";
import { DatumSelector, DatumList } from "@/components/gdt/DatumBadge";
import { ToleranceInput } from "@/components/gdt/ToleranceDisplay";
import { MaterialConditionSelector } from "@/components/gdt/MaterialConditionBadge";
import { ValidationPanel } from "@/components/gdt/ValidationMessage";
import SizeDimensionInput from "@/components/gdt/SizeDimensionInput";
import type { SizeDimensionInput as SizeDimensionType } from "@/lib/calc/types";
import type { ValidationResult } from "@/lib/rules/validateFcf";
import {
  CHARACTERISTIC_DESCRIPTIONS,
  FEATURE_TYPE_LABELS,
  FRAME_MODIFIER_LABELS,
} from "@/lib/constants/gdt-symbols";

interface FcfBuilderPanelProps {
  initialFcf?: Partial<FcfJson>;
  onChange?: (fcf: Partial<FcfJson>) => void;
  onValidate?: (fcf: Partial<FcfJson>) => Promise<ValidationResult>;
  validationResult?: ValidationResult | null;
  className?: string;
}

const defaultFcf: Partial<FcfJson> = {
  sourceUnit: "mm",
  source: { inputType: "builder" },
  tolerance: { value: 0 },
  datums: [],
};

// Cylindrical features that should have diametral tolerance zones
const CYLINDRICAL_FEATURES: FeatureType[] = ["hole", "pin"];

// Features of Size that can have MMC/LMC and require size dimension
const FEATURES_OF_SIZE: FeatureType[] = ["hole", "pin", "boss", "slot"];

export default function FcfBuilderPanel({
  initialFcf,
  onChange,
  onValidate,
  validationResult,
  className,
}: FcfBuilderPanelProps) {
  const [fcf, setFcf] = useState<Partial<FcfJson>>({
    ...defaultFcf,
    ...initialFcf,
  });

  // Update parent and trigger validation
  const updateFcf = useCallback(
    (updates: Partial<FcfJson>) => {
      const newFcf = { ...fcf, ...updates };
      setFcf(newFcf);
      onChange?.(newFcf);
    },
    [fcf, onChange]
  );

  // Update tolerance
  const updateTolerance = useCallback(
    (updates: Partial<ToleranceZone>) => {
      updateFcf({
        tolerance: { ...fcf.tolerance, ...updates } as ToleranceZone,
      });
    },
    [fcf.tolerance, updateFcf]
  );

  // Add datum
  const addDatum = useCallback(
    (datumId: string) => {
      const currentDatums = fcf.datums || [];
      if (currentDatums.length >= 3) return;
      if (currentDatums.some((d) => d.id === datumId)) return;
      updateFcf({
        datums: [...currentDatums, { id: datumId }],
      });
    },
    [fcf.datums, updateFcf]
  );

  // Remove datum
  const removeDatum = useCallback(
    (index: number) => {
      const currentDatums = fcf.datums || [];
      updateFcf({
        datums: currentDatums.filter((_, i) => i !== index),
      });
    },
    [fcf.datums, updateFcf]
  );

  // Update datum material condition
  const updateDatumMC = useCallback(
    (index: number, mc: DatumReference["materialCondition"]) => {
      const currentDatums = fcf.datums || [];
      const newDatums = [...currentDatums];
      newDatums[index] = { ...newDatums[index], materialCondition: mc };
      updateFcf({ datums: newDatums });
    },
    [fcf.datums, updateFcf]
  );

  // Check if characteristic requires datums
  const requiresDatums = fcf.characteristic === "position" || fcf.characteristic === "perpendicularity";
  const allowsDatums = fcf.characteristic !== "flatness";

  // Check if feature is cylindrical (should have diametral zone)
  const isCylindricalFeature = fcf.featureType && CYLINDRICAL_FEATURES.includes(fcf.featureType);

  // Check if feature is a Feature of Size (can have MMC/LMC)
  const isFeatureOfSize = fcf.featureType && FEATURES_OF_SIZE.includes(fcf.featureType);

  // Size dimension is relevant for Features of Size
  // Required when MMC/LMC is selected, optional otherwise
  const showSizeDimension = isFeatureOfSize;
  const sizeDimensionRequired = isFeatureOfSize && fcf.tolerance?.materialCondition;

  // Update size dimension
  const updateSizeDimension = useCallback(
    (updates: Partial<Omit<SizeDimensionType, "featureType">>) => {
      updateFcf({
        sizeDimension: {
          ...fcf.sizeDimension,
          ...updates,
          featureType: fcf.featureType!,
        } as any,
      });
    },
    [fcf.sizeDimension, fcf.featureType, updateFcf]
  );

  // Auto-set/unset diameter zone based on feature type
  useEffect(() => {
    if (fcf.characteristic === "position") {
      if (isCylindricalFeature && !fcf.tolerance?.diameter) {
        // Auto-enable diameter for cylindrical features
        updateTolerance({ diameter: true });
      } else if (!isCylindricalFeature && fcf.tolerance?.diameter) {
        // Auto-disable diameter for non-cylindrical features
        updateTolerance({ diameter: false });
      }
    }
  }, [fcf.featureType, fcf.characteristic, fcf.tolerance?.diameter, isCylindricalFeature, updateTolerance]);

  // Notes popover state
  const [showNotesPopover, setShowNotesPopover] = useState(false);

  // Simple step label component - large number with label
  const StepLabel = ({ step, label }: { step: number; label: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-lg font-mono font-bold text-accent-500">{step}</span>
      <span className="text-xs font-mono text-[#6B7280] dark:text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section 1: Feature Type */}
      <section className="space-y-2">
        <StepLabel step={1} label="Define Feature" />
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#374151] dark:text-slate-400">Feature:</label>
          <select
            value={fcf.featureType || ""}
            onChange={(e) => updateFcf({ featureType: e.target.value as FeatureType || undefined })}
            className={cn(
              "bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 font-mono text-sm text-[#374151] dark:text-slate-300",
              "hover:border-[#D1D5DB] dark:hover:border-slate-600 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500/50",
              "cursor-pointer appearance-none px-3 py-2 w-36"
            )}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: '16px',
              paddingRight: '32px',
            }}
          >
            <option value="">Select...</option>
            {(Object.keys(FEATURE_TYPE_LABELS) as FeatureType[]).map((type) => (
              <option key={type} value={type}>{FEATURE_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-[#E5E7EB] dark:border-slate-800/50" />

      {/* Section 2: Geometric Tolerance */}
      <section className="space-y-2">
        <StepLabel step={2} label="Geometric Tolerance" />
        <CharacteristicPicker
          value={fcf.characteristic || null}
          onChange={(char) => updateFcf({ characteristic: char })}
          compact
          showLabels
          equallySpaced
        />
        {/* Characteristic description inline */}
        {fcf.characteristic && (
          <p className="text-sm text-[#6B7280] dark:text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-slate-600" />
            {CHARACTERISTIC_DESCRIPTIONS[fcf.characteristic]}
          </p>
        )}
      </section>

      {/* Divider */}
      <div className="border-t border-[#E5E7EB] dark:border-slate-800/50" />

      {/* Section 3: Tolerance Zone (single horizontal row) */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <StepLabel step={3} label="Tolerance Zone" />
          {isCylindricalFeature && fcf.tolerance?.diameter && fcf.characteristic === "position" && (
            <span className="text-xs text-accent-500 ml-2">(⌀ auto for {fcf.featureType})</span>
          )}
        </div>
        <ToleranceInput
          value={fcf.tolerance || {}}
          onChange={updateTolerance}
          unit={fcf.sourceUnit || "mm"}
          onUnitChange={(unit) => updateFcf({ sourceUnit: unit })}
          showDiameter={fcf.characteristic === "position" || fcf.characteristic === "perpendicularity"}
          showMaterialCondition={fcf.characteristic !== "flatness"}
          showUnitSelector
          compact
        />
      </section>

      {/* Divider */}
      <div className="border-t border-[#E5E7EB] dark:border-slate-800/50" />

      {/* Section 4: Size Dimension (conditional, compact) */}
      {showSizeDimension && (
        <>
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <StepLabel step={4} label="Size Dimension" />
              {sizeDimensionRequired ? (
                <span className="text-xs text-warning-500 ml-2">Required for {fcf.tolerance?.materialCondition}</span>
              ) : (
                <span className="text-xs text-[#9CA3AF] dark:text-slate-600 ml-2">Optional</span>
              )}
            </div>
            <SizeDimensionInput
              value={fcf.sizeDimension}
              onChange={updateSizeDimension}
              featureType={fcf.featureType}
              unit={fcf.sourceUnit || "mm"}
            />
          </section>
          <div className="border-t border-[#E5E7EB] dark:border-slate-800/50" />
        </>
      )}

      {/* Section 5: Datum References (side-by-side layout) */}
      {allowsDatums && (
        <>
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <StepLabel step={showSizeDimension ? 5 : 4} label="Datum References" />
              {requiresDatums && (
                <span className="text-xs text-error-500 ml-2">Required</span>
              )}
            </div>
            <div className="flex gap-4 items-stretch">
              {/* Datum selector grid */}
              <div className="flex-shrink-0">
                <DatumSelector
                  selectedDatums={(fcf.datums || []).map((d) => d.id)}
                  onSelect={addDatum}
                  onDeselect={(id) => {
                    const index = (fcf.datums || []).findIndex((d) => d.id === id);
                    if (index >= 0) removeDatum(index);
                  }}
                  maxDatums={3}
                  compact
                />
              </div>

              {/* Selected datums with inline MC - aligned container */}
              <div className="flex-1 flex items-center border-l border-[#E5E7EB] dark:border-slate-800/50 pl-4 min-h-[56px]">
                {(fcf.datums || []).length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {(fcf.datums || []).map((datum, index) => (
                      <div
                        key={datum.id}
                        className="flex items-center gap-1 bg-[#F9FAFB] dark:bg-slate-800/50 border border-[#E5E7EB] dark:border-slate-700 px-2 py-1"
                      >
                        <span className="font-mono text-sm text-accent-500 font-bold">{datum.id}</span>
                        <MaterialConditionSelector
                          value={datum.materialCondition}
                          onChange={(mc) => updateDatumMC(index, mc)}
                          allowRFS
                          size="xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeDatum(index)}
                          className="text-[#9CA3AF] dark:text-slate-500 hover:text-[#374151] dark:hover:text-slate-300 ml-1"
                          aria-label={`Remove datum ${datum.id}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-[#9CA3AF] dark:text-slate-600 italic">Select datums A-N →</span>
                )}
              </div>
            </div>
          </section>
          <div className="border-t border-[#E5E7EB] dark:border-slate-800/50" />
        </>
      )}

      {/* Section 6: Options Row (Modifiers + Name + Notes) */}
      <section className="space-y-2">
        <StepLabel
          step={showSizeDimension ? (allowsDatums ? 6 : 5) : (allowsDatums ? 5 : 4)}
          label="Options"
        />
        <div className="flex items-center gap-3 flex-wrap">
          {/* Frame Modifiers */}
          <div className="flex items-center gap-1">
            {(Object.keys(FRAME_MODIFIER_LABELS) as FrameModifier[]).map((mod) => {
              const isSelected = (fcf.modifiers || []).includes(mod);
              return (
                <button
                  key={mod}
                  type="button"
                  onClick={() => {
                    const current = fcf.modifiers || [];
                    updateFcf({
                      modifiers: isSelected
                        ? current.filter((m) => m !== mod)
                        : [...current, mod],
                    });
                  }}
                  className={cn(
                    "px-2.5 py-1.5 text-xs border transition-colors",
                    isSelected
                      ? "bg-accent-500/20 border-accent-500 text-accent-500"
                      : "bg-white dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-500 hover:border-[#D1D5DB] dark:hover:border-slate-600"
                  )}
                  title={FRAME_MODIFIER_LABELS[mod]}
                >
                  {FRAME_MODIFIER_LABELS[mod].split(' ')[0]}
                </button>
              );
            })}
          </div>

          {/* Separator */}
          <div className="h-6 w-px bg-[#E5E7EB] dark:bg-slate-700" />

          {/* Name input */}
          <div className="flex items-center gap-2 flex-1 min-w-[150px]">
            <label className="text-sm text-[#374151] dark:text-slate-400 whitespace-nowrap">Name:</label>
            <input
              type="text"
              value={fcf.name || ""}
              onChange={(e) => updateFcf({ name: e.target.value || undefined })}
              className="flex-1 min-w-0 bg-white dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-800 px-3 py-2 font-mono text-sm text-[#374151] dark:text-slate-300 placeholder-[#9CA3AF] dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-accent-500/50 focus:border-accent-500/50"
              placeholder="e.g., Mounting Hole"
            />
          </div>

          {/* Notes popover trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotesPopover(!showNotesPopover)}
              className={cn(
                "p-2 border transition-colors",
                (fcf.notes || []).length > 0
                  ? "bg-primary-500/20 border-primary-500 text-primary-500"
                  : "bg-white dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700 text-[#6B7280] dark:text-slate-500 hover:border-[#D1D5DB] dark:hover:border-slate-600"
              )}
              title="Add notes"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Notes popover */}
            {showNotesPopover && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#0A0E14] border border-[#E5E7EB] dark:border-slate-700 shadow-xl z-50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] dark:border-slate-800">
                  <span className="text-sm font-mono text-[#374151] dark:text-slate-400">Notes</span>
                  <button
                    type="button"
                    onClick={() => setShowNotesPopover(false)}
                    className="text-[#6B7280] dark:text-slate-500 hover:text-[#111827] dark:hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3">
                  <textarea
                    value={(fcf.notes || []).join("\n")}
                    onChange={(e) =>
                      updateFcf({
                        notes: e.target.value
                          ? e.target.value.split("\n").filter(Boolean)
                          : undefined,
                      })
                    }
                    className="min-h-[100px] resize-y text-sm w-full bg-[#F9FAFB] dark:bg-slate-900/50 border border-[#E5E7EB] dark:border-slate-800 px-3 py-2 font-mono text-[#374151] dark:text-slate-300 placeholder-[#9CA3AF] dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-accent-500/50"
                    placeholder="Additional notes..."
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Validation Results */}
      {validationResult && (
        <ValidationPanel
          issues={validationResult.issues}
          title="Validation"
          collapsible
          defaultExpanded={!validationResult.valid}
        />
      )}
    </div>
  );
}
