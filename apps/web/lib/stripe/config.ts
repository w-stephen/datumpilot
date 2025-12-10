/**
 * Stripe Pricing Configuration
 *
 * Defines the tiers, limits, and features for each subscription plan.
 * Price IDs should be set via environment variables.
 */

export const TIERS = {
  free: {
    name: "Free",
    description: "Get started with basic GD&T tools",
    price: 0,
    limits: {
      projects: 2,
      fcfs: 10,
      stackups: 5,
      measurementsPerFcf: 10,
    },
    features: {
      exportPng: false,
      exportSvg: false,
      exportPdf: false,
      exportJson: true,
      aiExplanations: false,
      teamMembers: false,
      prioritySupport: false,
    },
  },
  pro: {
    name: "Pro",
    description: "Full access for individual engineers",
    priceMonthly: 29,
    priceYearly: 290,
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    limits: {
      projects: 20,
      fcfs: 500,
      stackups: 100,
      measurementsPerFcf: 100,
    },
    features: {
      exportPng: true,
      exportSvg: true,
      exportPdf: true,
      exportJson: true,
      aiExplanations: true,
      teamMembers: false,
      prioritySupport: false,
    },
  },
  team: {
    name: "Team",
    description: "Collaborate with your engineering team",
    priceMonthly: 99,
    priceYearly: 990,
    stripePriceIdMonthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_TEAM_YEARLY_PRICE_ID,
    limits: {
      projects: Infinity,
      fcfs: Infinity,
      stackups: Infinity,
      measurementsPerFcf: Infinity,
    },
    features: {
      exportPng: true,
      exportSvg: true,
      exportPdf: true,
      exportJson: true,
      aiExplanations: true,
      teamMembers: true,
      prioritySupport: true,
    },
  },
} as const;

export type Tier = keyof typeof TIERS;
export type TierConfig = (typeof TIERS)[Tier];

/**
 * Get tier configuration by name.
 */
export function getTierConfig(tier: Tier): TierConfig {
  return TIERS[tier];
}

/**
 * Get limits for a specific tier.
 */
export function getTierLimits(tier: Tier) {
  return TIERS[tier].limits;
}

/**
 * Check if a feature is enabled for a tier.
 */
export function isFeatureEnabled(
  tier: Tier,
  feature: keyof TierConfig["features"]
): boolean {
  return TIERS[tier].features[feature];
}

/**
 * Get the display price for a tier.
 */
export function getTierPrice(tier: Tier, interval: "monthly" | "yearly"): number {
  const config = TIERS[tier];
  if (tier === "free") return 0;

  if ("priceMonthly" in config) {
    return interval === "monthly" ? config.priceMonthly : config.priceYearly;
  }
  return 0;
}

/**
 * Get the Stripe price ID for a tier.
 */
export function getStripePriceId(
  tier: Tier,
  interval: "monthly" | "yearly"
): string | undefined {
  const config = TIERS[tier];
  if (tier === "free") return undefined;

  if ("stripePriceIdMonthly" in config) {
    return interval === "monthly"
      ? config.stripePriceIdMonthly
      : config.stripePriceIdYearly;
  }
  return undefined;
}
