import type { Metadata } from "next";
import StudioHeader from "@/components/studio/StudioHeader";
import StudioDashboard from "@/components/studio/StudioDashboard";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Merchant Studio | RealmCanvas",
  description:
    "Manage 3D showroom deployments, product placements, analytics, and customer inquiries with zero cross-tenant leakage.",
};

export default function StudioPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <StudioHeader
        organizationName="Acme Sound Labs"
        userDisplayName="Alice Owner"
        userRole="owner"
        showroomSlug="celestial-pavilion"
      />
      <StudioDashboard />
      <Footer />
    </div>
  );
}
