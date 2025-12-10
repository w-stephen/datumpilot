/**
 * Supabase Client Exports
 *
 * Server-side usage:
 *   import { createClient } from "@/lib/supabase/server";
 *
 * Client-side usage:
 *   import { createClient } from "@/lib/supabase/client";
 *
 * Admin operations (server-side only):
 *   import { createAdminClient } from "@/lib/supabase/admin";
 */

// Re-export types for convenience
export type { StorageMetadata, SignedUrlRequest } from "./storage";
export { validateStorageMetadata, createSignedUrl } from "./storage";
