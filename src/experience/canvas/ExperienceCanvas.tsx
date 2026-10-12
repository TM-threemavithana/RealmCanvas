"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import Link from "next/link";
import CameraRig, {
  type CameraRigMode,
  type NavigationZoneId,
  NAVIGATION_DESTINATIONS,
  getDestinationById,
  DEFAULT_DESTINATION_ID,
} from "@/experience/camera/CameraRig";
import ArrivalPortalGreybox from "@/experience/templates/celestial-pavilion/ArrivalPortalGreybox";
import {
  type CapabilityReport,
  type QualityTier,
  getEffectiveDpr,
} from "@/experience/quality/QualityManager";
import {
  PerformanceMonitor,
  type PerformanceMetrics,
} from "@/experience/quality/PerformanceMonitor";
import {
  interactionDispatcher,
  type InteractionPayload,
} from "@/experience/interactions/InteractionRegistry";
import ProductDetailDrawer from "@/experience/ui/ProductDetailDrawer";
import {
  PRODUCT_VARIANTS,
  DEFAULT_VARIANT_ID,
} from "@/experience/templates/ProductVariants";
import { TelemetryBridge } from "@/experience/telemetry/TelemetryBridge";

interface ExperienceCanvasProps {
  report: CapabilityReport;
  slug: string;
  onExitExperience?: () => void;
}

function PerformanceSampler({
  monitor,
  onMetricsUpdate,
}: {
  monitor: PerformanceMonitor;
  onMetricsUpdate: (metrics: PerformanceMetrics) => void;
}) {
  const frameCount = useRef(0);

  useFrame((_, delta) => {
    const metrics = monitor.recordFrame(delta);
    frameCount.current++;
    if (frameCount.current % 30 === 0) {
      onMetricsUpdate(metrics);
    }
  });

  return null;
}

export default function ExperienceCanvas({
  report,
  slug,
  onExitExperience,
}: ExperienceCanvasProps) {
  const [activeZone, setActiveZone] = useState<NavigationZoneId>(DEFAULT_DESTINATION_ID);
  const [cameraMode, setCameraMode] = useState<CameraRigMode>("zone_arrival");
  const [hasInspected, setHasInspected] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activePayload, setActivePayload] = useState<InteractionPayload | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(DEFAULT_VARIANT_ID);
  const [effectiveTier, setEffectiveTier] = useState<QualityTier>(report.tier);
  const [perfMetrics, setPerfMetrics] = useState<PerformanceMetrics | null>(null);
  const [showPerfOverlay, setShowPerfOverlay] = useState(false);

  const inspectTriggerRef = useRef<HTMLButtonElement>(null);
  const currentDestination = getDestinationById(activeZone);

  const perfMonitor = useMemo(
    () =>
      new PerformanceMonitor(report.tier, {
        onTierChange: (newTier) => {
          setEffectiveTier(newTier);
        },
      }),
    [report.tier]
  );

  const telemetry = useMemo(
    () =>
      new TelemetryBridge({
        organizationId: "org_celestial_demo",
        showroomId: slug || "celestial-pavilion",
      }),
    [slug]
  );

  const effectiveDpr = getEffectiveDpr(effectiveTier, report.systemDpr);

  // Initialize and tear down telemetry lifecycle
  useEffect(() => {
    telemetry.emit("experience_entered", { entryMode: "webgl" });
    telemetry.emit("scene_ready", {
      renderTier: report.tier,
    });

    return () => {
      telemetry.destroy();
    };
  }, [telemetry, report.tier]);

  // Subscribe to typed interaction dispatcher events
  useEffect(() => {
    const unsubscribe = interactionDispatcher.subscribe(
      "inspect_product",
      (payload) => {
        setCameraMode("inspect");
        setHasInspected(true);
        setActivePayload(payload);
        setIsDrawerOpen(true);
        telemetry.emit("product_inspected", {
          productId: payload.productId,
          slotKey: payload.slotKey,
        });
      }
    );

    // Escape key closes product inspection and returns to Active Zone
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDrawerOpen) {
        if (cameraMode === "inspect") {
          setCameraMode(activeZone);
        } else {
          setActiveZone(DEFAULT_DESTINATION_ID);
          setCameraMode(DEFAULT_DESTINATION_ID);
        }
        setActivePayload(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen, cameraMode, activeZone, telemetry]);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setCameraMode(activeZone);
    setActivePayload(null);
  };

  const handleSelectZone = (zoneId: NavigationZoneId) => {
    setActiveZone(zoneId);
    setCameraMode(zoneId);
    telemetry.emit("zone_visited", { zoneKey: zoneId });
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      setActivePayload(null);
    }
    interactionDispatcher.dispatch({
      interaction: "focus_location",
      slotKey: "featured-hero",
      metadata: { zoneId },
    });
  };

  const handleInspectTrigger = () => {
    if (cameraMode !== "inspect" || !isDrawerOpen) {
      interactionDispatcher.dispatch({
        interaction: "inspect_product",
        slotKey: "featured-hero",
        productId: "prod_01_aurora",
      });
    } else {
      handleCloseDrawer();
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "75vh",
        minHeight: "560px",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border-accent)",
        boxShadow: "0 12px 40px rgba(8, 14, 28, 0.8), 0 0 32px var(--aether-cyan-glow)",
        backgroundColor: "var(--void)",
      }}
    >
      {/* REACT THREE FIBER DECLARATIVE CANVAS */}
      <Canvas
        dpr={effectiveDpr}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          alpha: false,
        }}
        camera={{
          position: [0, 1.8, 5.2],
          fov: 50,
          near: 0.1,
          far: 50,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <PerformanceSampler
          monitor={perfMonitor}
          onMetricsUpdate={(metrics) => {
            setPerfMetrics(metrics);
          }}
        />
        <CameraRig
          mode={cameraMode}
          reducedMotion={report.prefersReducedMotion}
        />
        <ArrivalPortalGreybox
          reducedMotion={report.prefersReducedMotion}
          variantId={selectedVariantId}
          onPedestalClick={() => {
            setCameraMode("inspect");
            setHasInspected(true);
            setIsDrawerOpen(true);
          }}
        />
      </Canvas>

      {/* TOP FLOATING EXPERIENCE HUD OVERLAY */}
      <div
        style={{
          position: "absolute",
          top: "1.25rem",
          left: "1.25rem",
          right: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", pointerEvents: "auto", alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge badge-cyan" style={{ backdropFilter: "blur(8px)" }}>
            <span className="status-dot" />
            Zone {currentDestination.zoneNumber}: {currentDestination.label}
          </span>
          <button
            type="button"
            onClick={() => setShowPerfOverlay((prev) => !prev)}
            className={`badge ${perfMetrics?.isDegraded ? "badge-gold" : ""}`}
            style={{
              backdropFilter: "blur(8px)",
              cursor: "pointer",
              textTransform: "capitalize",
              border: showPerfOverlay ? "1px solid var(--aether-cyan)" : undefined,
            }}
            title="Toggle Diagnostics & Real-Time Performance Telemetry (RC-010)"
          >
            Tier: {effectiveTier} ({perfMetrics ? `${perfMetrics.currentFps} FPS` : `${effectiveDpr.toFixed(2)}x DPR`})
          </button>
          <span className="badge badge-iris" style={{ backdropFilter: "blur(8px)" }}>
            Finish: {PRODUCT_VARIANTS[selectedVariantId]?.label || selectedVariantId}
          </span>
          {activePayload && (
            <span className="badge badge-gold" style={{ backdropFilter: "blur(8px)" }}>
              Focused: {activePayload.slotKey} ({activePayload.productId})
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", pointerEvents: "auto" }}>
          {onExitExperience && (
            <button
              type="button"
              onClick={onExitExperience}
              className="btn btn-secondary"
              style={{
                padding: "0.4rem 0.85rem",
                fontSize: "0.8rem",
              }}
              title="Return to Showroom Staging setup"
            >
              Staging Settings
            </button>
          )}
          <Link
            href="/catalog"
            className="btn btn-outline"
            style={{
              padding: "0.4rem 0.85rem",
              fontSize: "0.8rem",
              backdropFilter: "blur(8px)",
              background: "rgba(8, 14, 28, 0.6)",
            }}
          >
            2D Catalog Mode
          </Link>
        </div>
      </div>

      {/* BOTTOM FLOATING INTERACTION HUD: ZONE NAVIGATION DOCK & INSPECTION */}
      <div
        style={{
          position: "absolute",
          bottom: "1.25rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          pointerEvents: "auto",
          zIndex: 10,
          width: "calc(100% - 2.5rem)",
          maxWidth: "680px",
        }}
      >
        {/* ACCESSIBLE ZONE DESTINATION NAVIGATION DOCK */}
        <nav
          aria-label="Celestial Pavilion Zone Navigation"
          className="glass-panel"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.35rem 0.5rem",
            gap: "0.35rem",
            width: "100%",
            boxShadow: "0 8px 32px rgba(8, 14, 28, 0.75)",
            overflowX: "auto",
          }}
        >
          {NAVIGATION_DESTINATIONS.map((dest) => {
            const isActive = activeZone === dest.id && cameraMode !== "inspect";
            return (
              <button
                key={dest.id}
                type="button"
                aria-current={isActive ? "true" : undefined}
                onClick={() => handleSelectZone(dest.id)}
                className={`btn ${isActive ? "btn-primary" : "btn-secondary"}`}
                style={{
                  flex: "1 1 0",
                  minWidth: "120px",
                  padding: "0.35rem 0.6rem",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  whiteSpace: "nowrap",
                  borderColor: isActive ? "var(--aether-cyan)" : undefined,
                }}
                title={dest.description}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    opacity: 0.8,
                    fontFamily: "monospace",
                    color: isActive ? "var(--aether-cyan)" : "var(--pearl-dim)",
                  }}
                >
                  {dest.zoneNumber}
                </span>
                <span>{dest.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* PEDESTAL INSPECTION CONTROL BAR */}
        <div
          className="glass-panel"
          style={{
            padding: "0.45rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            width: "100%",
            boxShadow: "0 8px 32px rgba(8, 14, 28, 0.75)",
          }}
        >
          <button
            ref={inspectTriggerRef}
            type="button"
            onClick={handleInspectTrigger}
            className={`btn ${cameraMode === "inspect" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.4rem 1.1rem", fontSize: "0.825rem", whiteSpace: "nowrap" }}
          >
            {cameraMode === "inspect"
              ? `Reset ${currentDestination.shortLabel} View (Esc)`
              : "Inspect Hero Product (Enter)"}
          </button>

          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--pearl-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cameraMode === "inspect"
              ? "Hero Pedestal in Focus · Details Active"
              : `${currentDestination.label}: ${currentDestination.tagline}`}
          </span>
        </div>
      </div>

      {/* ACCESSIBLE PRODUCT DETAIL DRAWER OVERLAY */}
      <ProductDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        triggerRef={inspectTriggerRef}
        selectedVariantId={selectedVariantId}
        onSelectVariant={(variantId) => {
          setSelectedVariantId(variantId);
          telemetry.emit("variant_selected", {
            productId: activePayload?.productId || "prod_01_aurora",
            variantId,
          });
        }}
      />

      {/* PERFORMANCE & DIAGNOSTICS TELEMETRY OVERLAY (RC-010) */}
      {showPerfOverlay && (
        <div
          className="glass-panel"
          style={{
            position: "absolute",
            top: "4.5rem",
            left: "1.25rem",
            zIndex: 30,
            padding: "1rem",
            width: "300px",
            fontSize: "0.8rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            boxShadow: "0 8px 32px rgba(8, 14, 28, 0.85)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, color: "var(--aether-cyan)" }}>
              Telemetry Diagnostics
            </span>
            <button
              type="button"
              onClick={() => setShowPerfOverlay(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--pearl-dim)",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
              aria-label="Close telemetry overlay"
            >
              ✕
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
            <span style={{ color: "var(--pearl-dim)" }}>Framerate:</span>
            <span style={{ color: "var(--pearl)", fontWeight: 500 }}>
              {perfMetrics ? `${perfMetrics.currentFps} FPS` : "Sampling..."}
            </span>
            <span style={{ color: "var(--pearl-dim)" }}>Frame Time:</span>
            <span style={{ color: "var(--pearl)", fontWeight: 500 }}>
              {perfMetrics ? `${perfMetrics.averageFrameTimeMs} ms` : "Sampling..."}
            </span>
            <span style={{ color: "var(--pearl-dim)" }}>Active Tier:</span>
            <span style={{ color: "var(--pearl)", fontWeight: 500, textTransform: "capitalize" }}>
              {effectiveTier}
            </span>
            <span style={{ color: "var(--pearl-dim)" }}>Effective DPR:</span>
            <span style={{ color: "var(--pearl)", fontWeight: 500 }}>
              {effectiveDpr.toFixed(2)}x
            </span>
            <span style={{ color: "var(--pearl-dim)" }}>Hysteresis:</span>
            <span style={{ color: "var(--aether-cyan)", fontWeight: 500 }}>
              Active (5s Lock)
            </span>
            <span style={{ color: "var(--pearl-dim)" }}>Samples:</span>
            <span style={{ color: "var(--pearl)", fontWeight: 500 }}>
              {perfMetrics?.totalSamples || 0}
            </span>
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--pearl-dim)", marginTop: "0.25rem" }}>
            NFR-005: 60 FPS desktop / 30+ FPS mobile baseline with automated hysteresis degradation.
          </span>
        </div>
      )}
    </div>
  );
}
