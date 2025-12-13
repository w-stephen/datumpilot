/**
 * Server-side SVG Generator for FCF Exports
 *
 * Generates SVG strings for Feature Control Frames without React dependencies.
 * This mirrors the client-side FcfPreview rendering logic for consistent output.
 */

import type { FcfJson, MaterialConditionSymbol, Characteristic } from "@/lib/fcf/schema";

// ASME Y14.5-2018 Feature Control Frame dimensions (in mm, scaled)
const FCF = {
  cellHeight: 32,
  cellMinWidth: 32,
  symbolWidth: 32,
  toleranceMinWidth: 48,
  datumWidth: 28,
  datumWidthWithMC: 44,
  strokeWidth: 2,
  fontSize: 14,
  fontFamily: "monospace",
  padding: 4,
};

// GD&T symbols
const CHARACTERISTIC_SYMBOLS: Record<Characteristic, string> = {
  position: "⊕",
  flatness: "⏥",
  perpendicularity: "⊥",
  profile: "⌓",
  other: "?",
};

const MATERIAL_CONDITION_SYMBOLS: Record<MaterialConditionSymbol, string> = {
  MMC: "Ⓜ",
  LMC: "Ⓛ",
  RFS: "",
};

const CHARACTERISTIC_COLORS: Record<Characteristic, string> = {
  position: "#3B82F6",
  flatness: "#10B981",
  perpendicularity: "#F59E0B",
  profile: "#8B5CF6",
  other: "#6B7280",
};

export interface SvgGeneratorOptions {
  scale?: number;
  backgroundColor?: string;
  includeMetadata?: boolean;
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
function getToleranceWidth(fcf: FcfJson): number {
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
function calculateFrameWidth(fcf: FcfJson): number {
  let width = FCF.symbolWidth; // Characteristic symbol
  width += getToleranceWidth(fcf); // Tolerance value

  // Datum references
  const datums = fcf.datums || [];
  datums.forEach((datum) => {
    const hasMC = datum.materialCondition && datum.materialCondition !== "RFS";
    width += hasMC ? FCF.datumWidthWithMC : FCF.datumWidth;
  });

  return width;
}

/**
 * XML-escape a string for safe SVG output
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate SVG string for an FCF
 */
export function generateFcfSvg(fcf: FcfJson, options: SvgGeneratorOptions = {}): string {
  const { scale = 1.5, backgroundColor = "transparent", includeMetadata = false } = options;

  const frameWidth = calculateFrameWidth(fcf);
  const frameHeight = FCF.cellHeight;

  // SVG viewBox dimensions with padding
  const viewBoxPadding = 20;
  const viewBoxWidth = frameWidth + viewBoxPadding * 2;
  const viewBoxHeight = frameHeight + viewBoxPadding * 2;

  // Final SVG dimensions
  const svgWidth = viewBoxWidth * scale;
  const svgHeight = viewBoxHeight * scale;

  // Get characteristic color
  const charColor = fcf.characteristic
    ? CHARACTERISTIC_COLORS[fcf.characteristic]
    : "#6B7280";

  // Build cells
  const cells: string[] = [];
  let xOffset = 0;

  // Cell 1: Characteristic Symbol
  if (fcf.characteristic) {
    const symbol = CHARACTERISTIC_SYMBOLS[fcf.characteristic] || "?";
    cells.push(`
      <g transform="translate(${xOffset}, 0)">
        <rect x="0" y="0" width="${FCF.symbolWidth}" height="${FCF.cellHeight}" fill="transparent" stroke="#334155" stroke-width="1"/>
        <text x="${FCF.symbolWidth / 2}" y="${FCF.cellHeight / 2}" text-anchor="middle" dominant-baseline="central" fill="${charColor}" font-size="${FCF.fontSize + 4}" font-family="${FCF.fontFamily}" font-weight="bold">${escapeXml(symbol)}</text>
      </g>
    `);
    xOffset += FCF.symbolWidth;
  }

  // Cell 2: Tolerance Value
  if (fcf.tolerance?.value !== undefined) {
    const toleranceWidth = getToleranceWidth(fcf);
    const valueStr = fcf.tolerance.value.toFixed(3);
    const hasDiameter = fcf.tolerance.diameter;
    const mcSymbol = getMCSymbol(fcf.tolerance.materialCondition);

    let toleranceContent = "";
    if (hasDiameter) {
      toleranceContent += `<tspan fill="#00D4AA">⌀</tspan>`;
    }
    toleranceContent += `<tspan>${valueStr}</tspan>`;
    if (mcSymbol) {
      toleranceContent += `<tspan fill="#F59E0B" font-size="${FCF.fontSize - 2}"> ${escapeXml(mcSymbol)}</tspan>`;
    }

    cells.push(`
      <g transform="translate(${xOffset}, 0)">
        <rect x="0" y="0" width="${toleranceWidth}" height="${FCF.cellHeight}" fill="transparent" stroke="#334155" stroke-width="1"/>
        <text x="${toleranceWidth / 2}" y="${FCF.cellHeight / 2}" text-anchor="middle" dominant-baseline="central" fill="#F8FAFC" font-size="${FCF.fontSize}" font-family="${FCF.fontFamily}" font-weight="600">${toleranceContent}</text>
      </g>
    `);
    xOffset += toleranceWidth;
  }

  // Cells 3+: Datum References
  const datums = fcf.datums || [];
  datums.forEach((datum, index) => {
    const mcSymbol = getMCSymbol(datum.materialCondition);
    const hasMC = mcSymbol !== "";
    const cellWidth = hasMC ? FCF.datumWidthWithMC : FCF.datumWidth;

    let datumContent = `<tspan>${escapeXml(datum.id)}</tspan>`;
    if (mcSymbol) {
      datumContent += `<tspan fill="#F59E0B" font-size="${FCF.fontSize}" dx="3">${escapeXml(mcSymbol)}</tspan>`;
    }

    const textX = hasMC ? cellWidth / 2 - 6 : cellWidth / 2;

    cells.push(`
      <g transform="translate(${xOffset}, 0)">
        <rect x="0" y="0" width="${cellWidth}" height="${FCF.cellHeight}" fill="transparent" stroke="#334155" stroke-width="1"/>
        <text x="${textX}" y="${FCF.cellHeight / 2}" text-anchor="middle" dominant-baseline="central" fill="#00D4AA" font-size="${FCF.fontSize}" font-family="${FCF.fontFamily}" font-weight="bold">${datumContent}</text>
      </g>
    `);
    xOffset += cellWidth;
  });

  // Build the SVG
  let metadata = "";
  if (includeMetadata) {
    metadata = `
    <metadata>
      <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
               xmlns:dc="http://purl.org/dc/elements/1.1/">
        <rdf:Description>
          <dc:title>${escapeXml(fcf.name || "FCF Export")}</dc:title>
          <dc:creator>DatumPilot</dc:creator>
          <dc:date>${new Date().toISOString()}</dc:date>
          <dc:description>Feature Control Frame: ${escapeXml(fcf.characteristic || "")}</dc:description>
        </rdf:Description>
      </rdf:RDF>
    </metadata>`;
  }

  const bgRect = backgroundColor !== "transparent"
    ? `<rect x="0" y="0" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="${backgroundColor}"/>`
    : "";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">
  ${metadata}
  ${bgRect}
  <g transform="translate(${viewBoxPadding}, ${viewBoxPadding})">
    <!-- Main frame border -->
    <rect x="0" y="0" width="${frameWidth}" height="${frameHeight}" fill="#1A2332" stroke="#334155" stroke-width="${FCF.strokeWidth}" rx="2"/>
    <!-- Cells -->
    ${cells.join("\n")}
  </g>
</svg>`;

  return svg;
}

/**
 * Generate a minimal SVG for empty state
 */
export function generateEmptySvg(options: SvgGeneratorOptions = {}): string {
  const { scale = 1.5, backgroundColor = "#1A2332" } = options;
  const width = 200 * scale;
  const height = 60 * scale;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 200 60">
  <rect x="0" y="0" width="200" height="60" fill="${backgroundColor}" stroke="#334155" stroke-width="2" stroke-dasharray="5,5" rx="4"/>
  <text x="100" y="30" text-anchor="middle" dominant-baseline="central" fill="#6B7280" font-size="12" font-family="monospace">No FCF data</text>
</svg>`;
}
