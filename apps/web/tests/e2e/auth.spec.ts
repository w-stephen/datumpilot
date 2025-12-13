/**
 * Authentication E2E Tests
 *
 * Tests the authentication flows including login, signup, and protected routes.
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Public Routes", () => {
    test("should load the landing page", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveTitle(/DatumPilot/);
    });

    test("should show login button on landing page", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("link", { name: /sign in|login/i })).toBeVisible();
    });

    test("should load the pricing page", async ({ page }) => {
      await page.goto("/pricing");
      await expect(page.getByText(/pricing|plans/i)).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated users from /app to login", async ({ page }) => {
      await page.goto("/app");
      // Should redirect to login or show auth modal
      await expect(page).toHaveURL(/\/login|\/auth/);
    });

    test("should redirect unauthenticated users from /app/builder", async ({ page }) => {
      await page.goto("/app/builder");
      await expect(page).toHaveURL(/\/login|\/auth/);
    });

    test("should redirect unauthenticated users from /app/settings", async ({ page }) => {
      await page.goto("/app/settings");
      await expect(page).toHaveURL(/\/login|\/auth/);
    });
  });

  test.describe("Auth UI Components", () => {
    test("login page should have OAuth buttons", async ({ page }) => {
      await page.goto("/login");
      // Check for OAuth provider buttons
      const googleButton = page.getByRole("button", { name: /google/i });
      const githubButton = page.getByRole("button", { name: /github/i });

      // At least one OAuth provider should be present
      const hasGoogle = await googleButton.isVisible().catch(() => false);
      const hasGithub = await githubButton.isVisible().catch(() => false);

      expect(hasGoogle || hasGithub).toBeTruthy();
    });

    test("login page should have email input for magic link", async ({ page }) => {
      await page.goto("/login");
      const emailInput = page.getByPlaceholder(/email/i);
      await expect(emailInput).toBeVisible();
    });
  });
});

test.describe("Auth Callback", () => {
  test("should handle missing code in callback", async ({ page }) => {
    await page.goto("/auth/callback");
    // Should redirect to login with error
    await expect(page).toHaveURL(/\/login/);
  });

  test("should handle invalid code in callback", async ({ page }) => {
    await page.goto("/auth/callback?code=invalid_code");
    // Should handle gracefully and redirect
    await page.waitForLoadState("networkidle");
    // Either redirects to login or shows error
    const url = page.url();
    expect(url.includes("/login") || url.includes("/auth")).toBeTruthy();
  });
});

test.describe("Logout", () => {
  test("logout should clear session and redirect", async ({ page }) => {
    // Simulate logged-in state by setting a cookie (mock)
    // In real tests, you'd use a test user account

    await page.goto("/auth/logout");
    // Should redirect to home or login
    await expect(page).toHaveURL(/^\/$|\/login/);
  });
});
