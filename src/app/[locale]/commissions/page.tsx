import type { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import { AppShell } from "@/components/site/AppShell";
import { CommissionsBoard } from "@/components/commissions/CommissionsBoard";
import { getRotationForDisplay } from "@/lib/commissions";

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
  const { state, meta, hasData } = await getRotationForDisplay();

  return (
    <AppShell breadcrumb="//COVERT.OPS.LIVE">
      <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <CommissionsBoard initialState={state} initialMeta={meta} hasData={hasData} />
      </div>
    </AppShell>
  );
}
