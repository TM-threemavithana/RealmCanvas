import Link from "next/link";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

export default function HomePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main id="main-content" style={{ flex: 1 }}>
        {/* HERO SECTION */}
        <section
          style={{
            position: "relative",
            paddingTop: "6rem",
            paddingBottom: "6rem",
            background: "radial-gradient(circle at 50% 20%, rgba(24, 44, 73, 0.45) 0%, rgba(8, 14, 28, 1) 75%)",
            overflow: "hidden",
          }}
        >
          {/* Subtle Background Glow Rings */}
          <div
            style={{
              position: "absolute",
              top: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(55, 221, 235, 0.12) 0%, rgba(141, 107, 238, 0.05) 50%, transparent 70%)",
              pointerEvents: "none",
              filter: "blur(60px)",
            }}
          />

          <div className="container" style={{ position: "relative", textAlign: "center" }}>
            <div style={{ display: "inline-flex", marginBottom: "1.5rem" }}>
              <span className="badge badge-cyan">
                <span className="status-dot" />
                Celestial Tech Pavilion · Immersive 3D Engine
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4.25rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                marginBottom: "1.5rem",
                maxWidth: "960px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Where Precision Hardware Meets{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--aether-cyan) 20%, var(--iris) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Immersive Space.
              </span>
            </h1>

            <p
              style={{
                fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
                lineHeight: 1.6,
                color: "var(--pearl-muted)",
                maxWidth: "760px",
                marginLeft: "auto",
                marginRight: "auto",
                marginBottom: "2.5rem",
              }}
            >
              Step beyond static catalogs. RealmCanvas provides high-fidelity,
              browser-based 3D showrooms with real-time model inspection, material
              variant customization, and direct commercial lead generation.
            </p>

            {/* Primary Entry Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.25rem",
                flexWrap: "wrap",
                marginBottom: "3.5rem",
              }}
            >
              <Link href="/showroom/celestial-pavilion" className="btn btn-primary">
                <span>Enter 3D Showroom</span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/catalog" className="btn btn-secondary">
                <span>Browse 2D Catalog</span>
                <span className="badge badge-gold" style={{ marginLeft: "0.25rem" }}>
                  Zero-WebGL
                </span>
              </Link>
            </div>

            {/* Trust & Architecture Metrics Strip */}
            <div
              className="glass-panel"
              style={{
                maxWidth: "920px",
                margin: "0 auto",
                padding: "1.25rem 2rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1.5rem",
                textAlign: "left",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--aether-cyan)", fontWeight: 600 }}>
                  Render Target
                </span>
                <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--pearl)" }}>
                  WebGL 2 / 60 FPS
                </p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--iris)", fontWeight: 600 }}>
                  Universal Fallback
                </span>
                <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--pearl)" }}>
                  Accessible HTML 2D
                </p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--dawn-gold)", fontWeight: 600 }}>
                  Publishing Model
                </span>
                <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--pearl)" }}>
                  Immutable Manifests
                </p>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--pearl-muted)", fontWeight: 600 }}>
                  Multi-Tenancy
                </span>
                <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--pearl)" }}>
                  Strict Server Guards
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOUR PAVILION ZONES SECTION */}
        <section id="zones" className="section-padding" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="container">
            <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 3.5rem" }}>
              <span className="badge badge-iris" style={{ marginBottom: "0.75rem" }}>
                Flagship World Design
              </span>
              <h2 style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
                The Celestial Tech Pavilion
              </h2>
              <p style={{ color: "var(--pearl-muted)", fontSize: "1.05rem" }}>
                An architectural structure elevated above clouds, designed to guide
                visitors seamlessly from initial curiosity to qualified customer action.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {/* Zone 1 */}
              <article className="card-panel">
                <span className="badge badge-cyan" style={{ marginBottom: "1rem" }}>
                  Zone 01
                </span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Arrival Portal
                </h3>
                <p style={{ fontSize: "0.92rem", color: "var(--pearl-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                  A circular open terrace framed by a monolithic arch. Silhouette
                  lighting reveals the hero showcase, introducing visitors to the brand aesthetic.
                </p>
                <div style={{ fontSize: "0.8rem", color: "var(--aether-cyan)", fontWeight: 600 }}>
                  Commercial Goal: Brand Prestige & Entrance
                </div>
              </article>

              {/* Zone 2 */}
              <article className="card-panel">
                <span className="badge badge-iris" style={{ marginBottom: "1rem" }}>
                  Zone 02
                </span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Discovery Gallery
                </h3>
                <p style={{ fontSize: "0.92rem", color: "var(--pearl-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                  A curved architectural walkway hosting interactive pedestal sockets.
                  Visitors smoothly navigate between models and trigger immediate focus.
                </p>
                <div style={{ fontSize: "0.8rem", color: "var(--iris)", fontWeight: 600 }}>
                  Commercial Goal: Multi-SKU Exploration
                </div>
              </article>

              {/* Zone 3 */}
              <article className="card-panel">
                <span className="badge badge-gold" style={{ marginBottom: "1rem" }}>
                  Zone 03
                </span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Product Lab
                </h3>
                <p style={{ fontSize: "0.92rem", color: "var(--pearl-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                  Spotlighted inspection rig allowing 360-degree free orbit,
                  material/finish toggling, and deep dive into technical specifications.
                </p>
                <div style={{ fontSize: "0.8rem", color: "var(--dawn-gold)", fontWeight: 600 }}>
                  Commercial Goal: Feature Inspection & Demos
                </div>
              </article>

              {/* Zone 4 */}
              <article className="card-panel">
                <span className="badge" style={{ marginBottom: "1rem", color: "var(--pearl)" }}>
                  Zone 04
                </span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Conversion Lounge
                </h3>
                <p style={{ fontSize: "0.92rem", color: "var(--pearl-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                  A tranquil atrium with warm lighting and recap displays. Facilitates
                  instant quote requests, demo bookings, or outbound store referrals.
                </p>
                <div style={{ fontSize: "0.8rem", color: "var(--pearl)", fontWeight: 600 }}>
                  Commercial Goal: Qualified Lead Generation
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* COMMERCIAL CAPABILITIES & STANDARDS */}
        <section id="features" className="section-padding" style={{ backgroundColor: "var(--surface-base)", borderTop: "1px solid var(--border-subtle)" }}>
          <div className="container">
            <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 3.5rem" }}>
              <span className="badge badge-cyan" style={{ marginBottom: "0.75rem" }}>
                Commercial Engineering
              </span>
              <h2 style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
                Built for High Reliability & Measurable Outcomes
              </h2>
              <p style={{ color: "var(--pearl-muted)", fontSize: "1.05rem" }}>
                Unlike fragile 3D experiments, RealmCanvas operates as a secure,
                maintainable enterprise SaaS platform.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "2rem",
              }}
            >
              <div className="card-panel">
                <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>🛡️</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Immutable Scene Manifests
                </h3>
                <p style={{ fontSize: "0.95rem", color: "var(--pearl-muted)", lineHeight: 1.6 }}>
                  Scenes are compiled into immutable, schema-validated public snapshots.
                  Visitors never query internal administrative tables or execute untrusted code.
                </p>
              </div>

              <div className="card-panel">
                <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>⚡</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Adaptive Quality Management
                </h3>
                <p style={{ fontSize: "0.95rem", color: "var(--pearl-muted)", lineHeight: 1.6 }}>
                  Dynamic resolution scaling, capped DPR, and selective post-processing
                  ensure smooth frame rates across high-end desktop GPUs and mid-range mobile phones.
                </p>
              </div>

              <div className="card-panel">
                <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>♿</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Progressive Accessibility
                </h3>
                <p style={{ fontSize: "0.95rem", color: "var(--pearl-muted)", lineHeight: 1.6 }}>
                  WCAG 2.2 AA compliant HTML fallbacks, keyboard focus traps handling, and
                  strict adherence to OS reduced-motion preferences protect every user journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section
          style={{
            padding: "5rem 0",
            borderTop: "1px solid var(--border-subtle)",
            background: "linear-gradient(180deg, var(--void) 0%, var(--slate-dark) 100%)",
            textAlign: "center",
          }}
        >
          <div className="container" style={{ maxWidth: "700px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
              Experience RealmCanvas Today
            </h2>
            <p style={{ color: "var(--pearl-muted)", marginBottom: "2rem", fontSize: "1.05rem" }}>
              Preview the Celestial Pavilion interactive prototype or inspect our accessible 2D catalog.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/showroom/celestial-pavilion" className="btn btn-primary">
                Launch 3D Showroom
              </Link>
              <Link href="/catalog" className="btn btn-secondary">
                View 2D Catalog
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
