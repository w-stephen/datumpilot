/**
 * Database Types for DatumPilot
 *
 * These types mirror the Supabase/Postgres schema defined in:
 * infra/supabase/migrations/001_init.sql
 *
 * Note: When Supabase client is implemented (Phase 1/4), these should be
 * auto-generated using `supabase gen types typescript`.
 */

import { FcfJson, Characteristic, Unit } from "@/lib/fcf/schema";

// ============================================================================
// ENUMS (matching SQL CHECK constraints)
// ============================================================================

export type FileRole = "image" | "pdf" | "step" | "csv" | "export_png" | "export_svg" | "export_json";
export type UploadStatus = "stored" | "failed" | "deleted";
export type SourceInputType = "image" | "builder" | "json";
export type Confidence = "high" | "medium" | "low";
export type Calculator = "position_mmc" | "flatness" | "perpendicularity" | "profile";
export type RunType = "initial" | "retry" | "manual_override";
export type MeasurementType = "trial" | "final";

// ============================================================================
// BASE TYPES
// ============================================================================

export interface Timestamps {
  created_at: string; // ISO 8601 timestamptz
  updated_at?: string;
}

export interface SoftDelete {
  deleted_at?: string | null;
}

// ============================================================================
// PROJECTS
// ============================================================================

export interface Project extends Timestamps, SoftDelete {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  tags: string[];
}

export interface ProjectInsert {
  name: string;
  description?: string | null;
  tags?: string[];
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  tags?: string[];
}

// ============================================================================
// PROJECT QUOTAS
// ============================================================================

export interface ProjectQuota extends Timestamps {
  project_id: string;
  max_upload_bytes: number;
  max_upload_count: number;
  max_fcf_records: number;
  max_measurements: number;
  max_interpretation_runs: number;
}

// ============================================================================
// UPLOADS
// ============================================================================

export interface Upload extends SoftDelete {
  id: string;
  project_id: string;
  created_by: string;
  file_role: FileRole;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  file_size: number;
  file_hash?: string | null;
  status: UploadStatus;
  metadata: Record<string, unknown>;
  storage_metadata: StorageMetadataJson;
  created_at: string;
}

export interface StorageMetadataJson {
  upload_id: string;
  project_id: string;
  owner_user_id: string;
  content_type?: string;
}

export interface UploadInsert {
  project_id: string;
  file_role: FileRole;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  file_size: number;
  file_hash?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// FCF RECORDS
// ============================================================================

export interface FcfRecord extends Timestamps, SoftDelete {
  id: string;
  project_id: string;
  characteristic: Characteristic;
  feature_type?: string | null;
  source_unit: Unit;
  standard: string;
  name: string;
  source_input_type: SourceInputType;
  fcf_json: FcfJson;
  parse_confidence?: number | null;
  validation_errors?: ValidationErrorJson[] | null;
  calc_summary?: Record<string, unknown> | null;
  explanation?: string | null;
  confidence?: Confidence | null;
  warnings?: string[] | null;
  source_upload_id?: string | null;
  created_by: string;
}

export interface ValidationErrorJson {
  code: string;
  message: string;
  path?: string;
  severity?: "error" | "warning";
}

export interface FcfRecordInsert {
  project_id: string;
  name: string;
  characteristic: Characteristic;
  feature_type?: string;
  source_unit?: Unit;
  standard?: string;
  source_input_type: SourceInputType;
  fcf_json: FcfJson;
  parse_confidence?: number;
  validation_errors?: ValidationErrorJson[];
  calc_summary?: Record<string, unknown>;
  explanation?: string;
  confidence?: Confidence;
  warnings?: string[];
  source_upload_id?: string;
}

export interface FcfRecordUpdate {
  name?: string;
  characteristic?: Characteristic;
  feature_type?: string;
  source_unit?: Unit;
  fcf_json?: FcfJson;
  validation_errors?: ValidationErrorJson[];
  calc_summary?: Record<string, unknown>;
  explanation?: string;
  confidence?: Confidence;
  warnings?: string[];
}

// ============================================================================
// FCF INTERPRETATION RUNS
// ============================================================================

export interface FcfInterpretationRun {
  id: string;
  fcf_record_id: string;
  run_type: RunType;
  parse_confidence?: number | null;
  qa_confidence?: Confidence | null;
  extraction_json?: Record<string, unknown> | null;
  combined_json?: Record<string, unknown> | null;
  interpretation_json?: Record<string, unknown> | null;
  qa_result?: Record<string, unknown> | null;
  warnings?: string[] | null;
  created_by: string;
  created_at: string;
}

export interface FcfInterpretationRunInsert {
  fcf_record_id: string;
  run_type: RunType;
  parse_confidence?: number;
  qa_confidence?: Confidence;
  extraction_json?: Record<string, unknown>;
  combined_json?: Record<string, unknown>;
  interpretation_json?: Record<string, unknown>;
  qa_result?: Record<string, unknown>;
  warnings?: string[];
}

// ============================================================================
// MEASUREMENTS
// ============================================================================

export interface Measurement {
  id: string;
  fcf_record_id: string;
  calculator: Calculator;
  calculator_version: string;
  schema_version?: string | null;
  inputs_json: Record<string, unknown>;
  results_json: Record<string, unknown>;
  pass_fail?: boolean | null;
  unit: Unit;
  source_unit: Unit;
  decimals?: number | null;
  measurement_type?: MeasurementType | null;
  notes?: string | null;
  conversion_notes?: string | null;
  created_by: string;
  created_at: string;
}

export interface MeasurementInsert {
  fcf_record_id: string;
  calculator: Calculator;
  calculator_version: string;
  schema_version?: string;
  inputs_json: Record<string, unknown>;
  results_json: Record<string, unknown>;
  pass_fail?: boolean;
  unit?: Unit;
  source_unit?: Unit;
  decimals?: number;
  measurement_type?: MeasurementType;
  notes?: string;
  conversion_notes?: string;
}

// ============================================================================
// USER SETTINGS
// ============================================================================

export interface UserSettings {
  user_id: string;
  unit: Unit;
  decimals: number;
  dual_display: boolean;
  updated_at: string;
}

export interface UserSettingsUpdate {
  unit?: Unit;
  decimals?: number;
  dual_display?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export interface ListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProjectListParams extends ListParams {
  tags?: string[];
  search?: string;
  includeDeleted?: boolean;
}

export interface FcfRecordListParams extends ListParams {
  projectId: string;
  characteristic?: Characteristic;
  search?: string;
  includeDeleted?: boolean;
}

export interface MeasurementListParams extends ListParams {
  fcfRecordId: string;
  calculator?: Calculator;
  passFail?: boolean;
}
