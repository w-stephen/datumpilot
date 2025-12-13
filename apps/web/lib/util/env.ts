/**
 * Environment Variable Validation
 *
 * Validates and provides typed access to environment variables.
 * Throws clear errors for missing required variables at build/start time.
 */

import { z } from "zod";

// Required environment variables schema
const requiredEnvSchema = z.object({
  // Supabase - Always required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Missing Supabase anon key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Missing Supabase service role key"),

  // Stripe - Required for billing
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "Invalid Stripe secret key format"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "Invalid Stripe webhook secret format"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_", "Invalid Stripe publishable key format"),
});

// Optional environment variables schema
const optionalEnvSchema = z.object({
  // AI Providers
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_PRIMARY_PROVIDER: z.enum(["anthropic", "openai"]).optional().default("anthropic"),
  AI_FALLBACK_PROVIDER: z.enum(["anthropic", "openai", "none"]).optional().default("none"),

  // Stripe Price IDs
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_PRO_YEARLY_PRICE_ID: z.string().optional(),
  STRIPE_TEAM_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_TEAM_YEARLY_PRICE_ID: z.string().optional(),

  // Observability
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),

  // Analytics
  POSTHOG_API_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),

  // Vercel
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  VERCEL_ORG_ID: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),

  // Node
  NODE_ENV: z.enum(["development", "test", "production"]).optional().default("development"),
});

// Combined schema
const envSchema = requiredEnvSchema.merge(optionalEnvSchema);

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

/**
 * Load and validate environment variables.
 * Throws descriptive errors for missing/invalid required variables.
 */
export function loadEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");

    throw new Error(`❌ Environment validation failed:\n${errors}\n\nSee .env.example for required variables.`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * Validate environment variables without throwing.
 * Returns validation result for use in scripts.
 */
export function validateEnv(): {
  success: boolean;
  errors: Array<{ path: string; message: string }>;
  warnings: string[];
} {
  const errors: Array<{ path: string; message: string }> = [];
  const warnings: string[] = [];

  // Check required variables
  const requiredResult = requiredEnvSchema.safeParse(process.env);
  if (!requiredResult.success) {
    for (const err of requiredResult.error.errors) {
      errors.push({ path: err.path.join("."), message: err.message });
    }
  }

  // Check optional but recommended variables
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    warnings.push("No AI provider configured. AI features will be disabled.");
  }

  if (!process.env.SENTRY_DSN) {
    warnings.push("Sentry DSN not configured. Error reporting will be disabled.");
  }

  if (!process.env.STRIPE_PRO_MONTHLY_PRICE_ID) {
    warnings.push("Stripe price IDs not configured. Billing will not work correctly.");
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  // Server-side
  if (typeof window === "undefined") {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }
  // Client-side
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "development";
}
