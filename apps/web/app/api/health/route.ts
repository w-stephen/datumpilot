import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Health Check Endpoint
 *
 * Returns the health status of the application and its dependencies.
 * Used for monitoring, load balancers, and deployment verification.
 *
 * GET /api/health
 * GET /api/health?detailed=true (includes latency metrics)
 */

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    stripe: HealthCheck;
    ai?: HealthCheck;
  };
}

interface HealthCheck {
  status: "pass" | "fail" | "warn";
  latencyMs?: number;
  message?: string;
}

// Track server start time for uptime calculation
const startTime = Date.now();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get("detailed") === "true";

  const checks: HealthStatus["checks"] = {
    database: await checkDatabase(detailed),
    stripe: await checkStripe(detailed),
  };

  // Only check AI provider if detailed is requested (it's expensive)
  if (detailed && process.env.ANTHROPIC_API_KEY) {
    checks.ai = await checkAI();
  }

  // Determine overall status
  const allStatuses = Object.values(checks).map((c) => c.status);
  const hasFail = allStatuses.includes("fail");
  const hasWarn = allStatuses.includes("warn");

  const overallStatus: HealthStatus["status"] = hasFail
    ? "unhealthy"
    : hasWarn
      ? "degraded"
      : "healthy";

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };

  // Return appropriate HTTP status
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(healthStatus, { status: httpStatus });
}

/**
 * Check database connectivity
 */
async function checkDatabase(includeLatency: boolean): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const supabase = await createClient();

    // Simple connectivity check - query auth status
    const { error } = await supabase.auth.getSession();

    const latencyMs = Date.now() - start;

    if (error) {
      return {
        status: "fail",
        latencyMs: includeLatency ? latencyMs : undefined,
        message: error.message,
      };
    }

    // Warn if latency is high (> 500ms)
    if (latencyMs > 500) {
      return {
        status: "warn",
        latencyMs: includeLatency ? latencyMs : undefined,
        message: "High latency detected",
      };
    }

    return {
      status: "pass",
      latencyMs: includeLatency ? latencyMs : undefined,
    };
  } catch (error) {
    return {
      status: "fail",
      latencyMs: includeLatency ? Date.now() - start : undefined,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check Stripe API connectivity
 */
async function checkStripe(includeLatency: boolean): Promise<HealthCheck> {
  const start = Date.now();

  // Skip if Stripe is not configured
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      status: "warn",
      message: "Stripe not configured",
    };
  }

  try {
    // Import Stripe dynamically to avoid issues if not configured
    const { stripe } = await import("@/lib/stripe/client");

    // Simple balance check - fast and non-destructive
    await stripe.balance.retrieve();

    const latencyMs = Date.now() - start;

    if (latencyMs > 1000) {
      return {
        status: "warn",
        latencyMs: includeLatency ? latencyMs : undefined,
        message: "High latency detected",
      };
    }

    return {
      status: "pass",
      latencyMs: includeLatency ? latencyMs : undefined,
    };
  } catch (error) {
    return {
      status: "fail",
      latencyMs: includeLatency ? Date.now() - start : undefined,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check AI provider connectivity (optional, expensive)
 */
async function checkAI(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    // Skip if not configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        status: "warn",
        message: "AI provider not configured",
      };
    }

    // We don't want to make actual API calls in health checks
    // Just verify the key format is valid
    const keyValid =
      process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-") ||
      process.env.ANTHROPIC_API_KEY.startsWith("sk-");

    return {
      status: keyValid ? "pass" : "warn",
      latencyMs: Date.now() - start,
      message: keyValid ? undefined : "API key format may be invalid",
    };
  } catch (error) {
    return {
      status: "fail",
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
