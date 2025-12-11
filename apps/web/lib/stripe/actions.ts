"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "./client";
import { getStripePriceId, type Tier } from "./config";

/**
 * Stripe Server Actions
 *
 * Server-side actions for managing Stripe subscriptions:
 * - Create checkout session for new subscriptions
 * - Create portal session for managing subscriptions
 */

export type StripeActionResult = {
  error?: string;
  url?: string;
};

/**
 * Create a Stripe Checkout session for subscription upgrade.
 * Redirects to Stripe hosted checkout page.
 */
export async function createCheckoutSession(
  tier: Tier,
  interval: "monthly" | "yearly"
): Promise<StripeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const priceId = getStripePriceId(tier, interval);
  if (!priceId) {
    return { error: "Invalid pricing configuration" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Create or update subscription record with customer ID
      await supabase.from("subscriptions").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
          tier: "free",
          status: "active",
        },
        { onConflict: "user_id" }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/app/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      allow_promotion_codes: true,
    });

    if (session.url) {
      redirect(session.url);
    }

    return { error: "Failed to create checkout session" };
  } catch (err) {
    // Re-throw redirect errors - they're not actual errors
    if (isRedirectError(err)) {
      throw err;
    }
    console.error("[Stripe] Checkout error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

/**
 * Create a Stripe Billing Portal session.
 * Allows users to manage their subscription, update payment methods, etc.
 */
export async function createPortalSession(): Promise<StripeActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // Get customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      return { error: "No subscription found" };
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${siteUrl}/app/settings/billing`,
    });

    if (session.url) {
      redirect(session.url);
    }

    return { error: "Failed to create portal session" };
  } catch (err) {
    // Re-throw redirect errors - they're not actual errors
    if (isRedirectError(err)) {
      throw err;
    }
    console.error("[Stripe] Portal error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { error: message };
  }
}

/**
 * Get the current user's subscription.
 */
export async function getSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return subscription;
}

/**
 * Sync subscription from Stripe to Supabase.
 * Call this after checkout success to ensure database is up-to-date
 * even if webhooks are delayed or fail.
 *
 * @param sessionId - Optional Stripe checkout session ID to sync from
 */
export async function syncSubscriptionFromStripe(
  sessionId?: string
): Promise<{
  success: boolean;
  tier?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    let customerId: string | null = null;
    let stripeSubscription: Awaited<
      ReturnType<typeof stripe.subscriptions.retrieve>
    > | null = null;

    // If session ID provided, get customer and subscription from checkout session
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.customer) {
        customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer.id;
      }
      if (session.subscription) {
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        stripeSubscription = await stripe.subscriptions.retrieve(subId);
      }
    }

    // Fallback: try to get customer ID from local subscription record
    if (!customerId) {
      const { data: localSub } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();

      customerId = localSub?.stripe_customer_id || null;
    }

    // If still no customer ID, nothing to sync
    if (!customerId) {
      return { success: true, tier: "free" };
    }

    // If we don't have subscription from session, fetch from Stripe
    if (!stripeSubscription) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        // No active subscription in Stripe, ensure free tier
        await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: user.id,
              stripe_customer_id: customerId,
              tier: "free",
              status: "active",
              stripe_subscription_id: null,
              stripe_price_id: null,
            },
            { onConflict: "user_id" }
          );

        return { success: true, tier: "free" };
      }

      stripeSubscription = subscriptions.data[0];
    }

    // Sync the active subscription
    const subscriptionItem = stripeSubscription.items.data[0];
    const priceId = subscriptionItem?.price.id;
    const tier = getTierFromPriceId(priceId);

    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: stripeSubscription.id,
        stripe_price_id: priceId,
        tier,
        status: stripeSubscription.status,
        interval: subscriptionItem?.price.recurring?.interval,
        current_period_start: subscriptionItem?.current_period_start
          ? new Date(subscriptionItem.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subscriptionItem?.current_period_end
          ? new Date(subscriptionItem.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("[Stripe] Sync error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, tier };
  } catch (err) {
    console.error("[Stripe] Sync error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Map Stripe price ID to tier name (shared helper)
 */
function getTierFromPriceId(priceId: string | undefined): string {
  if (!priceId) return "free";

  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const proYearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  const teamMonthly = process.env.STRIPE_TEAM_MONTHLY_PRICE_ID;
  const teamYearly = process.env.STRIPE_TEAM_YEARLY_PRICE_ID;

  if (priceId === proMonthly || priceId === proYearly) {
    return "pro";
  }
  if (priceId === teamMonthly || priceId === teamYearly) {
    return "team";
  }

  return "free";
}

/**
 * Ensure user has a subscription record (creates free tier if missing).
 */
export async function ensureSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Try to get existing subscription
  let { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Create free tier subscription if none exists
  if (!subscription) {
    const { data: newSubscription, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        tier: "free",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("[Stripe] Error creating subscription:", error);
      return null;
    }

    subscription = newSubscription;
  }

  return subscription;
}
