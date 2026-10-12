import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        backgroundColor: "var(--void-deep)",
        paddingTop: "4rem",
        paddingBottom: "3rem",
        marginTop: "auto",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "2.5rem",
            marginBottom: "3rem",
          }}
        >
          {/* Brand Column */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  width: "1rem",
                  height: "1rem",
                  background: "var(--aether-cyan)",
                  display: "inline-block",
                  borderRadius: "2px",
                  transform: "rotate(45deg)",
                }}
              />
              <strong style={{ fontSize: "1.1rem", color: "var(--pearl)" }}>
                RealmCanvas
              </strong>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--pearl-muted)",
                lineHeight: 1.6,
                maxWidth: "320px",
              }}
            >
              Commercial interactive 3D showroom platform. Bridging high-fidelity
              architectural experiences with measurable e-commerce outcomes.
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h4
              style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--aether-cyan)",
                marginBottom: "1rem",
                fontWeight: 600,
              }}
            >
              Experiences
            </h4>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
                fontSize: "0.9rem",
                color: "var(--pearl-muted)",
              }}
            >
              <li>
                <Link href="/showroom/celestial-pavilion">
                  Celestial Pavilion (3D)
                </Link>
              </li>
              <li>
                <Link href="/catalog">Accessible 2D Catalog</Link>
              </li>
              <li>
                <a href="#zones">World Architecture</a>
              </li>
              <li>
                <a href="#features">Commercial Specification</a>
              </li>
            </ul>
          </div>

          {/* Standards & Quality Column */}
          <div>
            <h4
              style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--iris)",
                marginBottom: "1rem",
                fontWeight: 600,
              }}
            >
              Quality & Access
            </h4>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
                fontSize: "0.9rem",
                color: "var(--pearl-muted)",
              }}
            >
              <li>WCAG 2.2 AA Target</li>
              <li>Zero-Canvas HTML Fallback</li>
              <li>Reduced-Motion Respecting</li>
              <li>Privacy-Preserving Telemetry</li>
            </ul>
          </div>

          {/* Architecture Status Column */}
          <div>
            <h4
              style={{
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--dawn-gold)",
                marginBottom: "1rem",
                fontWeight: 600,
              }}
            >
              Architecture
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                fontSize: "0.85rem",
                color: "var(--pearl-muted)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="status-dot" style={{ color: "var(--aether-cyan)" }} />
                <span>Next.js App Router (Modular Monolith)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="status-dot" style={{ color: "var(--iris)" }} />
                <span>Three.js & React Three Fiber (RC-004)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="status-dot" style={{ color: "var(--dawn-gold)" }} />
                <span>Immutable Scene Manifest Contract</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.8rem",
            color: "var(--pearl-dim)",
          }}
        >
          <p>© 2026 RealmCanvas. Provisional name; domain & trademark pending clearance.</p>
          <p>Engineered with Antigravity IDE · Milestone RC-002</p>
        </div>
      </div>
    </footer>
  );
}
