import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resvg } from "@resvg/resvg-js";
import { fcfJsonSchema, FcfJson } from "@/lib/fcf/schema";
import type { ExportFormat, ExportResult } from "@/lib/export/types";
import { generateFcfSvg } from "@/lib/export/svg-generator";
import { generateFcfPdf } from "@/lib/export/pdf-generator";
import { checkFeatureAccess, getSubscriptionStatus } from "@/lib/stripe/subscription";

// Request schema - JSON kept for future API integrations
const exportRequestSchema = z.object({
  fcf: fcfJsonSchema,
  format: z.enum(["png", "svg", "pdf", "json"]),
  options: z
    .object({
      scale: z.number().min(0.5).max(4).optional(),
      includeMetadata: z.boolean().optional(),
      backgroundColor: z.string().optional(),
    })
    .optional(),
});

// Map format to feature name
const formatToFeature: Record<ExportFormat, "exportPng" | "exportSvg" | "exportPdf" | "exportJson"> = {
  png: "exportPng",
  svg: "exportSvg",
  pdf: "exportPdf",
  json: "exportJson",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fcf, format, options } = exportRequestSchema.parse(body);

    // Check subscription tier for export access
    const feature = formatToFeature[format];
    const hasAccess = await checkFeatureAccess(feature);

    if (!hasAccess) {
      const status = await getSubscriptionStatus();
      return NextResponse.json(
        {
          error: "Upgrade required",
          message: `${format.toUpperCase()} export is available on Pro and Team plans.`,
          currentTier: status?.tier || "free",
          requiredTier: "pro",
        },
        { status: 403 }
      );
    }

    let result: ExportResult;

    switch (format) {
      case "png":
        result = await generatePngExport(fcf, options);
        break;
      case "svg":
        result = await generateSvgExport(fcf, options);
        break;
      case "pdf":
        result = await generatePdfExport(fcf, options);
        break;
      case "json":
        // JSON export kept for API integrations (not exposed in UI)
        result = await generateJsonExport(fcf);
        break;
      default: {
        const _exhaustiveCheck: never = format;
        return NextResponse.json(
          { error: `Invalid format: ${_exhaustiveCheck}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Export Generators
// ---------------------------------------------------------------------------

interface ExportOptions {
  scale?: number;
  includeMetadata?: boolean;
  backgroundColor?: string;
}

/**
 * Generate PNG export of FCF visualization using resvg.
 */
async function generatePngExport(
  fcf: FcfJson,
  options?: ExportOptions
): Promise<ExportResult> {
  const scale = options?.scale ?? 2;
  const backgroundColor = options?.backgroundColor ?? "#1A2332";

  // Generate SVG string
  const svgString = generateFcfSvg(fcf, {
    scale,
    backgroundColor,
    includeMetadata: false,
  });

  // Convert SVG to PNG using resvg
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: "original",
    },
    font: {
      fontDirs: [],
      defaultFontFamily: "monospace",
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Generate filename
  const filename = `fcf-${sanitizeFilename(fcf.name || "export")}-${Date.now()}.png`;

  // Return as base64 data URL for direct download
  const base64 = pngBuffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  return {
    url: dataUrl,
    format: "png",
    filename,
    size: pngBuffer.length,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

/**
 * Generate SVG export of FCF visualization.
 */
async function generateSvgExport(
  fcf: FcfJson,
  options?: ExportOptions
): Promise<ExportResult> {
  const scale = options?.scale ?? 1.5;
  const backgroundColor = options?.backgroundColor ?? "transparent";

  // Generate SVG string
  const svgString = generateFcfSvg(fcf, {
    scale,
    backgroundColor,
    includeMetadata: options?.includeMetadata ?? true,
  });

  // Generate filename
  const filename = `fcf-${sanitizeFilename(fcf.name || "export")}-${Date.now()}.svg`;

  // Return as data URL
  const base64 = Buffer.from(svgString, "utf-8").toString("base64");
  const dataUrl = `data:image/svg+xml;base64,${base64}`;

  return {
    url: dataUrl,
    format: "svg",
    filename,
    size: Buffer.byteLength(svgString, "utf-8"),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

/**
 * Generate PDF export with FCF frame and metadata.
 */
async function generatePdfExport(
  fcf: FcfJson,
  options?: ExportOptions
): Promise<ExportResult> {
  // Generate PDF buffer
  const pdfBuffer = await generateFcfPdf(fcf, {
    includeMetadata: options?.includeMetadata ?? true,
    pageSize: "a4",
    orientation: "portrait",
  });

  // Generate filename
  const filename = `fcf-${sanitizeFilename(fcf.name || "export")}-${Date.now()}.pdf`;

  // Return as base64 data URL
  const base64 = pdfBuffer.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  return {
    url: dataUrl,
    format: "pdf",
    filename,
    size: pdfBuffer.length,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

/**
 * Generate JSON export for API integrations.
 * Not exposed in UI, kept for future CAD/PLM integrations.
 */
async function generateJsonExport(fcf: FcfJson): Promise<ExportResult> {
  const jsonString = JSON.stringify(fcf, null, 2);
  const filename = `fcf-${sanitizeFilename(fcf.name || "export")}-${Date.now()}.json`;

  // Return as data URL
  const base64 = Buffer.from(jsonString, "utf-8").toString("base64");
  const dataUrl = `data:application/json;base64,${base64}`;

  return {
    url: dataUrl,
    format: "json",
    filename,
    size: Buffer.byteLength(jsonString, "utf-8"),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

/**
 * Sanitize filename to remove special characters
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}
