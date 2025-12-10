"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { User, LogOut, Settings, Loader2 } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils/cn";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserMenuProps {
  user: SupabaseUser | null;
}

function getInitials(user: SupabaseUser | null): string {
  if (!user) return "?";

  const fullName = user.user_metadata?.full_name;
  if (fullName) {
    const parts = fullName.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  if (user.email) {
    return user.email.substring(0, 2).toUpperCase();
  }

  return "U";
}

function getDisplayName(user: SupabaseUser | null): string {
  if (!user) return "User";

  const fullName = user.user_metadata?.full_name;
  if (fullName) return fullName;

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "User";
}

export function UserMenu({ user }: UserMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-3 py-1.5 bg-accent-500 text-slate-950 font-mono text-xs font-semibold hover:bg-accent-400 transition-colors"
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
        }}
      >
        SIGN IN
      </Link>
    );
  }

  const initials = getInitials(user);
  const displayName = getDisplayName(user);
  const email = user.email || "";

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          "flex items-center gap-3 px-3 py-1.5 transition-all",
          showMenu
            ? "bg-slate-800"
            : "hover:bg-slate-800/50"
        )}
      >
        {/* Avatar */}
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute inset-0 border border-accent-500/50" />
          <span className="font-mono text-xs font-bold text-accent-500">
            {initials}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <p className="font-mono text-xs font-medium text-slate-200">{displayName}</p>
          <p className="font-mono text-[10px] text-slate-500">{email}</p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-50">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 dark:border-slate-700" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 dark:border-slate-700" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 dark:border-slate-700" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 dark:border-slate-700" />

            {/* User info */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 bg-accent-500" />
                <span className="font-mono text-[10px] text-slate-500 tracking-wider">
                  SIGNED IN AS
                </span>
              </div>
              <p className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                {displayName}
              </p>
              <p className="font-mono text-xs text-slate-500 truncate">{email}</p>
            </div>

            {/* Menu items */}
            <div className="py-2">
              <Link
                href="/app/settings"
                className="flex items-center gap-3 px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <User className="w-4 h-4" />
                PROFILE
              </Link>
              <Link
                href="/app/settings"
                className="flex items-center gap-3 px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                <Settings className="w-4 h-4" />
                SETTINGS
              </Link>
            </div>

            {/* Sign out */}
            <div className="py-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleSignOut}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-400 hover:bg-error-500/10 hover:text-error-500 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                SIGN OUT
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
