import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import StudioHeader from "@/components/studio/StudioHeader";
import StudioDashboard from "@/components/studio/StudioDashboard";
import StudioPage from "@/app/studio/page";

describe("Merchant Studio Admin & Pilot Dashboard (RC-019)", () => {
  describe("StudioHeader Component", () => {
    it("renders tenant organization name and owner role badge", () => {
      const html = renderToString(
        <StudioHeader
          organizationName="Acme Sound Labs"
          userDisplayName="Alice Owner"
          userRole="owner"
          showroomSlug="celestial-pavilion"
        />
      );

      expect(html).toContain("Acme Sound Labs");
      expect(html).toContain("Alice Owner");
      expect(html).toContain("owner");
      expect(html).toContain("badge-gold");
      expect(html).toContain("/showroom/celestial-pavilion");
      expect(html).toContain("Skip to studio content");
    });

    it("renders editor and analyst role badges with appropriate styling", () => {
      const editorHtml = renderToString(
        <StudioHeader userRole="editor" userDisplayName="Bob Editor" />
      );
      expect(editorHtml).toContain("badge-cyan");
      expect(editorHtml).toContain("editor");

      const analystHtml = renderToString(
        <StudioHeader userRole="analyst" userDisplayName="Charlie Analyst" />
      );
      expect(analystHtml).toContain("badge-iris");
      expect(analystHtml).toContain("analyst");
    });
  });

  describe("StudioDashboard Component", () => {
    it("renders commercial performance KPI widgets", () => {
      const html = renderToString(<StudioDashboard />);

      expect(html).toContain("Showroom Control Center");
      expect(html).toContain("Showroom Impressions");
      expect(html).toContain("Unique Visitor Sessions");
      expect(html).toContain("3D Product Inspections");
      expect(html).toContain("Commercial CTA Clicks");
      expect(html).toContain("2,480");
      expect(html).toContain("1,912");
      expect(html).toContain("3,145");
      expect(html).toContain("428");
    });

    it("renders active showroom publication state and template metadata", () => {
      const html = renderToString(
        <StudioDashboard
          showroomTitle="Celestial Tech Pavilion"
          templateId="celestial-tech-pavilion-v1"
          revisionNumber={3}
          publicationId="pub_celestial_live"
          isPublished={true}
        />
      );

      expect(html).toContain("Active Showroom");
      expect(html).toContain("Published (Live)");
      expect(html).toContain("celestial-tech-pavilion-v1");
      expect(html).toContain("Draft Rev #3");
      expect(html).toContain("pub_celestial_live");
    });

    it("renders fixed template placement slot matrix", () => {
      const html = renderToString(<StudioDashboard />);

      expect(html).toContain("Template Slot Allocations");
      expect(html).toContain("featured-hero");
      expect(html).toContain("gallery-01");
      expect(html).toContain("gallery-02");
      expect(html).toContain("lab-hero");
      expect(html).toContain("Aurora Wireless Headphones");
      expect(html).toContain("Titanium Studio Monitor");
      expect(html).toContain("— Available Slot —");
    });

    it("renders recent inquiries and lead pipeline", () => {
      const html = renderToString(<StudioDashboard />);

      expect(html).toContain("Recent Inquiries");
      expect(html).toContain("Marcus Vance");
      expect(html).toContain("Elena Rostova");
      expect(html).toContain("David Chen");
      expect(html).toContain("3 Active Leads");
    });

    it("provides semantic landmarks and skip anchor", () => {
      const html = renderToString(<StudioDashboard />);

      expect(html).toContain('id="studio-main"');
      expect(html).toContain('aria-label="Commercial Performance Metrics"');
      expect(html).toContain('aria-labelledby="showroom-status-title"');
      expect(html).toContain('aria-labelledby="placements-title"');
      expect(html).toContain('aria-labelledby="inquiries-title"');
    });
  });

  describe("StudioPage Integration", () => {
    it("renders full page layout containing header, dashboard, and footer", () => {
      const html = renderToString(<StudioPage />);

      expect(html).toContain("Merchant Studio");
      expect(html).toContain("Showroom Control Center");
      expect(html).toContain("Footer Navigation");
    });
  });
});
