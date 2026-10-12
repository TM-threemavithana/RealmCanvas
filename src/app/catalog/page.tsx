import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Product Catalog (Accessible 2D Fallback) | RealmCanvas",
  description:
    "Explore products, technical specifications, and purchase options with zero WebGL requirements. Fully accessible screen-reader and keyboard compatible catalog.",
};

export default function CatalogPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main id="main-content" style={{ flex: 1, padding: "4rem 0" }}>
        <div className="container">
          {/* Breadcrumb & Heading */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: "1.5rem" }}>
            <Link
              href="/"
              style={{
                fontSize: "0.85rem",
                color: "var(--aether-cyan)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              ← Back to Overview
            </Link>
          </nav>

          <div style={{ maxWidth: "800px", marginBottom: "3rem" }}>
            <span className="badge badge-gold" style={{ marginBottom: "0.75rem" }}>
              Accessible Fallback Catalog · FR-011
            </span>
            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
              }}
            >
              Hardware Product Catalog
            </h1>
            <p style={{ color: "var(--pearl-muted)", fontSize: "1.05rem", lineHeight: 1.6 }}>
              This 2D catalog ensures complete access to specifications, finishes, and
              commercial inquiries without requiring WebGL 2 hardware or high-bandwidth 3D asset downloads.
            </p>
          </div>

          {/* Catalog Grid */}
          <section aria-label="Published Products">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "2rem",
              }}
            >
              {/* Demo Product Card */}
              <article
                className="card-panel"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      height: "220px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--slate-dark)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.5rem",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        border: "3px solid var(--aether-cyan)",
                        boxShadow: "0 0 24px var(--aether-cyan-glow)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--pearl)",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      3D Model
                    </div>
                    <span
                      className="badge badge-cyan"
                      style={{
                        position: "absolute",
                        top: "0.75rem",
                        right: "0.75rem",
                      }}
                    >
                      Hero Slot 01
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                      Aurora Precision Headphones
                    </h2>
                    <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--dawn-gold)" }}>
                      Flagship SKU
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.92rem",
                      color: "var(--pearl-muted)",
                      lineHeight: 1.6,
                      marginBottom: "1.5rem",
                    }}
                  >
                    Studio-grade wireless acoustics engineered with acoustic composite
                    enclosures, titanium drivers, and spatial audio calibration.
                  </p>

                  {/* Specifications Table */}
                  <div style={{ marginBottom: "1.5rem" }}>
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
                      Technical Specifications
                    </h3>
                    <dl
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.5rem 1rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      <dt style={{ color: "var(--pearl-dim)" }}>Drivers:</dt>
                      <dd style={{ color: "var(--pearl)", fontWeight: 500 }}>45mm Custom Titanium</dd>
                      <dt style={{ color: "var(--pearl-dim)" }}>Frequency Range:</dt>
                      <dd style={{ color: "var(--pearl)", fontWeight: 500 }}>10 Hz - 40,000 Hz</dd>
                      <dt style={{ color: "var(--pearl-dim)" }}>Battery Life:</dt>
                      <dd style={{ color: "var(--pearl)", fontWeight: 500 }}>38 Hours Active ANC</dd>
                      <dt style={{ color: "var(--pearl-dim)" }}>Connectivity:</dt>
                      <dd style={{ color: "var(--pearl)", fontWeight: 500 }}>Bluetooth 5.4 / Lossless USB-C</dd>
                    </dl>
                  </div>

                  {/* Available Finishes */}
                  <div style={{ marginBottom: "1.75rem" }}>
                    <h3
                      style={{
                        fontSize: "0.8rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--iris)",
                        marginBottom: "0.5rem",
                        fontWeight: 600,
                      }}
                    >
                      Available Finishes
                    </h3>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span className="badge badge-iris">Midnight Obsidian</span>
                      <span className="badge">Pearl Titanium</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <Link
                    href="/showroom/celestial-pavilion"
                    className="btn btn-primary"
                    style={{ flex: 1, minWidth: "160px" }}
                  >
                    View in 3D Showroom
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, minWidth: "160px" }}
                    onClick={undefined}
                  >
                    Inquire / Request Quote
                  </button>
                </div>
              </article>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
