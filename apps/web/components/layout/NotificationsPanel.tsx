"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export type NotificationType = "system" | "validation" | "billing" | "team";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  dismissible: boolean;
  createdAt: Date;
}

const WELCOME_DISMISSED_KEY = "dp_welcome_dismissed";

const WELCOME_NOTIFICATION: Notification = {
  id: "welcome",
  type: "system",
  title: "Welcome to DatumPilot!",
  message:
    "Get started by creating your first project or exploring the FCF Builder.",
  href: "/app",
  read: false,
  dismissible: true,
  createdAt: new Date(),
};

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load notifications on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
    if (!dismissed) {
      setNotifications([WELCOME_NOTIFICATION]);
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const dismissNotification = (id: string) => {
    if (id === "welcome") {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "system":
        return Sparkles;
      default:
        return Bell;
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all",
          isOpen && "bg-slate-100 dark:bg-slate-800/50"
        )}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {/* Notification dot */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg z-50">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-300 dark:border-slate-700" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-300 dark:border-slate-700" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-300 dark:border-slate-700" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-300 dark:border-slate-700" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <span className="font-mono text-[10px] text-slate-500 tracking-widest">
              NOTIFICATIONS
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 font-mono text-[10px] text-accent-500 hover:text-accent-400 transition-colors"
              >
                <Check className="w-3 h-3" />
                MARK ALL READ
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-auto">
            {notifications.length > 0 ? (
              <div className="py-2">
                {notifications.map((notification) => {
                  const Icon = getTypeIcon(notification.type);
                  const content = (
                    <div
                      className={cn(
                        "flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        !notification.read &&
                          "bg-accent-500/5 border-l-2 border-accent-500"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 flex-shrink-0 flex items-center justify-center",
                          notification.type === "system"
                            ? "bg-accent-500/10"
                            : "bg-slate-100 dark:bg-slate-800"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            notification.type === "system"
                              ? "text-accent-500"
                              : "text-slate-500"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                          {notification.title}
                        </h4>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {notification.dismissible && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );

                  if (notification.href) {
                    return (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        onClick={() => setIsOpen(false)}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return <div key={notification.id}>{content}</div>;
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="font-mono text-xs text-slate-500">
                  No new notifications
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
