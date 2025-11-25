/**
 * Uploads API Routes
 *
 * GET  /api/uploads - List uploads for a project
 * POST /api/uploads - Create upload metadata and get signed URL
 *
 * Flow:
 * 1. Client calls POST /api/uploads with file metadata
 * 2. Server validates, creates upload record, returns signed URL
 * 3. Client uploads file directly to storage using signed URL
 * 4. Client calls PATCH /api/uploads/[id] to confirm upload success
 *
 * Note: Prepared for Supabase integration (Phase 1).
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  uploadInsertSchema,
  uploadListParamsSchema,
  uuidSchema
} from "@/lib/database/validation";
import type { Upload, ApiResult, PaginatedResponse, StorageMetadataJson } from "@/lib/database/types";

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_BUCKET = "uploads";
const SIGNED_URL_EXPIRES_IN = 3600; // 1 hour

// Content type to file role mapping for validation
const ALLOWED_CONTENT_TYPES: Record<string, string[]> = {
  image: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  pdf: ["application/pdf"],
  step: ["application/step", "application/octet-stream"],
  csv: ["text/csv", "application/csv"],
  export_png: ["image/png"],
  export_svg: ["image/svg+xml"],
  export_json: ["application/json"]
};

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

function generateStoragePath(projectId: string, uploadId: string, fileName: string): string {
  // Structure: projects/{project_id}/uploads/{upload_id}/{sanitized_filename}
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `projects/${projectId}/uploads/${uploadId}/${sanitizedName}`;
}

function validateContentType(fileRole: string, contentType: string): boolean {
  const allowed = ALLOWED_CONTENT_TYPES[fileRole];
  if (!allowed) return false;
  return allowed.includes(contentType);
}

// ============================================================================
// GET /api/uploads - List uploads for a project
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
    fileRole: searchParams.get("fileRole"),
    status: searchParams.get("status")
  };

  // Remove null values
  const cleanParams = Object.fromEntries(
    Object.entries(rawParams).filter(([, v]) => v !== null)
  );

  let params;
  try {
    params = uploadListParamsSchema.parse(cleanParams);
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
  //   .from("uploads")
  //   .select("*", { count: "exact" })
  //   .eq("project_id", params.projectId)
  //   .order(params.sortBy ?? "created_at", { ascending: params.sortOrder === "asc" })
  //   .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1);
  //
  // if (params.fileRole) query = query.eq("file_role", params.fileRole);
  // if (params.status) query = query.eq("status", params.status);

  // Mock response for development
  const mockUploads: Upload[] = [];

  const response: ApiResult<PaginatedResponse<Upload>> = {
    success: true,
    data: {
      data: mockUploads,
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
// POST /api/uploads - Create upload and get signed URL
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
    input = uploadInsertSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }

  // Validate content type for file role
  if (!validateContentType(input.file_role, input.content_type)) {
    return createApiError(
      "INVALID_CONTENT_TYPE",
      `Content type '${input.content_type}' is not allowed for file role '${input.file_role}'`,
      400
    );
  }

  // Validate project ID format
  const projectIdResult = uuidSchema.safeParse(input.project_id);
  if (!projectIdResult.success) {
    return createApiError("INVALID_PROJECT_ID", "Invalid project ID format", 400);
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
  //
  // // Check upload count quota
  // const { count } = await supabase
  //   .from("uploads")
  //   .select("*", { count: "exact", head: true })
  //   .eq("project_id", input.project_id)
  //   .neq("status", "deleted");
  //
  // if (count >= project.project_quotas.max_upload_count) {
  //   return createApiError("QUOTA_EXCEEDED", "Upload count quota exceeded", 403);
  // }

  // Generate IDs and paths
  const uploadId = crypto.randomUUID();
  const storagePath = generateStoragePath(input.project_id, uploadId, input.file_name);

  // Create storage metadata that will be attached to the storage object
  const storageMetadata: StorageMetadataJson = {
    upload_id: uploadId,
    project_id: input.project_id,
    owner_user_id: userId,
    content_type: input.content_type
  };

  // TODO (Phase 1): Create upload record and signed URL
  // const supabase = createServerClient(...)
  //
  // // Insert upload record
  // const { data: upload, error: insertError } = await supabase
  //   .from("uploads")
  //   .insert({
  //     id: uploadId,
  //     project_id: input.project_id,
  //     created_by: userId,
  //     file_role: input.file_role,
  //     storage_bucket: STORAGE_BUCKET,
  //     storage_path: storagePath,
  //     file_name: input.file_name,
  //     content_type: input.content_type,
  //     file_size: input.file_size,
  //     file_hash: input.file_hash,
  //     status: "stored",
  //     metadata: input.metadata ?? {},
  //     storage_metadata: storageMetadata
  //   })
  //   .select()
  //   .single();
  //
  // if (insertError) {
  //   return createApiError("DATABASE_ERROR", insertError.message, 500);
  // }
  //
  // // Generate signed upload URL
  // const { data: signedUrl, error: signedUrlError } = await supabase.storage
  //   .from(STORAGE_BUCKET)
  //   .createSignedUploadUrl(storagePath, {
  //     upsert: false
  //   });
  //
  // if (signedUrlError) {
  //   // Rollback upload record
  //   await supabase.from("uploads").delete().eq("id", uploadId);
  //   return createApiError("STORAGE_ERROR", signedUrlError.message, 500);
  // }

  // Mock response for development
  const mockUpload: Upload = {
    id: uploadId,
    project_id: input.project_id,
    created_by: userId,
    file_role: input.file_role,
    storage_bucket: STORAGE_BUCKET,
    storage_path: storagePath,
    file_name: input.file_name,
    content_type: input.content_type,
    file_size: input.file_size,
    file_hash: input.file_hash ?? null,
    status: "stored",
    metadata: input.metadata ?? {},
    storage_metadata: storageMetadata,
    created_at: new Date().toISOString(),
    deleted_at: null
  };

  const response: ApiResult<{
    upload: Upload;
    signedUrl: string;
    expiresIn: number;
  }> = {
    success: true,
    data: {
      upload: mockUpload,
      signedUrl: `https://example.supabase.co/storage/v1/object/sign/${STORAGE_BUCKET}/${storagePath}?token=mock_token`,
      expiresIn: SIGNED_URL_EXPIRES_IN
    }
  };

  return NextResponse.json(response, { status: 201 });
}
