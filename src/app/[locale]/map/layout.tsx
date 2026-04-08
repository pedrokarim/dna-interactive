import { Suspense } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import StructuredData from "@/components/StructuredData";
import Loading from "@/components/Loading";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  {}: {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  return generatePageMetadata(pageMetadata.map, parent);
}

export default async function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tMap = await getTranslations('map');

  return (
    <>
      <StructuredData type="map" />
      <Suspense fallback={<Loading mode="box" message={tMap('loadingMap')} size={48} />}>
        {children}
      </Suspense>
    </>
  );
}
