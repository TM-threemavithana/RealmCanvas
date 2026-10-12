"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  probeCapabilities,
  getEffectiveDpr,
  type CapabilityReport,
  type QualityTier,
} from "@/experience/quality/QualityManager";

interface CapabilityGuardProps {
  slug: string;
  onLaunchExperience?: (report: CapabilityReport) => void;
}

export default function CapabilityGuard({
  slug,
  onLaunchExperience,
}: CapabilityGuardProps) {
  const [probeStatus, setProbeStatus] = useState<"probing" | "ready" | "unsupported">("probing");
  const [report, setReport] = useState<CapabilityReport | null>(null);
  const [selectedTier, setSelectedTier] = useState<QualityTier>("medium");
  const [audioOptIn, setAudioOptIn] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const runProbe = () => {
    setProbeStatus("probing");
    const result = probeCapabilities();
    setReport(result);
    setSelectedTier(result.tier);
    setReducedMotion(result.prefersReducedMotion);

    if (result.webgl2Supported) {
      setProbeStatus("ready");
    } else {
      setProbeStatus("unsupported");
    }
  };

  useEffect(() => {
    // Schedule probe on mount asynchronously to prevent cascading renders
    const timer = setTimeout(() => {
      runProbe();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleTierChange = (tier: QualityTier) => {
    setSelectedTier(tier);
    if (report) {
      setReport({
        ...report,
        tier,
        effectiveDpr: getEffectiveDpr(tier, report.systemDpr),
      });
    }
  };

  /* STATE 1: PROBING IN PROGRESS */
  if (probeStatus === "probing") {
    return (
      <div
        className="card-panel"
        style={{
          padding: "3.5rem 2rem",
          textAlign: "center",
          maxWidth: "640px",
          margin: "0 auto",
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "3px solid var(--border-subtle)",
            borderTopColor: "var(--aether-cyan)",
            margin: "0 auto 1.5rem",
            animation: "spin 1s linear infinite",
          }}
        />
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Evaluating Graphics Capabilities...
        </h2>
        <p style={{ color: "var(--pearl-muted)", fontSize: "0.95rem" }}>
          Probing WebGL 2 hardware acceleration, display pixel ratios, and motion settings.
        </p>
      </div>
    );
  }

  /* STATE 2: WEBGL 2 UNSUPPORTED (FALLBACK TO 2D CATALOG) */
  if (probeStatus === "unsupported") {
    return (
      <div
        className="card-panel"
        style={{
          padding: "3rem 2rem",
          textAlign: "center",
          maxWidth: "680px",
          margin: "0 auto",
          borderColor: "rgba(245, 202, 138, 0.4)",
        }}
        role="alert"
      >
        <span className="badge badge-gold" style={{ marginBottom: "1.25rem" }}>
          Automatic Fallback · FR-011 / NFR-010
        </span>

        <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1rem" }}>
          WebGL 2 Hardware Acceleration Unavailable
        </h2>

        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--pearl-muted)",
            lineHeight: 1.6,
            marginBottom: "1.5rem",
          }}
        >
          {report?.reason ||
            "Your browser or graphics environment does not currently support WebGL 2. All product details, technical specifications, and inquiry options remain fully available in our accessible 2D Catalog."}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <Link href="/catalog" className="btn btn-primary" style={{ minWidth: "220px" }}>
            Open Accessible 2D Catalog
          </Link>
          <button
            type="button"
            onClick={runProbe}
            className="btn btn-secondary"
            style={{ minWidth: "160px" }}
          >
            Retry Graphics Probe
          </button>
        </div>
      </div>
    );
  }

  /* STATE 3: READY FOR 3D EXPERIENCE */
  return (
    <div
      className="card-panel"
      style={{
        padding: "2.5rem 2rem",
        textAlign: "center",
        maxWidth: "760px",
        margin: "0 auto",
      }}
    >
      <div style={{ display: "inline-flex", marginBottom: "1rem" }}>
        <span className="badge badge-cyan">
          <span className="status-dot" />
          WebGL 2 Verified · Ready to Launch
        </span>
      </div>

      <h2
        style={{
          fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: "0.75rem",
        }}
      >
        Showroom Staging: <span style={{ color: "var(--aether-cyan)" }}>{slug}</span>
      </h2>

      <p
        style={{
          fontSize: "0.95rem",
          color: "var(--pearl-muted)",
          lineHeight: 1.6,
          maxWidth: "580px",
          margin: "0 auto 2rem",
        }}
      >
        Your graphics hardware supports real-time WebGL 2 rendering. You can adjust
        render quality and accessibility preferences below, or switch to 2D at any time.
      </p>

      {/* Hardware Report HUD */}
      <div
        className="glass-panel"
        style={{
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          textAlign: "left",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          fontSize: "0.85rem",
        }}
      >
        <div>
          <span style={{ color: "var(--pearl-dim)", fontSize: "0.75rem", textTransform: "uppercase" }}>
            Renderer / GPU
          </span>
          <p style={{ fontWeight: 600, color: "var(--pearl)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {report?.rendererString || "Standard WebGL 2 Pipeline"}
          </p>
        </div>

        <div>
          <span style={{ color: "var(--pearl-dim)", fontSize: "0.75rem", textTransform: "uppercase" }}>
            Max Texture Size
          </span>
          <p style={{ fontWeight: 600, color: "var(--pearl)" }}>
            {report?.maxTextureSize ? `${report.maxTextureSize}px` : "Unknown"}
          </p>
        </div>

        <div>
          <span style={{ color: "var(--pearl-dim)", fontSize: "0.75rem", textTransform: "uppercase" }}>
            Effective DPR
          </span>
          <p style={{ fontWeight: 600, color: "var(--pearl)" }}>
            {report?.effectiveDpr.toFixed(2)}x (Capped)
          </p>
        </div>

        <div>
          <span style={{ color: "var(--pearl-dim)", fontSize: "0.75rem", textTransform: "uppercase" }}>
            CPU Concurrency
          </span>
          <p style={{ fontWeight: 600, color: "var(--pearl)" }}>
            {report?.hardwareConcurrency || 2} Threads
          </p>
        </div>
      </div>

      {/* Preferences & Quality Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          marginBottom: "2.5rem",
          padding: "1.25rem",
          backgroundColor: "rgba(15, 28, 48, 0.4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
          textAlign: "left",
        }}
      >
        {/* Tier Selector */}
        <div>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--aether-cyan)",
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            Graphics Quality Tier (Section 5.2)
          </span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {(["low", "medium", "high"] as QualityTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => handleTierChange(tier)}
                className={`btn ${selectedTier === tier ? "btn-primary" : "btn-secondary"}`}
                style={{
                  padding: "0.45rem 1rem",
                  fontSize: "0.825rem",
                  textTransform: "capitalize",
                }}
                aria-pressed={selectedTier === tier}
              >
                {tier} {tier === "high" ? "(2.0x DPR)" : tier === "medium" ? "(1.5x DPR)" : "(1.0x DPR)"}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles (Motion & Audio) */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", paddingTop: "0.5rem" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem" }}>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              style={{ accentColor: "var(--aether-cyan)" }}
            />
            <span>Reduced Motion (Disable dynamic camera sweeps)</span>
          </label>

          <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem" }}>
            <input
              type="checkbox"
              checked={audioOptIn}
              onChange={(e) => setAudioOptIn(e.target.checked)}
              style={{ accentColor: "var(--aether-cyan)" }}
            />
            <span>Enable Ambient Audio (User opt-in)</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (report && onLaunchExperience) {
              onLaunchExperience({
                ...report,
                tier: selectedTier,
                prefersReducedMotion: reducedMotion,
              });
            }
          }}
          className="btn btn-primary"
          style={{ minWidth: "240px" }}
        >
          <span>Enter 3D Experience (RC-004)</span>
          <span aria-hidden="true">→</span>
        </button>

        <Link
          href="/catalog"
          className="btn btn-secondary"
          style={{ minWidth: "200px" }}
          title="Switch to accessible HTML product catalog with zero WebGL requirements"
        >
          Switch to 2D Mode
        </Link>
      </div>
    </div>
  );
}
