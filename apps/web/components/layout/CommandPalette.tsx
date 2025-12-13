"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FolderOpen,
  FileText,
  Layers,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SearchResult, SearchResponse } from "@/app/api/search/route";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = "dp_recent_searches";
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((s) => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

function getTypeIcon(type: SearchResult["type"]) {
  switch (type) {
    case "project":
      return FolderOpen;
    case "fcf":
      return FileText;
    case "stackup":
      return Layers;
    default:
      return FileText;
  }
}

function getTypeLabel(type: SearchResult["type"]): string {
  switch (type) {
    case "project":
      return "PROJECT";
    case "fcf":
      return "FCF";
    case "stackup":
      return "STACK-UP";
  }
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data: SearchResponse = await response.json();
          setResults(data.results);
          setSelectedIndex(0);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Search failed:", error);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  // Handle navigation
  const navigateToResult = useCallback(
    (result: SearchResult) => {
      saveRecentSearch(query);
      router.push(result.href);
      onClose();
    },
    [query, router, onClose]
  );

  // Handle recent search click
  const handleRecentSearchClick = useCallback((search: string) => {
    setQuery(search);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        navigateToResult(results[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, navigateToResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <div className="relative bg-slate-900 border border-slate-700 shadow-2xl">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-500" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-500" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-500" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-500" />

          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, FCFs, stack-ups..."
              className="flex-1 bg-transparent font-mono text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 text-accent-500 animate-spin" />
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-auto">
            {results.length > 0 ? (
              <div className="py-2">
                {/* Group results by type */}
                {["project", "fcf", "stackup"].map((type) => {
                  const typeResults = results.filter((r) => r.type === type);
                  if (typeResults.length === 0) return null;

                  return (
                    <div key={type}>
                      <div className="px-4 py-1.5">
                        <span className="font-mono text-[10px] text-slate-500 tracking-widest">
                          {getTypeLabel(type as SearchResult["type"])}S
                        </span>
                      </div>
                      {typeResults.map((result) => {
                        const Icon = getTypeIcon(result.type);
                        const index = results.indexOf(result);
                        const isSelected = index === selectedIndex;

                        return (
                          <button
                            key={result.id}
                            onClick={() => navigateToResult(result)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2 transition-colors text-left",
                              isSelected
                                ? "bg-accent-500/20 text-accent-400"
                                : "text-slate-300 hover:bg-slate-800/50"
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs truncate">
                                {result.name}
                              </div>
                              {result.description && (
                                <div className="font-mono text-[10px] text-slate-500 truncate">
                                  {result.description}
                                </div>
                              )}
                              {result.meta?.characteristic && (
                                <div className="font-mono text-[10px] text-slate-500">
                                  {result.meta.characteristic.toUpperCase()}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <ArrowRight className="w-3 h-3 text-accent-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : query.length >= 2 && !isLoading ? (
              <div className="py-8 text-center">
                <p className="font-mono text-xs text-slate-500">
                  No results found for &quot;{query}&quot;
                </p>
              </div>
            ) : query.length < 2 && recentSearches.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-1.5">
                  <span className="font-mono text-[10px] text-slate-500 tracking-widest">
                    RECENT SEARCHES
                  </span>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-colors text-left"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-xs">{search}</span>
                  </button>
                ))}
              </div>
            ) : query.length < 2 ? (
              <div className="py-8 text-center">
                <p className="font-mono text-xs text-slate-500">
                  Type at least 2 characters to search
                </p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 text-slate-500">
            <div className="flex items-center gap-4 font-mono text-[10px]">
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                  &uarr;
                </kbd>{" "}
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                  &darr;
                </kbd>{" "}
                Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                  Enter
                </kbd>{" "}
                Select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                  Esc
                </kbd>{" "}
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
