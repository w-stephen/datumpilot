import { cn } from "@/lib/utils/cn";

interface TechnicalPanelProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

/**
 * Technical panel wrapper with corner accents and optional label.
 * Used for grouping related content with a technical aesthetic.
 */
export function TechnicalPanel({ children, label, className }: TechnicalPanelProps) {
  return (
    <div
      className={cn(
        "relative bg-white dark:bg-slate-900/40 border border-[#E5E5E5] dark:border-slate-800",
        label && "mt-3", // Add top margin when label present to prevent clipping
        className
      )}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#D4D4D4] dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#D4D4D4] dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#D4D4D4] dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#D4D4D4] dark:border-slate-700" />

      {label && (
        <div className="absolute -top-2.5 left-4 px-2 bg-[#F3F3F3] dark:bg-[#0D1117] font-mono text-[10px] text-[#6E6E6E] dark:text-slate-500 tracking-widest">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
