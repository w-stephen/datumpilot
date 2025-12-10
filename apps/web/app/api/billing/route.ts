import { NextResponse } from "next/server";
import { getSubscriptionStatus, getUsageStats } from "@/lib/stripe/subscription";

/**
 * GET /api/billing
 *
 * Returns current user's billing data including subscription status and usage.
 */
export async function GET() {
  try {
    const [status, stats] = await Promise.all([
      getSubscriptionStatus(),
      getUsageStats(),
    ]);

    if (!status) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      tier: status.tier,
      status: status.status,
      currentPeriodEnd: status.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: status.cancelAtPeriodEnd,
      limits: stats.limits,
      usage: stats.usage,
    });
  } catch (error) {
    console.error("[Billing API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    );
  }
}
