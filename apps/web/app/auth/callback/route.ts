import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth callback handler.
 *
 * This route handles:
 * - OAuth provider redirects (Google, GitHub)
 * - Magic link email confirmations
 * - Password reset confirmations
 *
 * The code is exchanged for a session, then the user is redirected
 * to the app or the specified redirect URL.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("[Auth Callback] OAuth error:", error, errorDescription);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", error);
    if (errorDescription) {
      loginUrl.searchParams.set("error_description", errorDescription);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Code exchange error:", exchangeError);
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", "auth_failed");
      loginUrl.searchParams.set("error_description", exchangeError.message);
      return NextResponse.redirect(loginUrl);
    }

    // Successful authentication - redirect to app or specified URL
    const redirectUrl = new URL(next, origin);
    return NextResponse.redirect(redirectUrl);
  }

  // No code provided - redirect to login
  console.warn("[Auth Callback] No code provided in callback");
  return NextResponse.redirect(new URL("/login?error=no_code", origin));
}
