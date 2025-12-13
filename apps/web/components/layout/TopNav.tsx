"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserMenu } from "@/components/auth/UserMenu";
import { useCommandPalette } from "@/lib/hooks/useCommandPalette";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { HelpMenu } from "@/components/layout/HelpMenu";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";

// Map routes to readable names
const routeLabels: Record<string, string> = {
  "/app": "Dashboard",
  "/app/builder": "FCF Builder",
  "/app/stackup": "Stack-Up Analysis",
  "/app/projects": "Projects",
  "/app/settings": "Settings",
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Skip "app" as a visible breadcrumb but keep it in path
    if (segment === "app") {
      continue;
    }

    // Handle dynamic segments (like [id])
    if (segment.startsWith("[") || /^[a-f0-9-]{36}$/i.test(segment)) {
      breadcrumbs.push({
        label: "Details",
        href: currentPath,
      });
    } else {
      const label =
        routeLabels[currentPath] ||
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      breadcrumbs.push({
        label,
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}

export default function TopNav() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const { user } = useAuth();
  const commandPalette = useCommandPalette();

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-slate-50/80 dark:bg-[#0A0E14]/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between h-full px-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1">
            <Link
              href="/app"
              className="font-mono text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Home
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="font-mono text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={commandPalette.open}
              className="flex items-center gap-2 p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
              aria-label="Search (Cmd+K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline font-mono text-[10px] text-slate-400 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5">
                {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "\u2318K" : "Ctrl+K"}
              </span>
            </button>

          {/* Help */}
          <HelpMenu />

          {/* Notifications */}
          <NotificationsPanel />

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

          {/* User Menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
      />
    </>
  );
}
