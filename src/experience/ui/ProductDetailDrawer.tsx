"use client";

import { useEffect, useRef } from "react";

export interface ProductDetailData {
  id: string;
  title: string;
  summary: string;
  slotKey: string;
  specifications: Array<{ label: string; value: string }>;
  variants: Array<{ id: string; label: string }>;
  cta: { label: string; url: string };
}

export const DEFAULT_HERO_PRODUCT: ProductDetailData = {
  id: "prod_01_aurora",
  title: "Aurora Precision Wireless Headphones",
  summary:
    "Flagship acoustic monitor featuring acoustic composite enclosures, titanium dynamic drivers, and adaptive noise cancellation calibrated for studio-grade reproduction.",
  slotKey: "featured-hero",
  specifications: [
    { label: "Acoustic Drivers", value: "45mm Custom Titanium" },
    { label: "Frequency Range", value: "10 Hz - 40,000 Hz" },
    { label: "Battery Life", value: "38 Hours Active ANC" },
    { label: "Connectivity", value: "Lossless USB-C & Bluetooth 5.4" },
    { label: "Enclosure Material", value: "Mineral Composite & Brushed Titanium" },
  ],
  variants: [
    { id: "var_midnight", label: "Midnight Obsidian" },
    { id: "var_titanium", label: "Pearl Titanium" },
  ],
  cta: {
    label: "Inquire & Pre-Order",
    url: "https://example.com/products/aurora-headphones",
  },
};

/**
 * Validates outbound CTA URLs according to Section 10.1 (Threat Model).
 * Strictly requires HTTPS scheme or trusted relative internal paths.
 * Rejects javascript:, data:, vbscript:, and insecure protocols.
 */
export function isSafeCtaUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();

  // Allow relative internal routes (e.g. /catalog, /inquire)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

import { PRODUCT_VARIANTS } from "@/experience/templates/ProductVariants";

interface ProductDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductDetailData;
  triggerRef?: React.RefObject<HTMLElement | null>;
  selectedVariantId?: string;
  onSelectVariant?: (variantId: string) => void;
}

export default function ProductDetailDrawer({
  isOpen,
  onClose,
  product = DEFAULT_HERO_PRODUCT,
  triggerRef,
  selectedVariantId = "var_midnight",
  onSelectVariant,
}: ProductDetailDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Focus management and Escape key handling
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element and trigger element to restore upon close
      const triggerElement = triggerRef?.current;
      previousActiveElement.current = document.activeElement;

      // Move focus into the drawer close button
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }

        // Focus trap inside drawer
        if (e.key === "Tab" && drawerRef.current) {
          const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
        // Restore focus to trigger element
        if (triggerElement) {
          triggerElement.focus();
        } else if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const safeCta = isSafeCtaUrl(product.cta.url);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(4, 8, 16, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        // Close when clicking the outer backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-drawer-title"
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          backgroundColor: "rgba(15, 28, 48, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderLeft: "1px solid var(--border-accent)",
          boxShadow: "-8px 0 32px rgba(8, 14, 28, 0.9)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* TOP BAR: SLOT BADGE & CLOSE BUTTON */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
          }}
        >
          <span className="badge badge-cyan">
            Slot: {product.slotKey}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
            }}
            aria-label="Close product inspection drawer (Escape)"
          >
            Close (Esc)
          </button>
        </div>

        {/* PRODUCT TITLE & SUMMARY */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h2
            id="product-drawer-title"
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "0.75rem",
              color: "var(--pearl)",
            }}
          >
            {product.title}
          </h2>
          <p
            style={{
              fontSize: "0.92rem",
              lineHeight: 1.6,
              color: "var(--pearl-muted)",
            }}
          >
            {product.summary}
          </p>
        </div>

        {/* SPECIFICATIONS GRID */}
        <div
          style={{
            marginBottom: "1.75rem",
            padding: "1.25rem",
            backgroundColor: "rgba(8, 14, 28, 0.5)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h3
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--aether-cyan)",
              marginBottom: "0.75rem",
              fontWeight: 600,
            }}
          >
            Verified Specifications
          </h3>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.6rem 0.75rem",
              fontSize: "0.825rem",
            }}
          >
            {product.specifications.map((spec) => (
              <div key={spec.label} style={{ gridColumn: "span 2" }}>
                <dt style={{ color: "var(--pearl-dim)", fontSize: "0.75rem" }}>
                  {spec.label}:
                </dt>
                <dd style={{ color: "var(--pearl)", fontWeight: 500 }}>
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* HARDWARE FINISH / MATERIAL VARIANT SELECTOR (RC-008) */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <h3
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--iris)",
                margin: 0,
                fontWeight: 600,
              }}
            >
              Hardware Finish (RC-008)
            </h3>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--pearl-dim)",
              }}
            >
              Instant PBR Swap
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Hardware Finish Selection"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            {product.variants.map((v) => {
              const isSelected = selectedVariantId === v.id;
              const variantMeta = PRODUCT_VARIANTS[v.id];
              const swatch = variantMeta?.swatchColor || "#080E1C";
              const accent = variantMeta?.emissiveColor || "var(--aether-cyan)";

              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectVariant?.(v.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    border: isSelected
                      ? `1.5px solid ${accent}`
                      : "1px solid var(--border-subtle)",
                    backgroundColor: isSelected
                      ? "rgba(24, 44, 73, 0.75)"
                      : "rgba(16, 30, 51, 0.45)",
                    color: isSelected ? "var(--pearl)" : "var(--pearl-muted)",
                    cursor: "pointer",
                    fontSize: "0.825rem",
                    fontWeight: isSelected ? 600 : 400,
                    transition: "all var(--transition-fast)",
                    boxShadow: isSelected
                      ? `0 0 12px ${accent}40`
                      : "none",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      backgroundColor: swatch,
                      border: "1px solid var(--border-accent)",
                      flexShrink: 0,
                      display: "inline-block",
                      boxShadow: isSelected ? `0 0 6px ${accent}` : "none",
                    }}
                    aria-hidden="true"
                  />
                  <span style={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {v.label}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: accent,
                        fontWeight: 700,
                      }}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* COMMERCIAL ACTIONS */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {safeCta ? (
            <a
              href={product.cta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              <span>{product.cta.label}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="btn btn-secondary"
              style={{ width: "100%", opacity: 0.5, cursor: "not-allowed" }}
              title="CTA link is disabled because it failed security scheme policy"
            >
              Commercial Link Unavailable
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: "100%" }}
          >
            Return to Pavilion Overview
          </button>
        </div>
      </div>
    </div>
  );
}
