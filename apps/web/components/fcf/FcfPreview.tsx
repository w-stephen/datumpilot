"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson, MaterialConditionSymbol } from "@/lib/fcf/schema";
import {
  CHARACTERISTIC_COLORS,
  GDT_SYMBOLS,
  MATERIAL_CONDITION_SYMBOLS,
} from "@/lib/constants/gdt-symbols";

interface FcfPreviewProps {
  fcf: Partial<FcfJson>;
  width?: number;
  height?: number;
  scale?: number;
  showGrid?: boolean;
  interactive?: boolean;
  className?: string;
}

// ASME Y14.5-2018 Feature Control Frame dimensions (in mm, scaled)
const FCF = {
  cellHeight: 32,
  cellMinWidth: 32,
  symbolWidth: 32,
  toleranceMinWidth: 48,
  datumWidth: 28,
  datumWidthWithMC: 44, // Wider cell when datum has material condition
  strokeWidth: 2,
  fontSize: 14,
  fontFamily: "IBM Plex Mono, monospace",
  padding: 4,
};

/**
 * Get the symbol for a characteristic
 */
function getCharacteristicSymbol(char: string): string {
  const symbols: Record<string, string> = {
    position: "⊕",
    flatness: "⏥",
    perpendicularity: "⊥",
    profile: "⌓",
    other: "?",
  };
  return symbols[char] || "?";
}

/**
 * Get the material condition symbol
 */
function getMCSymbol(mc: MaterialConditionSymbol | undefined): string {
  if (!mc || mc === "RFS") return "";
  return MATERIAL_CONDITION_SYMBOLS[mc];
}

/**
 * Calculate the width needed for the tolerance cell
 */
function getToleranceWidth(fcf: Partial<FcfJson>): number {
  if (!fcf.tolerance?.value) return FCF.toleranceMinWidth;
  const valueStr = fcf.tolerance.value.toFixed(3);
  const hasDiameter = fcf.tolerance.diameter;
  const hasMC = fcf.tolerance.materialCondition && fcf.tolerance.materialCondition !== "RFS";
  const charCount = valueStr.length + (hasDiameter ? 1 : 0) + (hasMC ? 1 : 0);
  return Math.max(FCF.toleranceMinWidth, charCount * 10 + FCF.padding * 2);
}

/**
 * Calculate total frame width
 */
function calculateFrameWidth(fcf: Partial<FcfJson>): number {
  let width = FCF.symbolWidth; // Characteristic symbol
  width += getToleranceWidth(fcf); // Tolerance value

  // Datum references - wider cells for datums with material conditions
  const datums = fcf.datums || [];
  datums.forEach((datum) => {
    const hasMC = datum.materialCondition && datum.materialCondition !== "RFS";
    width += hasMC ? FCF.datumWidthWithMC : FCF.datumWidth;
  });

  return width;
}

export default function FcfPreview({
  fcf,
  width: containerWidth,
  height: containerHeight,
  scale = 1,
  showGrid = false,
  className,
}: FcfPreviewProps) {
  // Calculate frame dimensions
  const frameWidth = useMemo(() => calculateFrameWidth(fcf), [fcf]);
  const frameHeight = FCF.cellHeight;

  // SVG viewBox dimensions with padding
  const viewBoxPadding = 20;
  const viewBoxWidth = frameWidth + viewBoxPadding * 2;
  const viewBoxHeight = frameHeight + viewBoxPadding * 2;

  // Container dimensions
  const svgWidth = containerWidth || viewBoxWidth * scale;
  const svgHeight = containerHeight || viewBoxHeight * scale;

  // Get characteristic color
  const charColor = fcf.characteristic
    ? CHARACTERISTIC_COLORS[fcf.characteristic]
    : "#6B7280";

  // Empty state
  if (!fcf.characteristic && !fcf.tolerance?.value && !fcf.datums?.length) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          "bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-lg",
          className
        )}
        style={{ width: svgWidth, height: svgHeight }}
      >
        <p className="text-sm text-slate-500">
          Select a characteristic to preview
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative",
        showGrid && "bg-grid-pattern",
        className
      )}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="overflow-visible"
        aria-label="Feature Control Frame Preview"
      >
        {/* Definitions */}
        <defs>
          {/* Glow filter for active states */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Frame group - centered in viewBox */}
        <g transform={`translate(${viewBoxPadding}, ${viewBoxPadding})`}>
          {/* Main frame border */}
          <rect
            x={0}
            y={0}
            width={frameWidth}
            height={frameHeight}
            fill="#1A2332"
            stroke="#334155"
            strokeWidth={FCF.strokeWidth}
            rx={2}
          />

          {/* Cells */}
          {renderCells(fcf, charColor)}
        </g>
      </svg>

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent-500/30" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-accent-500/30" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-accent-500/30" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-accent-500/30" />
    </div>
  );
}

/**
 * Render the cells of the FCF
 */
function renderCells(fcf: Partial<FcfJson>, charColor: string): React.ReactNode {
  const cells: React.ReactNode[] = [];
  let xOffset = 0;

  // Cell 1: Characteristic Symbol
  if (fcf.characteristic) {
    const symbol = getCharacteristicSymbol(fcf.characteristic);
    cells.push(
      <g key="char" transform={`translate(${xOffset}, 0)`}>
        {/* Cell border */}
        <rect
          x={0}
          y={0}
          width={FCF.symbolWidth}
          height={FCF.cellHeight}
          fill="transparent"
          stroke="#334155"
          strokeWidth={1}
        />
        {/* Symbol */}
        <text
          x={FCF.symbolWidth / 2}
          y={FCF.cellHeight / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={charColor}
          fontSize={FCF.fontSize + 4}
          fontFamily={FCF.fontFamily}
          fontWeight="bold"
        >
          {symbol}
        </text>
      </g>
    );
    xOffset += FCF.symbolWidth;
  }

  // Cell 2: Tolerance Value
  if (fcf.tolerance?.value !== undefined) {
    const toleranceWidth = getToleranceWidth(fcf);
    const valueStr = fcf.tolerance.value.toFixed(3);
    const hasDiameter = fcf.tolerance.diameter;
    const mcSymbol = getMCSymbol(fcf.tolerance.materialCondition);

    cells.push(
      <g key="tolerance" transform={`translate(${xOffset}, 0)`}>
        {/* Cell border */}
        <rect
          x={0}
          y={0}
          width={toleranceWidth}
          height={FCF.cellHeight}
          fill="transparent"
          stroke="#334155"
          strokeWidth={1}
        />
        {/* Tolerance content */}
        <text
          x={toleranceWidth / 2}
          y={FCF.cellHeight / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#F8FAFC"
          fontSize={FCF.fontSize}
          fontFamily={FCF.fontFamily}
          fontWeight="600"
        >
          {hasDiameter && (
            <tspan fill="#00D4AA">{GDT_SYMBOLS.diameter}</tspan>
          )}
          <tspan>{valueStr}</tspan>
          {mcSymbol && (
            <tspan fill="#F59E0B" fontSize={FCF.fontSize - 2}> {mcSymbol}</tspan>
          )}
        </text>
      </g>
    );
    xOffset += toleranceWidth;
  }

  // Cells 3+: Datum References
  const datums = fcf.datums || [];
  datums.forEach((datum, index) => {
    const mcSymbol = getMCSymbol(datum.materialCondition);
    const hasMC = mcSymbol !== "";
    const cellWidth = hasMC ? FCF.datumWidthWithMC : FCF.datumWidth;

    cells.push(
      <g key={`datum-${index}`} transform={`translate(${xOffset}, 0)`}>
        {/* Cell border */}
        <rect
          x={0}
          y={0}
          width={cellWidth}
          height={FCF.cellHeight}
          fill="transparent"
          stroke="#334155"
          strokeWidth={1}
        />
        {/* Datum letter and material condition side by side */}
        <text
          x={hasMC ? cellWidth / 2 - 6 : cellWidth / 2}
          y={FCF.cellHeight / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#00D4AA"
          fontSize={FCF.fontSize}
          fontFamily={FCF.fontFamily}
          fontWeight="bold"
        >
          {datum.id}
          {mcSymbol && (
            <tspan fill="#F59E0B" fontSize={FCF.fontSize} dx="3">
              {mcSymbol}
            </tspan>
          )}
        </text>
      </g>
    );
    xOffset += cellWidth;
  });

  return cells;
}

/**
 * FcfPreviewCard - Preview with additional metadata and controls
 */
export function FcfPreviewCard({
  fcf,
  title,
  subtitle,
  showMetadata = true,
  actions,
  className,
}: {
  fcf: Partial<FcfJson>;
  title?: string;
  subtitle?: string;
  showMetadata?: boolean;
  actions?: React.ReactNode;
  className?: string;
}) {
  const charColor = fcf.characteristic
    ? CHARACTERISTIC_COLORS[fcf.characteristic]
    : "#6B7280";

  return (
    <div
      className={cn(
        "bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Header */}
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            {title && (
              <h3 className="font-mono font-semibold text-slate-200">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions}
        </div>
      )}

      {/* Preview */}
      <div className="p-6 flex items-center justify-center bg-slate-950/50">
        <FcfPreview fcf={fcf} scale={1.5} showGrid />
      </div>

      {/* Metadata */}
      {showMetadata && fcf.characteristic && (
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Characteristic:</span>
              <span className="font-medium" style={{ color: charColor }}>
                {fcf.characteristic.charAt(0).toUpperCase() + fcf.characteristic.slice(1)}
              </span>
            </div>
            {fcf.featureType && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Feature:</span>
                <span className="text-slate-300">
                  {fcf.featureType.charAt(0).toUpperCase() + fcf.featureType.slice(1)}
                </span>
              </div>
            )}
            {fcf.sourceUnit && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Units:</span>
                <span className="text-slate-300 font-mono">{fcf.sourceUnit}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
