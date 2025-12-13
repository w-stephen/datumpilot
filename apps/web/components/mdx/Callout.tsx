"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react";

interface CalloutProps {
  type?: "info" | "warning" | "tip" | "error";
  children: ReactNode;
  className?: string;
}

const calloutStyles = {
  info: {
    container: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-900 dark:text-blue-100",
  },
  warning: {
    container: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-900 dark:text-amber-100",
  },
  tip: {
    container: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    text: "text-green-900 dark:text-green-100",
  },
  error: {
    container: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    text: "text-red-900 dark:text-red-100",
  },
};

const icons = {
  info: Info,
  warning: AlertTriangle,
  tip: Lightbulb,
  error: AlertCircle,
};

export function Callout({ type = "info", children, className }: CalloutProps) {
  const styles = calloutStyles[type];
  const Icon = icons[type];

  return (
    <div
      className={cn(
        "my-6 flex gap-3 rounded-lg border p-4",
        styles.container,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", styles.icon)} />
      <div className={cn("text-sm leading-relaxed", styles.text)}>{children}</div>
    </div>
  );
}
