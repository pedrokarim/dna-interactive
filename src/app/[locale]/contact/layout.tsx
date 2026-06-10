import type { Metadata, ResolvingMetadata } from "next";
import { NAVIGATION } from "@/lib/constants";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.contact, parent, locale);
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-ink via-panel to-ink text-parch">
      <SiteHeader active={NAVIGATION.contact} />
      <main className="container mx-auto px-4 py-12 md:px-6 md:py-20">{children}</main>
      <SiteFooter active={NAVIGATION.contact} />
    </div>
  );
}