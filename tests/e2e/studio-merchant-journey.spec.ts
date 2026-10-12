import { test, expect } from "@playwright/test";

/**
 * RealmCanvas Merchant Studio & Publishing Journey E2E Specification
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 15.2: TC-006, TC-007, TC-008)
 */
test.describe("Merchant Studio Management & Publishing Journey", () => {
  test("TC-006: Studio Onboarding renders authenticated tenant context and role badge", async ({
    page,
  }) => {
    await page.goto("/studio");

    // Verify Studio Header
    await expect(page.locator("h1")).toContainText(/Merchant Studio/i);
    await expect(page.getByText(/Tenant:/i)).toBeVisible();
    await expect(page.getByText(/Celestial Sound Labs/i)).toBeVisible();
    await expect(page.getByText(/Role: owner/i)).toBeVisible();

    // Verify Key Performance Indicators (KPIs)
    await expect(page.getByText(/Live Visits/i)).toBeVisible();
    await expect(page.getByText(/Qualified Leads/i)).toBeVisible();
    await expect(page.getByText(/Conversion Rate/i)).toBeVisible();
  });

  test("TC-007 & TC-008: Interactive Slot Assignment and Atomic Publication Snapshot", async ({
    page,
  }) => {
    await page.goto("/studio");

    // 1. Open slot assignment modal on Pedestal Hero
    const editHeroBtn = page.getByRole("button", { name: /Edit slot featured-hero/i });
    await expect(editHeroBtn).toBeVisible();
    await editHeroBtn.click();

    // Verify modal dialog
    const slotModal = page.locator('div[role="dialog"][aria-labelledby="slot-assignment-title"]');
    await expect(slotModal).toBeVisible();
    await expect(slotModal.locator("h2#slot-assignment-title")).toContainText("Assign Pedestal Product");

    // Change scale slider to 1.4x
    const scaleSlider = slotModal.locator("#slot-scale");
    await scaleSlider.fill("1.4");

    // Save changes
    const saveBtn = slotModal.getByRole("button", { name: /Save Placement/i });
    await saveBtn.click();
    await expect(slotModal).not.toBeVisible();

    // Confirm draft revision was incremented
    await expect(page.getByText(/Draft Rev #4/i)).toBeVisible();

    // 2. Trigger Atomic Publication flow
    const publishBtn = page.getByRole("button", { name: /Publish Changes/i });
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    // Verify Publish Confirmation Modal
    const publishModal = page.locator('div[role="dialog"][aria-labelledby="publish-modal-title"]');
    await expect(publishModal).toBeVisible();
    await expect(publishModal.locator("h2#publish-modal-title")).toContainText("Publish Showroom Revision");
    await expect(publishModal.getByText(/Optimistic Concurrency Check/i)).toBeVisible();

    // Confirm publication
    const confirmBtn = publishModal.getByRole("button", { name: /Confirm & Publish Live/i });
    await confirmBtn.click();

    // Verify success state with snapshot pointer
    await expect(publishModal.getByText(/Revision Successfully Published Live/i)).toBeVisible();
    await expect(publishModal.getByRole("link", { name: /Launch Live Showroom/i })).toBeVisible();

    // Close modal
    await publishModal.getByRole("button", { name: /Return to Studio/i }).click();
    await expect(publishModal).not.toBeVisible();
  });

  test("Lead Management: Interactive lead status lifecycle cycling", async ({ page }) => {
    await page.goto("/studio");

    // Find first interactive lead status badge
    const leadBadge = page.locator('button[aria-label*="Lead status:"]').first();
    await expect(leadBadge).toBeVisible();

    const initialText = await leadBadge.innerText();

    // Click to cycle status
    await leadBadge.click();

    // Text or aria-label should update
    const updatedText = await leadBadge.innerText();
    expect(updatedText).not.toEqual(initialText);
  });
});
