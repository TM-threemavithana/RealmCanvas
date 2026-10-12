import { describe, it, expect, vi } from "vitest";
import {
  PerformanceMonitor,
  REFERENCE_DEVICE_PROFILES,
} from "@/experience/quality/PerformanceMonitor";

describe("Performance Monitor & Visual Baseline Logging (RC-010)", () => {
  describe("Reference Device Profiles (Section 5.1 & 5.2)", () => {
    it("defines reference hardware profiles covering desktop, mobile, and fallback", () => {
      expect(REFERENCE_DEVICE_PROFILES.desktop_high).toBeDefined();
      expect(REFERENCE_DEVICE_PROFILES.desktop_medium).toBeDefined();
      expect(REFERENCE_DEVICE_PROFILES.mobile_low).toBeDefined();
      expect(REFERENCE_DEVICE_PROFILES.fallback_no_webgl).toBeDefined();
    });

    it("enforces NFR-005 performance criteria: 60 FPS desktop and 30+ FPS mobile", () => {
      const desktopHigh = REFERENCE_DEVICE_PROFILES.desktop_high;
      expect(desktopHigh.targetFps).toBe(60);
      expect(desktopHigh.maxFrameTimeMs).toBeLessThanOrEqual(16.7);
      expect(desktopHigh.targetDpr).toBe(2.0);

      const desktopMed = REFERENCE_DEVICE_PROFILES.desktop_medium;
      expect(desktopMed.targetFps).toBe(60);
      expect(desktopMed.maxFrameTimeMs).toBeLessThanOrEqual(16.7);
      expect(desktopMed.targetDpr).toBe(1.5);

      const mobileLow = REFERENCE_DEVICE_PROFILES.mobile_low;
      expect(mobileLow.targetFps).toBe(30);
      expect(mobileLow.maxFrameTimeMs).toBeLessThanOrEqual(33.4);
      expect(mobileLow.targetDpr).toBe(1.0);
    });
  });

  describe("Frame Time Sampling & FPS Calculation", () => {
    it("computes accurate FPS from standard 60 FPS deltas (~16.6ms)", () => {
      const monitor = new PerformanceMonitor("high");

      for (let i = 0; i < 30; i++) {
        monitor.recordFrame(0.0166);
      }

      const metrics = monitor.getMetrics();
      expect(metrics.currentFps).toBe(60);
      expect(metrics.averageFrameTimeMs).toBe(16.6);
      expect(metrics.totalSamples).toBe(30);
    });

    it("clamps extreme delta spikes to protect against inactive background tab dormancy", () => {
      const monitor = new PerformanceMonitor("high");

      // Simulate a tab suspension causing a 5-second jump
      const metrics = monitor.recordFrame(5.0);

      // Delta should be clamped to 0.5s (500ms max)
      expect(metrics.averageFrameTimeMs).toBeLessThanOrEqual(500);
      expect(metrics.currentFps).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Hysteresis-Protected Quality Tier Degradation (Section 5.2)", () => {
    it("downgrades tier after sustained slow frames", () => {
      const onTierChange = vi.fn();
      const monitor = new PerformanceMonitor("high", {
        consecutiveSlowFramesForDowngrade: 10,
        hysteresisCooldownMs: 1000,
        onTierChange,
      });

      const initialTime = 10000;

      // Simulate 10 consecutive slow frames (> 33.3ms) after cooldown
      for (let i = 0; i < 10; i++) {
        monitor.recordFrame(0.045, initialTime + 2000 + i * 45); // 45ms per frame = ~22 FPS
      }

      const metrics = monitor.getMetrics();
      expect(metrics.currentTier).toBe("medium");
      expect(onTierChange).toHaveBeenCalledWith(
        "medium",
        expect.stringContaining("Sustained slow performance")
      );
    });

    it("prevents rapid tier flapping during active hysteresis cooldown window", () => {
      const onTierChange = vi.fn();
      const monitor = new PerformanceMonitor("high", {
        consecutiveSlowFramesForDowngrade: 5,
        hysteresisCooldownMs: 5000,
        onTierChange,
      });

      const time1 = 10000;
      // Initial downgrade after 5 slow frames
      for (let i = 0; i < 5; i++) {
        monitor.recordFrame(0.045, time1 + 6000 + i * 45);
      }
      expect(onTierChange).toHaveBeenCalledTimes(1);
      expect(monitor.getMetrics().currentTier).toBe("medium");

      // Simulate further slow frames only 1 second later (inside 5s cooldown)
      const time2 = time1 + 7000;
      for (let i = 0; i < 5; i++) {
        monitor.recordFrame(0.045, time2 + i * 45);
      }

      // Tier should remain 'medium', not downgrade to 'low' yet because cooldown is active
      expect(onTierChange).toHaveBeenCalledTimes(1);
      expect(monitor.getMetrics().currentTier).toBe("medium");

      // Simulate slow frames after cooldown passes (> 5000ms later)
      const time3 = time1 + 12000;
      for (let i = 0; i < 5; i++) {
        monitor.recordFrame(0.045, time3 + i * 45);
      }

      // Now it downgrades to 'low'
      expect(onTierChange).toHaveBeenCalledTimes(2);
      expect(monitor.getMetrics().currentTier).toBe("low");
    });
  });

  describe("Structured Telemetry Snapshot (Section 16.3 Privacy Compliance)", () => {
    it("creates privacy-safe telemetry log without PII or user identifiers", () => {
      const monitor = new PerformanceMonitor("medium");
      monitor.recordFrame(0.0166);

      const snapshot = monitor.createTelemetrySnapshot();
      expect(snapshot.timestamp).toBeTruthy();
      expect(snapshot.fps).toBe(60);
      expect(snapshot.tier).toBe("medium");
      expect(snapshot.totalSamples).toBe(1);

      // Ensure no IP, user identity, or tracking fields exist
      const keys = Object.keys(snapshot);
      expect(keys).not.toContain("userId");
      expect(keys).not.toContain("email");
      expect(keys).not.toContain("ip");
      expect(keys).not.toContain("sessionId");
    });
  });
});
