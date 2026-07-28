import type { Metadata, ResolvingMetadata } from "next";
import { generatePageMetadata, pageMetadata } from "@/lib/metadata";
import { RecaptchaProvider } from "@/components/RecaptchaProvider";

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
  // Le provider reCAPTCHA vit ici, pas à la racine : seul ce formulaire s'en
  // sert, donc le script Google (et son badge) ne se charge que sur cette route.
  return (
    <RecaptchaProvider>
      <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </RecaptchaProvider>
  );
}
