import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import { getMapMetadata } from "@/lib/metadata";

// Métadonnées SEO pour la page map
export const metadata: Metadata = getMapMetadata();

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData type="map" />
      {children}
    </>
  );
}
