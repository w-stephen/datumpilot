/**
 * Single FCF Record API Routes
 *
 * GET    /api/fcf/records/[id] - Get FCF record by ID
 * PATCH  /api/fcf/records/[id] - Update FCF record
 * DELETE /api/fcf/records/[id] - Soft delete FCF record
 *
 * Note: Prepared for Supabase integration (Phase 1).
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { fcfRecordUpdateSchema, uuidSchema } from "@/lib/database/validation";
import { validateFcf } from "@/lib/rules/validateFcf";
import type { FcfRecord, ApiResult } from "@/lib/database/types";

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ============================================================================
// GET /api/fcf/records/[id] - Get single FCF record
// ============================================================================

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = getUserId(request);
  if (!userId) {
    return createApiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await context.params;

  // Validate ID format
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return createApiError("INVALID_ID", "Invalid FCF record ID format", 400);
  }

  // TODO (Phase 1): Replace with actual Supabase query
  // const supabase = createServerClient(...)
  // const { data, error } = await supabase
  //   .from("fcf_records")
  //   .select(`
  //     *,
  //     projects!inner(user_id)
  //   `)
  //   .eq("id", id)
  //   .eq("projects.user_id", userId)
  //   .is("deleted_at", null)
  //   .single();
  //
  // if (error) {
  //   if (error.code === "PGRST116") {
  //     return createApiError("NOT_FOUND", "FCF record not found", 404);
  //   }
  //   return createApiError("DATABASE_ERROR", error.message, 500);
  // }

  // Mock response for development
  const mockRecord: FcfRecord = {
    id: id,
    project_id: "11111111-1111-1111-1111-111111111111",
    created_by: userId,
    name: "Sample FCF Record",
    characteristic: "position",
    feature_type: "hole",
    source_unit: "mm",
    standard: "ASME_Y14_5_2018",
    source_input_type: "builder",
    fcf_json: {
      characteristic: "position",
      featureType: "hole",
      sourceUnit: "mm",
      source: { inputType: "builder" },
      tolerance: { value: 0.1, diameter: true, materialCondition: "MMC" },
      datums: [{ id: "A" }, { id: "B" }, { id: "C" }]
    },
    parse_confidence: null,
    validation_errors: null,
    calc_summary: null,
    explanation: null,
    confidence: "high",
    warnings: null,
    source_upload_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };

  const response: ApiResult<FcfRecord> = {
    success: true,
    data: mockRecord
  };

  return NextResponse.json(response);
}

// ============================================================================
// PATCH /api/fcf/records/[id] - Update FCF record
// ============================================================================

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = getUserId(request);
  if (!userId) {
    return createApiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await context.params;

  // Validate ID format
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return createApiError("INVALID_ID", "Invalid FCF record ID format", 400);
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
    input = fcfRecordUpdateSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }

  // Check if there's anything to update
  if (Object.keys(input).length === 0) {
    return createApiError("EMPTY_UPDATE", "No fields to update", 400);
  }

  // If FCF JSON is being updated, re-validate it
  let validationErrors = null;
  let warnings = null;
  let confidence: "high" | "medium" | "low" | undefined;

  if (input.fcf_json) {
    const validationResult = validateFcf(input.fcf_json);
    validationErrors = validationResult.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: issue.path,
      severity: issue.severity
    }));
    warnings = validationResult.warnings.map((w) => w.message);

    if (validationResult.errors.length > 0) {
      confidence = "low";
    } else if (validationResult.warnings.length > 0) {
      confidence = "medium";
    } else {
      confidence = "high";
    }
  }

  // TODO (Phase 1): Replace with actual Supabase update
  // const supabase = createServerClient(...)
  //
  // // First verify ownership
  // const { data: existing } = await supabase
  //   .from("fcf_records")
  //   .select(`
  //     *,
  //     projects!inner(user_id)
  //   `)
  //   .eq("id", id)
  //   .eq("projects.user_id", userId)
  //   .is("deleted_at", null)
  //   .single();
  //
  // if (!existing) {
  //   return createApiError("NOT_FOUND", "FCF record not found", 404);
  // }
  //
  // const updateData = {
  //   ...input,
  //   ...(validationErrors && { validation_errors: validationErrors }),
  //   ...(warnings && { warnings }),
  //   ...(confidence && { confidence })
  // };
  //
  // const { data, error } = await supabase
  //   .from("fcf_records")
  //   .update(updateData)
  //   .eq("id", id)
  //   .select()
  //   .single();
  //
  // if (error) {
  //   if (error.code === "23505") {
  //     return createApiError("DUPLICATE_NAME", "An FCF record with this name already exists", 409);
  //   }
  //   return createApiError("DATABASE_ERROR", error.message, 500);
  // }

  // Mock response for development
  const mockRecord: FcfRecord = {
    id: id,
    project_id: "11111111-1111-1111-1111-111111111111",
    created_by: userId,
    name: input.name ?? "Sample FCF Record",
    characteristic: input.characteristic ?? "position",
    feature_type: input.feature_type ?? "hole",
    source_unit: input.source_unit ?? "mm",
    standard: "ASME_Y14_5_2018",
    source_input_type: "builder",
    fcf_json: input.fcf_json ?? {
      characteristic: "position",
      featureType: "hole",
      sourceUnit: "mm",
      source: { inputType: "builder" },
      tolerance: { value: 0.1, diameter: true, materialCondition: "MMC" },
      datums: [{ id: "A" }, { id: "B" }, { id: "C" }]
    },
    parse_confidence: null,
    validation_errors: validationErrors,
    calc_summary: input.calc_summary ?? null,
    explanation: input.explanation ?? null,
    confidence: confidence ?? "high",
    warnings: warnings,
    source_upload_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };

  const response: ApiResult<FcfRecord> = {
    success: true,
    data: mockRecord
  };

  return NextResponse.json(response);
}

// ============================================================================
// DELETE /api/fcf/records/[id] - Soft delete FCF record
// ============================================================================

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = getUserId(request);
  if (!userId) {
    return createApiError("UNAUTHORIZED", "Authentication required", 401);
  }

  const { id } = await context.params;

  // Validate ID format
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return createApiError("INVALID_ID", "Invalid FCF record ID format", 400);
  }

  // TODO (Phase 1): Replace with actual Supabase soft delete
  // const supabase = createServerClient(...)
  //
  // // First verify ownership
  // const { data: existing } = await supabase
  //   .from("fcf_records")
  //   .select(`
  //     *,
  //     projects!inner(user_id)
  //   `)
  //   .eq("id", id)
  //   .eq("projects.user_id", userId)
  //   .is("deleted_at", null)
  //   .single();
  //
  // if (!existing) {
  //   return createApiError("NOT_FOUND", "FCF record not found", 404);
  // }
  //
  // const { error } = await supabase
  //   .from("fcf_records")
  //   .update({ deleted_at: new Date().toISOString() })
  //   .eq("id", id);
  //
  // if (error) {
  //   return createApiError("DATABASE_ERROR", error.message, 500);
  // }

  return NextResponse.json({ success: true, data: { id } });
}
