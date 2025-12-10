import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client for server-side operations.
 * Uses Next.js 16 async cookies() API.
 *
 * Use this in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 */
export async function createClient() {
  const cookieStore = await cookies(); // Next.js 16: async cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component where cookies can't be set
            // This is expected behavior - cookies will be set by middleware
          }
        },
      },
    }
  );
}

/**
 * Helper to get the current authenticated user.
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Helper to get the current session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Helper to require authentication.
 * Throws if not authenticated - use in server actions/API routes.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
