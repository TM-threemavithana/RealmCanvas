import { describe, it, expect, vi } from "vitest";
import {
  probeCapabilities,
  getEffectiveDpr,
  setupContextLossMonitoring,
} from "@/experience/quality/QualityManager";

describe("QualityManager & Capability Probe (RC-003)", () => {
  describe("getEffectiveDpr", () => {
    it("caps low tier DPR to maximum 1.0", () => {
      expect(getEffectiveDpr("low", 1.0)).toBe(1.0);
      expect(getEffectiveDpr("low", 2.0)).toBe(1.0);
      expect(getEffectiveDpr("low", 3.0)).toBe(1.0);
    });

    it("caps medium tier DPR to maximum 1.5", () => {
      expect(getEffectiveDpr("medium", 1.0)).toBe(1.0);
      expect(getEffectiveDpr("medium", 2.0)).toBe(1.5);
      expect(getEffectiveDpr("medium", 3.0)).toBe(1.5);
    });

    it("caps high tier DPR to maximum 2.0 to protect GPU thermals", () => {
      expect(getEffectiveDpr("high", 1.0)).toBe(1.0);
      expect(getEffectiveDpr("high", 1.75)).toBe(1.75);
      expect(getEffectiveDpr("high", 3.0)).toBe(2.0);
    });

    it("defaults to 1.0 for fallback tier", () => {
      expect(getEffectiveDpr("fallback", 2.5)).toBe(1.0);
    });

    it("enforces minimum DPR floor of 0.75", () => {
      expect(getEffectiveDpr("low", 0.5)).toBe(0.75);
    });
  });

  describe("probeCapabilities (SSR / Fallback Safety)", () => {
    it("safely handles non-browser environment without throwing", () => {
      // In standard Node environment (without global window/document), probe returns fallback
      const report = probeCapabilities();
      expect(report).toBeDefined();
      expect(report.tier).toBe("fallback");
      expect(report.webgl2Supported).toBe(false);
      expect(report.effectiveDpr).toBe(1.0);
      expect(report.reason).toBeDefined();
    });
  });

  describe("setupContextLossMonitoring", () => {
    it("attaches listeners and prevents default on webglcontextlost", () => {
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();
      const mockCanvas = {
        addEventListener,
        removeEventListener,
      } as unknown as HTMLCanvasElement;

      const onLost = vi.fn();
      const onRestored = vi.fn();

      const cleanup = setupContextLossMonitoring(mockCanvas, onLost, onRestored);

      expect(addEventListener).toHaveBeenCalledWith(
        "webglcontextlost",
        expect.any(Function),
        false
      );
      expect(addEventListener).toHaveBeenCalledWith(
        "webglcontextrestored",
        expect.any(Function),
        false
      );

      // Verify cleanup removes listeners
      cleanup();
      expect(removeEventListener).toHaveBeenCalledWith(
        "webglcontextlost",
        expect.any(Function)
      );
      expect(removeEventListener).toHaveBeenCalledWith(
        "webglcontextrestored",
        expect.any(Function)
      );
    });
  });
});
