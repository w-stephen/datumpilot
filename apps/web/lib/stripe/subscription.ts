import { createClient } from "@/lib/supabase/server";
import { getTierLimits, isFeatureEnabled, type Tier } from "./config";

/**
 * Subscription Helpers
 *
 * Server-side utilities for checking subscription status and limits.
 */

export interface SubscriptionStatus {
  tier: Tier;
  status: string;
  isActive: boolean;
  isPro: boolean;
  isTeam: boolean;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Get the current user's subscription status.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .single();

  if (!subscription) {
    // Return free tier defaults
    return {
      tier: "free",
      status: "active",
      isActive: true,
      isPro: false,
      isTeam: false,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  const tier = subscription.tier as Tier;
  const isActive = subscription.status === "active" || subscription.status === "trialing";

  return {
    tier,
    status: subscription.status,
    isActive,
    isPro: tier === "pro" || tier === "team",
    isTeam: tier === "team",
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
  };
}

/**
 * Check if the current user can perform an action based on their tier limits.
 */
export async function checkUsageLimit(
  resource: "projects" | "fcfs" | "stackups" | "measurementsPerFcf",
  currentCount: number
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  const status = await getSubscriptionStatus();
  const tier = status?.tier || "free";
  const limits = getTierLimits(tier);
  const limit = limits[resource];

  return {
    allowed: currentCount < limit,
    limit: limit === Infinity ? -1 : limit,
    remaining: limit === Infinity ? -1 : Math.max(0, limit - currentCount),
  };
}

/**
 * Check if a feature is enabled for the current user.
 */
export async function checkFeatureAccess(
  feature:
    | "exportPng"
    | "exportSvg"
    | "exportPdf"
    | "exportJson"
    | "aiExplanations"
    | "teamMembers"
    | "prioritySupport"
): Promise<boolean> {
  const status = await getSubscriptionStatus();
  const tier = status?.tier || "free";
  return isFeatureEnabled(tier, feature);
}

/**
 * Get usage statistics for the current user.
 */
export async function getUsageStats(): Promise<{
  tier: Tier;
  limits: ReturnType<typeof getTierLimits>;
  usage: {
    projects: number;
    fcfs: number;
    stackups: number;
  };
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      tier: "free",
      limits: getTierLimits("free"),
      usage: { projects: 0, fcfs: 0, stackups: 0 },
    };
  }

  // Get subscription tier
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", user.id)
    .single();

  const tier = (subscription?.tier as Tier) || "free";

  // Count projects
  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  // Count FCFs across all projects
  const { count: fcfCount } = await supabase
    .from("fcf_records")
    .select("*, projects!inner(*)", { count: "exact", head: true })
    .eq("projects.user_id", user.id)
    .is("deleted_at", null);

  // Count stack-up analyses across all projects
  const { count: stackupCount } = await supabase
    .from("stackup_analyses")
    .select("*, projects!inner(*)", { count: "exact", head: true })
    .eq("projects.user_id", user.id)
    .is("deleted_at", null);

  return {
    tier,
    limits: getTierLimits(tier),
    usage: {
      projects: projectCount || 0,
      fcfs: fcfCount || 0,
      stackups: stackupCount || 0,
    },
  };
}
