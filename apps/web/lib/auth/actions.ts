"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Auth Server Actions
 *
 * These actions handle all authentication flows:
 * - Magic link email sign-in
 * - OAuth sign-in (Google, GitHub)
 * - Sign out
 *
 * All actions use the server-side Supabase client with async cookies.
 */

export type AuthActionResult = {
  error?: string;
  success?: boolean;
};

/**
 * Sign in with magic link email.
 * Sends a one-time login link to the user's email.
 *
 * Note: This action is compatible with useActionState which passes
 * (prevState, formData) as arguments.
 */
export async function signInWithEmail(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please enter a valid email address" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error("[Auth] Magic link error:", error);
    return { error: error.message };
  }

  // Redirect to verification page
  redirect("/verify");
}

/**
 * Sign in with OAuth provider.
 * Redirects to the provider's login page.
 */
export async function signInWithOAuth(
  provider: "google" | "github"
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error("[Auth] OAuth error:", error);
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Failed to get OAuth URL" };
}

/**
 * Sign out the current user.
 * Clears the session and redirects to the login page.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Get the current authenticated user.
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
 * Get the current session.
 * Returns null if no active session.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Update user profile metadata.
 * Requires authentication.
 */
export async function updateProfile(
  formData: FormData
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const fullName = formData.get("fullName") as string;

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
    },
  });

  if (error) {
    console.error("[Auth] Profile update error:", error);
    return { error: error.message };
  }

  revalidatePath("/app/settings");
  return { success: true };
}

/**
 * Update user email.
 * Sends confirmation to both old and new email addresses.
 */
export async function updateEmail(
  formData: FormData
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const newEmail = formData.get("email") as string;

  if (!newEmail) {
    return { error: "Email is required" };
  }

  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    console.error("[Auth] Email update error:", error);
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Delete the current user's account.
 * This is a destructive operation and requires admin client.
 */
export async function deleteAccount(): Promise<AuthActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Import admin client only when needed
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[Auth] Account deletion error:", error);
    return { error: error.message };
  }

  // Sign out and redirect
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
