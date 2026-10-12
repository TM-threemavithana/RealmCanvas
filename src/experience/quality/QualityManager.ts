/**
 * RealmCanvas Quality Manager & Capability Probe
 * Complies with REALMCANVAS_MASTER_SPEC.md (Section 5.1, 5.2, 7.4, 7.5)
 */

export type QualityTier = "low" | "medium" | "high" | "fallback";

export interface CapabilityReport {
  webgl2Supported: boolean;
  tier: QualityTier;
  effectiveDpr: number;
  maxTextureSize: number;
  prefersReducedMotion: boolean;
  hardwareConcurrency: number;
  systemDpr: number;
  rendererString?: string;
  vendorString?: string;
  reason?: string;
}

/**
 * Returns the effective Device Pixel Ratio (DPR) capped per Quality Tier
 * Low: ~0.75-1.0
 * Medium: ~1.0-1.5
 * High: ~1.5-2.0 (capped)
 */
export function getEffectiveDpr(tier: QualityTier, systemDpr = 1): number {
  const dpr = Math.max(0.75, systemDpr);
  switch (tier) {
    case "low":
      return Math.min(dpr, 1.0);
    case "medium":
      return Math.min(dpr, 1.5);
    case "high":
      return Math.min(dpr, 2.0);
    case "fallback":
    default:
      return 1.0;
  }
}

/**
 * Evaluates device capabilities and probes for WebGL 2 context support.
 * Safe for execution in both SSR and browser environments.
 */
export function probeCapabilities(): CapabilityReport {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      webgl2Supported: false,
      tier: "fallback",
      effectiveDpr: 1.0,
      maxTextureSize: 0,
      prefersReducedMotion: false,
      hardwareConcurrency: 1,
      systemDpr: 1.0,
      reason: "Execution environment does not support client window context (SSR).",
    };
  }

  const systemDpr = window.devicePixelRatio || 1;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const prefersReducedMotion =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  let canvas: HTMLCanvasElement | null = null;
  let gl: WebGL2RenderingContext | null = null;

  try {
    canvas = document.createElement("canvas");
    gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
  } catch (err) {
    gl = null;
  }

  if (!gl) {
    return {
      webgl2Supported: false,
      tier: "fallback",
      effectiveDpr: 1.0,
      maxTextureSize: 0,
      prefersReducedMotion,
      hardwareConcurrency,
      systemDpr,
      reason: "WebGL 2 is unsupported or disabled by the current browser/GPU environment.",
    };
  }

  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;

  let rendererString: string | undefined;
  let vendorString: string | undefined;

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (debugInfo) {
    rendererString = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || undefined;
    vendorString = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || undefined;
  }

  // Tier assignment heuristics based on hardware boundaries
  let tier: QualityTier = "medium";
  if (hardwareConcurrency >= 8 && maxTextureSize >= 8192 && systemDpr >= 1.5) {
    tier = "high";
  } else if (hardwareConcurrency < 4 || maxTextureSize < 4096) {
    tier = "low";
  } else {
    tier = "medium";
  }

  const effectiveDpr = getEffectiveDpr(tier, systemDpr);

  return {
    webgl2Supported: true,
    tier,
    effectiveDpr,
    maxTextureSize,
    prefersReducedMotion,
    hardwareConcurrency,
    systemDpr,
    rendererString,
    vendorString,
  };
}

/**
 * Attaches standard WebGL context loss and recovery event listeners
 */
export function setupContextLossMonitoring(
  canvas: HTMLCanvasElement,
  onLost: (event: Event) => void,
  onRestored: (event: Event) => void
): () => void {
  const handleLost = (e: Event) => {
    e.preventDefault();
    onLost(e);
  };

  const handleRestored = (e: Event) => {
    onRestored(e);
  };

  canvas.addEventListener("webglcontextlost", handleLost, false);
  canvas.addEventListener("webglcontextrestored", handleRestored, false);

  return () => {
    canvas.removeEventListener("webglcontextlost", handleLost);
    canvas.removeEventListener("webglcontextrestored", handleRestored);
  };
}
