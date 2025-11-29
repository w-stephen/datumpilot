"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenTool,
  FileJson,
  ImagePlus,
  FolderKanban,
  Settings,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

const mainNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/app",
    icon: LayoutDashboard,
    description: "Overview & quick actions",
  },
  {
    label: "FCF Builder",
    href: "/app/builder",
    icon: PenTool,
    description: "Build feature control frames",
  },
  {
    label: "Interpreter",
    href: "/app/interpreter",
    icon: FileJson,
    description: "Interpret FCF JSON & calculate",
  },
  {
    label: "Image Mode",
    href: "/app/image-interpreter",
    icon: ImagePlus,
    description: "Extract FCF from images",
  },
  {
    label: "Projects",
    href: "/app/projects",
    icon: FolderKanban,
    description: "Manage FCF collections",
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Settings",
    href: "/app/settings",
    icon: Settings,
    description: "Units, precision & profile",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-slate-925 border-r border-slate-800",
        "flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-800">
        <Link href="/app" className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500">
            <Target className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-lg bg-accent-500/20 blur-md" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-mono font-bold text-lg text-slate-50 tracking-tight">
                DatumPilot
              </span>
              <span className="text-2xs text-slate-500 uppercase tracking-wider">
                GD&T Interpreter
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
                  "transition-all duration-200",
                  active
                    ? "bg-primary-500/10 text-primary-400"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
                )}

                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    active ? "text-primary-400" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />

                {!collapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      active ? "text-primary-400" : "text-slate-300"
                    )}>
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="text-2xs text-slate-500 truncate">
                        {item.description}
                      </span>
                    )}
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 border border-slate-700 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                    <span className="text-sm text-slate-200">{item.label}</span>
                    {item.description && (
                      <p className="text-2xs text-slate-400 mt-0.5">{item.description}</p>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-3 border-t border-slate-800">
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "transition-all duration-200",
                active
                  ? "bg-primary-500/10 text-primary-400"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  active ? "text-primary-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {!collapsed && (
                <span className={cn(
                  "text-sm font-medium",
                  active ? "text-primary-400" : "text-slate-300"
                )}>
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 border border-slate-700 rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  <span className="text-sm text-slate-200">{item.label}</span>
                </div>
              )}
            </Link>
          );
        })}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg",
            "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300",
            "transition-all duration-200"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
