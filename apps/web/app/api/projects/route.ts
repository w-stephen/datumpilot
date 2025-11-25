/**
 * Projects API Routes
 *
 * GET  /api/projects - List projects for authenticated user
 * POST /api/projects - Create a new project
 *
 * Note: These routes are prepared for Supabase integration (Phase 1).
 * Currently they validate inputs and return structured responses.
 * When Supabase client is implemented, replace mock responses with actual queries.
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  projectInsertSchema,
  projectListParamsSchema
} from "@/lib/database/validation";
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

// Placeholder: Extract user ID from auth session
// TODO (Phase 1): Replace with actual Supabase auth
function getUserId(_request: NextRequest): string | null {
  // In Phase 1, this will use:
  // const supabase = createServerClient(...)
  // const { data: { user } } = await supabase.auth.getUser()
  // return user?.id ?? null

  // For now, return a mock user ID for development
  // In production, this MUST return null if not authenticated
  return "00000000-0000-0000-0000-000000000001";
}

// ============================================================================
// GET /api/projects - List projects
// ============================================================================

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
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

  // TODO (Phase 1): Replace with actual Supabase query
  // const supabase = createServerClient(...)
  // let query = supabase
  //   .from("projects")
  //   .select("*", { count: "exact" })
  //   .eq("user_id", userId)
  //   .order(params.sortBy ?? "created_at", { ascending: params.sortOrder === "asc" })
  //   .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1);
  //
  // if (!params.includeDeleted) {
  //   query = query.is("deleted_at", null);
  // }
  // if (params.search) {
  //   query = query.ilike("name", `%${params.search}%`);
  // }
  // if (params.tags?.length) {
  //   query = query.overlaps("tags", params.tags);
  // }

  // Mock response for development
  const mockProjects: Project[] = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      user_id: userId,
      name: "Sample Project",
      description: "A sample project for development",
      tags: ["gdt", "sample"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    }
  ];

  const response: ApiResult<PaginatedResponse<Project>> = {
    success: true,
    data: {
      data: mockProjects,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total: mockProjects.length,
        totalPages: 1
      }
    }
  };

  return NextResponse.json(response);
}

// ============================================================================
// POST /api/projects - Create project
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
    input = projectInsertSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }

  // TODO (Phase 1): Replace with actual Supabase insert
  // const supabase = createServerClient(...)
  // const { data, error } = await supabase
  //   .from("projects")
  //   .insert({
  //     user_id: userId,
  //     name: input.name,
  //     description: input.description,
  //     tags: input.tags
  //   })
  //   .select()
  //   .single();
  //
  // if (error) {
  //   if (error.code === "23505") { // unique_violation
  //     return createApiError("DUPLICATE_NAME", "A project with this name already exists", 409);
  //   }
  //   return createApiError("DATABASE_ERROR", error.message, 500);
  // }

  // Mock response for development
  const mockProject: Project = {
    id: crypto.randomUUID(),
    user_id: userId,
    name: input.name,
    description: input.description ?? null,
    tags: input.tags,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null
  };

  const response: ApiResult<Project> = {
    success: true,
    data: mockProject
  };

  return NextResponse.json(response, { status: 201 });
}
