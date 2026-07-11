import type { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import { AppShell } from "@/components/site/AppShell";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(pageMetadata.items, parent, locale);
}

export default async function ItemsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell breadcrumb="//GEAR.DATABASE">
      <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </AppShell>
  );
}
