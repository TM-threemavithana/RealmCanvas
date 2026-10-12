import React from "react";
import Link from "next/link";
import { TEMPLATE_SLOT_REGISTRY } from "@/server/showrooms/PlacementEditor";

interface PlacementSummaryItem {
  slotKey: string;
  slotName: string;
  assignedProduct?: {
    id: string;
    name: string;
    scale: number;
  };
}

interface AnalyticsMetric {
  label: string;
  value: string | number;
  subtext: string;
  accent: "cyan" | "gold" | "iris";
}

interface InquiryItem {
  id: string;
  contactName: string;
  productName: string;
  status: "new" | "contacted" | "qualified" | "closed";
  submittedAt: string;
}

interface StudioDashboardProps {
  organizationName?: string;
  showroomTitle?: string;
  templateId?: string;
  revisionNumber?: number;
  publicationId?: string;
  isPublished?: boolean;
  placements?: PlacementSummaryItem[];
  metrics?: AnalyticsMetric[];
  recentInquiries?: InquiryItem[];
}

const getSlotDescription = (key: string): string => {
  const descriptor = TEMPLATE_SLOT_REGISTRY.find((s) => s.slotKey === key);
  return descriptor ? descriptor.description : key;
};

const DEFAULT_PLACEMENTS: PlacementSummaryItem[] = [
  {
    slotKey: "featured-hero",
    slotName: getSlotDescription("featured-hero"),
    assignedProduct: {
      id: "prod_aurora",
      name: "Aurora Wireless Headphones",
      scale: 1.0,
    },
  },
  {
    slotKey: "gallery-01",
    slotName: getSlotDescription("gallery-01"),
    assignedProduct: {
      id: "prod_monitor",
      name: "Titanium Studio Monitor",
      scale: 1.0,
    },
  },
  {
    slotKey: "gallery-02",
    slotName: getSlotDescription("gallery-02"),
  },
  {
    slotKey: "gallery-03",
    slotName: getSlotDescription("gallery-03"),
  },
  {
    slotKey: "gallery-04",
    slotName: getSlotDescription("gallery-04"),
  },
  {
    slotKey: "lab-hero",
    slotName: getSlotDescription("lab-hero"),
    assignedProduct: {
      id: "prod_aurora_lab",
      name: "Aurora Acoustic Rig (Exploded View)",
      scale: 1.2,
    },
  },
];

const DEFAULT_METRICS: AnalyticsMetric[] = [
  {
    label: "Showroom Impressions",
    value: "2,480",
    subtext: "Total landing & entrance beacons",
    accent: "cyan",
  },
  {
    label: "Unique Visitor Sessions",
    value: "1,912",
    subtext: "Privacy-hashed sessions",
    accent: "iris",
  },
  {
    label: "3D Product Inspections",
    value: "3,145",
    subtext: "Pedestal clicks & focus draws",
    accent: "gold",
  },
  {
    label: "Commercial CTA Clicks",
    value: "428",
    subtext: "17.2% overall exploration conversion",
    accent: "cyan",
  },
];

const DEFAULT_INQUIRIES: InquiryItem[] = [
  {
    id: "inq_01",
    contactName: "Marcus Vance",
    productName: "Aurora Wireless Headphones",
    status: "new",
    submittedAt: "10 mins ago",
  },
  {
    id: "inq_02",
    contactName: "Elena Rostova",
    productName: "Titanium Studio Monitor",
    status: "contacted",
    submittedAt: "2 hours ago",
  },
  {
    id: "inq_03",
    contactName: "David Chen",
    productName: "Aurora Wireless Headphones",
    status: "qualified",
    submittedAt: "1 day ago",
  },
];

export default function StudioDashboard({
  organizationName = "Acme Sound Labs",
  showroomTitle = "Celestial Tech Pavilion",
  templateId = "celestial-tech-pavilion-v1",
  revisionNumber = 3,
  publicationId = "pub_celestial_live",
  isPublished = true,
  placements = DEFAULT_PLACEMENTS,
  metrics = DEFAULT_METRICS,
  recentInquiries = DEFAULT_INQUIRIES,
}: StudioDashboardProps) {
  const occupiedSlots = placements.filter((p) => p.assignedProduct).length;
  const totalSlots = placements.length;

  return (
    <main id="studio-main" style={{ flex: 1, padding: "2.5rem 0 5rem" }}>
      <div className="container">
        {/* Top Title Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              <span className="badge badge-gold">Pilot Showroom Admin</span>
              <span className="badge badge-cyan">{organizationName}</span>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--pearl)",
                margin: 0,
              }}
            >
              Showroom Control Center
            </h1>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link
              href="/catalog"
              className="btn btn-secondary"
              style={{ padding: "0.6rem 1.25rem", fontSize: "0.875rem" }}
            >
              View 2D Catalog
            </Link>
            <Link
              href="/showroom/celestial-pavilion"
              className="btn btn-primary"
              style={{ padding: "0.6rem 1.25rem", fontSize: "0.875rem" }}
            >
              Enter Live 3D Experience
            </Link>
          </div>
        </div>

        {/* 4-COLUMN KPI ROW */}
        <section aria-label="Commercial Performance Metrics" style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {metrics.map((m) => {
              const borderAccent =
                m.accent === "gold"
                  ? "var(--border-highlight)"
                  : m.accent === "iris"
                  ? "rgba(141, 107, 238, 0.35)"
                  : "var(--border-accent)";

              return (
                <div
                  key={m.label}
                  className="card-panel"
                  style={{
                    padding: "1.25rem",
                    borderColor: borderAccent,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--pearl-dim)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {m.label}
                  </span>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "var(--pearl)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {m.value}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--pearl-muted)" }}>
                    {m.subtext}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* MAIN DASHBOARD GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "2rem",
          }}
        >
          {/* COLUMN 1: SHOWROOM & PLACEMENT MANAGEMENT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Showroom Publication Status */}
            <section
              className="card-panel"
              aria-labelledby="showroom-status-title"
              style={{ padding: "1.75rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}
              >
                <h2
                  id="showroom-status-title"
                  style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--pearl)" }}
                >
                  Active Showroom
                </h2>
                <span className={isPublished ? "badge badge-cyan" : "badge badge-iris"}>
                  <span className="status-dot" style={{ marginRight: "0.35rem" }} />
                  {isPublished ? "Published (Live)" : "Draft In Progress"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  fontSize: "0.875rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--pearl-dim)" }}>World Title:</span>
                  <span style={{ color: "var(--pearl)", fontWeight: 600 }}>{showroomTitle}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--pearl-dim)" }}>Template:</span>
                  <span style={{ color: "var(--aether-cyan)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                    {templateId}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--pearl-dim)" }}>Revision Concurrency:</span>
                  <span style={{ color: "var(--pearl)" }}>{`Draft Rev #${revisionNumber}`}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--pearl-dim)" }}>Active Publication:</span>
                  <span style={{ color: "var(--pearl-muted)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                    {publicationId}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: "0.85rem",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "rgba(8, 14, 28, 0.4)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.8rem",
                  color: "var(--pearl-dim)",
                  lineHeight: 1.5,
                }}
              >
                Published snapshots are immutable (Section 8.2). Edits occur in draft revisions
                with optimistic revision concurrency control before atomic publication.
              </div>
            </section>

            {/* Fixed Slot Allocation Matrix */}
            <section
              className="card-panel"
              aria-labelledby="placements-title"
              style={{ padding: "1.75rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <h2
                    id="placements-title"
                    style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--pearl)" }}
                  >
                    Template Slot Allocations
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: "var(--pearl-dim)" }}>
                    Section 7.4 Fixed World Registry
                  </span>
                </div>
                <span className="badge badge-gold">
                  {occupiedSlots} / {totalSlots} Assigned
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {placements.map((slot) => {
                  const isAssigned = !!slot.assignedProduct;

                  return (
                    <div
                      key={slot.slotKey}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius-sm)",
                        border: isAssigned
                          ? "1px solid var(--border-subtle)"
                          : "1px dashed var(--border-subtle)",
                        backgroundColor: isAssigned
                          ? "rgba(24, 44, 73, 0.4)"
                          : "rgba(8, 14, 28, 0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.75rem",
                              color: "var(--aether-cyan)",
                              fontWeight: 600,
                            }}
                          >
                            {slot.slotKey}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--pearl-dim)" }}>
                            · {slot.slotName}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: isAssigned ? 600 : 400,
                            color: isAssigned ? "var(--pearl)" : "var(--pearl-dim)",
                            marginTop: "0.15rem",
                          }}
                        >
                          {slot.assignedProduct ? slot.assignedProduct.name : "— Available Slot —"}
                        </span>
                      </div>

                      {isAssigned ? (
                        <span className="badge badge-cyan" style={{ fontSize: "0.7rem" }}>
                          Scale {slot.assignedProduct?.scale}x
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--pearl-dim)",
                            fontStyle: "italic",
                          }}
                        >
                          Unassigned
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* COLUMN 2: RECENT INQUIRIES & ACTIONS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section
              className="card-panel"
              aria-labelledby="inquiries-title"
              style={{ padding: "1.75rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <h2
                    id="inquiries-title"
                    style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--pearl)" }}
                  >
                    Recent Inquiries & Leads
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: "var(--pearl-dim)" }}>
                    Section 3.3 Conversion Pipeline
                  </span>
                </div>
                <span className="badge badge-iris">{`${recentInquiries.length} Active Leads`}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {recentInquiries.map((inq) => {
                  const statusBadgeClass =
                    inq.status === "new"
                      ? "badge badge-cyan"
                      : inq.status === "qualified"
                      ? "badge badge-gold"
                      : "badge badge-iris";

                  return (
                    <div
                      key={inq.id}
                      style={{
                        padding: "0.85rem 1rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-subtle)",
                        backgroundColor: "rgba(24, 44, 73, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--pearl)", fontSize: "0.875rem" }}>
                            {inq.contactName}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--pearl-dim)" }}>
                            · {inq.submittedAt}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--pearl-muted)", marginTop: "0.15rem" }}>
                          Inquiry for: {inq.productName}
                        </span>
                      </div>

                      <span className={statusBadgeClass} style={{ textTransform: "capitalize", fontSize: "0.75rem" }}>
                        {inq.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick Pilot Onboarding Guidance */}
            <section
              className="card-panel"
              aria-labelledby="pilot-guide-title"
              style={{
                padding: "1.75rem",
                backgroundColor: "rgba(8, 14, 28, 0.6)",
                border: "1px solid var(--border-highlight)",
              }}
            >
              <h2
                id="pilot-guide-title"
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                  color: "var(--dawn-gold)",
                }}
              >
                Merchant Pilot Operations
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  color: "var(--pearl-muted)",
                  marginBottom: "1rem",
                }}
              >
                Welcome to the RealmCanvas pilot program. You can assign 3D assets to fixed
                pavilion pedestals, configure finishes, test responsive rendering, and review
                inquiries submitted through the 3D conversion lounge or accessible 2D catalog.
              </p>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  fontSize: "0.8rem",
                  color: "var(--pearl-dim)",
                }}
              >
                <li>✓ Zero cross-tenant data leakage (Section 8.3)</li>
                <li>✓ Server-enforced role hierarchy: Owner &gt; Editor &gt; Analyst</li>
                <li>✓ Full WCAG 2.2 AA and non-WebGL fallback guarantees</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
