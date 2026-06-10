import type { Metadata, ResolvingMetadata } from "next";
import { NAVIGATION } from "@/lib/constants";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.characters, parent, locale);
}

export default async function CharactersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen text-parch">
      <SiteHeader active={NAVIGATION.characters} />
      <main className="container mx-auto px-3 md:px-6 py-5 md:py-10">{children}</main>
      <SiteFooter active={NAVIGATION.characters} />
    </div>
  );
}
