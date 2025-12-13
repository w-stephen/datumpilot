import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  id: string;
  type: "project" | "fcf" | "stackup";
  name: string;
  description?: string;
  href: string;
  meta?: {
    characteristic?: string;
    tags?: string[];
    method?: string;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], query: query || "" });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const results: SearchResult[] = [];
    const searchPattern = `%${query}%`;

    // Search projects
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, description, tags")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .limit(5);

    if (projects) {
      for (const project of projects) {
        results.push({
          id: project.id,
          type: "project",
          name: project.name,
          description: project.description || undefined,
          href: `/app/projects/${project.id}`,
          meta: {
            tags: project.tags,
          },
        });
      }
    }

    // Search FCF records
    const { data: fcfRecords } = await supabase
      .from("fcf_records")
      .select("id, name, characteristic, project_id, projects!inner(user_id)")
      .eq("projects.user_id", user.id)
      .is("deleted_at", null)
      .or(`name.ilike.${searchPattern}`)
      .limit(5);

    if (fcfRecords) {
      for (const fcf of fcfRecords) {
        results.push({
          id: fcf.id,
          type: "fcf",
          name: fcf.name,
          href: `/app/projects/${fcf.project_id}?fcf=${fcf.id}`,
          meta: {
            characteristic: fcf.characteristic,
          },
        });
      }
    }

    // Search stack-up analyses
    const { data: stackups } = await supabase
      .from("stackup_analyses")
      .select("id, name, method, project_id, projects!inner(user_id)")
      .eq("projects.user_id", user.id)
      .is("deleted_at", null)
      .or(`name.ilike.${searchPattern}`)
      .limit(5);

    if (stackups) {
      for (const stackup of stackups) {
        results.push({
          id: stackup.id,
          type: "stackup",
          name: stackup.name,
          href: `/app/stackup/${stackup.id}`,
          meta: {
            method: stackup.method,
          },
        });
      }
    }

    return NextResponse.json({
      results,
      query,
    } satisfies SearchResponse);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
