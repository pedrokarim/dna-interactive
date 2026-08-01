/**
 * Les autres projets de l'écosystème Ascencia, pour la section de promotion
 * croisée présente en bas de la page « À propos ».
 *
 * Source de vérité : la section « Nos Projets » de https://ascencia.re. Les
 * logos pointent chaque projet chez lui, donc un changement de logo se propage
 * sans rien redéployer ici (les domaines sont autorisés dans `next.config.ts`,
 * `images.remotePatterns`).
 *
 * Miroir de `src/lib/other-projects.ts` de Just Tools : chaque site de
 * l'écosystème reprend la même liste en retirant sa propre entrée. DNA
 * Interactive est donc absent d'ici, et Just Tools présent — c'est exactement
 * l'inverse de la liste côté Just Tools.
 *
 * Seules les données structurelles vivent ici. Les libellés (description,
 * étiquette) sont dans les fichiers de langue sous `otherProjects.items.<id>`,
 * le site étant servi en 7 locales — contrairement à Just Tools, monolingue,
 * qui peut se permettre de les stocker avec la donnée.
 */

export interface OtherProject {
  /** Doit correspondre à la clé sous `otherProjects.items` dans les messages. */
  id: string;
  /** Nom propre : identique dans toutes les langues, donc pas traduit. */
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

/** Le hub qui recense tous les projets de l'écosystème. */
export const ECOSYSTEM_HUB = {
  name: "Ascencia",
  url: "https://ascencia.re/",
};
