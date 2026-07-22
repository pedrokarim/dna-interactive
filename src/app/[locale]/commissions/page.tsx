import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import { CommissionsBoard } from "@/components/commissions/CommissionsBoard";
import { getRotationForDisplay } from "@/lib/commissions";
import { getAppSettings } from "@/lib/settings/db";

// Données vivantes : rendu à la demande, jamais prérendu en statique.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.commissions, parent, locale);
}

export default async function CommissionsPage() {
  const settings = await getAppSettings();
  if (!settings.commissionsVisible) notFound();
  const { state, meta, hasData } = await getRotationForDisplay();

  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <CommissionsBoard initialState={state} initialMeta={meta} hasData={hasData} />
    </div>
  );
}
