"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenTool,
  FileJson,
  FolderKanban,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  code: string;
}

const mainNavItems: NavItem[] = [
  {
    label: "DASHBOARD",
    href: "/app",
    icon: LayoutDashboard,
    code: "01",
  },
  {
    label: "FCF BUILDER",
    href: "/app/builder",
    icon: PenTool,
    code: "02",
  },
  {
    label: "INTERPRETER",
    href: "/app/interpreter",
    icon: FileJson,
    code: "03",
  },
  {
    label: "PROJECTS",
    href: "/app/projects",
    icon: FolderKanban,
    code: "04",
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "SETTINGS",
    href: "/app/settings",
    icon: Settings,
    code: "SYS",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen",
        "bg-slate-50 dark:bg-[#0A0E14] border-r border-slate-200 dark:border-slate-800",
        "flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/app" className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10">
            {/* Crosshair logo */}
            <div className="absolute inset-0 border border-accent-500/50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 bg-accent-500" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2 bg-accent-500" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-px bg-accent-500" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-px bg-accent-500" />
            <Crosshair className="w-5 h-5 text-accent-500" strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-50 tracking-widest">
                DATUMPILOT
              </span>
              <span className="font-mono text-[9px] text-slate-500 dark:text-slate-600 tracking-[0.2em]">
                GD&T SYSTEM
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Section Label */}
      {!collapsed && (
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-slate-300 dark:bg-slate-700" />
            <span className="font-mono text-[9px] text-slate-500 dark:text-slate-600 tracking-[0.2em]">NAV.MAIN</span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5",
                  "transition-all duration-200",
                  active
                    ? "bg-accent-500/10 text-accent-500"
                    : "text-slate-600 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-300"
                )}
              >
                {/* Active indicator - technical bar */}
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent-500" />
                )}

                {/* Code number */}
                <span className={cn(
                  "font-mono text-[9px] w-5 flex-shrink-0 transition-colors",
                  active ? "text-accent-500" : "text-slate-400 dark:text-slate-700 group-hover:text-slate-600 dark:group-hover:text-slate-500"
                )}>
                  {item.code}
                </span>

                <item.icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    active ? "text-accent-500" : "text-slate-500 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-400"
                  )}
                />

                {!collapsed && (
                  <span className={cn(
                    "font-mono text-xs tracking-wide truncate",
                    active ? "text-accent-500" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                  )}>
                    {item.label}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-white dark:bg-[#0A0E14] border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-300 dark:border-slate-700" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-300 dark:border-slate-700" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-300 dark:border-slate-700" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-300 dark:border-slate-700" />
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{item.label}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-px bg-slate-300 dark:bg-slate-700" />
              <span className="font-mono text-[9px] text-slate-500 dark:text-slate-600 tracking-[0.2em]">NAV.SYS</span>
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "group relative w-full flex items-center gap-3 px-3 py-2.5 mb-1",
            "text-slate-600 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-300",
            "transition-all duration-200"
          )}
        >
          <span className="font-mono text-[9px] w-5 flex-shrink-0 text-slate-400 dark:text-slate-700">
            {mounted && theme === "dark" ? "DK" : "LT"}
          </span>

          {mounted ? (
            theme === "dark" ? (
              <Moon className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Sun className="w-4 h-4 flex-shrink-0" />
            )
          ) : (
            <div className="w-4 h-4 flex-shrink-0" />
          )}

          {!collapsed && (
            <span className="font-mono text-xs tracking-wide text-slate-500 dark:text-slate-400">
              {mounted && theme === "dark" ? "DARK MODE" : "LIGHT MODE"}
            </span>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-white dark:bg-[#0A0E14] border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-300 dark:border-slate-700" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-300 dark:border-slate-700" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-300 dark:border-slate-700" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-300 dark:border-slate-700" />
              <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                {mounted && theme === "dark" ? "SWITCH TO LIGHT" : "SWITCH TO DARK"}
              </span>
            </div>
          )}
        </button>

        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5",
                "transition-all duration-200",
                active
                  ? "bg-accent-500/10 text-accent-500"
                  : "text-slate-600 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-300"
              )}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent-500" />
              )}

              <span className={cn(
                "font-mono text-[9px] w-5 flex-shrink-0 transition-colors",
                active ? "text-accent-500" : "text-slate-400 dark:text-slate-700 group-hover:text-slate-600 dark:group-hover:text-slate-500"
              )}>
                {item.code}
              </span>

              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  active ? "text-accent-500" : "text-slate-500 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-400"
                )}
              />
              {!collapsed && (
                <span className={cn(
                  "font-mono text-xs tracking-wide",
                  active ? "text-accent-500" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                )}>
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-white dark:bg-[#0A0E14] border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-300 dark:border-slate-700" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-300 dark:border-slate-700" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-300 dark:border-slate-700" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-300 dark:border-slate-700" />
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{item.label}</span>
                </div>
              )}
            </Link>
          );
        })}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "group relative mt-2 transition-all duration-200",
            collapsed
              ? "w-full flex items-center justify-center py-3 hover:bg-accent-500/10"
              : "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/50",
            "text-slate-600 dark:text-slate-600 hover:text-slate-800 dark:hover:text-slate-400"
          )}
        >
          {collapsed ? (
            <>
              {/* Expand button - centered and prominent */}
              <div className="w-8 h-8 border border-slate-300 dark:border-slate-700 hover:border-accent-500/50 flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-3 py-2 bg-white dark:bg-[#0A0E14] border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-300 dark:border-slate-700" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-300 dark:border-slate-700" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-300 dark:border-slate-700" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-300 dark:border-slate-700" />
                <span className="font-mono text-xs text-slate-700 dark:text-slate-200">EXPAND</span>
              </div>
            </>
          ) : (
            <>
              <span className="font-mono text-[9px] w-5 flex-shrink-0 text-slate-400 dark:text-slate-700">
                {"<<"}
              </span>
              <ChevronLeft className="w-4 h-4" />
              <span className="font-mono text-xs tracking-wide">COLLAPSE</span>
            </>
          )}
        </button>
      </div>

      {/* Version indicator */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-700">v1.0.0</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-accent-500 animate-pulse" />
              <span className="font-mono text-[9px] text-slate-500 dark:text-slate-600">ONLINE</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed state indicator */}
      {collapsed && (
        <div className="px-3 py-3 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-center">
          <div className="w-1.5 h-1.5 bg-accent-500 animate-pulse" />
        </div>
      )}
    </aside>
  );
}
