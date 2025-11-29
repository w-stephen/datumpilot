"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson, Characteristic, FeatureType, Unit, DatumReference, ToleranceZone, FrameModifier } from "@/lib/fcf/schema";
import { CharacteristicPicker } from "@/components/gdt/CharacteristicIcon";
import { DatumSelector, DatumList, DATUM_LETTERS } from "@/components/gdt/DatumBadge";
import { ToleranceInput } from "@/components/gdt/ToleranceDisplay";
import { MaterialConditionSelector } from "@/components/gdt/MaterialConditionBadge";
import { ValidationPanel } from "@/components/gdt/ValidationMessage";
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

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section 1: Feature Type - Identify the feature first */}
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Feature Type</h3>
          <span className="text-xs text-slate-500">What are you tolerancing?</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(FEATURE_TYPE_LABELS) as FeatureType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => updateFcf({ featureType: type })}
              className={cn(
                "px-3 py-2 text-sm rounded-md border transition-colors text-left",
                fcf.featureType === type
                  ? "bg-primary-500/20 border-primary-500 text-primary-400"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
              )}
            >
              {FEATURE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </section>

      {/* Section 2: Characteristic Selection */}
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Characteristic</h3>
          <span className="text-xs text-slate-500">Geometric control type</span>
        </div>
        <div className="space-y-4">
          <CharacteristicPicker
            value={fcf.characteristic || null}
            onChange={(char) => updateFcf({ characteristic: char })}
            size="lg"
          />
          {fcf.characteristic && (
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {CHARACTERISTIC_DESCRIPTIONS[fcf.characteristic]}
            </p>
          )}
        </div>
      </section>

      {/* Section 3: Tolerance Zone */}
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Tolerance Zone</h3>
        </div>
        <div className="space-y-4">
          <ToleranceInput
            value={fcf.tolerance || {}}
            onChange={updateTolerance}
            unit={fcf.sourceUnit || "mm"}
            showDiameter={fcf.characteristic === "position" || fcf.characteristic === "perpendicularity"}
            showMaterialCondition={fcf.characteristic !== "flatness"}
          />

          {/* Hint when diameter is auto-selected for cylindrical features */}
          {isCylindricalFeature && fcf.tolerance?.diameter && fcf.characteristic === "position" && (
            <p className="text-xs text-accent-400 flex items-center gap-2">
              <Info className="w-3 h-3" />
              Diameter zone auto-selected for {fcf.featureType} feature
            </p>
          )}

          {/* Unit Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-slate-400">Units:</label>
            <div className="flex items-center gap-1">
              {(["mm", "inch"] as Unit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => updateFcf({ sourceUnit: unit })}
                  className={cn(
                    "px-3 py-1.5 text-sm font-mono rounded-md border transition-colors",
                    fcf.sourceUnit === unit
                      ? "bg-primary-500/20 border-primary-500 text-primary-400"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Datum References */}
      {allowsDatums && (
        <section className="panel">
          <div className="panel-header">
            <h3 className="panel-title">
              Datum References
              {requiresDatums && (
                <span className="ml-2 text-xs text-error-400 font-normal">
                  Required
                </span>
              )}
            </h3>
          </div>
          <div className="space-y-4">
            {/* Selected datums */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 w-20">Selected:</span>
              <DatumList
                datums={fcf.datums || []}
                removable
                onRemove={removeDatum}
              />
            </div>

            {/* Datum selector */}
            <div>
              <span className="text-sm text-slate-500 mb-2 block">
                Click to add (max 3):
              </span>
              <DatumSelector
                selectedDatums={(fcf.datums || []).map((d) => d.id)}
                onSelect={addDatum}
                onDeselect={(id) => {
                  const index = (fcf.datums || []).findIndex((d) => d.id === id);
                  if (index >= 0) removeDatum(index);
                }}
                maxDatums={3}
              />
            </div>

            {/* Material conditions for datums */}
            {(fcf.datums || []).length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <span className="text-sm text-slate-500 block">
                  Material conditions:
                </span>
                {(fcf.datums || []).map((datum, index) => (
                  <div key={datum.id} className="flex items-center gap-3">
                    <span className="w-20 font-mono text-accent-400">
                      Datum {datum.id}:
                    </span>
                    <MaterialConditionSelector
                      value={datum.materialCondition}
                      onChange={(mc) => updateDatumMC(index, mc)}
                      allowRFS
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 5: Frame Modifiers (Advanced) */}
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Frame Modifiers</h3>
          <span className="text-xs text-slate-500">Optional</span>
        </div>
        <div className="flex flex-wrap gap-2">
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
                  "px-3 py-1.5 text-xs rounded-md border transition-colors",
                  isSelected
                    ? "bg-accent-500/20 border-accent-500 text-accent-400"
                    : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600"
                )}
              >
                {FRAME_MODIFIER_LABELS[mod]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 6: Name & Notes */}
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Name & Notes</h3>
          <span className="text-xs text-slate-500">Optional</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              FCF Name
            </label>
            <input
              type="text"
              value={fcf.name || ""}
              onChange={(e) => updateFcf({ name: e.target.value || undefined })}
              className="input"
              placeholder="e.g., Mounting Hole Position"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              Notes
            </label>
            <textarea
              value={(fcf.notes || []).join("\n")}
              onChange={(e) =>
                updateFcf({
                  notes: e.target.value
                    ? e.target.value.split("\n").filter(Boolean)
                    : undefined,
                })
              }
              className="input min-h-[80px] resize-y"
              placeholder="Additional notes or annotations..."
            />
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
