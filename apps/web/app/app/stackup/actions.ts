"use server";

import { revalidatePath } from "next/cache";
import {
  calculateStackup,
  type CreateStackupInput,
  type UpdateStackupInput,
  type StackupAnalysis,
  type StackupResult,
} from "@/lib/stackup";

// Note: When Supabase client is implemented, replace mock data with real database calls
// import { createClient } from '@/lib/supabase/server';

/**
 * Type combining analysis with computed result
 */
export interface StackupWithResult extends StackupAnalysis {
  result?: StackupResult;
}

// Mock data storage (replace with Supabase when available)
let mockAnalyses: StackupAnalysis[] = [
  {
    id: "mock-001",
    projectId: "proj-001",
    name: "Bearing Housing Clearance",
    description: "Analysis of clearance between bearing OD and housing bore",
    measurementObjective: "Gap between bearing outer race and housing bore",
    acceptanceCriteria: { minimum: 0, maximum: 0.05 },
    positiveDirection: "left-to-right",
    dimensions: [
      {
        id: "dim-001",
        name: "Housing Bore",
        nominal: 50.0,
        tolerancePlus: 0.025,
        toleranceMinus: 0.0,
        sign: "positive",
        sensitivityCoefficient: 1,
        sourceDrawing: "HSG-001",
      },
      {
        id: "dim-002",
        name: "Bearing OD",
        nominal: 50.0,
        tolerancePlus: 0.0,
        toleranceMinus: 0.013,
        sign: "negative",
        sensitivityCoefficient: 1,
        sourceDrawing: "BRG-6210",
      },
    ],
    analysisMethod: "worst-case",
    unit: "mm",
    createdBy: "user-001",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mock-002",
    projectId: "proj-001",
    name: "Shaft End Play",
    description: "Axial play analysis for rotating shaft assembly",
    measurementObjective: "Total axial play of shaft in housing",
    acceptanceCriteria: { minimum: 0.1, maximum: 0.5 },
    positiveDirection: "left-to-right",
    dimensions: [
      {
        id: "dim-003",
        name: "Housing Depth",
        nominal: 100.0,
        tolerancePlus: 0.1,
        toleranceMinus: 0.1,
        sign: "positive",
        sensitivityCoefficient: 1,
      },
      {
        id: "dim-004",
        name: "Bearing A Width",
        nominal: 25.0,
        tolerancePlus: 0.05,
        toleranceMinus: 0.05,
        sign: "negative",
        sensitivityCoefficient: 1,
      },
      {
        id: "dim-005",
        name: "Spacer",
        nominal: 10.0,
        tolerancePlus: 0.08,
        toleranceMinus: 0.08,
        sign: "negative",
        sensitivityCoefficient: 1,
      },
      {
        id: "dim-006",
        name: "Bearing B Width",
        nominal: 25.0,
        tolerancePlus: 0.05,
        toleranceMinus: 0.05,
        sign: "negative",
        sensitivityCoefficient: 1,
      },
      {
        id: "dim-007",
        name: "Shaft Length",
        nominal: 39.5,
        tolerancePlus: 0.1,
        toleranceMinus: 0.1,
        sign: "negative",
        sensitivityCoefficient: 1,
      },
    ],
    analysisMethod: "rss",
    unit: "mm",
    createdBy: "user-001",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

/**
 * Get all stack-up analyses, optionally filtered by project
 */
export async function getStackupAnalyses(
  projectId?: string
): Promise<StackupWithResult[]> {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 100));

  let analyses = [...mockAnalyses];

  if (projectId) {
    analyses = analyses.filter((a) => a.projectId === projectId);
  }

  // Calculate results for each analysis
  return analyses.map((analysis) => {
    const result =
      analysis.dimensions.length >= 2 ? calculateStackup(analysis) : undefined;
    return { ...analysis, result };
  });
}

/**
 * Get a single stack-up analysis by ID
 */
export async function getStackupAnalysis(
  id: string
): Promise<{ analysis: StackupAnalysis; result: StackupResult } | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const analysis = mockAnalyses.find((a) => a.id === id);
  if (!analysis) return null;

  const result = calculateStackup(analysis);
  return { analysis, result };
}

/**
 * Create a new stack-up analysis
 */
export async function createStackupAnalysis(
  input: CreateStackupInput
): Promise<StackupAnalysis> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const now = new Date().toISOString();
  const analysis: StackupAnalysis = {
    id: `mock-${Date.now()}`,
    ...input,
    createdBy: "user-001", // Would come from auth in real implementation
    createdAt: now,
    updatedAt: now,
  };

  mockAnalyses = [analysis, ...mockAnalyses];
  revalidatePath("/app/stackup");

  return analysis;
}

/**
 * Update an existing stack-up analysis
 */
export async function updateStackupAnalysis(
  id: string,
  input: UpdateStackupInput
): Promise<StackupAnalysis | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const index = mockAnalyses.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updated: StackupAnalysis = {
    ...mockAnalyses[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };

  mockAnalyses[index] = updated;
  revalidatePath(`/app/stackup/${id}`);
  revalidatePath("/app/stackup");

  return updated;
}

/**
 * Delete a stack-up analysis (soft delete)
 */
export async function deleteStackupAnalysis(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const index = mockAnalyses.findIndex((a) => a.id === id);
  if (index === -1) return false;

  mockAnalyses = mockAnalyses.filter((a) => a.id !== id);
  revalidatePath("/app/stackup");

  return true;
}

/**
 * Duplicate an existing analysis
 */
export async function duplicateStackupAnalysis(
  id: string
): Promise<StackupAnalysis | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const original = mockAnalyses.find((a) => a.id === id);
  if (!original) return null;

  const now = new Date().toISOString();
  const duplicate: StackupAnalysis = {
    ...original,
    id: `mock-${Date.now()}`,
    name: `${original.name} (Copy)`,
    dimensions: original.dimensions.map((d) => ({
      ...d,
      id: crypto.randomUUID(),
    })),
    createdAt: now,
    updatedAt: now,
  };

  mockAnalyses = [duplicate, ...mockAnalyses];
  revalidatePath("/app/stackup");

  return duplicate;
}
