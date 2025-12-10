"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { createCheckoutSession } from "@/lib/stripe/actions";
import { TIERS, type Tier } from "@/lib/stripe/config";
import { cn } from "@/lib/utils/cn";

interface PricingCardsProps {
  currentTier: Tier;
  isLoggedIn: boolean;
}

export function PricingCards({ currentTier, isLoggedIn }: PricingCardsProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="space-y-8">
      {/* Interval toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setInterval("monthly")}
            className={cn(
              "px-4 py-2 font-mono text-xs transition-all",
              interval === "monthly"
                ? "bg-accent-500 text-slate-950"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            MONTHLY
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={cn(
              "px-4 py-2 font-mono text-xs transition-all relative",
              interval === "yearly"
                ? "bg-accent-500 text-slate-950"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            YEARLY
            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-success-500 text-slate-950 font-mono text-[8px] font-bold">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <PricingCard
          tier="free"
          interval={interval}
          currentTier={currentTier}
          isLoggedIn={isLoggedIn}
        />
        <PricingCard
          tier="pro"
          interval={interval}
          currentTier={currentTier}
          isLoggedIn={isLoggedIn}
          featured
        />
        <PricingCard
          tier="team"
          interval={interval}
          currentTier={currentTier}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}

interface PricingCardProps {
  tier: Tier;
  interval: "monthly" | "yearly";
  currentTier: Tier;
  isLoggedIn: boolean;
  featured?: boolean;
}

function PricingCard({
  tier,
  interval,
  currentTier,
  isLoggedIn,
  featured,
}: PricingCardProps) {
  const [isPending, startTransition] = useTransition();
  const config = TIERS[tier];
  const isCurrent = tier === currentTier;

  const price =
    tier === "free"
      ? 0
      : interval === "monthly"
        ? (config as typeof TIERS.pro).priceMonthly
        : Math.round((config as typeof TIERS.pro).priceYearly / 12);

  const handleUpgrade = () => {
    if (tier === "free" || isCurrent) return;

    startTransition(async () => {
      await createCheckoutSession(tier, interval);
    });
  };

  return (
    <div
      className={cn(
        "relative bg-white dark:bg-slate-900 border",
        featured
          ? "border-accent-500"
          : "border-slate-200 dark:border-slate-800"
      )}
    >
      {/* Corner accents */}
      <div
        className={cn(
          "absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2",
          featured ? "border-accent-500" : "border-slate-300 dark:border-slate-700"
        )}
      />
      <div
        className={cn(
          "absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2",
          featured ? "border-accent-500" : "border-slate-300 dark:border-slate-700"
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2",
          featured ? "border-accent-500" : "border-slate-300 dark:border-slate-700"
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2",
          featured ? "border-accent-500" : "border-slate-300 dark:border-slate-700"
        )}
      />

      {/* Featured badge */}
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent-500 text-slate-950 font-mono text-[10px] font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          MOST POPULAR
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-accent-500" />
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-600 tracking-wider">
              TIER.{tier.toUpperCase()}
            </span>
          </div>
          <h3 className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
            {config.name}
          </h3>
          <p className="font-mono text-xs text-slate-500 dark:text-slate-600 mt-1">
            {config.description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-4xl font-bold text-slate-900 dark:text-slate-100">
              ${price}
            </span>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-600">
              /mo
            </span>
          </div>
          {tier !== "free" && interval === "yearly" && (
            <p className="font-mono text-[10px] text-accent-500 mt-1">
              Billed annually (${(config as typeof TIERS.pro).priceYearly}/year)
            </p>
          )}
        </div>

        {/* Limits */}
        <div className="mb-6 space-y-2">
          <LimitItem
            label="Projects"
            value={config.limits.projects}
          />
          <LimitItem
            label="FCF Records"
            value={config.limits.fcfs}
          />
          <LimitItem
            label="Stack-Up Analyses"
            value={config.limits.stackups}
          />
        </div>

        {/* Features */}
        <div className="mb-6 space-y-2">
          <FeatureItem
            label="PNG/SVG Export"
            enabled={config.features.exportPng}
          />
          <FeatureItem
            label="PDF Export"
            enabled={config.features.exportPdf}
          />
          <FeatureItem
            label="AI Explanations"
            enabled={config.features.aiExplanations}
          />
          <FeatureItem
            label="Team Members"
            enabled={config.features.teamMembers}
          />
          <FeatureItem
            label="Priority Support"
            enabled={config.features.prioritySupport}
          />
        </div>

        {/* CTA */}
        {tier === "free" ? (
          isLoggedIn ? (
            <button
              disabled
              className="w-full py-3 font-mono text-xs font-semibold text-slate-500 dark:text-slate-600 border border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed"
            >
              {isCurrent ? "CURRENT PLAN" : "FREE TIER"}
            </button>
          ) : (
            <a
              href="/signup"
              className="block w-full py-3 font-mono text-xs font-semibold text-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-accent-500/30 hover:bg-accent-500/5 transition-all"
            >
              GET STARTED FREE
            </a>
          )
        ) : isCurrent ? (
          <button
            disabled
            className="w-full py-3 font-mono text-xs font-semibold text-slate-500 dark:text-slate-600 border border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed"
          >
            CURRENT PLAN
          </button>
        ) : isLoggedIn ? (
          <button
            onClick={handleUpgrade}
            disabled={isPending}
            className={cn(
              "w-full py-3 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all",
              featured
                ? "bg-accent-500 text-slate-950 hover:bg-accent-400"
                : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-accent-500/30 hover:bg-accent-500/5"
            )}
            style={
              featured
                ? {
                    clipPath:
                      "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                  }
                : undefined
            }
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                LOADING...
              </>
            ) : (
              `UPGRADE TO ${config.name.toUpperCase()}`
            )}
          </button>
        ) : (
          <a
            href="/signup"
            className={cn(
              "block w-full py-3 font-mono text-xs font-semibold text-center transition-all",
              featured
                ? "bg-accent-500 text-slate-950 hover:bg-accent-400"
                : "border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-accent-500/30 hover:bg-accent-500/5"
            )}
            style={
              featured
                ? {
                    clipPath:
                      "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                  }
                : undefined
            }
          >
            GET STARTED
          </a>
        )}
      </div>
    </div>
  );
}

function LimitItem({ label, value }: { label: string; value: number }) {
  const display = value === Infinity ? "Unlimited" : value.toLocaleString();

  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
        {display}
      </span>
    </div>
  );
}

function FeatureItem({ label, enabled }: { label: string; enabled: boolean }) {
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
        {enabled && <Check className="w-2.5 h-2.5 text-accent-500" />}
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
