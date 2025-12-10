"use server";

import { redirect } from "next/navigation";
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
