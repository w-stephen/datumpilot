"use client";

import { useState, useCallback, useEffect } from "react";
import {
  X,
  Save,
  FolderPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FcfJson, Characteristic } from "@/lib/fcf/schema";
import type { Project } from "@/lib/database/types";

interface SaveFcfModalProps {
  isOpen: boolean;
  onClose: () => void;
  fcf: Partial<FcfJson>;
  onSaveSuccess?: (recordId: string, projectId: string) => void;
}

type SaveStatus = "idle" | "loading" | "success" | "error";

export default function SaveFcfModal({
  isOpen,
  onClose,
  fcf,
  onSaveSuccess,
}: SaveFcfModalProps) {
  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // New project form
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  // FCF name
  const [fcfName, setFcfName] = useState("");

  // Save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProjects();
      // Generate default name from characteristic
      const defaultName = fcf.characteristic
        ? `${fcf.characteristic.charAt(0).toUpperCase() + fcf.characteristic.slice(1)} FCF`
        : "New FCF";
      setFcfName(defaultName);
    }
  }, [isOpen, fcf.characteristic]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSaveStatus("idle");
      setErrorMessage(null);
      setSavedRecordId(null);
      setShowNewProject(false);
      setNewProjectName("");
    }
  }, [isOpen]);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (data.success && data.data?.data) {
        setProjects(data.data.data);
        // Auto-select the first project if available
        if (data.data.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  }, [selectedProjectId]);

  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) return;

    setCreatingProject(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Add new project to list and select it
        setProjects((prev) => [data.data, ...prev]);
        setSelectedProjectId(data.data.id);
        setShowNewProject(false);
        setNewProjectName("");
      } else {
        setErrorMessage(data.error?.message || "Failed to create project");
      }
    } catch (error) {
      setErrorMessage("Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  }, [newProjectName]);

  const handleSave = useCallback(async () => {
    if (!selectedProjectId || !fcfName.trim()) {
      setErrorMessage("Please select a project and enter a name");
      return;
    }

    setSaveStatus("loading");
    setErrorMessage(null);

    try {
      // Build the complete FCF JSON for saving
      const fcfJson: FcfJson = {
        characteristic: fcf.characteristic as Characteristic,
        sourceUnit: fcf.sourceUnit || "mm",
        source: fcf.source || { inputType: "builder" },
        tolerance: fcf.tolerance || { value: 0 },
        datums: fcf.datums,
        featureType: fcf.featureType,
        name: fcfName.trim(),
        modifiers: fcf.modifiers,
        pattern: fcf.pattern,
        sizeDimension: fcf.sizeDimension,
        projectedZone: fcf.projectedZone,
        composite: fcf.composite,
        notes: fcf.notes,
      };

      const response = await fetch("/api/fcf/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProjectId,
          name: fcfName.trim(),
          characteristic: fcf.characteristic,
          feature_type: fcf.featureType,
          source_unit: fcf.sourceUnit || "mm",
          source_input_type: "builder",
          fcf_json: fcfJson,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.record) {
        setSaveStatus("success");
        setSavedRecordId(data.data.record.id);
        onSaveSuccess?.(data.data.record.id, selectedProjectId);
      } else {
        setSaveStatus("error");
        setErrorMessage(data.error?.message || "Failed to save FCF");
      }
    } catch (error) {
      setSaveStatus("error");
      setErrorMessage("Failed to save FCF. Please try again.");
    }
  }, [selectedProjectId, fcfName, fcf, onSaveSuccess]);

  if (!isOpen) return null;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const canSave = selectedProjectId && fcfName.trim() && saveStatus !== "loading";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 shadow-xl">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-500" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-500" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-500" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Save className="w-5 h-5 text-accent-500" />
            <h2 className="font-mono text-lg font-bold text-[#111827] dark:text-slate-100">
              SAVE FCF
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F3F4F6] dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-[#6B7280] dark:text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success State */}
          {saveStatus === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent-500/10 border border-accent-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-accent-500" />
              </div>
              <h3 className="font-mono text-lg text-[#111827] dark:text-slate-100 mb-2">
                FCF SAVED
              </h3>
              <p className="font-mono text-sm text-[#6B7280] dark:text-slate-500 mb-6">
                Your feature control frame has been saved to the project.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-accent-500 text-slate-950 font-mono text-sm font-semibold hover:bg-accent-400 transition-colors"
              >
                CLOSE
              </button>
            </div>
          )}

          {/* Form */}
          {saveStatus !== "success" && (
            <>
              {/* FCF Name */}
              <div>
                <label className="block font-mono text-xs text-[#6B7280] dark:text-slate-500 tracking-widest mb-2">
                  FCF NAME
                </label>
                <input
                  type="text"
                  value={fcfName}
                  onChange={(e) => setFcfName(e.target.value)}
                  placeholder="Enter FCF name..."
                  className="w-full px-4 py-3 bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 font-mono text-sm text-[#111827] dark:text-slate-100 placeholder-[#9CA3AF] dark:placeholder-slate-500 focus:outline-none focus:border-accent-500"
                />
              </div>

              {/* Project Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-xs text-[#6B7280] dark:text-slate-500 tracking-widest">
                    PROJECT
                  </label>
                  <button
                    onClick={() => setShowNewProject(!showNewProject)}
                    className="flex items-center gap-1 font-mono text-xs text-accent-500 hover:text-accent-400 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    NEW PROJECT
                  </button>
                </div>

                {/* New Project Form */}
                {showNewProject && (
                  <div className="mb-3 p-3 bg-accent-500/5 border border-accent-500/20">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name..."
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 font-mono text-sm text-[#111827] dark:text-slate-100 placeholder-[#9CA3AF] dark:placeholder-slate-500 focus:outline-none focus:border-accent-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateProject();
                        }}
                      />
                      <button
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim() || creatingProject}
                        className={cn(
                          "px-4 py-2 font-mono text-xs font-semibold transition-colors",
                          newProjectName.trim() && !creatingProject
                            ? "bg-accent-500 text-slate-950 hover:bg-accent-400"
                            : "bg-[#E5E7EB] dark:bg-slate-700 text-[#9CA3AF] dark:text-slate-500 cursor-not-allowed"
                        )}
                      >
                        {creatingProject ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "CREATE"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Project Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 font-mono text-sm text-left transition-colors hover:border-[#D1D5DB] dark:hover:border-slate-600"
                  >
                    {loadingProjects ? (
                      <span className="text-[#9CA3AF] dark:text-slate-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading projects...
                      </span>
                    ) : selectedProject ? (
                      <span className="text-[#111827] dark:text-slate-100">
                        {selectedProject.name}
                      </span>
                    ) : projects.length === 0 ? (
                      <span className="text-[#9CA3AF] dark:text-slate-500">
                        No projects - create one above
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF] dark:text-slate-500">
                        Select a project...
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-[#6B7280] dark:text-slate-500 transition-transform",
                        showProjectDropdown && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Dropdown */}
                  {showProjectDropdown && projects.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 shadow-lg z-10 max-h-48 overflow-auto">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => {
                            setSelectedProjectId(project.id);
                            setShowProjectDropdown(false);
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left font-mono text-sm transition-colors",
                            project.id === selectedProjectId
                              ? "bg-accent-500/10 text-accent-500"
                              : "text-[#374151] dark:text-slate-300 hover:bg-[#F3F4F6] dark:hover:bg-slate-800"
                          )}
                        >
                          {project.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-error-500/10 border border-error-500/30">
                  <AlertCircle className="w-4 h-4 text-error-500 flex-shrink-0" />
                  <span className="font-mono text-sm text-error-500">
                    {errorMessage}
                  </span>
                </div>
              )}

              {/* FCF Summary */}
              <div className="p-4 bg-[#F9FAFB] dark:bg-slate-800/50 border border-[#E5E7EB] dark:border-slate-700">
                <h4 className="font-mono text-xs text-[#6B7280] dark:text-slate-500 tracking-widest mb-3">
                  FCF SUMMARY
                </h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] dark:text-slate-500">Characteristic:</span>
                    <span className="text-[#111827] dark:text-slate-100">
                      {fcf.characteristic || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] dark:text-slate-500">Tolerance:</span>
                    <span className="text-[#111827] dark:text-slate-100">
                      {fcf.tolerance?.diameter ? "⌀" : ""}
                      {fcf.tolerance?.value?.toFixed(3) || "0.000"} {fcf.sourceUnit || "mm"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] dark:text-slate-500">Datums:</span>
                    <span className="text-[#111827] dark:text-slate-100">
                      {fcf.datums?.length
                        ? fcf.datums.map((d) => d.id).join(" - ")
                        : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {saveStatus !== "success" && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E7EB] dark:border-slate-700 font-mono text-sm text-[#6B7280] dark:text-slate-400 hover:border-[#D1D5DB] dark:hover:border-slate-600 hover:text-[#374151] dark:hover:text-slate-300 transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={cn(
                "flex items-center gap-2 px-6 py-2 font-mono text-sm font-semibold transition-colors",
                canSave
                  ? "bg-accent-500 text-slate-950 hover:bg-accent-400"
                  : "bg-[#E5E7EB] dark:bg-slate-700 text-[#9CA3AF] dark:text-slate-500 cursor-not-allowed"
              )}
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
              }}
            >
              {saveStatus === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SAVING...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  SAVE FCF
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
