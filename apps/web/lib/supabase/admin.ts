import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client with service role key.
 * This client bypasses RLS and should only be used in:
 * - Server Actions with proper authorization checks
 * - Webhook handlers
 * - Admin operations
 *
 * SECURITY: Never expose this client to the browser.
 * Always verify the user has permission before using admin operations.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Helper to get user by ID using admin client.
 * Use when you need to look up a user without their session.
 */
export async function getUserById(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error) {
    throw error;
  }

  return data.user;
}

/**
 * Helper to delete a user by ID using admin client.
 * Use for account deletion flows.
 */
export async function deleteUserById(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw error;
  }
}
