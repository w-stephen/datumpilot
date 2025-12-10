import { Suspense } from "react";
import { getUser } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/stripe/actions";
import { PricingCards } from "@/components/billing/PricingCards";
import { Crosshair, Check, Zap } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Pricing | DatumPilot",
  description: "Choose the plan that fits your GD&T workflow",
};

export default async function PricingPage() {
  const user = await getUser();
  const subscription = user ? await getSubscription() : null;
  const currentTier = (subscription?.tier as "free" | "pro" | "team") || "free";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0A0E14]">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00D4AA 1px, transparent 1px),
            linear-gradient(to bottom, #00D4AA 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10">
            <div className="absolute inset-0 border border-accent-500/50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 bg-accent-500" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2 bg-accent-500" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-px bg-accent-500" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-px bg-accent-500" />
            <Crosshair className="w-5 h-5 text-accent-500" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-50 tracking-widest">
              DATUMPILOT
            </span>
            <span className="font-mono text-[9px] text-slate-500 dark:text-slate-600 tracking-[0.2em]">
              GD&T SYSTEM
            </span>
          </div>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-px bg-accent-500" />
            <span className="font-mono text-[10px] text-accent-500 tracking-widest">
              PRICING
            </span>
            <div className="w-12 h-px bg-accent-500" />
          </div>
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-4">
            CHOOSE YOUR PLAN
          </h1>
          <p className="font-mono text-sm text-slate-500 dark:text-slate-600 max-w-xl mx-auto">
            Start free, upgrade when you need more power. All plans include
            ASME Y14.5-2018 validation and tolerance calculations.
          </p>
        </div>

        {/* Pricing cards */}
        <Suspense
          fallback={
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[500px] bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <PricingCards currentTier={currentTier} isLoggedIn={!!user} />
        </Suspense>

        {/* Features comparison */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h2 className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              ALL PLANS INCLUDE
            </h2>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-600">
              Core features available on every plan
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "FCF Builder",
                description: "Build feature control frames with live ASME validation",
              },
              {
                title: "FCF Interpreter",
                description: "Parse and validate FCF data with instant feedback",
              },
              {
                title: "Tolerance Calculations",
                description: "Position, flatness, perpendicularity, profile calculators",
              },
              {
                title: "Stack-Up Analysis",
                description: "Worst-Case, RSS, and Six Sigma methods",
              },
              {
                title: "Project Organization",
                description: "Organize FCFs and measurements by project",
              },
              {
                title: "PNG/SVG Export",
                description: "Export FCF drawings for documentation and reports",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-4 bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center border border-accent-500/30 bg-accent-500/10">
                  <Check className="w-3 h-3 text-accent-500" />
                </div>
                <div>
                  <h3 className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {feature.title}
                  </h3>
                  <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500/10 border border-accent-500/30">
            <Zap className="w-4 h-4 text-accent-500" />
            <span className="font-mono text-xs text-accent-500">
              Start free and upgrade anytime
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center">
        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600">
          Questions? Contact{" "}
          <a
            href="mailto:support@datumpilot.com"
            className="text-accent-500 hover:text-accent-400"
          >
            support@datumpilot.com
          </a>
        </p>
      </footer>
    </div>
  );
}
