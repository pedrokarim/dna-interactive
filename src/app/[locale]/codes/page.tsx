import { NAVIGATION } from "@/lib/constants";
import CodesList from "@/components/CodesList";
import type { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.codes, parent, locale);
}

export default async function CodesPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-ink via-panel to-ink text-parch">
      <SiteHeader active={NAVIGATION.codes} />
      <main className="container mx-auto px-4 py-12 md:px-6">
        <CodesList />
      </main>
      <SiteFooter active={NAVIGATION.codes} />
    </div>
  );
}
