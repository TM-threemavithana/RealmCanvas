import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import SlotAssignmentModal from "@/components/studio/SlotAssignmentModal";
import PublishConfirmationModal from "@/components/studio/PublishConfirmationModal";
import StudioDashboard from "@/components/studio/StudioDashboard";

describe("Merchant Studio Interactive Mutations (RC-021)", () => {
  const sampleProducts = [
    { id: "prod_01", name: "Aurora Headphones", slug: "aurora" },
    { id: "prod_02", name: "Titanium Monitor", slug: "titanium" },
  ];

  describe("SlotAssignmentModal", () => {
    it("renders accessible modal with product options and scale slider", () => {
      const html = renderToString(
        <SlotAssignmentModal
          isOpen={true}
          onClose={() => {}}
          slotKey="featured-hero"
          availableProducts={sampleProducts}
          currentScale={1.2}
          onSave={() => {}}
        />
      );

      // Dialog accessibility
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="slot-assignment-title"');
      expect(html).toContain("Assign Pedestal Product");
      expect(html).toContain("featured-hero");

      // Product dropdown options
      expect(html).toContain("Aurora Headphones");
      expect(html).toContain("Titanium Monitor");

      // Scale slider bounds
      expect(html).toContain('min="0.5"');
      expect(html).toContain('max="2"');
      expect(html).toContain('1.2x');

      // Touch targets
      expect(html).toContain("min-height:44px");
    });

    it("renders nothing when isOpen is false", () => {
      const html = renderToString(
        <SlotAssignmentModal
          isOpen={false}
          onClose={() => {}}
          slotKey="featured-hero"
          availableProducts={sampleProducts}
          onSave={() => {}}
        />
      );

      expect(html).toBe("");
    });
  });

  describe("PublishConfirmationModal", () => {
    it("renders revision confirmation summary with optimistic concurrency checks", () => {
      const html = renderToString(
        <PublishConfirmationModal
          isOpen={true}
          onClose={() => {}}
          revisionNumber={4}
          assignedSlotCount={3}
          totalSlotCount={6}
          onConfirmPublish={async () => {}}
        />
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain("Publish Showroom Revision #4");
      expect(html).toContain("Optimistic Concurrency Check");
      expect(html).toContain("3 / 6 Slots Configured");
      expect(html).toContain("Rev #4 Validated");
      expect(html).toContain("Confirm &amp; Publish Live");
    });

    it("renders success state with snapshot pointer when published", () => {
      const html = renderToString(
        <PublishConfirmationModal
          isOpen={true}
          onClose={() => {}}
          revisionNumber={4}
          assignedSlotCount={3}
          totalSlotCount={6}
          publishedSnapshotId="pub_live_snapshot_99"
          onConfirmPublish={async () => {}}
        />
      );

      expect(html).toContain("Revision Successfully Published Live");
      expect(html).toContain("pub_live_snapshot_99");
      expect(html).toContain("/showroom/celestial-pavilion");
      expect(html).toContain("Launch Live Showroom");
    });

    it("renders nothing when isOpen is false", () => {
      const html = renderToString(
        <PublishConfirmationModal
          isOpen={false}
          onClose={() => {}}
          revisionNumber={1}
          assignedSlotCount={0}
          totalSlotCount={6}
          onConfirmPublish={async () => {}}
        />
      );

      expect(html).toBe("");
    });
  });

  describe("StudioDashboard Interactive Integration", () => {
    it("renders publish action and slot mutation triggers", () => {
      const html = renderToString(<StudioDashboard />);

      // Publish action button
      expect(html).toContain("Publish Changes (Rev #3)");

      // Slot action buttons
      expect(html).toContain("Edit");
      expect(html).toContain("Assign");

      // Interactive lead status badges with accessible labels
      expect(html).toContain('aria-label="Lead status: new. Click to cycle status."');
      expect(html).toContain('aria-label="Lead status: contacted. Click to cycle status."');
    });
  });
});
