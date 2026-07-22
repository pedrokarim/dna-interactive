import type { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";

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
    <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
  );
}
