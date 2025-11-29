"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Download,
  Settings,
  Target,
  FileJson,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Eye,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson } from "@/lib/fcf/schema";
import FcfPreview from "@/components/fcf/FcfPreview";
import { CharacteristicIcon } from "@/components/gdt/CharacteristicIcon";
import { ValidationStatus } from "@/components/gdt/ValidationMessage";

interface ProjectDetailPageProps {
  params: { id: string };
}

// Mock project data
const mockProject = {
  id: "proj-001",
  name: "Assembly QA - Phase 2",
  description: "Quality assurance checks for the main assembly components",
  createdAt: "2024-01-15",
  updatedAt: "2024-01-20",
  tags: ["assembly", "QA"],
};

// Mock FCF records
const mockFcfRecords: Array<{
  id: string;
  name: string;
  fcf: Partial<FcfJson>;
  valid: boolean;
  errorCount: number;
  warningCount: number;
  measurementCount: number;
  lastMeasured: string | null;
}> = [
  {
    id: "fcf-001",
    name: "Mounting Hole Position",
    fcf: {
      characteristic: "position",
      featureType: "hole",
      tolerance: { value: 0.25, diameter: true, materialCondition: "MMC" },
      datums: [{ id: "A" }, { id: "B" }, { id: "C" }],
      sourceUnit: "mm",
    },
    valid: true,
    errorCount: 0,
    warningCount: 1,
    measurementCount: 12,
    lastMeasured: "2024-01-20",
  },
  {
    id: "fcf-002",
    name: "Top Surface Flatness",
    fcf: {
      characteristic: "flatness",
      featureType: "surface",
      tolerance: { value: 0.05 },
      datums: [],
      sourceUnit: "mm",
    },
    valid: true,
    errorCount: 0,
    warningCount: 0,
    measurementCount: 8,
    lastMeasured: "2024-01-19",
  },
  {
    id: "fcf-003",
    name: "Datum Face Perpendicularity",
    fcf: {
      characteristic: "perpendicularity",
      featureType: "plane",
      tolerance: { value: 0.1 },
      datums: [{ id: "A" }],
      sourceUnit: "mm",
    },
    valid: true,
    errorCount: 0,
    warningCount: 0,
    measurementCount: 6,
    lastMeasured: "2024-01-18",
  },
  {
    id: "fcf-004",
    name: "Slot Position",
    fcf: {
      characteristic: "position",
      featureType: "slot",
      tolerance: { value: 0.5, materialCondition: "MMC" },
      datums: [{ id: "A" }, { id: "B" }],
      sourceUnit: "mm",
    },
    valid: false,
    errorCount: 1,
    warningCount: 0,
    measurementCount: 0,
    lastMeasured: null,
  },
];

// Mock measurements
const mockMeasurements = [
  { id: "m-001", fcfId: "fcf-001", value: 0.18, status: "pass", date: "2024-01-20" },
  { id: "m-002", fcfId: "fcf-001", value: 0.22, status: "pass", date: "2024-01-19" },
  { id: "m-003", fcfId: "fcf-002", value: 0.03, status: "pass", date: "2024-01-19" },
  { id: "m-004", fcfId: "fcf-003", value: 0.08, status: "pass", date: "2024-01-18" },
];

type Tab = "fcfs" | "measurements" | "activity";

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("fcfs");
  const [selectedFcf, setSelectedFcf] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Stats
  const totalFcfs = mockFcfRecords.length;
  const validFcfs = mockFcfRecords.filter((f) => f.valid).length;
  const totalMeasurements = mockMeasurements.length;
  const passRate = totalMeasurements > 0
    ? Math.round((mockMeasurements.filter((m) => m.status === "pass").length / totalMeasurements) * 100)
    : 0;

  const selectedFcfData = selectedFcf
    ? mockFcfRecords.find((f) => f.id === selectedFcf)
    : null;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-800">
        <div className="flex items-start gap-4">
          <Link
            href="/app/projects"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-mono font-bold text-slate-50 tracking-tight">
              {mockProject.name}
            </h1>
            <p className="text-slate-400 mt-1">{mockProject.description}</p>
            <div className="flex items-center gap-2 mt-2">
              {mockProject.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded"
                >
                  {tag}
                </span>
              ))}
              <span className="text-xs text-slate-500">
                Updated {new Date(mockProject.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn-secondary text-sm">
            <Settings className="w-4 h-4" />
          </button>
          <button className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Add FCF
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 py-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm">FCF Records</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-100">
              {totalFcfs}
            </span>
            <span className="text-sm text-success-500">
              {validFcfs} valid
            </span>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Measurements</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-100">
              {totalMeasurements}
            </span>
            <span className="text-sm text-slate-500">total</span>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Pass Rate</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-success-500">
              {passRate}%
            </span>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Last Activity</span>
          </div>
          <div className="text-lg font-mono text-slate-100">
            {new Date(mockProject.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800">
        {(
          [
            { id: "fcfs", label: "FCF Records", icon: Target },
            { id: "measurements", label: "Measurements", icon: Activity },
            { id: "activity", label: "Activity", icon: Clock },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === id
                ? "border-primary-500 text-primary-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden pt-4">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FCF List */}
          <div className="lg:col-span-2 overflow-auto">
            {activeTab === "fcfs" && (
              <div className="space-y-3">
                {mockFcfRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => setSelectedFcf(record.id)}
                    className={cn(
                      "group relative bg-slate-900/50 border rounded-lg p-4 cursor-pointer transition-all",
                      selectedFcf === record.id
                        ? "border-primary-500 bg-primary-500/5"
                        : "border-slate-800 hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* FCF Preview */}
                      <div className="flex-shrink-0 p-3 bg-slate-950/50 rounded-lg">
                        <FcfPreview fcf={record.fcf} scale={1} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-mono font-semibold text-slate-200">
                              {record.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <CharacteristicIcon
                                characteristic={record.fcf.characteristic!}
                                size="sm"
                                showLabel
                              />
                              <span className="text-xs text-slate-500">
                                {record.fcf.featureType}
                              </span>
                            </div>
                          </div>
                          <ValidationStatus
                            valid={record.valid}
                            errorCount={record.errorCount}
                            warningCount={record.warningCount}
                            size="sm"
                          />
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Activity className="w-3.5 h-3.5" />
                            <span>{record.measurementCount} measurements</span>
                          </div>
                          {record.lastMeasured && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {new Date(record.lastMeasured).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDropdown(
                              showDropdown === record.id ? null : record.id
                            );
                          }}
                          className="p-1.5 rounded hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>
                        {showDropdown === record.id && (
                          <div className="absolute right-0 top-8 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 z-10">
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
                              <Play className="w-4 h-4" />
                              Run Calculation
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
                              <Edit className="w-4 h-4" />
                              Edit in Builder
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-400 hover:bg-slate-700">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "measurements" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono font-semibold text-slate-200">
                    Recent Measurements
                  </h3>
                  <button className="btn-secondary text-sm">
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                </div>
                {mockMeasurements.map((measurement) => {
                  const fcf = mockFcfRecords.find((f) => f.id === measurement.fcfId);
                  return (
                    <div
                      key={measurement.id}
                      className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3"
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          measurement.status === "pass"
                            ? "bg-success-500"
                            : "bg-error-500"
                        )}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-slate-300">
                          {fcf?.name || "Unknown FCF"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(measurement.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-accent-400">
                          {measurement.value.toFixed(3)}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">mm</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">
                  Activity Timeline
                </h3>
                <p className="text-sm text-slate-500">
                  Activity log coming soon
                </p>
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="overflow-auto">
            {selectedFcfData ? (
              <div className="panel sticky top-0">
                <div className="panel-header">
                  <h3 className="panel-title">FCF Details</h3>
                </div>

                {/* Large preview */}
                <div className="p-6 bg-slate-950/50 rounded-lg flex items-center justify-center mb-4">
                  <FcfPreview fcf={selectedFcfData.fcf} scale={1.8} showGrid />
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Name</span>
                    <span className="font-mono text-slate-200">
                      {selectedFcfData.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Characteristic</span>
                    <CharacteristicIcon
                      characteristic={selectedFcfData.fcf.characteristic!}
                      size="sm"
                      showLabel
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Feature Type</span>
                    <span className="text-slate-300 capitalize">
                      {selectedFcfData.fcf.featureType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Tolerance</span>
                    <span className="font-mono text-accent-400">
                      {selectedFcfData.fcf.tolerance?.diameter && "Ø"}
                      {selectedFcfData.fcf.tolerance?.value.toFixed(3)}{" "}
                      {selectedFcfData.fcf.sourceUnit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Status</span>
                    <ValidationStatus
                      valid={selectedFcfData.valid}
                      errorCount={selectedFcfData.errorCount}
                      warningCount={selectedFcfData.warningCount}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
                  <button className="btn-primary text-sm flex-1">
                    <Play className="w-4 h-4" />
                    Calculate
                  </button>
                  <button className="btn-secondary text-sm">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    Select an FCF to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
