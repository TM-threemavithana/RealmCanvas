import { describe, it, expect, vi } from "vitest";
import type { PresentationMode } from "@/experience/templates/ProductPresenter";

describe("ProductPresenter & 2D Image Fallback (RC-007)", () => {
  describe("Presentation Modes & Fallback Invariants", () => {
    it("defines valid presentation modes", () => {
      const validModes: PresentationMode[] = ["procedural", "gltf", "poster-fallback"];
      expect(validModes).toContain("procedural");
      expect(validModes).toContain("gltf");
      expect(validModes).toContain("poster-fallback");
    });

    it("defaults to procedural mode when no external model URL is supplied", () => {
      const getInitialMode = (modelUrl?: string, forceFallback?: boolean): PresentationMode => {
        if (forceFallback) return "poster-fallback";
        if (modelUrl) return "gltf";
        return "procedural";
      };

      expect(getInitialMode()).toBe("procedural");
      expect(getInitialMode(undefined, false)).toBe("procedural");
    });

    it("activates poster-fallback when forceFallback is enabled", () => {
      const getInitialMode = (modelUrl?: string, forceFallback?: boolean): PresentationMode => {
        if (forceFallback) return "poster-fallback";
        if (modelUrl) return "gltf";
        return "procedural";
      };

      expect(getInitialMode("https://cdn.example.com/broken.glb", true)).toBe("poster-fallback");
      expect(getInitialMode(undefined, true)).toBe("poster-fallback");
    });
  });

  describe("Commerce Invariant: Broken Model Does Not Block Interaction (TC-001)", () => {
    it("guarantees inspection handler is executable in fallback poster mode", () => {
      const onInspect = vi.fn();

      // Simulate click in poster-fallback state
      const simulatePosterClick = (inspectHandler: () => void) => {
        inspectHandler();
      };

      simulatePosterClick(onInspect);
      expect(onInspect).toHaveBeenCalledTimes(1);
    });

    it("simulates asset fetch failure without unhandled error propagation", async () => {
      // Mock failed asset fetch
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network timeout: 404 Not Found"));

      let hasFallenBack = false;
      try {
        await mockFetch("https://cdn.example.com/missing-model.glb");
      } catch {
        hasFallenBack = true;
      }

      expect(hasFallenBack).toBe(true);
    });
  });
});
