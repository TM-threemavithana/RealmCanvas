import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

interface ShowroomPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ShowroomPageProps): Promise<Metadata> {
  const { slug } = await params;
  const formattedTitle = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${formattedTitle} Showroom | RealmCanvas`,
    description: `Immersive 3D interactive showroom for ${formattedTitle}. Powered by Three.js and React Three Fiber.`,
  };
}

export default async function ShowroomPage({ params }: ShowroomPageProps) {
  const { slug } = await params;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main id="main-content" style={{ flex: 1, padding: "4rem 0" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
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
              ← Back to Portal Home
            </Link>
          </nav>

          <div className="card-panel" style={{ padding: "3rem 2rem", textAlign: "center" }}>
            <div style={{ display: "inline-flex", marginBottom: "1.25rem" }}>
              <span className="badge badge-cyan">
                <span className="status-dot" />
                Template: celestial-tech-pavilion-v1
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
              }}
            >
              Showroom: <span style={{ color: "var(--aether-cyan)" }}>{slug}</span>
            </h1>

            <p
              style={{
                fontSize: "1.05rem",
                color: "var(--pearl-muted)",
                lineHeight: 1.6,
                maxWidth: "600px",
                margin: "0 auto 2.5rem",
              }}
            >
              Welcome to the showroom staging area. In Milestones RC-003 and RC-004,
              this route hosts the client-side capability probe and React Three Fiber
              rendering canvas.
            </p>

            {/* Experience Controls Preview (FR-001 / FR-020) */}
            <div
              className="glass-panel"
              style={{
                padding: "1.5rem",
                marginBottom: "2.5rem",
                textAlign: "left",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1.25rem",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--aether-cyan)", fontWeight: 600 }}>
                  Graphics Quality Tier
                </span>
                <p style={{ fontWeight: 600, color: "var(--pearl)", marginTop: "0.25rem" }}>
                  Adaptive (Medium Baseline)
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--iris)", fontWeight: 600 }}>
                  Audio Experience
                </span>
                <p style={{ fontWeight: 600, color: "var(--pearl)", marginTop: "0.25rem" }}>
                  Muted (User Opt-in Only)
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--dawn-gold)", fontWeight: 600 }}>
                  Motion Mode
                </span>
                <p style={{ fontWeight: 600, color: "var(--pearl)", marginTop: "0.25rem" }}>
                  System Standard
                </p>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                style={{ minWidth: "220px" }}
              >
                <span>Launch 3D Canvas (RC-004)</span>
              </button>
              <Link
                href="/catalog"
                className="btn btn-secondary"
                style={{ minWidth: "200px" }}
              >
                Switch to 2D Catalog
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
