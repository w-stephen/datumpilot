"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PenTool,
  FolderKanban,
  ArrowRight,
  Activity,
  Target,
  CheckCircle2,
  Clock,
  Crosshair,
  ChevronRight,
  TrendingUp,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Quick action cards data
const quickActions = [
  {
    title: "FCF BUILDER",
    description: "Build feature control frames with live preview and ASME Y14.5 validation",
    href: "/app/builder",
    icon: PenTool,
    shortcut: "01",
  },
  {
    title: "STACK-UP ANALYSIS",
    description: "Calculate tolerance accumulation using Worst-Case, RSS, and Six Sigma methods",
    href: "/app/stackup",
    icon: Layers,
    shortcut: "02",
  },
  {
    title: "PROJECTS",
    description: "Manage your FCF collections and measurement runs",
    href: "/app/projects",
    icon: FolderKanban,
    shortcut: "03",
  },
];

// Mock stats data
const stats = [
  { label: "TOTAL FCFs", value: 24, icon: Target, change: "+3", period: "this week" },
  { label: "PROJECTS", value: 6, icon: FolderKanban, change: "2", period: "active" },
  { label: "VALIDATIONS", value: 142, icon: CheckCircle2, change: "98%", period: "pass rate" },
  { label: "CALCULATIONS", value: 89, icon: Activity, change: "+12", period: "today" },
];

// Mock recent activity
const recentActivity = [
  { action: "Created FCF", item: "Position @ MMC - Mounting Hole", time: "2h ago", status: "valid" },
  { action: "Ran calculation", item: "Flatness - Top Surface", time: "4h ago", status: "pass" },
  { action: "Validated FCF", item: "Perpendicularity - Slot", time: "1d ago", status: "warning" },
  { action: "Created project", item: "Assembly QA - Phase 2", time: "2d ago", status: "valid" },
];

// Animated counter
function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}</span>;
}

// Technical panel wrapper with VS Code-inspired light mode
function TechnicalPanel({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn(
      "relative bg-white dark:bg-slate-900/40 border border-[#E5E5E5] dark:border-slate-800",
      label && "mt-3", // Add top margin when label present to prevent clipping
      className
    )}>
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

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">DASHBOARD</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-[#1F1F1F] dark:text-slate-50 tracking-tight">
            WORKSPACE OVERVIEW
          </h1>
          <p className="text-[#616161] dark:text-slate-500 mt-1 font-mono text-sm">
            GD&T Feature Control Frame Management System
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900/60 border border-[#E5E5E5] dark:border-slate-800">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
          <Clock className="w-3.5 h-3.5 text-[#6E6E6E] dark:text-slate-500" />
          <span className="font-mono text-xs text-[#6E6E6E] dark:text-slate-500">LIVE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <TechnicalPanel key={stat.label} label={`STAT.${String(index + 1).padStart(2, '0')}`}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <stat.icon className="w-5 h-5 text-[#6E6E6E] dark:text-slate-600" />
                <div className="flex items-center gap-1 text-accent-500">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-mono text-xs">{stat.change}</span>
                </div>
              </div>
              <div className="font-mono text-4xl font-bold text-[#1F1F1F] dark:text-slate-100 tabular-nums">
                {mounted && <AnimatedCounter target={stat.value} />}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-xs text-[#616161] dark:text-slate-500 tracking-wide">{stat.label}</span>
                <span className="font-mono text-[10px] text-[#8B8B8B] dark:text-slate-600">{stat.period}</span>
              </div>
            </div>
          </TechnicalPanel>
        ))}
      </div>

      {/* Quick Actions */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Crosshair className="w-4 h-4 text-accent-500" />
          <h2 className="font-mono text-sm font-semibold text-[#1F1F1F] dark:text-slate-300 tracking-wide">
            QUICK ACTIONS
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-[#D4D4D4] dark:from-slate-800 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative bg-white dark:bg-slate-900/40 border border-[#E5E5E5] dark:border-slate-800 hover:border-accent-500/30 transition-all duration-300"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
              }}
            >
              {/* Corner cuts visual */}
              <div className="absolute top-0 right-0 w-3 h-3 border-l border-b border-[#E5E5E5] dark:border-slate-800 group-hover:border-accent-500/30 transition-colors" style={{ transform: 'translate(0, 0) rotate(45deg)', transformOrigin: 'top right' }} />

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 border border-[#D4D4D4] dark:border-slate-700 bg-[#F8F8F8] dark:bg-slate-800/50 flex items-center justify-center group-hover:border-accent-500/50 group-hover:bg-accent-500/5 transition-all">
                    <action.icon className="w-4 h-4 text-[#616161] dark:text-slate-400 group-hover:text-accent-500 transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[#8B8B8B] dark:text-slate-700 group-hover:text-accent-500/50 transition-colors">
                      {action.shortcut}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8B8B8B] dark:text-slate-700 group-hover:text-accent-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
                <h3 className="font-mono text-sm font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-wide mb-1">
                  {action.title}
                </h3>
                <p className="text-xs text-[#616161] dark:text-slate-500 leading-relaxed line-clamp-2">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-accent-500" />
            <h2 className="font-mono text-sm font-semibold text-[#1F1F1F] dark:text-slate-300 tracking-wide">
              RECENT ACTIVITY
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#D4D4D4] dark:from-slate-800 to-transparent" />
          </div>
          <Link
            href="/app/projects"
            className="font-mono text-xs text-[#6E6E6E] dark:text-slate-500 hover:text-accent-500 transition-colors flex items-center gap-1"
          >
            VIEW ALL
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <TechnicalPanel label="ACTIVITY.LOG">
          <div className="divide-y divide-[#E5E5E5] dark:divide-slate-800/50">
            {recentActivity.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-5 py-4 hover:bg-[#F0F0F0] dark:hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2",
                        item.status === "valid" && "bg-accent-500",
                        item.status === "pass" && "bg-success-500",
                        item.status === "warning" && "bg-warning-500"
                      )}
                    />
                    <span className="font-mono text-[10px] text-[#8B8B8B] dark:text-slate-600 w-16">
                      {String(index + 1).padStart(2, '0')}.LOG
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-[#1F1F1F] dark:text-slate-300">
                      <span className="text-[#616161] dark:text-slate-500">{item.action}:</span>{" "}
                      <span className="font-medium">{item.item}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "font-mono text-[10px] px-2 py-0.5 border",
                      item.status === "valid" && "text-accent-500 border-accent-500/30 bg-accent-500/5",
                      item.status === "pass" && "text-success-500 border-success-500/30 bg-success-500/5",
                      item.status === "warning" && "text-warning-500 border-warning-500/30 bg-warning-500/5"
                    )}
                  >
                    {item.status.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs text-[#8B8B8B] dark:text-slate-600 w-12 text-right">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </TechnicalPanel>
      </section>

      {/* Getting Started */}
      <TechnicalPanel label="INIT.GUIDE">
        <div className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 border border-accent-500/30 bg-accent-500/5 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-accent-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-mono text-base font-semibold text-[#1F1F1F] dark:text-slate-100 tracking-wide mb-2">
                GETTING STARTED
              </h3>
              <p className="text-sm text-[#616161] dark:text-slate-500 mb-5 leading-relaxed">
                New to GD&T interpretation? Start by building your first Feature Control Frame
                with the interactive builder and get AI-powered explanations.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/app/builder"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-slate-950 font-mono text-xs font-semibold hover:bg-accent-400 transition-colors"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                  }}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  BUILD FCF
                </Link>
                <Link
                  href="/app/stackup"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[#D4D4D4] dark:border-slate-700 text-[#616161] dark:text-slate-300 font-mono text-xs font-medium hover:border-[#ABABAB] dark:hover:border-slate-600 hover:text-[#1F1F1F] dark:hover:text-slate-100 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  STACK-UP
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative grid */}
        <div className="absolute bottom-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
          <div
            className="w-full h-full opacity-[0.08] dark:opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #00D4AA 1px, transparent 1px),
                linear-gradient(to bottom, #00D4AA 1px, transparent 1px)
              `,
              backgroundSize: '8px 8px',
            }}
          />
        </div>
      </TechnicalPanel>
    </div>
  );
}
