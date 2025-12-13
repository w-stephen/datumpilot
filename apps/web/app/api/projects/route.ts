/**
 * Projects API Routes
 *
 * GET  /api/projects - List projects for authenticated user
 * POST /api/projects - Create a new project
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  projectInsertSchema,
  projectListParamsSchema
} from "@/lib/database/validation";
import { createClient } from "@/lib/supabase/server";
import type { Project, ApiResult, PaginatedResponse } from "@/lib/database/types";

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

// ============================================================================
// GET /api/projects - List projects
// ============================================================================

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return createApiError("UNAUTHORIZED", "Authentication required", 401);
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const rawParams = {
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    sortBy: searchParams.get("sortBy"),
    sortOrder: searchParams.get("sortOrder"),
    tags: searchParams.getAll("tags"),
    search: searchParams.get("search"),
    includeDeleted: searchParams.get("includeDeleted")
  };

  // Remove null values
  const cleanParams = Object.fromEntries(
    Object.entries(rawParams).filter(([, v]) => v !== null && (Array.isArray(v) ? v.length > 0 : true))
  );

  let params;
  try {
    params = projectListParamsSchema.parse(cleanParams);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }

  // Build query
  let query = supabase
    .from("projects")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order(params.sortBy ?? "created_at", { ascending: params.sortOrder === "asc" });

  if (!params.includeDeleted) {
    query = query.is("deleted_at", null);
  }
  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }
  if (params.tags && params.tags.length > 0) {
    query = query.overlaps("tags", params.tags);
  }

  // Apply pagination
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching projects:", error);
    return createApiError("DATABASE_ERROR", error.message, 500);
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / params.pageSize);

  const response: ApiResult<PaginatedResponse<Project>> = {
    success: true,
    data: {
      data: data as Project[],
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages
      }
    }
  };

  return NextResponse.json(response);
}

// ============================================================================
// POST /api/projects - Create project
// ============================================================================

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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
    input = projectInsertSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }

  // Insert into database
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description,
      tags: input.tags
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") { // unique_violation
      return createApiError("DUPLICATE_NAME", "A project with this name already exists", 409);
    }
    console.error("Error creating project:", error);
    return createApiError("DATABASE_ERROR", error.message, 500);
  }

  const response: ApiResult<Project> = {
    success: true,
    data: data as Project
  };

  return NextResponse.json(response, { status: 201 });
}
