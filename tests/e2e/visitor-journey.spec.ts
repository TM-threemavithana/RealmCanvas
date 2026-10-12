import { test, expect } from "@playwright/test";

/**
 * RealmCanvas Visitor Conversion Journey E2E Specification
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 15.2: TC-001, TC-002, TC-003, TC-004, TC-005)
 */
test.describe("Visitor Showroom & Conversion Journey", () => {
  test("TC-001: First load renders landing shell, navigates to showroom, and boots canvas", async ({
    page,
  }) => {
    // 1. Visit landing page
    await page.goto("/");
    await expect(page).toHaveTitle(/RealmCanvas/i);
    await expect(page.locator("h1")).toBeVisible();

    // 2. Click CTA to enter Celestial Pavilion Showroom
    const exploreCta = page.getByRole("link", { name: /Explore Celestial Pavilion/i }).first();
    await expect(exploreCta).toBeVisible();
    await exploreCta.click();

    // 3. Confirm navigation to showroom route
    await page.waitForURL("**/showroom/celestial-pavilion");
    await expect(page.getByText(/Zone 01: Arrival Portal/i)).toBeVisible();
  });

  test("TC-002 & TC-003: Inspect product, trigger drawer, and switch hardware variant", async ({
    page,
  }) => {
    await page.goto("/showroom/celestial-pavilion");

    // Click "Inspect Product" trigger
    const inspectButton = page.getByRole("button", { name: /Inspect Product/i });
    await expect(inspectButton).toBeVisible();
    await inspectButton.click();

    // Verify ProductDetailDrawer dialog attributes (TC-002)
    const drawer = page.locator('div[role="dialog"][aria-labelledby="product-drawer-title"]');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator("h2#product-drawer-title")).toContainText("Aurora Precision Wireless Headphones");
    await expect(drawer.getByText(/Verified Specifications/i)).toBeVisible();

    // Switch hardware variant to Pearl Titanium (TC-003)
    const titaniumSwatch = drawer.getByRole("radio", { name: /Pearl Titanium/i });
    await expect(titaniumSwatch).toBeVisible();
    await titaniumSwatch.click();
    await expect(titaniumSwatch).toHaveAttribute("aria-checked", "true");

    // Close drawer via Escape key or Close button
    const closeBtn = drawer.getByRole("button", { name: /Close product inspection drawer/i });
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test("TC-004: Validates outbound CTA security policy against script injection", async ({
    page,
  }) => {
    await page.goto("/showroom/celestial-pavilion");

    // Open product drawer
    await page.getByRole("button", { name: /Inspect Product/i }).click();

    // Outbound link must use https:// protocol, not javascript: or data:
    const ctaLink = page.getByRole("link", { name: /Inquire & Pre-Order/i });
    await expect(ctaLink).toBeVisible();
    const href = await ctaLink.getAttribute("href");
    expect(href).toMatch(/^https:\/\//);
    expect(href).not.toContain("javascript:");
  });

  test("TC-005: 2D Catalog Mode serves accessible non-WebGL fallback", async ({ page }) => {
    await page.goto("/showroom/celestial-pavilion");

    // Navigate to non-WebGL 2D catalog mode
    const catalogLink = page.getByRole("link", { name: /2D Catalog Mode/i });
    await expect(catalogLink).toBeVisible();
    await catalogLink.click();

    await page.waitForURL("**/catalog");
    await expect(page.locator("h1")).toContainText(/2D Commercial Catalog/i);
    await expect(page.getByText("Aurora Precision Wireless Headphones")).toBeVisible();
  });

  test("In-Scene Conversion Modal: Commercial Quote Request with Explicit Consent", async ({
    page,
  }) => {
    await page.goto("/showroom/celestial-pavilion");

    // Open drawer
    await page.getByRole("button", { name: /Inspect Product/i }).click();

    // Click Request Commercial Quote
    const quoteButton = page.getByRole("button", { name: /Request Commercial Quote/i });
    await expect(quoteButton).toBeVisible();
    await quoteButton.click();

    // Verify In-Scene Modal
    const modal = page.locator('div[role="dialog"][aria-labelledby="inquiry-modal-title"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator("h2#inquiry-modal-title")).toContainText("Request Commercial Quote");

    // Fill form fields
    await modal.locator("#inquiry-name").fill("John Architect");
    await modal.locator("#inquiry-email").fill("john@enterprise.test");
    await modal.locator("#inquiry-notes").fill("100 units evaluation batch");

    // Explicit consent checkbox required
    const consentCheckbox = modal.locator("#inquiry-consent");
    await expect(consentCheckbox).toBeVisible();
    await consentCheckbox.check();

    // Submit form
    const submitBtn = modal.getByRole("button", { name: /Send Request/i });
    await submitBtn.click();

    // Verify confirmation state or 409 duplicate handling
    await expect(modal.getByText(/Inquiry Confirmed|already submitted/i)).toBeVisible();
  });
});
