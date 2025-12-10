"use client";

import { useState } from "react";
import {
  BookOpen,
  Lightbulb,
  Target,
  Ruler,
  Box,
  Layers,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CharacteristicIcon } from "@/components/gdt/CharacteristicIcon";

// Technical panel wrapper
function TechnicalPanel({
  children,
  label,
  className,
  headerRight,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className={cn("relative bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800", className)}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 dark:border-slate-700" />

      {(label || headerRight) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50">
          {label && (
            <span className="font-mono text-[10px] text-slate-500 tracking-widest">{label}</span>
          )}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

type TabId = "overview" | "characteristics" | "modifiers" | "datums" | "workflow";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "overview", label: "OVERVIEW", icon: BookOpen },
  { id: "characteristics", label: "CHARACTERISTICS", icon: Target },
  { id: "modifiers", label: "MODIFIERS", icon: Ruler },
  { id: "datums", label: "DATUMS", icon: Box },
  { id: "workflow", label: "WORKFLOW", icon: Layers },
];

const characteristics = [
  {
    type: "position",
    name: "Position",
    symbol: "⊕",
    category: "Location",
    description: "Controls the location of a feature relative to datums. Most common GD&T control.",
    usage: "Use for holes, pins, slots, and any feature that needs to be located relative to other features.",
    requiresDatums: true,
    color: "text-primary-400",
  },
  {
    type: "flatness",
    name: "Flatness",
    symbol: "⏥",
    category: "Form",
    description: "Controls how flat a surface is. The surface must lie between two parallel planes.",
    usage: "Use for mating surfaces, sealing surfaces, and any surface that must be flat.",
    requiresDatums: false,
    color: "text-success-400",
  },
  {
    type: "perpendicularity",
    name: "Perpendicularity",
    symbol: "⊥",
    category: "Orientation",
    description: "Controls the orientation of a feature at 90° to a datum. The feature axis or surface must be perpendicular.",
    usage: "Use for features that must be at right angles to a reference surface.",
    requiresDatums: true,
    color: "text-warning-400",
  },
  {
    type: "profile",
    name: "Profile of a Surface",
    symbol: "⌓",
    category: "Profile",
    description: "Controls the 3D shape of a surface. The surface must lie within a specified tolerance zone.",
    usage: "Use for complex contoured surfaces, curved surfaces, and irregular shapes.",
    requiresDatums: false,
    color: "text-purple-400",
  },
];

const modifiers = [
  {
    symbol: "Ⓜ",
    name: "MMC (Maximum Material Condition)",
    description: "Feature contains maximum amount of material. For holes: smallest size. For pins: largest size.",
    benefit: "Provides bonus tolerance as feature departs from MMC.",
    color: "text-amber-400",
  },
  {
    symbol: "Ⓛ",
    name: "LMC (Least Material Condition)",
    description: "Feature contains minimum amount of material. For holes: largest size. For pins: smallest size.",
    benefit: "Ensures minimum wall thickness. Provides bonus tolerance.",
    color: "text-cyan-400",
  },
  {
    symbol: "—",
    name: "RFS (Regardless of Feature Size)",
    description: "Default condition in ASME Y14.5-2018. Tolerance applies at any produced size.",
    benefit: "No bonus tolerance. Most restrictive but simplest to inspect.",
    color: "text-slate-400",
  },
];

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">DOCS.GDT</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            GD&T REFERENCE
          </h1>
          <p className="text-slate-500 mt-1 font-mono text-sm">
            Learn about geometric dimensioning and tolerancing per ASME Y14.5-2018
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 py-4 border-b border-slate-200/50 dark:border-slate-800/50 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all whitespace-nowrap",
                isActive
                  ? "bg-accent-500/10 text-accent-500 border-b-2 border-accent-500"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pt-6 scrollbar-hide">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TechnicalPanel label="WHAT.IS.GDT">
              <div className="p-6 space-y-4">
                <p className="text-slate-600 dark:text-slate-300 font-mono text-sm leading-relaxed">
                  <strong className="text-accent-500">Geometric Dimensioning and Tolerancing (GD&T)</strong> is a
                  symbolic language used on engineering drawings to precisely define
                  allowable variations in part geometry.
                </p>
                <p className="text-slate-600 dark:text-slate-300 font-mono text-sm leading-relaxed">
                  Unlike traditional ± tolerancing, GD&T uses <strong className="text-accent-500">Feature Control Frames (FCFs)</strong> to
                  communicate geometric requirements clearly and unambiguously.
                </p>
                <div className="mt-6 p-4 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-mono text-xs text-slate-500 tracking-widest mb-3">KEY BENEFITS</h4>
                  <ul className="space-y-2">
                    {[
                      "Clearer communication of design intent",
                      "More consistent interpretation across teams",
                      "Potential for increased manufacturing tolerance",
                      "Better alignment between design and inspection",
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                        <ChevronRight className="w-3 h-3 text-accent-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TechnicalPanel>

            <TechnicalPanel label="FCF.ANATOMY">
              <div className="p-6 space-y-4">
                <p className="text-slate-600 dark:text-slate-300 font-mono text-sm leading-relaxed">
                  A <strong className="text-accent-500">Feature Control Frame</strong> is read left to right and contains:
                </p>
                <div className="space-y-3 mt-4">
                  {[
                    { num: "1", label: "Characteristic Symbol", desc: "What type of control is applied" },
                    { num: "2", label: "Tolerance Value", desc: "How much variation is allowed" },
                    { num: "3", label: "Material Modifier", desc: "MMC, LMC, or RFS (optional)" },
                    { num: "4", label: "Datum References", desc: "What the feature is measured from" },
                  ].map((item) => (
                    <div key={item.num} className="flex items-start gap-3 p-3 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                      <span className="font-mono text-xs text-accent-500 font-bold w-5">{item.num}</span>
                      <div>
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold">{item.label}</span>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TechnicalPanel>

            <TechnicalPanel label="QUICK.START" className="lg:col-span-2">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: Sparkles,
                      title: "FCF Builder",
                      desc: "Build feature control frames interactively with live ASME Y14.5 validation.",
                      link: "/app/builder",
                    },
                    {
                      icon: Layers,
                      title: "Projects",
                      desc: "Organize and manage your FCFs in project collections.",
                      link: "/app/projects",
                    },
                  ].map((item) => (
                    <a
                      key={item.title}
                      href={item.link}
                      className="group p-4 border border-slate-200 dark:border-slate-800 hover:border-accent-500/50 transition-colors"
                    >
                      <div className="w-10 h-10 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-3 group-hover:border-accent-500/50 transition-colors">
                        <item.icon className="w-5 h-5 text-slate-500 group-hover:text-accent-500 transition-colors" />
                      </div>
                      <h4 className="font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold mb-1 group-hover:text-accent-500 transition-colors">
                        {item.title}
                      </h4>
                      <p className="font-mono text-[10px] text-slate-500">{item.desc}</p>
                    </a>
                  ))}
                </div>
              </div>
            </TechnicalPanel>
          </div>
        )}

        {/* Characteristics Tab */}
        {activeTab === "characteristics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {characteristics.map((char) => (
              <TechnicalPanel key={char.type} label={`CHAR.${char.name.toUpperCase().replace(/\s+/g, "")}`}>
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <span className={cn("text-2xl", char.color)}>{char.symbol}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono text-sm text-slate-700 dark:text-slate-200 font-semibold">
                          {char.name}
                        </h3>
                        <span className="font-mono text-[10px] text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {char.category.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {char.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                      <span className="font-mono text-[10px] text-slate-500 tracking-widest">WHEN TO USE</span>
                      <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-1">{char.usage}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">REQUIRES DATUMS:</span>
                      <span className={cn(
                        "font-mono text-[10px] px-2 py-0.5",
                        char.requiresDatums
                          ? "text-warning-500 bg-warning-500/10 border border-warning-500/20"
                          : "text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      )}>
                        {char.requiresDatums ? "YES" : "NO"}
                      </span>
                    </div>
                  </div>
                </div>
              </TechnicalPanel>
            ))}
          </div>
        )}

        {/* Modifiers Tab */}
        {activeTab === "modifiers" && (
          <div className="space-y-6">
            <TechnicalPanel label="MATERIAL.CONDITIONS">
              <div className="p-6 space-y-4">
                <p className="text-slate-600 dark:text-slate-300 font-mono text-sm leading-relaxed">
                  Material condition modifiers define when the stated tolerance applies,
                  and can provide <strong className="text-accent-500">bonus tolerance</strong> when the feature
                  departs from the specified condition.
                </p>
              </div>
            </TechnicalPanel>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {modifiers.map((mod) => (
                <TechnicalPanel key={mod.name} label={`MOD.${mod.name.split(" ")[0].toUpperCase()}`}>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <span className={cn("text-xl font-bold", mod.color)}>{mod.symbol}</span>
                      </div>
                      <h3 className="font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold">
                        {mod.name}
                      </h3>
                    </div>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mb-4">
                      {mod.description}
                    </p>
                    <div className="p-3 bg-accent-500/5 border border-accent-500/20">
                      <span className="font-mono text-[10px] text-accent-500 tracking-widest">BENEFIT</span>
                      <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-1">{mod.benefit}</p>
                    </div>
                  </div>
                </TechnicalPanel>
              ))}
            </div>
          </div>
        )}

        {/* Datums Tab */}
        {activeTab === "datums" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TechnicalPanel label="WHAT.ARE.DATUMS">
              <div className="p-6 space-y-4">
                <p className="text-slate-600 dark:text-slate-300 font-mono text-sm leading-relaxed">
                  <strong className="text-accent-500">Datums</strong> are theoretical perfect geometric references
                  derived from actual part features. They establish the coordinate system
                  from which measurements are made.
                </p>
                <p className="text-slate-600 dark:text-slate-300 font-mono text-sm leading-relaxed">
                  Datum features are identified by <strong className="text-accent-500">letters (A, B, C...)</strong> and
                  are listed in the FCF in order of precedence (primary, secondary, tertiary).
                </p>
              </div>
            </TechnicalPanel>

            <TechnicalPanel label="DATUM.REFERENCE.FRAME">
              <div className="p-6 space-y-4">
                <p className="text-slate-600 dark:text-slate-300 font-mono text-sm leading-relaxed">
                  A <strong className="text-accent-500">Datum Reference Frame (DRF)</strong> is a 3D coordinate system
                  established by three mutually perpendicular datum planes.
                </p>
                <div className="space-y-2 mt-4">
                  {[
                    { label: "PRIMARY (A)", desc: "Removes 3 degrees of freedom - establishes first plane" },
                    { label: "SECONDARY (B)", desc: "Removes 2 degrees of freedom - establishes second plane" },
                    { label: "TERTIARY (C)", desc: "Removes 1 degree of freedom - completes the DRF" },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                      <span className="font-mono text-xs text-accent-500 font-semibold">{item.label}</span>
                      <p className="font-mono text-[10px] text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TechnicalPanel>

            <TechnicalPanel label="DATUM.MODIFIERS" className="lg:col-span-2">
              <div className="p-6">
                <p className="text-slate-600 dark:text-slate-300 font-mono text-sm leading-relaxed mb-4">
                  Datum feature references can also have material condition modifiers applied:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-400 font-bold">Ⓜ</span>
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold">Datum at MMC</span>
                    </div>
                    <p className="font-mono text-xs text-slate-500">
                      Allows datum shift (movement) when the datum feature departs from MMC.
                    </p>
                  </div>
                  <div className="p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-cyan-400 font-bold">Ⓛ</span>
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold">Datum at LMC</span>
                    </div>
                    <p className="font-mono text-xs text-slate-500">
                      Allows datum shift when the datum feature departs from LMC.
                    </p>
                  </div>
                </div>
              </div>
            </TechnicalPanel>
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab === "workflow" && (
          <div className="space-y-6">
            <TechnicalPanel label="HOW.TO.USE.DATUMPILOT">
              <div className="p-6">
                <p className="text-slate-600 dark:text-slate-300 font-mono text-sm leading-relaxed mb-6">
                  DatumPilot provides an interactive workflow for building and interpreting Feature Control Frames:
                </p>
                <div className="max-w-xl">
                  {/* Builder Workflow */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-sm text-accent-500 font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      FCF BUILDER WORKFLOW
                    </h3>
                    <div className="space-y-3">
                      {[
                        { step: "1", action: "Select characteristic type", desc: "Position, flatness, etc." },
                        { step: "2", action: "Set tolerance value", desc: "Specify the allowable variation" },
                        { step: "3", action: "Add modifiers", desc: "MMC, LMC, or leave as RFS" },
                        { step: "4", action: "Configure datums", desc: "Add primary, secondary, tertiary" },
                        { step: "5", action: "Validate and interpret", desc: "Get AI-powered explanation" },
                        { step: "6", action: "Export or save", desc: "PNG, SVG, PDF or save to project" },
                      ].map((item) => (
                        <div key={item.step} className="flex items-start gap-3 p-3 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                          <span className="font-mono text-xs text-accent-500 font-bold w-5">{item.step}</span>
                          <div>
                            <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{item.action}</span>
                            <p className="font-mono text-[10px] text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TechnicalPanel>

            <TechnicalPanel label="REFERENCE.STANDARD">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-mono text-sm text-slate-700 dark:text-slate-200 font-semibold mb-2">
                      ASME Y14.5-2018
                    </h3>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mb-4">
                      DatumPilot validates FCFs according to the ASME Y14.5-2018 standard,
                      the current American standard for geometric dimensioning and tolerancing.
                    </p>
                    <a
                      href="https://www.asme.org/codes-standards/find-codes-standards/y14-5-dimensioning-and-tolerancing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-mono text-xs text-accent-500 hover:underline"
                    >
                      Learn more about ASME Y14.5
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </TechnicalPanel>
          </div>
        )}
      </div>
    </div>
  );
}
