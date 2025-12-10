import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js Middleware for authentication and session management.
 *
 * Runs on every request to:
 * - Refresh Supabase auth tokens before they expire
 * - Protect /app/* routes from unauthenticated access
 * - Redirect authenticated users away from login/signup pages
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Static assets (svg, png, jpg, etc.)
     * - API routes that don't need session (webhooks, health checks)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
