/**
 * Single Project API Routes
 *
 * GET    /api/projects/[id] - Get project by ID
 * PATCH  /api/projects/[id] - Update project
 * DELETE /api/projects/[id] - Soft delete project
 *
 * Note: Prepared for Supabase integration (Phase 1).
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { projectUpdateSchema, uuidSchema } from "@/lib/database/validation";
import type { Project, ApiResult } from "@/lib/database/types";

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
// GET /api/projects/[id] - Get single project
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
    return createApiError("INVALID_ID", "Invalid project ID format", 400);
  }

  // TODO (Phase 1): Replace with actual Supabase query
  // const supabase = createServerClient(...)
  // const { data, error } = await supabase
  //   .from("projects")
  //   .select("*")
  //   .eq("id", id)
  //   .eq("user_id", userId)
  //   .is("deleted_at", null)
  //   .single();
  //
  // if (error) {
  //   if (error.code === "PGRST116") {
  //     return createApiError("NOT_FOUND", "Project not found", 404);
  //   }
  //   return createApiError("DATABASE_ERROR", error.message, 500);
  // }

  // Mock response for development
  const mockProject: Project = {
    id: id,
    user_id: userId,
    name: "Sample Project",
    description: "A sample project for development",
    tags: ["gdt", "sample"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };

  const response: ApiResult<Project> = {
    success: true,
    data: mockProject
  };

  return NextResponse.json(response);
}

// ============================================================================
// PATCH /api/projects/[id] - Update project
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
    return createApiError("INVALID_ID", "Invalid project ID format", 400);
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
    input = projectUpdateSchema.parse(body);
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

  // TODO (Phase 1): Replace with actual Supabase update
  // const supabase = createServerClient(...)
  // const { data, error } = await supabase
  //   .from("projects")
  //   .update(input)
  //   .eq("id", id)
  //   .eq("user_id", userId)
  //   .is("deleted_at", null)
  //   .select()
  //   .single();
  //
  // if (error) {
  //   if (error.code === "PGRST116") {
  //     return createApiError("NOT_FOUND", "Project not found", 404);
  //   }
  //   if (error.code === "23505") {
  //     return createApiError("DUPLICATE_NAME", "A project with this name already exists", 409);
  //   }
  //   return createApiError("DATABASE_ERROR", error.message, 500);
  // }

  // Mock response for development
  const mockProject: Project = {
    id: id,
    user_id: userId,
    name: input.name ?? "Sample Project",
    description: input.description ?? "A sample project for development",
    tags: input.tags ?? ["gdt", "sample"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };

  const response: ApiResult<Project> = {
    success: true,
    data: mockProject
  };

  return NextResponse.json(response);
}

// ============================================================================
// DELETE /api/projects/[id] - Soft delete project
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
    return createApiError("INVALID_ID", "Invalid project ID format", 400);
  }

  // TODO (Phase 1): Replace with actual Supabase soft delete
  // const supabase = createServerClient(...)
  // const { data, error } = await supabase
  //   .from("projects")
  //   .update({ deleted_at: new Date().toISOString() })
  //   .eq("id", id)
  //   .eq("user_id", userId)
  //   .is("deleted_at", null)
  //   .select()
  //   .single();
  //
  // if (error) {
  //   if (error.code === "PGRST116") {
  //     return createApiError("NOT_FOUND", "Project not found", 404);
  //   }
  //   return createApiError("DATABASE_ERROR", error.message, 500);
  // }

  return NextResponse.json({ success: true, data: { id } });
}
