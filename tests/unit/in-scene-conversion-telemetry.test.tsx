import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TelemetryBridge } from "@/experience/telemetry/TelemetryBridge";
import LeadInquiryModal from "@/experience/ui/LeadInquiryModal";
import ProductDetailDrawer, {
  DEFAULT_HERO_PRODUCT,
} from "@/experience/ui/ProductDetailDrawer";
import type { AnalyticsEventType } from "@/server/analytics/AnalyticsSchema";

describe("In-Scene Conversion Modal & Live Analytics Telemetry (RC-022)", () => {
  describe("TelemetryBridge (Section 7.5, Section 8.4, Section 9.5)", () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.restoreAllMocks();
    });

    it("initializes with anonymous session token and empty buffer", () => {
      const bridge = new TelemetryBridge({
        organizationId: "org_test",
        showroomId: "showroom_01",
        flushIntervalMs: 60000,
      });

      expect(bridge.getQueueLength()).toBe(0);
      bridge.destroy();
    });

    it("buffers allowlisted event types and ignores invalid events", () => {
      const bridge = new TelemetryBridge({
        organizationId: "org_test",
        showroomId: "showroom_01",
        flushIntervalMs: 60000,
      });

      bridge.emit("experience_entered", { entryMode: "webgl" });
      bridge.emit("scene_ready", { renderTier: "tier_a" });
      bridge.emit("zone_visited", { zoneKey: "zone_pedestal" });
      bridge.emit("product_inspected", { productId: "prod_01", slotKey: "hero" });
      bridge.emit("variant_selected", { productId: "prod_01", variantId: "var_midnight" });

      expect(bridge.getQueueLength()).toBe(5);

      // Attempt to emit unallowlisted event
      bridge.emit("unsupported_exploit_event" as AnalyticsEventType, { foo: "bar" });
      expect(bridge.getQueueLength()).toBe(5); // Ignored

      bridge.destroy();
    });

    it("automatically flushes when maxBatchSize is reached", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accepted: 3, duplicateOrDropped: 0 }),
      });
      globalThis.fetch = mockFetch;

      const bridge = new TelemetryBridge({
        organizationId: "org_batch_test",
        showroomId: "showroom_01",
        maxBatchSize: 3,
        flushIntervalMs: 60000,
      });

      bridge.emit("experience_entered");
      bridge.emit("scene_ready");
      expect(bridge.getQueueLength()).toBe(2);
      expect(mockFetch).not.toHaveBeenCalled();

      // Third event triggers auto-flush
      bridge.emit("zone_visited", { zoneKey: "zone_hero" });

      // Allow microtask resolution
      await Promise.resolve();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("/api/v1/public/events");
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.organizationId).toBe("org_batch_test");
      expect(requestBody.events).toHaveLength(3);
      expect(requestBody.events[0].eventType).toBe("experience_entered");
      expect(requestBody.events[2].eventType).toBe("zone_visited");

      bridge.destroy();
    });

    it("handles network failure gracefully without throwing or crashing the client", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network disconnect"));
      globalThis.fetch = mockFetch;

      const bridge = new TelemetryBridge({
        organizationId: "org_fail_test",
        showroomId: "showroom_01",
        maxBatchSize: 2,
        flushIntervalMs: 60000,
      });

      bridge.emit("experience_entered");
      bridge.emit("scene_ready");

      // Wait for flush to execute and catch network error
      await bridge.flush();

      // Failed batch is retained in buffer for subsequent retry
      expect(bridge.getQueueLength()).toBe(2);

      bridge.destroy();
    });

    it("destroy() clears timers and flushes remaining queue", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ accepted: 1, duplicateOrDropped: 0 }),
      });
      globalThis.fetch = mockFetch;

      const bridge = new TelemetryBridge({
        organizationId: "org_destroy_test",
        showroomId: "showroom_01",
        flushIntervalMs: 60000,
      });

      bridge.emit("experience_entered");
      expect(bridge.getQueueLength()).toBe(1);

      bridge.destroy();
      await Promise.resolve();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("LeadInquiryModal Accessibility & Contracts (WCAG 2.2 AA & Section 8.4)", () => {
    it("renders accessible quote inquiry modal with proper ARIA attributes", () => {
      const html = renderToString(
        <LeadInquiryModal
          isOpen={true}
          onClose={() => {}}
          organizationId="org_celestial_demo"
          showroomId="celestial-pavilion"
          productId="prod_01_aurora"
          productTitle="Aurora Precision Wireless Headphones"
        />
      );

      // Dialog accessibility
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="inquiry-modal-title"');
      expect(html).toContain('id="inquiry-modal-title"');
      expect(html).toContain("Request Commercial Quote");

      // Product reference
      expect(html).toContain("Aurora Precision Wireless Headphones");

      // Required fields & labels
      expect(html).toContain('for="inquiry-name"');
      expect(html).toContain('id="inquiry-name"');
      expect(html).toContain('for="inquiry-email"');
      expect(html).toContain('id="inquiry-email"');
      expect(html).toContain('for="inquiry-consent"');
      expect(html).toContain('id="inquiry-consent"');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain("I agree to be contacted regarding this commercial request");

      // Close button
      expect(html).toContain('aria-label="Close quote inquiry modal (Escape)"');

      // Touch targets: minimum 44px
      expect(html).toContain("min-height:44px");
    });

    it("does not render when isOpen is false", () => {
      const html = renderToString(
        <LeadInquiryModal
          isOpen={false}
          onClose={() => {}}
          organizationId="org_celestial_demo"
          showroomId="celestial-pavilion"
        />
      );

      expect(html).toBe("");
    });
  });

  describe("ProductDetailDrawer Conversion Actions Integration", () => {
    it("renders 'Request Commercial Quote' button within the commercial actions section", () => {
      const html = renderToString(
        <ProductDetailDrawer
          isOpen={true}
          onClose={() => {}}
          product={DEFAULT_HERO_PRODUCT}
          selectedVariantId="var_midnight"
        />
      );

      expect(html).toContain("Request Commercial Quote");
      expect(html).toContain("Inquire &amp; Pre-Order");
      expect(html).toContain("Return to Pavilion Overview");
      expect(html).toContain("min-height:44px");
    });
  });
});
