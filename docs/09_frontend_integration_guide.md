# Frontend Integration Guide (Phases 1 & 4)

This document provides implementation instructions for connecting the frontend to Supabase. Follow these steps when you begin frontend development.

## Quick Reference

| Phase | Component | Status | Location |
|-------|-----------|--------|----------|
| Phase 1 | Supabase Server Client | Pending | `lib/supabase/serverClient.ts` |
| Phase 1 | Supabase Browser Client | Pending | `lib/supabase/browserClient.ts` |
| Phase 1 | Auth Middleware | Pending | `middleware.ts` |
| Phase 4 | Generated Types | Pending | `lib/database.types.ts` |
| Phase 4 | Typed Query Helpers | Pending | `lib/supabase/queries.ts` |

---

## Phase 1: Core Infrastructure

### 1.1 Install Dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 1.2 Supabase Server Client

Replace the placeholder in `apps/web/lib/supabase/serverClient.ts`:

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignore - called from Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    }
  );
}

// Service role client for admin operations (server-only)
export function getSupabaseServiceClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

### 1.3 Supabase Browser Client

Create `apps/web/lib/supabase/browserClient.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export function getSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 1.4 Auth Middleware

Create `apps/web/middleware.ts`:

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ["/app", "/api/projects", "/api/fcf", "/api/uploads", "/api/measurements"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Public routes - redirect to app if authenticated
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isPublicPath && user) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### 1.5 Update API Routes

Replace the `getUserId` placeholder in each API route:

```typescript
// Before (placeholder)
function getUserId(_request: NextRequest): string | null {
  return "00000000-0000-0000-0000-000000000001";
}

// After (real implementation)
async function getUserId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
```

Then update each route handler to be async and await getUserId():

```typescript
export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return createApiError("UNAUTHORIZED", "Authentication required", 401);
  }
  // ... rest of handler
}
```

### 1.6 Uncomment Supabase Queries

In each API route, uncomment the Supabase query code blocks and remove the mock responses. Example:

```typescript
// Before (mock)
const mockProjects: Project[] = [...];
return NextResponse.json({ success: true, data: mockProjects });

// After (real)
const supabase = await getSupabaseServerClient();
const { data, error, count } = await supabase
  .from("projects")
  .select("*", { count: "exact" })
  .eq("user_id", userId)
  .order("created_at", { ascending: false });

if (error) {
  return createApiError("DATABASE_ERROR", error.message, 500);
}

return NextResponse.json({ success: true, data });
```

---

## Phase 4: Type Safety

### 4.1 Generate Database Types

Run this command whenever the database schema changes:

```bash
npx supabase gen types typescript --project-id your-project-id > apps/web/lib/database.types.ts
```

Or if using local development:

```bash
npx supabase gen types typescript --local > apps/web/lib/database.types.ts
```

### 4.2 Update Manual Types

After generating types, update `apps/web/lib/database/types.ts` to extend the generated types:

```typescript
import type { Database } from "@/lib/database.types";

// Re-export generated types
export type Tables = Database["public"]["Tables"];
export type Project = Tables["projects"]["Row"];
export type ProjectInsert = Tables["projects"]["Insert"];
export type ProjectUpdate = Tables["projects"]["Update"];

// ... similar for other tables
```

### 4.3 Create Typed Query Helpers

Create `apps/web/lib/supabase/queries.ts`:

```typescript
import { getSupabaseServerClient } from "./serverClient";
import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjects(userId: string) {
  const supabase = await getSupabaseServerClient();
  return supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
}

export async function getProjectById(projectId: string, userId: string) {
  const supabase = await getSupabaseServerClient();
  return supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();
}

export async function createProject(
  data: Tables["projects"]["Insert"]
) {
  const supabase = await getSupabaseServerClient();
  return supabase.from("projects").insert(data).select().single();
}

// ============================================================================
// FCF RECORDS
// ============================================================================

export async function getFcfRecords(projectId: string, userId: string) {
  const supabase = await getSupabaseServerClient();
  return supabase
    .from("fcf_records")
    .select(`
      *,
      projects!inner(user_id)
    `)
    .eq("project_id", projectId)
    .eq("projects.user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
}

// ... similar for other entities
```

---

## Environment Variables

Ensure these are set in `.env.local`:

```bash
# Required for client-side
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for server-side (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Auth UI Components

When building auth pages, you can use Supabase Auth UI:

```bash
pnpm add @supabase/auth-ui-react @supabase/auth-ui-shared
```

Example login page component:

```typescript
"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

export default function LoginPage() {
  const supabase = getSupabaseBrowserClient();

  return (
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providers={["google", "github"]}
      redirectTo={`${window.location.origin}/auth/callback`}
    />
  );
}
```

---

## Auth Callback Route

Create `apps/web/app/auth/callback/route.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
```

---

## Testing Checklist

Before deploying, verify:

- [ ] Auth middleware redirects unauthenticated users
- [ ] Session refresh works correctly
- [ ] API routes return 401 for unauthenticated requests
- [ ] RLS policies block cross-tenant access
- [ ] Soft-delete cascades work correctly
- [ ] Quota enforcement triggers fire on insert
- [ ] Storage upload/download works with signed URLs

---

## Files to Modify

When implementing Phase 1 & 4, you'll need to update these files:

| File | Changes |
|------|---------|
| `lib/supabase/serverClient.ts` | Replace placeholder with real client |
| `lib/supabase/browserClient.ts` | Create new file |
| `middleware.ts` | Create new file |
| `app/api/projects/route.ts` | Uncomment Supabase queries, update getUserId |
| `app/api/projects/[id]/route.ts` | Uncomment Supabase queries, update getUserId |
| `app/api/uploads/route.ts` | Uncomment Supabase queries, update getUserId |
| `app/api/fcf/records/route.ts` | Uncomment Supabase queries, update getUserId |
| `app/api/fcf/records/[id]/route.ts` | Uncomment Supabase queries, update getUserId |
| `app/api/measurements/route.ts` | Uncomment Supabase queries, update getUserId |
| `lib/database.types.ts` | Generate from Supabase CLI |
| `lib/supabase/queries.ts` | Create new file with typed helpers |
