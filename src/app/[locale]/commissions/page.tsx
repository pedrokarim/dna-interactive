import type { Metadata, ResolvingMetadata } from "next";
import { NAVIGATION } from "@/lib/constants";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
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
    <div className="min-h-screen bg-linear-to-br from-ink via-panel to-ink text-parch">
      <SiteHeader active={NAVIGATION.commissions} />
      <main className="container mx-auto px-4 py-12 md:px-6">
        <CommissionsBoard initialState={state} initialMeta={meta} hasData={hasData} />
      </main>
      <SiteFooter active={NAVIGATION.commissions} />
    </div>
  );
}
