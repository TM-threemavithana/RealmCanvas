"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface LeadInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  showroomId: string;
  productId?: string;
  productTitle?: string;
  onSuccess?: (leadId: string) => void;
}

export default function LeadInquiryModal({
  isOpen,
  onClose,
  organizationId,
  showroomId,
  productId,
  productTitle = "Featured Hardware",
  onSuccess,
}: LeadInquiryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationLeadId, setConfirmationLeadId] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setConsent(false);
    setError(null);
    setConfirmationLeadId(null);
    onClose();
  }, [onClose]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen || isSubmitting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please provide your name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (!consent) {
      setError("Explicit opt-in consent is required to process your request.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          showroomId,
          productId,
          contact: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          consent: true,
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        setConfirmationLeadId(data.leadId);
        onSuccess?.(data.leadId);
      } else if (response.status === 409) {
        setError(
          "A request for this item was already submitted recently. Our team has received your inquiry and will reach out shortly."
        );
      } else {
        setError(data.error?.message || "Failed to submit inquiry. Please try again.");
      }
    } catch {
      setError("Network connection issue. Please check your connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(4, 8, 16, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (!isSubmitting && e.target === e.currentTarget) handleClose();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        className="card-panel"
        style={{
          width: "100%",
          maxWidth: "480px",
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
              In-Scene Conversion · Zone 04
            </span>
            <h2
              id="inquiry-modal-title"
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "var(--pearl)",
                margin: 0,
              }}
            >
              Request Commercial Quote
            </h2>
          </div>
          {!isSubmitting && (
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.8rem",
                minHeight: "44px",
                minWidth: "44px",
              }}
              aria-label="Close quote inquiry modal (Escape)"
            >
              ✕
            </button>
          )}
        </div>

        {/* Success State */}
        {confirmationLeadId ? (
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
                ✓ Inquiry Confirmed
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--pearl-muted)" }}>
                Reference ID:{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--pearl)" }}>
                  {confirmationLeadId}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.875rem", color: "var(--pearl-muted)", lineHeight: 1.6, margin: 0 }}>
              {`Thank you for your interest in ${productTitle}. Our sales engineering team will review specifications and contact you at ${email}.`}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-primary"
                style={{ minHeight: "44px", width: "100%" }}
              >
                Return to 3D Pavilion
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "rgba(8, 14, 28, 0.5)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.825rem",
                color: "var(--pearl-muted)",
              }}
            >
              Requesting inquiry regarding:{" "}
              <strong style={{ color: "var(--pearl)" }}>{productTitle}</strong>
            </div>

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

            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label
                htmlFor="inquiry-name"
                style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pearl)" }}
              >
                Full Name *
              </label>
              <input
                id="inquiry-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--void)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--pearl)",
                  fontSize: "0.875rem",
                  minHeight: "44px",
                }}
              />
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label
                htmlFor="inquiry-email"
                style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pearl)" }}
              >
                Business Email *
              </label>
              <input
                id="inquiry-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--void)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--pearl)",
                  fontSize: "0.875rem",
                  minHeight: "44px",
                }}
              />
            </div>

            {/* Phone (Optional) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label
                htmlFor="inquiry-phone"
                style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pearl-muted)" }}
              >
                Phone (Optional)
              </label>
              <input
                id="inquiry-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--void)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--pearl)",
                  fontSize: "0.875rem",
                  minHeight: "44px",
                }}
              />
            </div>

            {/* Notes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label
                htmlFor="inquiry-notes"
                style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pearl-muted)" }}
              >
                Estimated Volume / Notes
              </label>
              <textarea
                id="inquiry-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Wholesale units, deployment timeline, etc."
                style={{
                  padding: "0.6rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "var(--void)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--pearl)",
                  fontSize: "0.875rem",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Explicit Consent (Section 8.2 & GDPR compliance) */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem",
                marginTop: "0.25rem",
              }}
            >
              <input
                id="inquiry-consent"
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{
                  accentColor: "var(--aether-cyan)",
                  marginTop: "0.25rem",
                  minHeight: "24px",
                  minWidth: "24px",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="inquiry-consent"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--pearl-muted)",
                  lineHeight: 1.5,
                  cursor: "pointer",
                }}
              >
                I agree to be contacted regarding this commercial request. RealmCanvas enforces
                strict tenant privacy and never sells or leaks contact data.
              </label>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "0.5rem",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "1rem",
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="btn btn-secondary"
                style={{ minHeight: "44px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ minHeight: "44px" }}
              >
                {isSubmitting ? "Submitting..." : "Send Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
