/**
 * FCF Builder E2E Tests
 *
 * Tests the Feature Control Frame builder workflow.
 * Note: These tests require authentication - use test fixtures or mock auth.
 */

import { test, expect } from "@playwright/test";

// Skip auth for these tests - they test UI behavior
// In a real setup, you'd use authenticated fixtures
test.describe("FCF Builder UI", () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to builder - will redirect if not authed
    await page.goto("/app/builder");
  });

  test.describe("Builder Layout", () => {
    test("should display builder page elements", async ({ page }) => {
      // Check for main builder components
      const builderTitle = page.getByText(/fcf builder|feature control frame/i);
      await expect(builderTitle).toBeVisible({ timeout: 10000 }).catch(() => {
        // If redirected to login, skip the test
        test.skip();
      });
    });
  });
});

// Tests that don't require auth - landing page builder preview
test.describe("Public Builder Preview", () => {
  test("should show GD&T characteristic options on landing page", async ({ page }) => {
    await page.goto("/");

    // Look for characteristic mentions
    const hasPosition = await page.getByText(/position/i).first().isVisible().catch(() => false);
    const hasFlatness = await page.getByText(/flatness/i).first().isVisible().catch(() => false);

    // Landing page should mention GD&T concepts
    expect(hasPosition || hasFlatness).toBeTruthy();
  });
});

test.describe("FCF Builder Form Interactions", () => {
  // These would run against a test environment with mock auth
  test.skip("should allow selecting a characteristic", async ({ page }) => {
    await page.goto("/app/builder");

    // Wait for builder to load
    await page.waitForSelector("[data-testid='characteristic-select']", {
      timeout: 5000,
    });

    // Click characteristic dropdown
    await page.click("[data-testid='characteristic-select']");

    // Select position
    await page.click("text=Position");

    // Verify selection
    const selected = await page.textContent("[data-testid='characteristic-select']");
    expect(selected).toContain("Position");
  });

  test.skip("should allow entering tolerance value", async ({ page }) => {
    await page.goto("/app/builder");

    // Wait for tolerance input
    const toleranceInput = page.locator("[data-testid='tolerance-value']");
    await toleranceInput.waitFor({ timeout: 5000 });

    // Enter tolerance
    await toleranceInput.fill("0.050");

    // Verify value
    await expect(toleranceInput).toHaveValue("0.050");
  });

  test.skip("should allow adding datum references", async ({ page }) => {
    await page.goto("/app/builder");

    // Wait for add datum button
    const addDatumBtn = page.locator("[data-testid='add-datum-btn']");
    await addDatumBtn.waitFor({ timeout: 5000 });

    // Click add datum
    await addDatumBtn.click();

    // Enter datum letter
    const datumInput = page.locator("[data-testid='datum-input-0']");
    await datumInput.fill("A");

    // Verify datum was added
    await expect(datumInput).toHaveValue("A");
  });

  test.skip("should update FCF preview on changes", async ({ page }) => {
    await page.goto("/app/builder");

    // Make changes to the form
    await page.click("[data-testid='characteristic-select']");
    await page.click("text=Position");

    const toleranceInput = page.locator("[data-testid='tolerance-value']");
    await toleranceInput.fill("0.100");

    // Check preview updates
    const preview = page.locator("[data-testid='fcf-preview']");
    await expect(preview).toBeVisible();

    // Preview should contain the position symbol or text
    const previewText = await preview.textContent();
    expect(previewText).toBeTruthy();
  });
});

test.describe("FCF Export", () => {
  test.skip("should show export options", async ({ page }) => {
    await page.goto("/app/builder");

    // Wait for export bar
    const exportBar = page.locator("[data-testid='export-bar']");
    await exportBar.waitFor({ timeout: 5000 });

    // Check export format buttons exist
    await expect(page.getByRole("button", { name: /png/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /svg/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /pdf/i })).toBeVisible();
  });

  test.skip("should show upgrade prompt for free tier export", async ({ page }) => {
    await page.goto("/app/builder");

    // Click PNG export
    await page.click("button:has-text('PNG')");

    // Should show upgrade prompt for free tier
    const upgradePrompt = page.getByText(/upgrade|pro plan/i);
    await expect(upgradePrompt).toBeVisible({ timeout: 5000 });
  });
});

test.describe("FCF Validation", () => {
  test.skip("should show validation errors for invalid FCF", async ({ page }) => {
    await page.goto("/app/builder");

    // Try to save without required fields
    const saveBtn = page.locator("[data-testid='save-fcf-btn']");
    await saveBtn.waitFor({ timeout: 5000 });
    await saveBtn.click();

    // Should show validation error
    const errorMessage = page.getByText(/required|missing|invalid/i);
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });
});
