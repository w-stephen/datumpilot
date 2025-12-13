/**
 * Quota Sync for Subscription Changes
 *
 * Ensures quota limits are properly synced when subscription tier changes.
 * This is called from the Stripe webhook on subscription create/update events.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getTierLimits, type Tier } from "./config";

interface SyncResult {
  success: boolean;
  tier: Tier;
  limits: ReturnType<typeof getTierLimits>;
  error?: string;
}

/**
 * Sync quota limits for a user based on their subscription tier.
 * This should be called when a subscription is created or updated.
 */
export async function syncQuotaLimits(
  userId: string,
  tier: Tier
): Promise<SyncResult> {
  const supabase = createAdminClient();
  const limits = getTierLimits(tier);

  try {
    // Upsert project_quotas with new limits
    // Note: This assumes a project_quotas table exists with RLS
    const { error } = await supabase.from("project_quotas").upsert(
      {
        user_id: userId,
        max_projects: limits.projects === Infinity ? null : limits.projects,
        max_fcfs: limits.fcfs === Infinity ? null : limits.fcfs,
        max_stackups: limits.stackups === Infinity ? null : limits.stackups,
        max_measurements_per_fcf:
          limits.measurementsPerFcf === Infinity
            ? null
            : limits.measurementsPerFcf,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      // If project_quotas table doesn't exist, log and continue
      // Quotas can still be enforced via subscription.tier checks
      console.warn(
        `[Quota Sync] Could not update project_quotas: ${error.message}`
      );
    }

    console.log(`[Quota Sync] Synced quotas for user ${userId} to tier ${tier}`);

    return {
      success: true,
      tier,
      limits,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Quota Sync] Error syncing quotas: ${message}`);

    return {
      success: false,
      tier,
      limits,
      error: message,
    };
  }
}

/**
 * Get user ID from Stripe customer ID
 */
export async function getUserIdFromStripeCustomer(
  stripeCustomerId: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (error || !data) {
    console.warn(
      `[Quota Sync] Could not find user for customer ${stripeCustomerId}`
    );
    return null;
  }

  return data.user_id;
}

/**
 * Check if a user has exceeded their quota limit for a resource.
 * Returns true if they can create more, false if at limit.
 */
export async function canCreateResource(
  userId: string,
  resource: "projects" | "fcfs" | "stackups"
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  const supabase = createAdminClient();

  // Get user's subscription tier
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .single();

  const tier = (subscription?.tier as Tier) || "free";
  const limits = getTierLimits(tier);
  const limit = limits[resource];

  // Count current usage
  let current = 0;

  if (resource === "projects") {
    const { count } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);
    current = count || 0;
  } else if (resource === "fcfs") {
    const { count } = await supabase
      .from("fcf_records")
      .select("*, projects!inner(*)", { count: "exact", head: true })
      .eq("projects.user_id", userId)
      .is("deleted_at", null);
    current = count || 0;
  } else if (resource === "stackups") {
    const { count } = await supabase
      .from("stackup_analyses")
      .select("*, projects!inner(*)", { count: "exact", head: true })
      .eq("projects.user_id", userId)
      .is("deleted_at", null);
    current = count || 0;
  }

  const isUnlimited = limit === Infinity;

  return {
    allowed: isUnlimited || current < limit,
    current,
    limit: isUnlimited ? -1 : limit,
    remaining: isUnlimited ? -1 : Math.max(0, limit - current),
  };
}

/**
 * Get usage percentage for a resource.
 * Returns -1 for unlimited resources.
 */
export function getUsagePercentage(current: number, limit: number): number {
  if (limit === -1 || limit === Infinity) return -1;
  return Math.min(Math.round((current / limit) * 100), 100);
}

/**
 * Check if usage is at warning threshold (80% or above)
 */
export function isAtWarningThreshold(current: number, limit: number): boolean {
  if (limit === -1 || limit === Infinity) return false;
  return current / limit >= 0.8;
}

/**
 * Check if usage is at limit (100%)
 */
export function isAtLimit(current: number, limit: number): boolean {
  if (limit === -1 || limit === Infinity) return false;
  return current >= limit;
}
