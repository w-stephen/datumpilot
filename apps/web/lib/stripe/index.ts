/**
 * Stripe Module Exports
 *
 * Client usage:
 *   import { stripe } from "@/lib/stripe/client";
 *
 * Config usage:
 *   import { TIERS, getTierConfig } from "@/lib/stripe/config";
 *
 * Actions usage:
 *   import { createCheckoutSession, createPortalSession } from "@/lib/stripe/actions";
 *
 * Subscription helpers:
 *   import { getSubscriptionStatus, checkUsageLimit } from "@/lib/stripe/subscription";
 */

export { stripe } from "./client";
export {
  TIERS,
  getTierConfig,
  getTierLimits,
  getTierPrice,
  getStripePriceId,
  isFeatureEnabled,
  type Tier,
  type TierConfig,
} from "./config";
export {
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  ensureSubscription,
} from "./actions";
export {
  getSubscriptionStatus,
  checkUsageLimit,
  checkFeatureAccess,
  getUsageStats,
  type SubscriptionStatus,
} from "./subscription";
