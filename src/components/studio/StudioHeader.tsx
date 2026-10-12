import React from "react";
import Link from "next/link";
import type { OrganizationRole } from "@/server/db/schema";

interface StudioHeaderProps {
  organizationName?: string;
  userDisplayName?: string;
  userRole?: OrganizationRole;
  showroomSlug?: string;
}

export default function StudioHeader({
  organizationName = "Acme Sound Labs",
  userDisplayName = "Alice Owner",
  userRole = "owner",
  showroomSlug = "celestial-pavilion",
}: StudioHeaderProps) {
  const roleBadgeClass =
    userRole === "owner"
      ? "badge badge-gold"
      : userRole === "editor"
      ? "badge badge-cyan"
      : "badge badge-iris";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: "rgba(8, 14, 28, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <a href="#studio-main" className="skip-link">
        Skip to studio content
      </a>

      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "4.5rem",
          gap: "1.5rem",
        }}
      >
        {/* Brand & Studio Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              textDecoration: "none",
            }}
            aria-label="RealmCanvas Home"
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "var(--radius-sm)",
                background:
                  "linear-gradient(135deg, var(--aether-cyan) 0%, var(--iris) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px var(--aether-cyan-glow)",
              }}
            >
              <span
                style={{
                  width: "0.85rem",
                  height: "0.85rem",
                  border: "2px solid var(--void)",
                  transform: "rotate(45deg)",
                  display: "inline-block",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  letterSpacing: "-0.02em",
                  color: "var(--pearl)",
                  lineHeight: 1.1,
                }}
              >
                RealmCanvas
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--dawn-gold)",
                  fontWeight: 700,
                }}
              >
                Merchant Studio
              </span>
            </div>
          </Link>

          <span
            style={{
              color: "var(--pearl-dim)",
              fontSize: "1.2rem",
              userSelect: "none",
            }}
          >
            /
          </span>

          {/* Tenant Selector Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(24, 44, 73, 0.5)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.85rem",
              color: "var(--pearl)",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--aether-cyan)",
                boxShadow: "0 0 6px var(--aether-cyan)",
              }}
            />
            <span>{organizationName}</span>
          </div>
        </div>

        {/* User Role & Live Showroom Action */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ color: "var(--pearl-muted)" }}>{userDisplayName}</span>
            <span className={roleBadgeClass} style={{ textTransform: "capitalize" }}>
              {userRole}
            </span>
          </div>

          <Link
            href={`/showroom/${showroomSlug}`}
            className="btn btn-secondary"
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.825rem",
              minHeight: "44px",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Preview Live 3D</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
