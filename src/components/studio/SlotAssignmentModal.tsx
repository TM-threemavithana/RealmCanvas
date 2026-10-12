"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  TEMPLATE_SLOT_REGISTRY,
  MIN_PLACEMENT_SCALE,
  MAX_PLACEMENT_SCALE,
  type SlotDescriptor,
} from "@/server/showrooms/PlacementEditor";

export interface AvailableProductOption {
  id: string;
  name: string;
  slug: string;
}

interface SlotAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotKey: string;
  currentProductId?: string;
  currentScale?: number;
  availableProducts: AvailableProductOption[];
  onSave: (slotKey: string, productId: string, scale: number) => void;
}

export default function SlotAssignmentModal({
  isOpen,
  onClose,
  slotKey,
  currentProductId,
  currentScale = 1.0,
  availableProducts,
  onSave,
}: SlotAssignmentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    currentProductId || (availableProducts[0]?.id ?? "")
  );
  const [scale, setScale] = useState<number>(currentScale);
  const [error, setError] = useState<string | null>(null);


  // Keyboard accessibility: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const slotDescriptor: SlotDescriptor | undefined = TEMPLATE_SLOT_REGISTRY.find(
    (s) => s.slotKey === slotKey
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError("Please select a product to assign to this pedestal.");
      return;
    }

    if (scale < MIN_PLACEMENT_SCALE || scale > MAX_PLACEMENT_SCALE) {
      setError(
        `Scale must be between ${MIN_PLACEMENT_SCALE}x and ${MAX_PLACEMENT_SCALE}x per Section 7.4 bounds.`
      );
      return;
    }

    onSave(slotKey, selectedProductId, scale);
    onClose();
  };

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
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-assignment-title"
        className="card-panel"
        style={{
          width: "100%",
          maxWidth: "500px",
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
            <span className="badge badge-cyan" style={{ marginBottom: "0.35rem" }}>
              Slot: {slotKey}
            </span>
            <h2
              id="slot-assignment-title"
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--pearl)",
                margin: 0,
              }}
            >
              Assign Pedestal Product
            </h2>
          </div>
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
            aria-label="Close modal (Escape)"
          >
            ✕
          </button>
        </div>

        {/* Slot Info Card */}
        {slotDescriptor && (
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(8, 14, 28, 0.5)",
              border: "1px solid var(--border-subtle)",
              marginBottom: "1.5rem",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ color: "var(--aether-cyan)", fontWeight: 600 }}>
              {slotDescriptor.label} ({slotDescriptor.zone})
            </div>
            <div style={{ color: "var(--pearl-dim)", marginTop: "0.25rem" }}>
              {slotDescriptor.description}
            </div>
          </div>
        )}

        {/* Assignment Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div
              style={{
                padding: "0.6rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(220, 38, 38, 0.2)",
                border: "1px solid rgba(220, 38, 38, 0.4)",
                color: "#fca5a5",
                fontSize: "0.825rem",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Product Selection */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label
              htmlFor="product-select"
              style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pearl)" }}
            >
              Catalog Product
            </label>
            <select
              id="product-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--void)",
                border: "1px solid var(--border-subtle)",
                color: "var(--pearl)",
                fontSize: "0.875rem",
                minHeight: "44px",
                width: "100%",
              }}
            >
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scale Slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label
                htmlFor="scale-slider"
                style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pearl)" }}
              >
                Pedestal Scale Factor
              </label>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  color: "var(--aether-cyan)",
                  fontWeight: 600,
                }}
              >
                {`${scale.toFixed(1)}x`}
              </span>
            </div>
            <input
              id="scale-slider"
              type="range"
              min={MIN_PLACEMENT_SCALE}
              max={MAX_PLACEMENT_SCALE}
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{
                accentColor: "var(--aether-cyan)",
                cursor: "pointer",
                width: "100%",
                minHeight: "44px",
              }}
              aria-label="Pedestal scale multiplier between 0.5 and 2.0"
            />
            <span style={{ fontSize: "0.75rem", color: "var(--pearl-dim)" }}>
              Bounded between {MIN_PLACEMENT_SCALE}x and {MAX_PLACEMENT_SCALE}x to preserve architectural proportions.
            </span>
          </div>

          {/* Buttons */}
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
              className="btn btn-secondary"
              style={{ minHeight: "44px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minHeight: "44px" }}
            >
              Confirm Placement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
