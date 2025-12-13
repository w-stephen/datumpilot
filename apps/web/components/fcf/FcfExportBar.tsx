"use client";

import { useState } from "react";
import { Download, FileImage, FileCode, FileText, Loader2, Lock, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { FcfJson } from "@/lib/fcf/schema";
import type { UserExportFormat } from "@/lib/export/types";
import { toast } from "sonner";

interface FcfExportBarProps {
  fcf: FcfJson;
  disabled?: boolean;
  className?: string;
  onExport?: (format: UserExportFormat, url: string) => void;
  onError?: (format: UserExportFormat, error: string) => void;
}

const EXPORT_OPTIONS: Array<{
  format: UserExportFormat;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    format: "png",
    label: "PNG",
    icon: FileImage,
    description: "Raster image for documents",
  },
  {
    format: "svg",
    label: "SVG",
    icon: FileCode,
    description: "Vector graphic for CAD",
  },
  {
    format: "pdf",
    label: "PDF",
    icon: FileText,
    description: "Print-ready document",
  },
];

interface UpgradeErrorResponse {
  error: string;
  message: string;
  currentTier: string;
  requiredTier: string;
}

export default function FcfExportBar({
  fcf,
  disabled,
  className,
  onExport,
  onError,
}: FcfExportBarProps) {
  const [exporting, setExporting] = useState<UserExportFormat | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const handleExport = async (format: UserExportFormat) => {
    if (disabled || exporting) return;

    setExporting(format);
    setShowUpgradePrompt(false);

    try {
      const response = await fetch("/api/fcf/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fcf, format }),
      });

      if (response.status === 403) {
        // Handle upgrade required
        const data: UpgradeErrorResponse = await response.json();
        setShowUpgradePrompt(true);
        toast.error(data.message, {
          description: "Upgrade to Pro for visual exports",
          action: {
            label: "Upgrade",
            onClick: () => window.location.href = "/app/settings/billing",
          },
        });
        onError?.(format, data.message);
        return;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Export failed" }));
        throw new Error(error.error || "Export failed");
      }

      const { url, filename } = await response.json();

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `fcf-${fcf.name || "export"}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${format.toUpperCase()} exported successfully`);
      onExport?.(format, url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      console.error("Export error:", message);
      toast.error("Export failed", { description: message });
      onError?.(format, message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 mr-1">
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono text-[10px] text-slate-500 tracking-widest">EXPORT</span>
        </div>

        <div className="flex items-center gap-1.5">
          {EXPORT_OPTIONS.map(({ format, label, icon: Icon, description }) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              disabled={disabled || exporting !== null}
              title={description}
              className={cn(
                "group relative flex items-center gap-1.5 px-3 py-1.5",
                "font-mono text-xs border transition-all duration-200",
                "border-slate-200 dark:border-slate-700",
                "hover:border-accent-500/50 hover:text-accent-500",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 dark:disabled:hover:border-slate-700",
                exporting === format && "border-accent-500 text-accent-500 bg-accent-500/5"
              )}
            >
              {exporting === format ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-accent-500 transition-colors" />
              )}
              <span className="text-slate-600 dark:text-slate-400 group-hover:text-accent-500 transition-colors">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Upgrade prompt */}
      {showUpgradePrompt && (
        <div className="flex items-center gap-3 px-3 py-2 bg-accent-500/5 border border-accent-500/20 rounded">
          <Lock className="w-4 h-4 text-accent-500 flex-shrink-0" />
          <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
            Visual exports (PNG, SVG, PDF) are available on Pro and Team plans.
          </p>
          <Link
            href="/app/settings/billing"
            className="flex items-center gap-1 font-mono text-xs text-accent-500 hover:text-accent-400 transition-colors whitespace-nowrap"
          >
            Upgrade
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
