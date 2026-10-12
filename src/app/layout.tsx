import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "RealmCanvas | Commercial Immersive 3D Showroom Platform",
  description:
    "Browser-based platform for premium, interactive 3D commercial showrooms. Explore high-fidelity digital pavilions and products.",
};

export const viewport: Viewport = {
  themeColor: "#080E1C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
