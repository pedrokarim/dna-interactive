/**
 * Les autres projets Ascencia, pour la section en bas de la page « À propos ».
 *
 * La liste suit la section « Nos Projets » de https://ascencia.re. Les logos
 * sont chargés chez chaque projet : un nouveau logo apparaît sans redéployer
 * ici (domaines autorisés dans `images.remotePatterns` de `next.config.ts`).
 *
 * Même liste que `src/lib/other-projects.ts` de Just Tools : chaque site
 * reprend la liste sans sa propre entrée. Ici DNA Interactive manque et Just
 * Tools est présent, et l'inverse chez Just Tools.
 *
 * Ici, seulement la structure. Les textes (description, étiquette) sont dans
 * les fichiers de langue sous `otherProjects.items.<id>`, puisque le site a 7
 * locales. Just Tools, en une seule langue, les garde avec les données.
 */

export interface OtherProject {
  /** Doit correspondre à la clé sous `otherProjects.items` dans les messages. */
  id: string;
  /** Nom propre, le même dans toutes les langues. */
  name: string;
  url: string;
  /** URL absolue, servie par le projet lui-même. */
  logo: string;
  /** Met la carte en avant : badge « Nouveau » à la place de l'étiquette. */
  isNew?: boolean;
}

export const OTHER_PROJECTS: OtherProject[] = [
  {
    id: "sarutobi",
    name: "Sarutobi",
    url: "https://sarutobi.ascencia.re/",
    logo: "https://sarutobi.ascencia.re/icon.png",
    isNew: true,
  },
  {
    id: "watchme",
    name: "WatchMe",
    url: "https://watchme.ascencia.re/",
    logo: "https://watchme.ascencia.re/icons/icon-192.png",
  },
  {
    id: "mcinfo",
    name: "MCInfo",
    url: "https://mcinfo.ascencia.re/",
    logo: "https://mcinfo.ascencia.re/images/logo/logo-mark-v01.png",
  },
  {
    id: "cardmyanime",
    name: "CardMyAnime",
    url: "https://cma.ascencia.re/",
    logo: "https://cma.ascencia.re/images/cma-logo.png",
  },
  {
    id: "just-tools",
    name: "Just Tools",
    url: "https://just-tools.ascencia.re/",
    logo: "https://just-tools.ascencia.re/assets/images/icon-192.png",
  },
  {
    id: "sharex-manager",
    name: "ShareX Manager",
    url: "https://sxm.ascencia.re/",
    logo: "https://sxm.ascencia.re/images/logo-sxm-simple.png",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    url: "https://portfolio.ascencia.re/",
    logo: "https://portfolio.ascencia.re/img/logo.png",
  },
];

/** Le site qui liste tous les projets Ascencia. */
export const ECOSYSTEM_HUB = {
  name: "Ascencia",
  url: "https://ascencia.re/",
};
