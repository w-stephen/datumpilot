"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  User,
  ChevronRight,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

// Map routes to readable names
const routeLabels: Record<string, string> = {
  "/app": "Dashboard",
  "/app/builder": "FCF Builder",
  "/app/interpreter": "Interpreter",
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
      const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
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
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Mock user data - replace with actual auth context
  const user = {
    name: "Engineer",
    email: "engineer@company.com",
    initials: "EN",
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-925/80 backdrop-blur-lg border-b border-slate-800">
      <div className="flex items-center justify-between h-full px-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1">
          <Link
            href="/app"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Home
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1">
              <ChevronRight className="w-4 h-4 text-slate-600" />
              {index === breadcrumbs.length - 1 ? (
                <span className="text-sm font-medium text-slate-200">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search (future feature) */}
          <button
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Help */}
          <button
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Notifications (future feature) */}
          <button
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-700 mx-2" />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all",
                showUserMenu
                  ? "bg-slate-800"
                  : "hover:bg-slate-800/50"
              )}
            >
              {/* Avatar */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500">
                <span className="text-xs font-bold text-slate-950">
                  {user.initials}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-200">{user.name}</p>
                <p className="text-2xs text-slate-500">{user.email}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm font-medium text-slate-200">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/app/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile & Settings
                    </Link>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
                      onClick={() => {
                        setShowUserMenu(false);
                        // Handle logout
                        console.log("Logout clicked");
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
