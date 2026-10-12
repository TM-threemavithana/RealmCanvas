import { describe, it, expect } from "vitest";
import {
  isSafeCtaUrl,
  DEFAULT_HERO_PRODUCT,
} from "@/experience/ui/ProductDetailDrawer";

describe("ProductDetailDrawer & Security Validation (RC-006)", () => {
  describe("isSafeCtaUrl (Section 10.1 Threat Model)", () => {
    it("allows valid HTTPS URLs", () => {
      expect(isSafeCtaUrl("https://example.com/checkout")).toBe(true);
      expect(isSafeCtaUrl("https://store.brand.com/products/aurora")).toBe(true);
    });

    it("allows safe internal relative URLs", () => {
      expect(isSafeCtaUrl("/catalog")).toBe(true);
      expect(isSafeCtaUrl("/inquire/aurora")).toBe(true);
    });

    it("rejects insecure HTTP URLs", () => {
      expect(isSafeCtaUrl("http://example.com/checkout")).toBe(false);
    });

    it("rejects javascript: and pseudo-protocol injection attacks", () => {
      expect(isSafeCtaUrl("javascript:alert(document.domain)")).toBe(false);
      expect(isSafeCtaUrl("javascript:void(0)")).toBe(false);
      expect(isSafeCtaUrl("JAVASCRIPT:alert(1)")).toBe(false);
      expect(isSafeCtaUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe(false);
      expect(isSafeCtaUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isSafeCtaUrl("file:///etc/passwd")).toBe(false);
    });

    it("rejects protocol-relative double-slash URLs", () => {
      expect(isSafeCtaUrl("//malicious.com")).toBe(false);
    });

    it("rejects empty, null, and non-string inputs", () => {
      expect(isSafeCtaUrl("")).toBe(false);
      expect(isSafeCtaUrl("   ")).toBe(false);
      expect(isSafeCtaUrl(null)).toBe(false);
      expect(isSafeCtaUrl(undefined)).toBe(false);
    });
  });

  describe("DEFAULT_HERO_PRODUCT Data Contract", () => {
    it("conforms to PublicProduct specifications", () => {
      expect(DEFAULT_HERO_PRODUCT.id).toBe("prod_01_aurora");
      expect(DEFAULT_HERO_PRODUCT.slotKey).toBe("featured-hero");
      expect(DEFAULT_HERO_PRODUCT.specifications.length).toBeGreaterThanOrEqual(4);
      expect(DEFAULT_HERO_PRODUCT.variants.length).toBeGreaterThanOrEqual(2);
      expect(isSafeCtaUrl(DEFAULT_HERO_PRODUCT.cta.url)).toBe(true);
    });
  });
});
