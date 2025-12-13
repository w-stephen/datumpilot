/**
 * Stripe Test Event Fixtures
 *
 * Mock Stripe webhook events for testing.
 */

import type Stripe from "stripe";

/**
 * Generate a mock checkout.session.completed event
 */
export function mockCheckoutCompleted(overrides?: {
  userId?: string;
  customerId?: string;
  subscriptionId?: string;
  priceId?: string;
}): Stripe.Event {
  const userId = overrides?.userId || "user_test_123";
  const customerId = overrides?.customerId || "cus_test_123";
  const subscriptionId = overrides?.subscriptionId || "sub_test_123";

  return {
    id: "evt_test_checkout_completed",
    object: "event",
    api_version: "2025-09-30.basil",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_123",
        object: "checkout.session",
        customer: customerId,
        subscription: subscriptionId,
        metadata: {
          supabase_user_id: userId,
        },
        mode: "subscription",
        payment_status: "paid",
        status: "complete",
      } as unknown as Stripe.Checkout.Session,
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
  } as Stripe.Event;
}

/**
 * Generate a mock customer.subscription.updated event
 */
export function mockSubscriptionUpdated(overrides?: {
  customerId?: string;
  subscriptionId?: string;
  priceId?: string;
  status?: Stripe.Subscription.Status;
  cancelAtPeriodEnd?: boolean;
}): Stripe.Event {
  const customerId = overrides?.customerId || "cus_test_123";
  const subscriptionId = overrides?.subscriptionId || "sub_test_123";
  const priceId = overrides?.priceId || "price_test_pro_monthly";
  const status = overrides?.status || "active";
  const cancelAtPeriodEnd = overrides?.cancelAtPeriodEnd || false;

  const now = Math.floor(Date.now() / 1000);
  const periodEnd = now + 30 * 24 * 60 * 60; // 30 days from now

  return {
    id: "evt_test_subscription_updated",
    object: "event",
    api_version: "2025-09-30.basil",
    created: now,
    type: "customer.subscription.updated",
    data: {
      object: {
        id: subscriptionId,
        object: "subscription",
        customer: customerId,
        status,
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: null,
        items: {
          object: "list",
          data: [
            {
              id: "si_test_123",
              object: "subscription_item",
              price: {
                id: priceId,
                object: "price",
                recurring: {
                  interval: "month",
                  interval_count: 1,
                },
              },
              current_period_start: now,
              current_period_end: periodEnd,
            },
          ],
        },
      } as unknown as Stripe.Subscription,
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
  } as Stripe.Event;
}

/**
 * Generate a mock customer.subscription.deleted event
 */
export function mockSubscriptionDeleted(overrides?: {
  customerId?: string;
  subscriptionId?: string;
}): Stripe.Event {
  const customerId = overrides?.customerId || "cus_test_123";
  const subscriptionId = overrides?.subscriptionId || "sub_test_123";

  return {
    id: "evt_test_subscription_deleted",
    object: "event",
    api_version: "2025-09-30.basil",
    created: Math.floor(Date.now() / 1000),
    type: "customer.subscription.deleted",
    data: {
      object: {
        id: subscriptionId,
        object: "subscription",
        customer: customerId,
        status: "canceled",
        items: {
          object: "list",
          data: [],
        },
      } as unknown as Stripe.Subscription,
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
  } as Stripe.Event;
}

/**
 * Generate a mock invoice.payment_failed event
 */
export function mockPaymentFailed(overrides?: {
  customerId?: string;
  subscriptionId?: string;
  errorMessage?: string;
}): Stripe.Event {
  const customerId = overrides?.customerId || "cus_test_123";
  const subscriptionId = overrides?.subscriptionId || "sub_test_123";
  const errorMessage = overrides?.errorMessage || "Your card was declined.";

  return {
    id: "evt_test_payment_failed",
    object: "event",
    api_version: "2025-09-30.basil",
    created: Math.floor(Date.now() / 1000),
    type: "invoice.payment_failed",
    data: {
      object: {
        id: "in_test_123",
        object: "invoice",
        customer: customerId,
        parent: {
          subscription_details: {
            subscription: subscriptionId,
          },
        },
        last_finalization_error: {
          message: errorMessage,
        },
      } as unknown as Stripe.Invoice,
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
  } as Stripe.Event;
}

/**
 * Generate a Stripe webhook signature for testing
 * Note: This is for testing only - use mock signature verification in tests
 */
export function mockSignature(): string {
  return "t=1234567890,v1=mock_signature_for_testing";
}

/**
 * Price IDs for test environment
 */
export const TEST_PRICE_IDS = {
  proMonthly: "price_test_pro_monthly",
  proYearly: "price_test_pro_yearly",
  teamMonthly: "price_test_team_monthly",
  teamYearly: "price_test_team_yearly",
};
