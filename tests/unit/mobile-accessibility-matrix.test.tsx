import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import ProductDetailDrawer, {
  DEFAULT_HERO_PRODUCT,
} from "@/experience/ui/ProductDetailDrawer";
import CatalogPage from "@/app/catalog/page";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { CAMERA_PRESETS } from "@/experience/camera/NavigationDestinations";

describe("Mobile & Accessibility Regression Matrix (RC-018 - WCAG 2.2 AA)", () => {
  describe("WCAG 2.1.1 & 2.1.2: Modal Dialog & Focus Contract", () => {
    it("renders ProductDetailDrawer with accessible dialog attributes", () => {
      const html = renderToString(
        <ProductDetailDrawer
          isOpen={true}
          onClose={() => {}}
          product={DEFAULT_HERO_PRODUCT}
          selectedVariantId="var_midnight"
        />
      );

      // Dialog accessibility semantics
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="product-drawer-title"');
      expect(html).toContain('id="product-drawer-title"');
      expect(html).toContain(DEFAULT_HERO_PRODUCT.title);

      // Close button accessibility
      expect(html).toContain('aria-label="Close product inspection drawer (Escape)"');
      expect(html).toContain("Close (Esc)");
    });

    it("does not render any DOM when isOpen is false", () => {
      const html = renderToString(
        <ProductDetailDrawer
          isOpen={false}
          onClose={() => {}}
          product={DEFAULT_HERO_PRODUCT}
        />
      );

      expect(html).toBe("");
    });
  });

  describe("WCAG 4.1.2: Name, Role, Value & Form Controls", () => {
    it("renders variant selector with accessible radiogroup semantics", () => {
      const html = renderToString(
        <ProductDetailDrawer
          isOpen={true}
          onClose={() => {}}
          product={DEFAULT_HERO_PRODUCT}
          selectedVariantId="var_midnight"
        />
      );

      // Radiogroup semantics
      expect(html).toContain('role="radiogroup"');
      expect(html).toContain('aria-label="Hardware Finish Selection"');

      // Radios
      expect(html).toContain('role="radio"');
      expect(html).toContain('aria-checked="true"');
      expect(html).toContain('aria-checked="false"');

      // Visual swatches and checkmarks hidden from screen reader announcements
      expect(html).toContain('aria-hidden="true"');
    });

    it("ensures Header contains skip link for keyboard bypass (WCAG 2.4.1)", () => {
      const html = renderToString(<Header />);
      expect(html).toContain('href="#main-content"');
      expect(html).toContain("Skip to main content");
      expect(html).toContain("skip-link");
    });

    it("ensures Header and Footer navigation have descriptive aria-labels", () => {
      const headerHtml = renderToString(<Header />);
      const footerHtml = renderToString(<Footer />);

      expect(headerHtml).toContain('aria-label="Primary"');
      expect(footerHtml).toContain('aria-label="Footer Navigation"');
    });
  });

  describe("WCAG 2.5.8: Target Size (Minimum 44x44px for Touch Controls)", () => {
    it("enforces 44px minimum touch target height on drawer interactive controls", () => {
      const html = renderToString(
        <ProductDetailDrawer
          isOpen={true}
          onClose={() => {}}
          product={DEFAULT_HERO_PRODUCT}
          selectedVariantId="var_midnight"
        />
      );

      // Close button and variant buttons have min-height 44px
      expect(html).toContain("min-height:44px");
      expect(html).toContain("min-width:44px");
    });
  });

  describe("WCAG 2.3.3 & NFR-009: Reduced Motion Support", () => {
    it("verifies Camera presets define deterministic targets for instant snapping", () => {
      const arrival = CAMERA_PRESETS.zone_arrival;
      const gallery = CAMERA_PRESETS.zone_gallery;
      const lab = CAMERA_PRESETS.zone_lab;
      const lounge = CAMERA_PRESETS.zone_lounge;

      expect(arrival.position).toHaveLength(3);
      expect(arrival.target).toHaveLength(3);
      expect(gallery.position).toHaveLength(3);
      expect(lab.position).toHaveLength(3);
      expect(lounge.position).toHaveLength(3);

      // Camera coordinates are valid finite numbers
      arrival.position.forEach((val) => expect(Number.isFinite(val)).toBe(true));
      gallery.position.forEach((val) => expect(Number.isFinite(val)).toBe(true));
    });
  });

  describe("FR-011: Complete Accessible 2D Fallback Path", () => {
    it("renders complete non-WebGL catalog page without canvas or WebGL requirements", () => {
      const html = renderToString(<CatalogPage />);

      // Main content anchor for skip link
      expect(html).toContain('id="main-content"');

      // Semantic structure
      expect(html).toContain("<h1");
      expect(html).toContain("Hardware Product Catalog");
      expect(html).toContain('aria-label="Published Products"');
      expect(html).toContain("<article");

      // Verifies zero 3D canvas dependencies in fallback path
      expect(html).not.toContain("<canvas");
      expect(html).not.toContain("webgl");

      // Verify breadcrumb
      expect(html).toContain('aria-label="Breadcrumb"');
      expect(html).toContain("Back to Overview");
    });
  });
});
