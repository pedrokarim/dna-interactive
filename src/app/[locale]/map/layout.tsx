import { Suspense } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import StructuredData from "@/components/StructuredData";
import Loading from "@/components/Loading";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  {}: {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  return generatePageMetadata(pageMetadata.map, parent);
}

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData type="map" />
      <Suspense fallback={<Loading mode="box" message="Chargement de la carte..." size={48} />}>
        {children}
      </Suspense>
    </>
  );
}
