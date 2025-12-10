import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Crosshair } from "lucide-react";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";

/**
 * Auth Layout
 *
 * Centered card layout for authentication pages.
 * Redirects authenticated users to /app.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Check if user is already authenticated
  const user = await getUser();

  if (user) {
    redirect("/app");
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0A0E14] flex flex-col">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00D4AA 1px, transparent 1px),
            linear-gradient(to bottom, #00D4AA 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10">
            <div className="absolute inset-0 border border-accent-500/50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 bg-accent-500" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2 bg-accent-500" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-px bg-accent-500" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-px bg-accent-500" />
            <Crosshair className="w-5 h-5 text-accent-500" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-50 tracking-widest">
              DATUMPILOT
            </span>
            <span className="font-mono text-[9px] text-slate-500 dark:text-slate-600 tracking-[0.2em]">
              GD&T SYSTEM
            </span>
          </div>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Auth card */}
          <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-500" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-500" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-500" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-500" />

            <div className="p-8">{children}</div>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center font-mono text-xs text-slate-500 dark:text-slate-600">
            Precision GD&T interpretation powered by AI
          </p>
        </div>
      </main>

      {/* Status indicator */}
      <footer className="relative z-10 p-6 flex justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="w-1.5 h-1.5 bg-accent-500 animate-pulse" />
          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-600">
            SECURE CONNECTION
          </span>
        </div>
      </footer>
    </div>
  );
}
