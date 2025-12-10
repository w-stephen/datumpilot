import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe Webhook Handler
 *
 * Handles subscription lifecycle events from Stripe:
 * - checkout.session.completed - New subscription created
 * - customer.subscription.updated - Subscription changed
 * - customer.subscription.deleted - Subscription canceled
 * - invoice.payment_failed - Payment failed
 */

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("[Stripe Webhook] Missing signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] Missing webhook secret");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle checkout.session.completed
 * Links Stripe customer to Supabase user and creates subscription record
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.supabase_user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error("[Stripe Webhook] No user ID in checkout session metadata");
    return;
  }

  console.log(
    `[Stripe Webhook] Checkout completed for user ${userId}, subscription ${subscriptionId}`
  );

  // Fetch full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const tier = getTierFromPriceId(priceId);

  // Update or create subscription record
  // Note: current_period_start/end are on SubscriptionItem in newer Stripe API
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      tier,
      status: subscription.status,
      interval: subscriptionItem?.price.recurring?.interval,
      current_period_start: subscriptionItem?.current_period_start
        ? new Date(subscriptionItem.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscriptionItem?.current_period_end
        ? new Date(subscriptionItem.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[Stripe Webhook] Error upserting subscription:", error);
    throw error;
  }
}

/**
 * Handle customer.subscription.updated
 * Updates subscription status, tier, and period dates
 */
async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const tier = getTierFromPriceId(priceId);

  console.log(
    `[Stripe Webhook] Subscription ${subscription.id} updated to ${subscription.status}`
  );

  // Note: current_period_start/end are on SubscriptionItem in newer Stripe API
  const { error } = await supabase
    .from("subscriptions")
    .update({
      stripe_price_id: priceId,
      tier,
      status: subscription.status,
      interval: subscriptionItem?.price.recurring?.interval,
      current_period_start: subscriptionItem?.current_period_start
        ? new Date(subscriptionItem.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscriptionItem?.current_period_end
        ? new Date(subscriptionItem.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("[Stripe Webhook] Error updating subscription:", error);
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted
 * Reverts user to free tier
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  console.log(`[Stripe Webhook] Subscription ${subscription.id} deleted`);

  const { error } = await supabase
    .from("subscriptions")
    .update({
      tier: "free",
      status: "canceled",
      stripe_subscription_id: null,
      stripe_price_id: null,
      interval: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("[Stripe Webhook] Error updating canceled subscription:", error);
    throw error;
  }
}

/**
 * Handle invoice.payment_failed
 * Logs payment failure for monitoring
 */
async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;
  // In newer Stripe API, subscription is under parent.subscription_details
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id || null;

  console.error(
    `[Stripe Webhook] Payment failed for customer ${customerId}, subscription ${subscriptionId || "unknown"}`
  );

  // Update subscription status to past_due if not already
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      metadata: {
        last_payment_error: invoice.last_finalization_error?.message || "Payment failed",
        last_payment_attempt: new Date().toISOString(),
      },
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("[Stripe Webhook] Error updating payment failure:", error);
  }
}

/**
 * Map Stripe price ID to tier name
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
