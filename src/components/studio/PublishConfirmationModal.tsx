"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

interface PublishConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisionNumber: number;
  assignedSlotCount: number;
  totalSlotCount: number;
  onConfirmPublish: () => Promise<void>;
  isPublishing?: boolean;
  publishedSnapshotId?: string | null;
}

export default function PublishConfirmationModal({
  isOpen,
  onClose,
  revisionNumber,
  assignedSlotCount,
  totalSlotCount,
  onConfirmPublish,
  isPublishing = false,
  publishedSnapshotId = null,
}: PublishConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape key closes modal (only when not in middle of publish transaction)
  useEffect(() => {
    if (!isOpen || isPublishing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPublishing, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(4, 8, 16, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (!isPublishing && e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-confirmation-title"
        className="card-panel"
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "rgba(15, 28, 48, 0.95)",
          border: "1px solid var(--border-accent)",
          padding: "2rem",
          boxShadow: "0 16px 48px rgba(4, 8, 16, 0.9)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <span className="badge badge-gold" style={{ marginBottom: "0.35rem" }}>
              Optimistic Concurrency Check
            </span>
            <h2
              id="publish-confirmation-title"
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "var(--pearl)",
                margin: 0,
              }}
            >
              {`Publish Showroom Revision #${revisionNumber}`}
            </h2>
          </div>
          {!isPublishing && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.8rem",
                minHeight: "44px",
                minWidth: "44px",
              }}
              aria-label="Close publish dialog (Escape)"
            >
              ✕
            </button>
          )}
        </div>

        {/* Success State */}
        {publishedSnapshotId ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div
              style={{
                padding: "1rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(55, 221, 235, 0.15)",
                border: "1px solid var(--border-accent)",
                color: "var(--pearl)",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--aether-cyan)", marginBottom: "0.25rem" }}>
                ✓ Revision Successfully Published Live
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--pearl-muted)" }}>
                Active publication snapshot ID:{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--pearl)" }}>
                  {publishedSnapshotId}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.875rem", color: "var(--pearl-muted)", lineHeight: 1.6, margin: 0 }}>
              The published scene manifest is now live. Public 3D visitors and 2D catalog shoppers
              will immediately see this new publication.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ minHeight: "44px" }}
              >
                Close Studio
              </button>
              <Link
                href="/showroom/celestial-pavilion"
                className="btn btn-primary"
                style={{ minHeight: "44px" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Launch Live Showroom</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Confirmation Content */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--pearl-muted)", lineHeight: 1.6, margin: 0 }}>
              You are about to compile draft <strong>{`Revision #${revisionNumber}`}</strong> into an immutable
              publication snapshot. This action replaces the active showroom version atomically.
            </p>

            {/* Checklist */}
            <div
              style={{
                padding: "1rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(8, 14, 28, 0.5)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
                fontSize: "0.825rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--pearl-dim)" }}>Template Pedestal Allocations:</span>
                <span style={{ color: "var(--pearl)", fontWeight: 600 }}>
                  {`${assignedSlotCount} / ${totalSlotCount} Slots Configured`}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--pearl-dim)" }}>Concurrency Token:</span>
                <span style={{ color: "var(--aether-cyan)", fontFamily: "var(--font-mono)" }}>
                  {`Rev #${revisionNumber} Validated`}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--pearl-dim)" }}>Transaction Guarantee:</span>
                <span style={{ color: "var(--pearl)" }}>Atomic Snapshot Switch</span>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "0.5rem",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "1.25rem",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isPublishing}
                className="btn btn-secondary"
                style={{ minHeight: "44px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmPublish}
                disabled={isPublishing}
                className="btn btn-primary"
                style={{ minHeight: "44px" }}
              >
                {isPublishing ? "Publishing Transaction..." : "Confirm & Publish Live"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
