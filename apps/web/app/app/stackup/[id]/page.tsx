import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStackupAnalysis } from "../actions";
import { StackupDetailView } from "./StackupDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const data = await getStackupAnalysis(id);

  if (!data) {
    return { title: "Analysis Not Found | DatumPilot" };
  }

  return {
    title: `${data.analysis.name} | Stack-Up Analysis | DatumPilot`,
    description: data.analysis.measurementObjective,
  };
}

export default async function StackupDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getStackupAnalysis(id);

  if (!data) {
    notFound();
  }

  const { analysis, result } = data;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <Link
          href="/app/stackup"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono text-xs">BACK TO ANALYSES</span>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-px bg-accent-500" />
          <span className="font-mono text-xs text-accent-500 tracking-widest uppercase">
            {analysis.analysisMethod}
          </span>
        </div>
        <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight uppercase">
          {analysis.name}
        </h1>
        <p className="text-slate-500 mt-1 font-mono text-sm">
          {analysis.measurementObjective}
        </p>
      </div>

      {/* Detail View */}
      <StackupDetailView analysis={analysis} result={result} />
    </div>
  );
}
