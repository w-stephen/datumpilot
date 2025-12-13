"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  text: string;
  level: number;
  number: string;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

/**
 * Extract headings from markdown content and add numbering
 * Handles duplicate headings by appending -1, -2, etc. (matching rehype-slug behavior)
 */
function extractHeadings(content: string): TOCItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: TOCItem[] = [];
  const usedIds = new Map<string, number>();
  let match;

  // Counters for numbering
  let h2Count = 0;
  let h3Count = 0;
  let h4Count = 0;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Create a base slug from the heading text
    const baseId = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Handle duplicate IDs by appending -1, -2, etc. (matches rehype-slug)
    let id = baseId;
    const count = usedIds.get(baseId) || 0;
    if (count > 0) {
      id = `${baseId}-${count}`;
    }
    usedIds.set(baseId, count + 1);

    // Calculate numbering
    let number = "";
    if (level === 2) {
      h2Count++;
      h3Count = 0;
      h4Count = 0;
      number = `${h2Count}.`;
    } else if (level === 3) {
      h3Count++;
      h4Count = 0;
      number = `${h2Count}.${h3Count}`;
    } else if (level === 4) {
      h4Count++;
      number = `${h2Count}.${h3Count}.${h4Count}`;
    }

    headings.push({ id, text, level, number });
  }

  return headings;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(true);

  const headings = useMemo(() => extractHeadings(content), [content]);

  const filteredHeadings = useMemo(() => {
    if (!searchQuery.trim()) return headings;
    const query = searchQuery.toLowerCase();
    return headings.filter((heading) =>
      heading.text.toLowerCase().includes(query)
    );
  }, [headings, searchQuery]);

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -80% 0px",
        threshold: 0,
      }
    );

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav
      className={cn(
        "rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          Table of Contents
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      {isExpanded && (
        <>
          {/* Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* TOC List */}
          <ul className="max-h-[400px] overflow-y-auto px-4 pb-4">
            {filteredHeadings.length === 0 ? (
              <li className="py-2 text-sm text-gray-500 dark:text-gray-400">
                No sections found
              </li>
            ) : (
              filteredHeadings.map((heading) => (
                <li key={heading.id}>
                  <button
                    onClick={() => scrollToHeading(heading.id)}
                    className={cn(
                      "block w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                      heading.level === 2 && "font-medium",
                      heading.level === 3 && "pl-4 text-gray-600 dark:text-gray-400",
                      heading.level === 4 && "pl-6 text-gray-500 dark:text-gray-500",
                      activeId === heading.id &&
                        "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                    )}
                  >
                    <span className="mr-2 text-gray-400 dark:text-gray-500 font-mono text-xs">
                      {heading.number}
                    </span>
                    {heading.text}
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Results count when searching */}
          {searchQuery && (
            <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {filteredHeadings.length} of {headings.length} sections
            </div>
          )}
        </>
      )}
    </nav>
  );
}
