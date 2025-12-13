"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
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
    description: "Position and runout analysis for rotating shafts",
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

// Technical panel wrapper
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
      "relative bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800",
      label && "mt-3",
      className
    )}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 dark:border-slate-700" />

      {label && (
        <div className="absolute -top-2.5 left-4 px-2 bg-slate-50 dark:bg-[#0D1117] font-mono text-[10px] text-slate-600 dark:text-slate-500 tracking-widest">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">PROJ.MANAGER</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            PROJECTS
          </h1>
          <p className="text-slate-600 dark:text-slate-500 mt-1 font-mono text-sm">
            Manage FCF collections, measurements, and analysis runs
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-slate-950 font-mono text-xs font-semibold hover:bg-accent-400 transition-colors"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          NEW PROJECT
        </button>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 py-3 px-4 bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-accent-500 animate-pulse" />
          <span className="font-mono text-xs text-accent-500">
            {filteredProjects.length} PROJECT{filteredProjects.length !== 1 ? 'S' : ''}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
        <span className="font-mono text-[10px] text-slate-600 dark:text-slate-500">
          SORT: {sortField.toUpperCase()} {sortDirection.toUpperCase()}
        </span>
        {selectedTags.length > 0 && (
          <>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
              FILTER: {selectedTags.join(', ').toUpperCase()}
            </span>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-4 gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-accent-500/50 focus:border-accent-500/50"
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
                  "px-2 py-1 font-mono text-[10px] border transition-colors uppercase",
                  selectedTags.includes(tag)
                    ? "bg-accent-500/20 border-accent-500 text-accent-400"
                    : "bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Sort */}
          <button
            onClick={() => toggleSort("updatedAt")}
            className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 font-mono text-[10px] transition-colors"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortField === "updatedAt"
              ? "DATE"
              : sortField === "name"
              ? "NAME"
              : "FCFs"}
          </button>

          {/* View mode */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  : "text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400"
              )}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list"
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  : "text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400"
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Project Grid/List */}
      <div className="flex-1 overflow-auto scrollbar-hide pt-4">
        {filteredProjects.length === 0 ? (
          <TechnicalPanel label="NO.RESULTS" className="h-full">
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-16 h-16 border border-slate-800 mx-auto mb-6 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="font-mono text-sm text-slate-500 mb-2">
                NO PROJECTS FOUND
              </h3>
              <p className="font-mono text-xs text-slate-600 max-w-sm">
                {searchQuery || selectedTags.length > 0
                  ? "Try adjusting your search or filters"
                  : "Create your first project to start organizing FCFs"}
              </p>
            </div>
          </TechnicalPanel>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                showDropdown={showDropdown === project.id}
                onToggleDropdown={() =>
                  setShowDropdown(showDropdown === project.id ? null : project.id)
                }
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project, index) => (
              <ProjectRow
                key={project.id}
                project={project}
                index={index}
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
  index,
  showDropdown,
  onToggleDropdown,
}: {
  project: Project;
  index: number;
  showDropdown: boolean;
  onToggleDropdown: () => void;
}) {
  const statusConfig = {
    valid: {
      icon: CheckCircle2,
      color: "text-accent-500",
      label: "VALID",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-warning-500",
      label: "WARNING",
    },
    error: {
      icon: AlertTriangle,
      color: "text-error-500",
      label: "ERROR",
    },
  };

  const status = statusConfig[project.validationStatus];
  const StatusIcon = status.icon;

  return (
    <Link
      href={`/app/projects/${project.id}`}
      className="group relative bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 dark:border-slate-700" />

      {/* Index label */}
      <div className="absolute -top-2.5 left-4 px-2 bg-slate-50 dark:bg-[#0D1117] font-mono text-[10px] text-slate-600 dark:text-slate-600 tracking-widest">
        PROJ.{String(index + 1).padStart(2, '0')}
      </div>

      {/* Dropdown menu */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleDropdown();
          }}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4 text-slate-500" />
        </button>
        {showDropdown && (
          <div className="absolute right-0 top-8 w-32 bg-white dark:bg-[#0A0E14] border border-slate-200 dark:border-slate-800 py-1 z-10">
            {/* Corner accents for dropdown */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-300 dark:border-slate-700" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-300 dark:border-slate-700" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-300 dark:border-slate-700" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-300 dark:border-slate-700" />
            <button className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[10px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Edit className="w-3 h-3" />
              EDIT
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[10px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Copy className="w-3 h-3" />
              DUPLICATE
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[10px] text-error-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Trash2 className="w-3 h-3" />
              DELETE
            </button>
          </div>
        )}
      </div>

      <div className="p-5 pt-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 border border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center">
            <FolderKanban className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 truncate uppercase">
              {project.name}
            </h3>
            <p className="font-mono text-[10px] text-slate-600 dark:text-slate-500 line-clamp-2 mt-1">
              {project.description}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-accent-500" />
            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
              {project.fcfCount}
            </span>
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-600">FCFs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileJson className="w-3.5 h-3.5 text-primary-500" />
            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
              {project.measurementCount}
            </span>
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-600">MEAS</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
            <span className={cn("font-mono text-[10px]", status.color)}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-slate-600">
            <Clock className="w-3 h-3" />
            {new Date(project.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-3">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 font-mono text-[9px] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// Project Row Component
function ProjectRow({
  project,
  index,
  showDropdown,
  onToggleDropdown,
}: {
  project: Project;
  index: number;
  showDropdown: boolean;
  onToggleDropdown: () => void;
}) {
  const statusConfig = {
    valid: {
      icon: CheckCircle2,
      color: "text-accent-500",
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
      className="group flex items-center gap-4 bg-slate-900/40 border border-slate-800 px-4 py-3 hover:border-slate-700 transition-colors"
    >
      {/* Index */}
      <span className="font-mono text-[10px] text-slate-600 w-8">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Icon */}
      <div className="w-8 h-8 border border-slate-700 bg-slate-800/50 flex items-center justify-center">
        <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
      </div>

      {/* Name & Description */}
      <div className="flex-1 min-w-0">
        <h3 className="font-mono text-xs text-slate-200 truncate uppercase">
          {project.name}
        </h3>
        <p className="font-mono text-[10px] text-slate-600 truncate">{project.description}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-accent-500" />
          <span className="font-mono text-xs text-slate-300">{project.fcfCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileJson className="w-3.5 h-3.5 text-primary-500" />
          <span className="font-mono text-xs text-slate-300">{project.measurementCount}</span>
        </div>
      </div>

      {/* Status */}
      <StatusIcon className={cn("w-4 h-4", status.color)} />

      {/* Date */}
      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600 w-24">
        <Calendar className="w-3 h-3" />
        {new Date(project.updatedAt).toLocaleDateString()}
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleDropdown();
          }}
          className="p-1.5 hover:bg-slate-800 transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-slate-500" />
        </button>
        {showDropdown && (
          <div className="absolute right-0 top-8 w-32 bg-[#0A0E14] border border-slate-800 py-1 z-10">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-700" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-700" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-700" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-700" />
            <button className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[10px] text-slate-400 hover:bg-slate-800">
              <Edit className="w-3 h-3" />
              EDIT
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[10px] text-slate-400 hover:bg-slate-800">
              <Copy className="w-3 h-3" />
              DUPLICATE
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[10px] text-error-400 hover:bg-slate-800">
              <Trash2 className="w-3 h-3" />
              DELETE
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
