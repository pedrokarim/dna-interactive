import { locales, type Locale } from "@/i18n/config";
import { getPlannerDataset } from "@/lib/planner/dataset";

/**
 * Données du planificateur pour une langue. Statique (régénérée au build) :
 * la page reste légère et le navigateur garde ce fichier en cache d'une visite
 * à l'autre, au lieu de le recevoir dans chaque page.
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
