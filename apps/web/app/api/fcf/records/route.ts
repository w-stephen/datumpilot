/**
 * FCF Records API Routes
 *
 * GET  /api/fcf/records - List FCF records for a project
 * POST /api/fcf/records - Create a new FCF record
 *
 * Note: Prepared for Supabase integration (Phase 1).
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  fcfRecordInsertSchema,
  fcfRecordListParamsSchema
} from "@/lib/database/validation";
import { validateFcf } from "@/lib/rules/validateFcf";
import type { FcfRecord, ApiResult, PaginatedResponse } from "@/lib/database/types";

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
// GET /api/fcf/records - List FCF records for a project
// ============================================================================

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return createApiError("UNAUTHORIZED", "Authentication required", 401);
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const rawParams = {
    projectId: searchParams.get("projectId"),
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    sortBy: searchParams.get("sortBy"),
    sortOrder: searchParams.get("sortOrder"),
    characteristic: searchParams.get("characteristic"),
    search: searchParams.get("search"),
    includeDeleted: searchParams.get("includeDeleted")
  };

  // Remove null values
  const cleanParams = Object.fromEntries(
    Object.entries(rawParams).filter(([, v]) => v !== null)
  );

  let params;
  try {
    params = fcfRecordListParamsSchema.parse(cleanParams);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }

  // TODO (Phase 1): Verify user owns the project first
  // const supabase = createServerClient(...)
  // const { data: project } = await supabase
  //   .from("projects")
  //   .select("id")
  //   .eq("id", params.projectId)
  //   .eq("user_id", userId)
  //   .is("deleted_at", null)
  //   .single();
  // if (!project) {
  //   return createApiError("NOT_FOUND", "Project not found", 404);
  // }

  // TODO (Phase 1): Replace with actual Supabase query
  // let query = supabase
  //   .from("fcf_records")
  //   .select("*", { count: "exact" })
  //   .eq("project_id", params.projectId)
  //   .order(params.sortBy ?? "created_at", { ascending: params.sortOrder === "asc" })
  //   .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1);
  //
  // if (!params.includeDeleted) {
  //   query = query.is("deleted_at", null);
  // }
  // if (params.characteristic) {
  //   query = query.eq("characteristic", params.characteristic);
  // }
  // if (params.search) {
  //   query = query.ilike("name", `%${params.search}%`);
  // }

  // Mock response for development
  const mockRecords: FcfRecord[] = [];

  const response: ApiResult<PaginatedResponse<FcfRecord>> = {
    success: true,
    data: {
      data: mockRecords,
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
// POST /api/fcf/records - Create FCF record
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
    input = fcfRecordInsertSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }

  // Run deterministic validation on the FCF JSON
  const validationResult = validateFcf(input.fcf_json);

  // Store validation errors in the record
  const validationErrors = validationResult.issues.map((issue) => ({
    code: issue.code,
    message: issue.message,
    path: issue.path,
    severity: issue.severity
  }));

  // Determine confidence based on validation
  let confidence: "high" | "medium" | "low" = "high";
  if (validationResult.errors.length > 0) {
    confidence = "low";
  } else if (validationResult.warnings.length > 0) {
    confidence = "medium";
  }

  // TODO (Phase 1): Verify user owns the project and check quotas
  // const supabase = createServerClient(...)
  // const { data: project } = await supabase
  //   .from("projects")
  //   .select("id, project_quotas(*)")
  //   .eq("id", input.project_id)
  //   .eq("user_id", userId)
  //   .is("deleted_at", null)
  //   .single();
  //
  // if (!project) {
  //   return createApiError("NOT_FOUND", "Project not found", 404);
  // }

  // TODO (Phase 1): Replace with actual Supabase insert
  // const { data, error } = await supabase
  //   .from("fcf_records")
  //   .insert({
  //     project_id: input.project_id,
  //     created_by: userId,
  //     name: input.name,
  //     characteristic: input.characteristic,
  //     feature_type: input.feature_type,
  //     source_unit: input.source_unit,
  //     standard: input.standard,
  //     source_input_type: input.source_input_type,
  //     fcf_json: input.fcf_json,
  //     parse_confidence: input.parse_confidence,
  //     validation_errors: validationErrors,
  //     calc_summary: input.calc_summary,
  //     explanation: input.explanation,
  //     confidence: confidence,
  //     warnings: validationResult.warnings.map(w => w.message),
  //     source_upload_id: input.source_upload_id
  //   })
  //   .select()
  //   .single();
  //
  // if (error) {
  //   if (error.code === "23505") { // unique_violation
  //     return createApiError("DUPLICATE_NAME", "An FCF record with this name already exists in this project", 409);
  //   }
  //   return createApiError("DATABASE_ERROR", error.message, 500);
  // }

  // Mock response for development
  const mockRecord: FcfRecord = {
    id: crypto.randomUUID(),
    project_id: input.project_id,
    created_by: userId,
    name: input.name,
    characteristic: input.characteristic,
    feature_type: input.feature_type ?? null,
    source_unit: input.source_unit ?? "mm",
    standard: input.standard ?? "ASME_Y14_5_2018",
    source_input_type: input.source_input_type,
    fcf_json: input.fcf_json,
    parse_confidence: input.parse_confidence ?? null,
    validation_errors: validationErrors.length > 0 ? validationErrors : null,
    calc_summary: input.calc_summary ?? null,
    explanation: input.explanation ?? null,
    confidence: confidence,
    warnings: validationResult.warnings.length > 0
      ? validationResult.warnings.map((w) => w.message)
      : null,
    source_upload_id: input.source_upload_id ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };

  const response: ApiResult<{
    record: FcfRecord;
    validation: {
      valid: boolean;
      errorCount: number;
      warningCount: number;
    };
  }> = {
    success: true,
    data: {
      record: mockRecord,
      validation: {
        valid: validationResult.valid,
        errorCount: validationResult.summary.errorCount,
        warningCount: validationResult.summary.warningCount
      }
    }
  };

  return NextResponse.json(response, { status: 201 });
}
