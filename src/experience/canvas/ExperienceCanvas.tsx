"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import CameraRig from "@/experience/camera/CameraRig";
import ArrivalPortalGreybox from "@/experience/templates/celestial-pavilion/ArrivalPortalGreybox";
import type { CapabilityReport } from "@/experience/quality/QualityManager";

interface ExperienceCanvasProps {
  report: CapabilityReport;
  slug: string;
  onExitExperience?: () => void;
}

export default function ExperienceCanvas({
  report,
  slug,
  onExitExperience,
}: ExperienceCanvasProps) {
  const [cameraMode, setCameraMode] = useState<"arrival" | "inspect">("arrival");
  const [hasInspected, setHasInspected] = useState(false);

  const toggleCameraMode = () => {
    const nextMode = cameraMode === "arrival" ? "inspect" : "arrival";
    setCameraMode(nextMode);
    if (nextMode === "inspect") {
      setHasInspected(true);
    }
  };

  const handlePedestalClick = () => {
    setCameraMode("inspect");
    setHasInspected(true);
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
        dpr={report.effectiveDpr}
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
        <CameraRig
          mode={cameraMode}
          reducedMotion={report.prefersReducedMotion}
        />
        <ArrivalPortalGreybox
          reducedMotion={report.prefersReducedMotion}
          onPedestalClick={handlePedestalClick}
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
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", pointerEvents: "auto" }}>
          <span className="badge badge-cyan" style={{ backdropFilter: "blur(8px)" }}>
            <span className="status-dot" />
            Zone 01: Arrival Portal
          </span>
          <span className="badge" style={{ backdropFilter: "blur(8px)", textTransform: "capitalize" }}>
            Tier: {report.tier} ({report.effectiveDpr.toFixed(2)}x DPR)
          </span>
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

      {/* BOTTOM FLOATING INTERACTION HUD */}
      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          pointerEvents: "auto",
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: "0.5rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 8px 32px rgba(8, 14, 28, 0.75)",
          }}
        >
          <button
            type="button"
            onClick={toggleCameraMode}
            className={`btn ${cameraMode === "inspect" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.45rem 1.1rem", fontSize: "0.85rem" }}
          >
            {cameraMode === "arrival" ? "Inspect Hero Product" : "Reset Arrival View"}
          </button>

          <span style={{ fontSize: "0.8rem", color: "var(--pearl-muted)" }}>
            {hasInspected
              ? "Product Pedestal in Focus"
              : "Click Pedestal or button to Inspect"}
          </span>
        </div>
      </div>
    </div>
  );
}
