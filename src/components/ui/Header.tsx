import Link from "next/link";

export default function Header() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: "rgba(8, 14, 28, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
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
        {/* Brand Emblem */}
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
              background: "linear-gradient(135deg, var(--aether-cyan) 0%, var(--iris) 100%)",
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
                fontSize: "1.2rem",
                letterSpacing: "-0.02em",
                color: "var(--pearl)",
                lineHeight: 1.1,
              }}
            >
              RealmCanvas
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--aether-cyan)",
                fontWeight: 600,
              }}
            >
              Immersive Showrooms
            </span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav
          aria-label="Primary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <Link
            href="/showroom/celestial-pavilion"
            style={{
              fontSize: "0.9rem",
              color: "var(--pearl-muted)",
              transition: "color var(--transition-fast)",
              fontWeight: 500,
            }}
          >
            3D Showroom
          </Link>
          <Link
            href="/catalog"
            style={{
              fontSize: "0.9rem",
              color: "var(--pearl-muted)",
              transition: "color var(--transition-fast)",
              fontWeight: 500,
            }}
          >
            2D Catalog
          </Link>
          <a
            href="#zones"
            style={{
              fontSize: "0.9rem",
              color: "var(--pearl-muted)",
              transition: "color var(--transition-fast)",
              fontWeight: 500,
            }}
          >
            World Zones
          </a>
          <a
            href="#features"
            style={{
              fontSize: "0.9rem",
              color: "var(--pearl-muted)",
              transition: "color var(--transition-fast)",
              fontWeight: 500,
            }}
          >
            Commercial Tech
          </a>
        </nav>

        {/* Status Badges & Quick Action */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span
            className="badge badge-cyan"
            title="WebGL 2 graphics probe active"
            style={{ display: "none" }}
          >
            <span className="status-dot" />
            WebGL 2
          </span>
          <Link
            href="/showroom/celestial-pavilion"
            className="btn btn-primary"
            style={{
              padding: "0.5rem 1.1rem",
              fontSize: "0.85rem",
            }}
          >
            Launch Experience
          </Link>
        </div>
      </div>
    </header>
  );
}
