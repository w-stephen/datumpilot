/**
 * Export format types for FCF visualization exports.
 *
 * User-facing exports: PNG, SVG, PDF (what engineers see in the UI)
 * Internal/API exports: JSON (preserved for future CAD/PLM integrations)
 */

// User-facing export formats (displayed in UI)
export type UserExportFormat = "png" | "svg" | "pdf";

// All export formats (includes JSON for internal API use)
export type ExportFormat = "png" | "svg" | "pdf" | "json";

// Helper to check if format is user-facing
export function isUserExportFormat(format: string): format is UserExportFormat {
  return ["png", "svg", "pdf"].includes(format);
}

// Export options for each format
export interface ExportOptions {
  /** Scale factor for raster exports (1 = 100%, 2 = 200%) */
  scale?: number;
  /** Include metadata in export (name, timestamp, etc.) */
  includeMetadata?: boolean;
  /** Background color (default: transparent for PNG/SVG) */
  backgroundColor?: string;
}

// Export result returned from API
export interface ExportResult {
  /** Signed URL to download the export */
  url: string;
  /** Format of the export */
  format: ExportFormat;
  /** File name for download */
  filename: string;
  /** Size in bytes (if available) */
  size?: number;
  /** Expiration time of the signed URL */
  expiresAt?: string;
}
