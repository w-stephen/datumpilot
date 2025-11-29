"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Target,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Grid,
  List,
  Trash2,
  Edit,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Mock project data
interface Project {
  id: string;
  name: string;
  description: string;
  fcfCount: number;
  measurementCount: number;
  validationStatus: "valid" | "warning" | "error";
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

const mockProjects: Project[] = [
  {
    id: "proj-001",
    name: "Assembly QA - Phase 2",
    description: "Quality assurance checks for the main assembly components",
    fcfCount: 12,
    measurementCount: 48,
    validationStatus: "valid",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    tags: ["assembly", "QA"],
  },
  {
    id: "proj-002",
    name: "Engine Block Tolerances",
    description: "Critical dimension checks for engine block machining",
    fcfCount: 24,
    measurementCount: 156,
    validationStatus: "warning",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-19",
    tags: ["engine", "machining"],
  },
  {
    id: "proj-003",
    name: "Bracket Mount Analysis",
    description: "Position and orientation tolerances for bracket mount points",
    fcfCount: 8,
    measurementCount: 32,
    validationStatus: "valid",
    createdAt: "2024-01-05",
    updatedAt: "2024-01-18",
    tags: ["brackets", "mounting"],
  },
  {
    id: "proj-004",
    name: "Housing Inspection",
    description: "Form and surface tolerances for housing components",
    fcfCount: 15,
    measurementCount: 0,
    validationStatus: "error",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-17",
    tags: ["housing", "inspection"],
  },
  {
    id: "proj-005",
    name: "Shaft Alignment Study",
    description: "Concentricity and runout analysis for rotating shafts",
    fcfCount: 6,
    measurementCount: 24,
    validationStatus: "valid",
    createdAt: "2023-12-20",
    updatedAt: "2024-01-16",
    tags: ["shafts", "alignment"],
  },
];

type ViewMode = "grid" | "list";
type SortField = "name" | "updatedAt" | "fcfCount";
type SortDirection = "asc" | "desc";

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    mockProjects.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, []);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let projects = [...mockProjects];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      projects = projects.filter((p) =>
        selectedTags.some((t) => p.tags.includes(t))
      );
    }

    // Sort
    projects.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "updatedAt") {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortField === "fcfCount") {
        comparison = a.fcfCount - b.fcfCount;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return projects;
  }, [searchQuery, selectedTags, sortField, sortDirection]);

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Toggle tag filter
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-mono font-bold text-slate-50 tracking-tight">
            Projects
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your FCF collections, measurements, and analysis runs
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-4 gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Tag filters */}
          <div className="flex items-center gap-1">
            {allTags.slice(0, 4).map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-2 py-1 text-xs rounded-md border transition-colors",
                  selectedTags.includes(tag)
                    ? "bg-primary-500/20 border-primary-500 text-primary-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Sort */}
          <button
            onClick={() => toggleSort("updatedAt")}
            className="btn-secondary text-sm"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortField === "updatedAt"
              ? "Date"
              : sortField === "name"
              ? "Name"
              : "FCFs"}
          </button>

          {/* View mode */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === "grid"
                  ? "bg-slate-700 text-slate-200"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === "list"
                  ? "bg-slate-700 text-slate-200"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Project Grid/List */}
      <div className="flex-1 overflow-auto">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderKanban className="w-12 h-12 text-slate-700 mb-4" />
            <h3 className="text-lg font-medium text-slate-400 mb-2">
              No Projects Found
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {searchQuery || selectedTags.length > 0
                ? "Try adjusting your search or filters"
                : "Create your first project to start organizing FCFs"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showDropdown={showDropdown === project.id}
                onToggleDropdown={() =>
                  setShowDropdown(showDropdown === project.id ? null : project.id)
                }
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                showDropdown={showDropdown === project.id}
                onToggleDropdown={() =>
                  setShowDropdown(showDropdown === project.id ? null : project.id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Project Card Component
function ProjectCard({
  project,
  showDropdown,
  onToggleDropdown,
}: {
  project: Project;
  showDropdown: boolean;
  onToggleDropdown: () => void;
}) {
  const statusConfig = {
    valid: {
      icon: CheckCircle2,
      color: "text-success-500",
      bg: "bg-success-500/10",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-warning-500",
      bg: "bg-warning-500/10",
    },
    error: {
      icon: AlertTriangle,
      color: "text-error-500",
      bg: "bg-error-500/10",
    },
  };

  const status = statusConfig[project.validationStatus];
  const StatusIcon = status.icon;

  return (
    <Link
      href={`/app/projects/${project.id}`}
      className="group relative bg-slate-900/50 border border-slate-800 rounded-lg p-5 hover:border-slate-700 hover:-translate-y-0.5 transition-all"
    >
      {/* Dropdown menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleDropdown();
          }}
          className="p-1.5 rounded hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4 text-slate-400" />
        </button>
        {showDropdown && (
          <div className="absolute right-0 top-8 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 z-10">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-400 hover:bg-slate-700">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800">
          <FolderKanban className="w-5 h-5 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-mono font-semibold text-slate-100 truncate">
            {project.name}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2">
            {project.description}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-accent-500" />
          <span className="text-sm font-medium text-slate-300">
            {project.fcfCount}
          </span>
          <span className="text-xs text-slate-500">FCFs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileJson className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-medium text-slate-300">
            {project.measurementCount}
          </span>
          <span className="text-xs text-slate-500">measurements</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded", status.bg)}>
          <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
          <span className={cn("text-xs capitalize", status.color)}>
            {project.validationStatus}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          {new Date(project.updatedAt).toLocaleDateString()}
        </div>
      </div>

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-3">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

// Project Row Component
function ProjectRow({
  project,
  showDropdown,
  onToggleDropdown,
}: {
  project: Project;
  showDropdown: boolean;
  onToggleDropdown: () => void;
}) {
  const statusConfig = {
    valid: {
      icon: CheckCircle2,
      color: "text-success-500",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-warning-500",
    },
    error: {
      icon: AlertTriangle,
      color: "text-error-500",
    },
  };

  const status = statusConfig[project.validationStatus];
  const StatusIcon = status.icon;

  return (
    <Link
      href={`/app/projects/${project.id}`}
      className="group flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 hover:border-slate-700 transition-colors"
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800">
        <FolderKanban className="w-4 h-4 text-slate-400" />
      </div>

      {/* Name & Description */}
      <div className="flex-1 min-w-0">
        <h3 className="font-mono font-medium text-slate-200 truncate">
          {project.name}
        </h3>
        <p className="text-xs text-slate-500 truncate">{project.description}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-accent-500" />
          <span className="text-slate-300">{project.fcfCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileJson className="w-4 h-4 text-primary-500" />
          <span className="text-slate-300">{project.measurementCount}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        <StatusIcon className={cn("w-4 h-4", status.color)} />
      </div>

      {/* Date */}
      <div className="flex items-center gap-1 text-xs text-slate-500 w-24">
        <Calendar className="w-3.5 h-3.5" />
        {new Date(project.updatedAt).toLocaleDateString()}
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleDropdown();
          }}
          className="p-1.5 rounded hover:bg-slate-800 transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-slate-400" />
        </button>
        {showDropdown && (
          <div className="absolute right-0 top-8 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1 z-10">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-400 hover:bg-slate-700">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
