import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import CapabilityGuard from "@/experience/canvas/CapabilityGuard";

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
        <div className="container" style={{ maxWidth: "840px" }}>
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

          {/* Mount WebGL 2 Capability Probe & Fallback Guard */}
          <CapabilityGuard slug={slug} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
