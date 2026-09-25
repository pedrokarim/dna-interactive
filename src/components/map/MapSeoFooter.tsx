"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getRegionSlug } from "@/lib/map/slugs";
import { NATIONS } from "@/lib/map/world";
import { useMapLabels } from "./useMapLabels";

/**
 * Présentation de la carte et liens vers les pages de région, en bas de la
 * liste défilante : aucune place fixe prise au panneau, mais présents dès le
 * premier rendu serveur. La vue plein écran n'a pas d'autre texte à offrir
 * aux moteurs, et les seize pages `/map/[region]` n'ont pas d'autre lien
 * depuis la carte.
 */
export function MapSeoFooter() {
  const t = useTranslations("map");
  const { name } = useMapLabels();
  return (
    <footer className="mt-2 border-t border-line/10 pt-3">
      <p className="font-sans text-[0.7rem] leading-relaxed text-muted-2">{t("pageIntro")}</p>
      <nav aria-label={t("regionGuides")} className="mt-3">
        <h2 className="font-caps text-[0.56rem] uppercase tracking-[0.2em] text-gold/70">{t("regionGuides")}</h2>
        <p className="mt-0.5 font-sans text-[0.68rem] text-muted-2">{t("regionGuidesLead")}</p>
        <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          {NATIONS.flatMap((n) => n.areas.flatMap((a) => a.maps)).map((m) => (
            <li key={m.id}>
              <Link href={`/map/${getRegionSlug(m.id)}`} className="font-sans text-[0.7rem] text-muted transition-colors hover:text-gold">
                {name(m.name)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
