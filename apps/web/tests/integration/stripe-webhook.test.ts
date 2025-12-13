/**
 * Stripe Webhook Integration Tests
 *
 * Tests the Stripe webhook handler for subscription lifecycle events.
 * Uses mocked Stripe events and signature verification bypass.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mockCheckoutCompleted,
  mockSubscriptionUpdated,
  mockSubscriptionDeleted,
  mockPaymentFailed,
  TEST_PRICE_IDS,
} from "../fixtures/stripe-events";

// Mock environment variables
vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret");
vi.stubEnv("STRIPE_PRO_MONTHLY_PRICE_ID", TEST_PRICE_IDS.proMonthly);
vi.stubEnv("STRIPE_PRO_YEARLY_PRICE_ID", TEST_PRICE_IDS.proYearly);
vi.stubEnv("STRIPE_TEAM_MONTHLY_PRICE_ID", TEST_PRICE_IDS.teamMonthly);
vi.stubEnv("STRIPE_TEAM_YEARLY_PRICE_ID", TEST_PRICE_IDS.teamYearly);

// Mock Supabase admin client
const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: { user_id: "user_test_123" }, error: null }),
  }),
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "subscriptions") {
        return {
          upsert: mockUpsert,
          update: mockUpdate,
          select: mockSelect,
        };
      }
      return {};
    },
  }),
}));

// Mock Stripe client
const mockRetrieve = vi.fn();
vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn((body, sig, secret) => {
        // Parse the body as the event for testing
        return JSON.parse(body);
      }),
    },
    subscriptions: {
      retrieve: mockRetrieve,
    },
  },
}));

describe("Stripe Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkout.session.completed", () => {
    it("should create subscription record on successful checkout", async () => {
      const event = mockCheckoutCompleted({
        userId: "user_abc123",
        customerId: "cus_abc123",
        subscriptionId: "sub_abc123",
      });

      // Mock subscription retrieval
      mockRetrieve.mockResolvedValue({
        id: "sub_abc123",
        status: "active",
        cancel_at_period_end: false,
        items: {
          data: [
            {
              price: { id: TEST_PRICE_IDS.proMonthly, recurring: { interval: "month" } },
              current_period_start: Math.floor(Date.now() / 1000),
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
          ],
        },
      });

      // Import handler dynamically to ensure mocks are in place
      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "stripe-signature": "test_signature",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user_abc123",
          stripe_customer_id: "cus_abc123",
          stripe_subscription_id: "sub_abc123",
          tier: "pro",
          status: "active",
        }),
        expect.any(Object)
      );
    });

    it("should handle missing user ID in metadata", async () => {
      const event = mockCheckoutCompleted({ userId: undefined as unknown as string });
      // Remove user ID from metadata
      (event.data.object as any).metadata = {};

      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "stripe-signature": "test_signature",
        },
      });

      const response = await POST(request);

      // Should still return 200 but not call upsert
      expect(response.status).toBe(200);
      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });

  describe("customer.subscription.updated", () => {
    it("should update subscription on plan change", async () => {
      const event = mockSubscriptionUpdated({
        customerId: "cus_abc123",
        subscriptionId: "sub_abc123",
        priceId: TEST_PRICE_IDS.teamMonthly,
        status: "active",
      });

      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "stripe-signature": "test_signature",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: "team",
          status: "active",
        })
      );
    });

    it("should handle subscription cancellation scheduled", async () => {
      const event = mockSubscriptionUpdated({
        customerId: "cus_abc123",
        status: "active",
        cancelAtPeriodEnd: true,
      });

      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "stripe-signature": "test_signature",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          cancel_at_period_end: true,
        })
      );
    });
  });

  describe("customer.subscription.deleted", () => {
    it("should revert to free tier on subscription deletion", async () => {
      const event = mockSubscriptionDeleted({
        customerId: "cus_abc123",
        subscriptionId: "sub_abc123",
      });

      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "stripe-signature": "test_signature",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          tier: "free",
          status: "canceled",
          stripe_subscription_id: null,
        })
      );
    });
  });

  describe("invoice.payment_failed", () => {
    it("should update subscription status to past_due", async () => {
      const event = mockPaymentFailed({
        customerId: "cus_abc123",
        errorMessage: "Card declined",
      });

      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "stripe-signature": "test_signature",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "past_due",
        })
      );
    });
  });

  describe("signature verification", () => {
    it("should reject requests without signature", async () => {
      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(mockCheckoutCompleted()),
        headers: {},
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Missing signature");
    });
  });

  describe("tier mapping", () => {
    it("should map pro monthly price to pro tier", async () => {
      const event = mockSubscriptionUpdated({
        priceId: TEST_PRICE_IDS.proMonthly,
      });

      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "stripe-signature": "test_signature",
        },
      });

      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ tier: "pro" })
      );
    });

    it("should map team yearly price to team tier", async () => {
      const event = mockSubscriptionUpdated({
        priceId: TEST_PRICE_IDS.teamYearly,
      });

      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "stripe-signature": "test_signature",
        },
      });

      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ tier: "team" })
      );
    });

    it("should default to free tier for unknown price", async () => {
      const event = mockSubscriptionUpdated({
        priceId: "price_unknown",
      });

      const { POST } = await import("@/app/api/stripe/webhook/route");

      const request = new Request("http://localhost:3000/api/stripe/webhook", {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "stripe-signature": "test_signature",
        },
      });

      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ tier: "free" })
      );
    });
  });
});
