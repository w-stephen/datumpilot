"use client";

import Link from "next/link";
import {
  PenTool,
  FileJson,
  ImagePlus,
  FolderKanban,
  ArrowRight,
  Activity,
  Target,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Quick action cards data
const quickActions = [
  {
    title: "FCF Builder",
    description: "Build feature control frames with live preview and ASME Y14.5 validation",
    href: "/app/builder",
    icon: PenTool,
    color: "#3B82F6",
    bgGradient: "from-primary-500/10 to-primary-500/5",
  },
  {
    title: "Interpreter",
    description: "Interpret FCF JSON and run tolerance calculations",
    href: "/app/interpreter",
    icon: FileJson,
    color: "#10B981",
    bgGradient: "from-success-500/10 to-success-500/5",
  },
  {
    title: "Image Mode",
    description: "Extract FCF data from engineering drawings using AI",
    href: "/app/image-interpreter",
    icon: ImagePlus,
    color: "#8B5CF6",
    bgGradient: "from-purple-500/10 to-purple-500/5",
  },
  {
    title: "Projects",
    description: "Manage your FCF collections and measurement runs",
    href: "/app/projects",
    icon: FolderKanban,
    color: "#F59E0B",
    bgGradient: "from-warning-500/10 to-warning-500/5",
  },
];

// Mock stats data - would come from API in production
const stats = [
  { label: "Total FCFs", value: "24", icon: Target, trend: "+3 this week" },
  { label: "Projects", value: "6", icon: FolderKanban, trend: "2 active" },
  { label: "Validations", value: "142", icon: CheckCircle2, trend: "98% pass rate" },
  { label: "Calculations", value: "89", icon: Activity, trend: "12 today" },
];

// Mock recent activity
const recentActivity = [
  { action: "Created FCF", item: "Position @ MMC - Mounting Hole", time: "2 hours ago", status: "valid" },
  { action: "Ran calculation", item: "Flatness - Top Surface", time: "4 hours ago", status: "pass" },
  { action: "Extracted FCF", item: "Perpendicularity - Slot", time: "1 day ago", status: "warning" },
  { action: "Created project", item: "Assembly QA - Phase 2", time: "2 days ago", status: "valid" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold text-slate-50 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Welcome back. Here&apos;s your GD&T workspace overview.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>Last updated: Just now</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="w-5 h-5 text-slate-500" />
              <span className="text-2xs text-slate-500">{stat.trend}</span>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-mono font-bold text-slate-100">
                {stat.value}
              </p>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-semibold text-slate-200">
            Quick Actions
          </h2>
          <Zap className="w-4 h-4 text-accent-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group relative overflow-hidden",
                "bg-gradient-to-br border border-slate-800 rounded-lg p-5",
                "hover:border-slate-700 hover:-translate-y-0.5",
                "transition-all duration-300",
                action.bgGradient
              )}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 100% 0%, ${action.color}40 0%, transparent 50%)`,
                  }}
                />
              </div>

              <div className="relative flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-lg"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon
                    className="w-6 h-6"
                    style={{ color: action.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono font-semibold text-slate-100">
                      {action.title}
                    </h3>
                    <ArrowRight
                      className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-semibold text-slate-200">
            Recent Activity
          </h2>
          <Link
            href="/app/projects"
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
          <div className="divide-y divide-slate-800">
            {recentActivity.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      item.status === "valid" && "bg-success-500",
                      item.status === "pass" && "bg-accent-500",
                      item.status === "warning" && "bg-warning-500"
                    )}
                  />
                  <div>
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-500">{item.action}:</span>{" "}
                      {item.item}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started (for new users) */}
      <section className="bg-gradient-to-br from-primary-500/5 via-accent-500/5 to-transparent border border-slate-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500/10">
            <Target className="w-5 h-5 text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-mono font-semibold text-slate-100">
              Getting Started with DatumPilot
            </h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              New to GD&T interpretation? Start by building your first Feature Control Frame
              or upload an engineering drawing to extract FCF data automatically.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/app/builder"
                className="btn-primary text-sm"
              >
                <PenTool className="w-4 h-4" />
                Build FCF
              </Link>
              <Link
                href="/app/image-interpreter"
                className="btn-secondary text-sm"
              >
                <ImagePlus className="w-4 h-4" />
                Upload Drawing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
