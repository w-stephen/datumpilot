/**
 * API Input Validation Schemas
 *
 * Zod schemas for validating API request bodies.
 * These ensure type-safe inputs before database operations.
 */

import { z } from "zod";
import { fcfJsonSchema } from "@/lib/fcf/schema";

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

export const projectInsertSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(2000).trim().nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).default([])
});

export const projectUpdateSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(2000).trim().nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional()
});

export const projectListParamsSchema = paginationSchema.extend({
  tags: z.array(z.string()).optional(),
  search: z.string().max(255).optional(),
  includeDeleted: z.coerce.boolean().default(false)
});

// ============================================================================
// UPLOAD SCHEMAS
// ============================================================================

export const fileRoleSchema = z.enum([
  "image",
  "pdf",
  "step",
  "csv",
  "export_png",
  "export_svg",
  "export_json"
]);

export const uploadInsertSchema = z.object({
  project_id: uuidSchema,
  file_role: fileRoleSchema,
  file_name: z.string().min(1).max(255),
  content_type: z.string().min(1).max(255),
  file_size: z.number().int().positive().max(104857600), // 100MB max
  file_hash: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const uploadListParamsSchema = paginationSchema.extend({
  projectId: uuidSchema,
  fileRole: fileRoleSchema.optional(),
  status: z.enum(["stored", "failed", "deleted"]).optional()
});

// ============================================================================
// FCF RECORD SCHEMAS
// ============================================================================

export const characteristicSchema = z.enum([
  "position",
  "flatness",
  "perpendicularity",
  "profile",
  "other"
]);

export const unitSchema = z.enum(["mm", "inch"]);

export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const sourceInputTypeSchema = z.enum(["image", "builder", "json"]);

export const validationErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.string().optional(),
  severity: z.enum(["error", "warning"]).optional()
});

export const fcfRecordInsertSchema = z.object({
  project_id: uuidSchema,
  name: z.string().min(1).max(255).trim(),
  characteristic: characteristicSchema,
  feature_type: z.string().max(50).optional(),
  source_unit: unitSchema.default("mm"),
  standard: z.string().max(50).default("ASME_Y14_5_2018"),
  source_input_type: sourceInputTypeSchema,
  fcf_json: fcfJsonSchema,
  parse_confidence: z.number().min(0).max(1).optional(),
  validation_errors: z.array(validationErrorSchema).optional(),
  calc_summary: z.record(z.unknown()).optional(),
  explanation: z.string().max(10000).optional(),
  confidence: confidenceSchema.optional(),
  warnings: z.array(z.string()).optional(),
  source_upload_id: uuidSchema.optional()
});

export const fcfRecordUpdateSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  characteristic: characteristicSchema.optional(),
  feature_type: z.string().max(50).nullable().optional(),
  source_unit: unitSchema.optional(),
  fcf_json: fcfJsonSchema.optional(),
  validation_errors: z.array(validationErrorSchema).nullable().optional(),
  calc_summary: z.record(z.unknown()).nullable().optional(),
  explanation: z.string().max(10000).nullable().optional(),
  confidence: confidenceSchema.nullable().optional(),
  warnings: z.array(z.string()).nullable().optional()
});

export const fcfRecordListParamsSchema = paginationSchema.extend({
  projectId: uuidSchema,
  characteristic: characteristicSchema.optional(),
  search: z.string().max(255).optional(),
  includeDeleted: z.coerce.boolean().default(false)
});

// ============================================================================
// INTERPRETATION RUN SCHEMAS
// ============================================================================

export const runTypeSchema = z.enum(["initial", "retry", "manual_override"]);

export const interpretationRunInsertSchema = z.object({
  fcf_record_id: uuidSchema,
  run_type: runTypeSchema,
  parse_confidence: z.number().min(0).max(1).optional(),
  qa_confidence: confidenceSchema.optional(),
  extraction_json: z.record(z.unknown()).optional(),
  combined_json: z.record(z.unknown()).optional(),
  interpretation_json: z.record(z.unknown()).optional(),
  qa_result: z.record(z.unknown()).optional(),
  warnings: z.array(z.string()).optional()
});

// ============================================================================
// MEASUREMENT SCHEMAS
// ============================================================================

export const calculatorSchema = z.enum([
  "position_mmc",
  "flatness",
  "perpendicularity",
  "profile"
]);

export const measurementTypeSchema = z.enum(["trial", "final"]);

export const measurementInsertSchema = z.object({
  fcf_record_id: uuidSchema,
  calculator: calculatorSchema,
  calculator_version: z.string().min(1).max(50),
  schema_version: z.string().max(50).optional(),
  inputs_json: z.record(z.unknown()),
  results_json: z.record(z.unknown()),
  pass_fail: z.boolean().optional(),
  unit: unitSchema.default("mm"),
  source_unit: unitSchema.default("mm"),
  decimals: z.number().int().min(1).max(4).optional(),
  measurement_type: measurementTypeSchema.optional(),
  notes: z.string().max(2000).optional(),
  conversion_notes: z.string().max(1000).optional()
});

export const measurementListParamsSchema = paginationSchema.extend({
  fcfRecordId: uuidSchema,
  calculator: calculatorSchema.optional(),
  passFail: z.coerce.boolean().optional()
});

// ============================================================================
// USER SETTINGS SCHEMAS
// ============================================================================

export const userSettingsUpdateSchema = z.object({
  unit: unitSchema.optional(),
  decimals: z.number().int().min(1).max(4).optional(),
  dual_display: z.boolean().optional()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ProjectInsertInput = z.infer<typeof projectInsertSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectListParamsInput = z.infer<typeof projectListParamsSchema>;

export type UploadInsertInput = z.infer<typeof uploadInsertSchema>;
export type UploadListParamsInput = z.infer<typeof uploadListParamsSchema>;

export type FcfRecordInsertInput = z.infer<typeof fcfRecordInsertSchema>;
export type FcfRecordUpdateInput = z.infer<typeof fcfRecordUpdateSchema>;
export type FcfRecordListParamsInput = z.infer<typeof fcfRecordListParamsSchema>;

export type InterpretationRunInsertInput = z.infer<typeof interpretationRunInsertSchema>;

export type MeasurementInsertInput = z.infer<typeof measurementInsertSchema>;
export type MeasurementListParamsInput = z.infer<typeof measurementListParamsSchema>;

export type UserSettingsUpdateInput = z.infer<typeof userSettingsUpdateSchema>;
