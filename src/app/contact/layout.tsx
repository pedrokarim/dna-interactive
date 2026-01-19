import type { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  {}: {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  return generatePageMetadata(pageMetadata.contact, parent);
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}