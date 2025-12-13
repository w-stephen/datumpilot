"use client";

import { useState, useRef, useEffect } from "react";
import {
  HelpCircle,
  Book,
  Keyboard,
  Mail,
  Bug,
  Sparkles,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface HelpMenuItem {
  type?: "divider";
  label?: string;
  href?: string;
  action?: "shortcuts";
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

const helpItems: HelpMenuItem[] = [
  {
    label: "Getting Started",
    href: "/docs/getting-started",
    icon: Book,
    external: false,
  },
  {
    label: "FCF Builder Guide",
    href: "/docs/fcf-builder",
    icon: Book,
    external: false,
  },
  {
    label: "Stack-up Guide",
    href: "/docs/stack-up",
    icon: Book,
    external: false,
  },
  {
    label: "Keyboard Shortcuts",
    action: "shortcuts",
    icon: Keyboard,
  },
  { type: "divider" },
  {
    label: "Contact Support",
    href: "mailto:support@datumpilot.com",
    icon: Mail,
    external: true,
  },
  {
    label: "Report a Bug",
    href: "mailto:bugs@datumpilot.com?subject=Bug Report",
    icon: Bug,
    external: true,
  },
  { type: "divider" },
  {
    label: "What's New",
    href: "/changelog",
    icon: Sparkles,
    external: false,
  },
];

const keyboardShortcuts = [
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["Cmd/Ctrl", "K"], description: "Open search" },
      { keys: ["Esc"], description: "Close modals" },
    ],
  },
  {
    category: "FCF Builder",
    shortcuts: [
      { keys: ["Cmd/Ctrl", "S"], description: "Save FCF" },
      { keys: ["Cmd/Ctrl", "E"], description: "Export menu" },
      { keys: ["Tab"], description: "Next field" },
      { keys: ["Shift", "Tab"], description: "Previous field" },
    ],
  },
  {
    category: "Stack-up Analysis",
    shortcuts: [
      { keys: ["Cmd/Ctrl", "Enter"], description: "Calculate" },
      { keys: ["Cmd/Ctrl", "N"], description: "Add dimension" },
    ],
  },
];

function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
        <div className="relative bg-slate-900 border border-slate-700 shadow-2xl">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-500" />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-accent-500" />
              <span className="font-mono text-xs text-slate-100">
                KEYBOARD SHORTCUTS
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-auto space-y-4">
            {keyboardShortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="font-mono text-[10px] text-slate-500 tracking-widest mb-2">
                  {category.category.toUpperCase()}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="font-mono text-xs text-slate-400">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-[10px] text-slate-300">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-slate-600">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HelpMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleItemClick = (item: HelpMenuItem) => {
    if (item.action === "shortcuts") {
      setShowShortcuts(true);
      setIsOpen(false);
    } else if (item.href && item.external) {
      window.open(item.href, "_blank");
      setIsOpen(false);
    } else if (item.href) {
      // Handle internal navigation - for now just close
      setIsOpen(false);
    }
  };

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all",
            isOpen && "bg-slate-100 dark:bg-slate-800/50"
          )}
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg z-50">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-300 dark:border-slate-700" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-300 dark:border-slate-700" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-300 dark:border-slate-700" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-300 dark:border-slate-700" />

            <div className="py-1">
              {helpItems.map((item, index) =>
                item.type === "divider" ? (
                  <div
                    key={index}
                    className="my-1 border-t border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <button
                    key={index}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-left"
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span className="flex-1 font-mono text-xs">{item.label}</span>
                    {item.external && (
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}
