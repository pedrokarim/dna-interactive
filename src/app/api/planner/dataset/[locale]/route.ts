import { locales, type Locale } from "@/i18n/config";
import { getPlannerDataset } from "@/lib/planner/dataset";

/**
 * Données du planificateur pour une langue, générées au build. Servies à part
 * pour alléger la page et pour que le navigateur les garde en cache d'une visite
 * à l'autre.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return new Response(null, { status: 404 });
  return Response.json(getPlannerDataset(locale));
}
