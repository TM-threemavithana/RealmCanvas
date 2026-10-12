/**
 * RealmCanvas Performance Monitor & Dynamic Quality Adaptation
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 5.1 NFR-005, Section 5.2, Section 14.1, Section 16.3)
 */

import type { QualityTier } from "./QualityManager";

export interface DevicePerformanceProfile {
  id: string;
  name: string;
  targetFps: number;
  maxFrameTimeMs: number;
  targetDpr: number;
  initialTier: QualityTier;
  description: string;
}

export const REFERENCE_DEVICE_PROFILES: Record<string, DevicePerformanceProfile> = {
  desktop_high: {
    id: "desktop_high",
    name: "Desktop High (Discrete GPU)",
    targetFps: 60,
    maxFrameTimeMs: 16.67,
    targetDpr: 2.0,
    initialTier: "high",
    description: "High-power discrete workstation GPU maintaining 60 FPS at 2.0x DPR capped.",
  },
  desktop_medium: {
    id: "desktop_medium",
    name: "Desktop Medium / Laptop (Integrated GPU)",
    targetFps: 60,
    maxFrameTimeMs: 16.67,
    targetDpr: 1.5,
    initialTier: "medium",
    description: "Mainstream laptop or integrated GPU targeting 60 FPS at balanced 1.5x DPR.",
  },
  mobile_low: {
    id: "mobile_low",
    name: "Mobile / Low Power",
    targetFps: 30,
    maxFrameTimeMs: 33.33,
    targetDpr: 1.0,
    initialTier: "low",
    description: "Mobile thermal-throttled or low-tier hardware targeting stable 30+ FPS at 1.0x DPR.",
  },
  fallback_no_webgl: {
    id: "fallback_no_webgl",
    name: "Fallback (No WebGL 2)",
    targetFps: 0,
    maxFrameTimeMs: 0,
    targetDpr: 1.0,
    initialTier: "fallback",
    description: "Non-accelerated browser environment routing immediately to accessible 2D Catalog.",
  },
};

export interface PerformanceMetrics {
  currentFps: number;
  averageFrameTimeMs: number;
  consecutiveSlowFrames: number;
  consecutiveFastFrames: number;
  currentTier: QualityTier;
  lastTierChangeTimestamp: number;
  isDegraded: boolean;
  totalSamples: number;
}

export interface PerformanceMonitorConfig {
  sampleWindowSize?: number;
  slowFrameThresholdMs?: number; // Frame time exceeding this triggers slow frame count (> 33.3ms = < 30 FPS)
  fastFrameThresholdMs?: number; // Frame time below this triggers fast frame count (< 17.2ms = > 58 FPS)
  consecutiveSlowFramesForDowngrade?: number; // Sustained slow frames required for downgrade (default: 60 frames = ~2s)
  consecutiveFastFramesForUpgrade?: number; // Sustained fast frames required for upgrade (default: 180 frames = ~3s)
  hysteresisCooldownMs?: number; // Hysteresis interval preventing flapping (default: 5000ms)
  onTierChange?: (newTier: QualityTier, reason: string) => void;
}

export interface StructuredTelemetryLog {
  timestamp: string;
  fps: number;
  frameTimeMs: number;
  tier: QualityTier;
  isDegraded: boolean;
  totalSamples: number;
}

export class PerformanceMonitor {
  private config: Required<PerformanceMonitorConfig>;
  private currentTier: QualityTier;
  private frameTimes: number[] = [];
  private consecutiveSlowFrames = 0;
  private consecutiveFastFrames = 0;
  private lastTierChangeTimestamp = 0;
  private totalSamples = 0;

  constructor(initialTier: QualityTier = "medium", config: PerformanceMonitorConfig = {}) {
    this.currentTier = initialTier;
    this.config = {
      sampleWindowSize: config.sampleWindowSize ?? 60,
      slowFrameThresholdMs: config.slowFrameThresholdMs ?? 33.33,
      fastFrameThresholdMs: config.fastFrameThresholdMs ?? 17.24,
      consecutiveSlowFramesForDowngrade: config.consecutiveSlowFramesForDowngrade ?? 60,
      consecutiveFastFramesForUpgrade: config.consecutiveFastFramesForUpgrade ?? 180,
      hysteresisCooldownMs: config.hysteresisCooldownMs ?? 5000,
      onTierChange: config.onTierChange ?? (() => {}),
    };
    this.lastTierChangeTimestamp = 0;
  }

  /**
   * Records a frame render delta and updates performance diagnostics.
   * Enforces hysteresis cooldown to prevent rapid quality oscillation.
   */
  public recordFrame(deltaSeconds: number, nowTimestamp: number = Date.now()): PerformanceMetrics {
    // Sanitize delta to protect against background tab dormancy spikes
    const clampedDelta = Math.min(Math.max(deltaSeconds, 0.001), 0.5);
    const frameTimeMs = clampedDelta * 1000;

    this.frameTimes.push(frameTimeMs);
    if (this.frameTimes.length > this.config.sampleWindowSize) {
      this.frameTimes.shift();
    }

    this.totalSamples++;

    const sum = this.frameTimes.reduce((acc, val) => acc + val, 0);
    const avgFrameTimeMs = sum / this.frameTimes.length;
    const currentFps = Math.round(1000 / avgFrameTimeMs);

    // Track consecutive slow vs fast frames
    if (frameTimeMs > this.config.slowFrameThresholdMs) {
      this.consecutiveSlowFrames++;
      this.consecutiveFastFrames = 0;
    } else if (frameTimeMs < this.config.fastFrameThresholdMs) {
      this.consecutiveFastFrames++;
      this.consecutiveSlowFrames = 0;
    } else {
      // Normal range: reset extreme counters
      this.consecutiveSlowFrames = 0;
      this.consecutiveFastFrames = 0;
    }

    // Evaluate Hysteresis-protected tier adaptation
    const cooldownElapsed = nowTimestamp - this.lastTierChangeTimestamp >= this.config.hysteresisCooldownMs;

    if (cooldownElapsed) {
      // Downgrade check
      if (this.consecutiveSlowFrames >= this.config.consecutiveSlowFramesForDowngrade) {
        const nextLower = this.getNextLowerTier(this.currentTier);
        if (nextLower !== this.currentTier) {
          const reason = `Sustained slow performance: ${this.consecutiveSlowFrames} frames > ${this.config.slowFrameThresholdMs.toFixed(1)}ms (${currentFps} FPS)`;
          this.currentTier = nextLower;
          this.lastTierChangeTimestamp = nowTimestamp;
          this.consecutiveSlowFrames = 0;
          this.config.onTierChange(nextLower, reason);
        }
      }
      // Upgrade check
      else if (this.consecutiveFastFrames >= this.config.consecutiveFastFramesForUpgrade) {
        const nextHigher = this.getNextHigherTier(this.currentTier);
        if (nextHigher !== this.currentTier) {
          const reason = `Sustained high performance: ${this.consecutiveFastFrames} frames < ${this.config.fastFrameThresholdMs.toFixed(1)}ms (${currentFps} FPS)`;
          this.currentTier = nextHigher;
          this.lastTierChangeTimestamp = nowTimestamp;
          this.consecutiveFastFrames = 0;
          this.config.onTierChange(nextHigher, reason);
        }
      }
    }

    return {
      currentFps,
      averageFrameTimeMs: Math.round(avgFrameTimeMs * 10) / 10,
      consecutiveSlowFrames: this.consecutiveSlowFrames,
      consecutiveFastFrames: this.consecutiveFastFrames,
      currentTier: this.currentTier,
      lastTierChangeTimestamp: this.lastTierChangeTimestamp,
      isDegraded: this.currentTier === "low",
      totalSamples: this.totalSamples,
    };
  }

  public getMetrics(): PerformanceMetrics {
    const sum = this.frameTimes.length > 0 ? this.frameTimes.reduce((acc, val) => acc + val, 0) : 16.67;
    const avg = this.frameTimes.length > 0 ? sum / this.frameTimes.length : 16.67;
    return {
      currentFps: Math.round(1000 / avg),
      averageFrameTimeMs: Math.round(avg * 10) / 10,
      consecutiveSlowFrames: this.consecutiveSlowFrames,
      consecutiveFastFrames: this.consecutiveFastFrames,
      currentTier: this.currentTier,
      lastTierChangeTimestamp: this.lastTierChangeTimestamp,
      isDegraded: this.currentTier === "low",
      totalSamples: this.totalSamples,
    };
  }

  public createTelemetrySnapshot(): StructuredTelemetryLog {
    const metrics = this.getMetrics();
    return {
      timestamp: new Date().toISOString(),
      fps: metrics.currentFps,
      frameTimeMs: metrics.averageFrameTimeMs,
      tier: metrics.currentTier,
      isDegraded: metrics.isDegraded,
      totalSamples: metrics.totalSamples,
    };
  }

  public setTier(tier: QualityTier): void {
    this.currentTier = tier;
    this.lastTierChangeTimestamp = Date.now();
    this.consecutiveSlowFrames = 0;
    this.consecutiveFastFrames = 0;
  }

  public reset(): void {
    this.frameTimes = [];
    this.consecutiveSlowFrames = 0;
    this.consecutiveFastFrames = 0;
    this.totalSamples = 0;
    this.lastTierChangeTimestamp = 0;
  }

  private getNextLowerTier(tier: QualityTier): QualityTier {
    switch (tier) {
      case "high":
        return "medium";
      case "medium":
        return "low";
      case "low":
      case "fallback":
      default:
        return tier;
    }
  }

  private getNextHigherTier(tier: QualityTier): QualityTier {
    switch (tier) {
      case "low":
        return "medium";
      case "medium":
        return "high";
      case "high":
      case "fallback":
      default:
        return tier;
    }
  }
}
