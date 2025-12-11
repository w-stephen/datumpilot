"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Loader2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  createPortalSession,
  syncSubscriptionFromStripe,
} from "@/lib/stripe/actions";
import { TIERS, type Tier } from "@/lib/stripe/config";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

interface BillingData {
  tier: Tier;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: {
    projects: number;
    fcfs: number;
    stackups: number;
    measurementsPerFcf: number;
  };
  usage: {
    projects: number;
    fcfs: number;
    stackups: number;
  };
}

export default function BillingSettingsPage() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    async function fetchBilling() {
      try {
        // If returning from checkout, sync subscription from Stripe first
        // This ensures we get the latest data even if webhook is delayed
        const isSuccess = searchParams.get("success") === "true";
        const sessionId = searchParams.get("session_id");
        if (isSuccess) {
          const syncResult = await syncSubscriptionFromStripe(
            sessionId || undefined
          );
          if (
            syncResult.success &&
            syncResult.tier &&
            syncResult.tier !== "free"
          ) {
            setSyncSuccess(true);
          }
        }

        const res = await fetch("/api/billing");
        if (!res.ok) throw new Error("Failed to fetch billing data");
        const data = await res.json();
        setBilling(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, [searchParams]);

  const handleManageBilling = () => {
    startTransition(async () => {
      await createPortalSession();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !billing) {
    return (
      <div className="p-6 bg-error-500/10 border border-error-500/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-error-500" />
          <p className="font-mono text-sm text-error-500">
            {error || "Failed to load billing data"}
          </p>
        </div>
      </div>
    );
  }

  const tierConfig = TIERS[billing.tier];
  const isPro = billing.tier === "pro" || billing.tier === "team";

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      {syncSuccess && (
        <div className="flex items-center gap-3 p-4 bg-success-500/10 border border-success-500/30">
          <CheckCircle2 className="w-5 h-5 text-success-500 flex-shrink-0" />
          <p className="font-mono text-sm text-success-500">
            Your subscription has been activated successfully!
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 bg-accent-500" />
          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-600 tracking-wider">
            SETTINGS.BILLING
          </span>
        </div>
        <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
          Billing & Subscription
        </h1>
        <p className="font-mono text-sm text-slate-500 dark:text-slate-600 mt-1">
          Manage your subscription and view usage
        </p>
      </div>

      {/* Current Plan */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-500" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-500" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-500" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-500" />

        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                  {tierConfig.name} Plan
                </h2>
                <span
                  className={cn(
                    "px-2 py-0.5 font-mono text-[10px] font-semibold",
                    billing.status === "active" || billing.status === "trialing"
                      ? "bg-success-500/20 text-success-500"
                      : billing.status === "past_due"
                        ? "bg-warning-500/20 text-warning-500"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  )}
                >
                  {billing.status.toUpperCase()}
                </span>
              </div>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-600">
                {tierConfig.description}
              </p>
              {billing.currentPeriodEnd && isPro && (
                <p className="font-mono text-xs text-slate-500 dark:text-slate-600 mt-2">
                  {billing.cancelAtPeriodEnd ? (
                    <span className="text-warning-500">
                      Cancels on{" "}
                      {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  ) : (
                    <>
                      Renews on{" "}
                      {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isPro ? (
                <button
                  onClick={handleManageBilling}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-accent-500/30 hover:bg-accent-500/5 transition-all"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5" />
                  )}
                  Manage Billing
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold bg-accent-500 text-slate-950 hover:bg-accent-400 transition-all"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                  }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Upgrade Plan
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
          USAGE
        </h2>
        <div className="space-y-4">
          <UsageBar
            label="Projects"
            current={billing.usage.projects}
            limit={billing.limits.projects}
          />
          <UsageBar
            label="FCF Records"
            current={billing.usage.fcfs}
            limit={billing.limits.fcfs}
          />
          <UsageBar
            label="Stack-Up Analyses"
            current={billing.usage.stackups}
            limit={billing.limits.stackups}
          />
        </div>
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
          FEATURES
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <FeatureRow
            label="PNG/SVG Export"
            enabled={tierConfig.features.exportPng}
          />
          <FeatureRow
            label="PDF Export"
            enabled={tierConfig.features.exportPdf}
          />
          <FeatureRow
            label="AI Explanations"
            enabled={tierConfig.features.aiExplanations}
          />
          <FeatureRow
            label="Team Members"
            enabled={tierConfig.features.teamMembers}
          />
          <FeatureRow
            label="Priority Support"
            enabled={tierConfig.features.prioritySupport}
          />
        </div>
      </div>

      {/* Upgrade CTA for free users */}
      {!isPro && (
        <div className="relative bg-gradient-to-r from-accent-500/10 to-accent-500/5 border border-accent-500/30 p-6">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent-500" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent-500" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                Unlock More Power
              </h3>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-600">
                Upgrade to Pro for unlimited FCFs, AI explanations, and PDF
                exports.
              </p>
            </div>
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold bg-accent-500 text-slate-950 hover:bg-accent-400 transition-all whitespace-nowrap"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
              }}
            >
              View Plans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageBar({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number;
}) {
  const isUnlimited = limit === -1 || limit === Infinity;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && current >= limit;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-xs font-semibold",
            isAtLimit
              ? "text-error-500"
              : isNearLimit
                ? "text-warning-500"
                : "text-slate-900 dark:text-slate-100"
          )}
        >
          {current.toLocaleString()}
          {isUnlimited ? "" : ` / ${limit.toLocaleString()}`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800">
        {isUnlimited ? (
          <div className="h-full bg-accent-500/30 w-full" />
        ) : (
          <div
            className={cn(
              "h-full transition-all",
              isAtLimit
                ? "bg-error-500"
                : isNearLimit
                  ? "bg-warning-500"
                  : "bg-accent-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-4 h-4 flex items-center justify-center",
          enabled
            ? "border border-accent-500/30 bg-accent-500/10"
            : "border border-slate-200 dark:border-slate-800"
        )}
      >
        {enabled && <CheckCircle2 className="w-2.5 h-2.5 text-accent-500" />}
      </div>
      <span
        className={cn(
          "font-mono text-xs",
          enabled
            ? "text-slate-700 dark:text-slate-300"
            : "text-slate-400 dark:text-slate-600"
        )}
      >
        {label}
      </span>
    </div>
  );
}
