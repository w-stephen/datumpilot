/**
 * Measurements API Routes
 *
 * GET  /api/measurements - List measurements for an FCF record
 * POST /api/measurements - Create a new measurement
 *
 * Measurements store calculator inputs and results for reproducibility.
 * Each measurement is immutable once created (append-only).
 *
 * Note: Prepared for Supabase integration (Phase 1).
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  measurementInsertSchema,
  measurementListParamsSchema
} from "@/lib/database/validation";
import type { Measurement, ApiResult, PaginatedResponse } from "@/lib/database/types";

// ============================================================================
// CONSTANTS
// ============================================================================

const CALCULATOR_VERSION = "1.0.0";

// ============================================================================
// HELPERS
// ============================================================================

function createApiError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details }
    },
    { status }
  );
}

function handleValidationError(error: ZodError) {
  return createApiError(
    "VALIDATION_ERROR",
    "Invalid request parameters",
    400,
    error.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message
    }))
  );
}

// Placeholder: Extract user ID from auth session
// TODO (Phase 1): Replace with actual Supabase auth
function getUserId(_request: NextRequest): string | null {
  return "00000000-0000-0000-0000-000000000001";
}

// ============================================================================
// GET /api/measurements - List measurements for an FCF record
// ============================================================================

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return createApiError("UNAUTHORIZED", "Authentication required", 401);
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const rawParams = {
    fcfRecordId: searchParams.get("fcfRecordId"),
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    sortBy: searchParams.get("sortBy"),
    sortOrder: searchParams.get("sortOrder"),
    calculator: searchParams.get("calculator"),
    passFail: searchParams.get("passFail")
  };

  // Remove null values
  const cleanParams = Object.fromEntries(
    Object.entries(rawParams).filter(([, v]) => v !== null)
  );

  let params;
  try {
    params = measurementListParamsSchema.parse(cleanParams);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }

  // TODO (Phase 1): Verify user owns the FCF record (through project)
  // const supabase = createServerClient(...)
  // const { data: fcfRecord } = await supabase
  //   .from("fcf_records")
  //   .select(`
  //     id,
  //     projects!inner(user_id)
  //   `)
  //   .eq("id", params.fcfRecordId)
  //   .eq("projects.user_id", userId)
  //   .is("deleted_at", null)
  //   .single();
  //
  // if (!fcfRecord) {
  //   return createApiError("NOT_FOUND", "FCF record not found", 404);
  // }

  // TODO (Phase 1): Replace with actual Supabase query
  // let query = supabase
  //   .from("measurements")
  //   .select("*", { count: "exact" })
  //   .eq("fcf_record_id", params.fcfRecordId)
  //   .order(params.sortBy ?? "created_at", { ascending: params.sortOrder === "asc" })
  //   .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1);
  //
  // if (params.calculator) query = query.eq("calculator", params.calculator);
  // if (params.passFail !== undefined) query = query.eq("pass_fail", params.passFail);

  // Mock response for development
  const mockMeasurements: Measurement[] = [];

  const response: ApiResult<PaginatedResponse<Measurement>> = {
    success: true,
    data: {
      data: mockMeasurements,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total: 0,
        totalPages: 0
      }
    }
  };

  return NextResponse.json(response);
}

// ============================================================================
// POST /api/measurements - Create measurement
// ============================================================================

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return createApiError("UNAUTHORIZED", "Authentication required", 401);
  }

  // Parse and validate body
  let body;
  try {
    body = await request.json();
  } catch {
    return createApiError("INVALID_JSON", "Request body must be valid JSON", 400);
  }

  let input;
  try {
    input = measurementInsertSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }

  // TODO (Phase 1): Verify user owns the FCF record (through project) and check quotas
  // const supabase = createServerClient(...)
  // const { data: fcfRecord } = await supabase
  //   .from("fcf_records")
  //   .select(`
  //     id,
  //     project_id,
  //     projects!inner(
  //       user_id,
  //       project_quotas(max_measurements)
  //     )
  //   `)
  //   .eq("id", input.fcf_record_id)
  //   .eq("projects.user_id", userId)
  //   .is("deleted_at", null)
  //   .single();
  //
  // if (!fcfRecord) {
  //   return createApiError("NOT_FOUND", "FCF record not found", 404);
  // }
  //
  // // Check measurement quota
  // const { count } = await supabase
  //   .from("measurements")
  //   .select("*", { count: "exact", head: true })
  //   .eq("fcf_record_id", input.fcf_record_id);
  //
  // if (count >= fcfRecord.projects.project_quotas.max_measurements) {
  //   return createApiError("QUOTA_EXCEEDED", "Measurement quota exceeded", 403);
  // }

  // TODO (Phase 1): Replace with actual Supabase insert
  // const { data, error } = await supabase
  //   .from("measurements")
  //   .insert({
  //     fcf_record_id: input.fcf_record_id,
  //     created_by: userId,
  //     calculator: input.calculator,
  //     calculator_version: input.calculator_version,
  //     schema_version: input.schema_version,
  //     inputs_json: input.inputs_json,
  //     results_json: input.results_json,
  //     pass_fail: input.pass_fail,
  //     unit: input.unit,
  //     source_unit: input.source_unit,
  //     decimals: input.decimals,
  //     measurement_type: input.measurement_type,
  //     notes: input.notes,
  //     conversion_notes: input.conversion_notes
  //   })
  //   .select()
  //   .single();
  //
  // if (error) {
  //   return createApiError("DATABASE_ERROR", error.message, 500);
  // }

  // Mock response for development
  const mockMeasurement: Measurement = {
    id: crypto.randomUUID(),
    fcf_record_id: input.fcf_record_id,
    created_by: userId,
    calculator: input.calculator,
    calculator_version: input.calculator_version || CALCULATOR_VERSION,
    schema_version: input.schema_version ?? null,
    inputs_json: input.inputs_json,
    results_json: input.results_json,
    pass_fail: input.pass_fail ?? null,
    unit: input.unit ?? "mm",
    source_unit: input.source_unit ?? "mm",
    decimals: input.decimals ?? null,
    measurement_type: input.measurement_type ?? null,
    notes: input.notes ?? null,
    conversion_notes: input.conversion_notes ?? null,
    created_at: new Date().toISOString()
  };

  const response: ApiResult<Measurement> = {
    success: true,
    data: mockMeasurement
  };

  return NextResponse.json(response, { status: 201 });
}
