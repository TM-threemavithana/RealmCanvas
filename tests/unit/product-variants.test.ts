import { describe, it, expect, vi } from "vitest";
import {
  PRODUCT_VARIANTS,
  DEFAULT_VARIANT_ID,
  getVariantById,
  type ProductVariantConfig,
} from "@/experience/templates/ProductVariants";

describe("Product Variants & PBR Material Config (RC-008)", () => {
  describe("Variant Registry Definitions", () => {
    it("defines the expected default variant id", () => {
      expect(DEFAULT_VARIANT_ID).toBe("var_midnight");
      expect(PRODUCT_VARIANTS[DEFAULT_VARIANT_ID]).toBeDefined();
    });

    it("registers both Midnight Obsidian and Pearl Titanium variants", () => {
      expect(PRODUCT_VARIANTS.var_midnight).toBeDefined();
      expect(PRODUCT_VARIANTS.var_midnight.label).toBe("Midnight Obsidian");

      expect(PRODUCT_VARIANTS.var_titanium).toBeDefined();
      expect(PRODUCT_VARIANTS.var_titanium.label).toBe("Pearl Titanium");
    });

    it("ensures all variants satisfy PBR physical limits and required tokens", () => {
      const variants = Object.values(PRODUCT_VARIANTS);
      expect(variants.length).toBeGreaterThanOrEqual(2);

      variants.forEach((v: ProductVariantConfig) => {
        expect(v.id).toBeTruthy();
        expect(v.label).toBeTruthy();
        expect(v.description).toBeTruthy();
        expect(v.bodyColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(v.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(v.emissiveColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(v.revealTrimColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(v.swatchColor).toMatch(/^#[0-9A-Fa-f]{6}$/);

        // PBR physical roughness [0, 1] and metalness [0, 1]
        expect(v.bodyRoughness).toBeGreaterThanOrEqual(0);
        expect(v.bodyRoughness).toBeLessThanOrEqual(1);
        expect(v.bodyMetalness).toBeGreaterThanOrEqual(0);
        expect(v.bodyMetalness).toBeLessThanOrEqual(1);

        expect(v.accentRoughness).toBeGreaterThanOrEqual(0);
        expect(v.accentRoughness).toBeLessThanOrEqual(1);
        expect(v.accentMetalness).toBeGreaterThanOrEqual(0);
        expect(v.accentMetalness).toBeLessThanOrEqual(1);

        expect(v.emissiveIntensity).toBeGreaterThan(0);
      });
    });
  });

  describe("getVariantById Resolution & Fallback Behavior (TC-003)", () => {
    it("retrieves the active variant when an exact valid ID is provided", () => {
      const midnight = getVariantById("var_midnight");
      expect(midnight.id).toBe("var_midnight");
      expect(midnight.bodyColor).toBe("#080E1C");

      const titanium = getVariantById("var_titanium");
      expect(titanium.id).toBe("var_titanium");
      expect(titanium.bodyColor).toBe("#E7F0FF");
    });

    it("falls back to default variant when id is undefined or null", () => {
      const fromUndefined = getVariantById(undefined);
      expect(fromUndefined.id).toBe(DEFAULT_VARIANT_ID);

      const fromNull = getVariantById(null);
      expect(fromNull.id).toBe(DEFAULT_VARIANT_ID);
    });

    it("enforces TC-003: invalid variant ID safely falls back to default without throwing", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const fallback = getVariantById("invalid_nonexistent_finish");
      expect(fallback).toBeDefined();
      expect(fallback.id).toBe(DEFAULT_VARIANT_ID);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid variant ID "invalid_nonexistent_finish"')
      );

      warnSpy.mockRestore();
    });
  });
});
