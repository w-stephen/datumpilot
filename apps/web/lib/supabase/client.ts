"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser-side operations.
 *
 * Use this in:
 * - Client Components
 * - Event handlers
 * - Real-time subscriptions
 *
 * Note: This client uses the anon key and respects RLS policies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
