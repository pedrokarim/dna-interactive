// ---------------------------------------------------------------------------
// Découpage des guides en chapitres.
//
// Avant, un guide tenait sur une seule page (7 000 px de haut pour celui des
// Géniemons, sept écrans à défiler). Maintenant c'est un sommaire, puis un
// chapitre par page avec un lien vers le suivant.
//
// Tout part du registre ci-dessous : ordre des chapitres, adresses, chapitres
// voisins. Pour ajouter un chapitre, on ajoute une entrée ici, puis on la gère
// dans le composant du guide.
// ---------------------------------------------------------------------------

export interface GuideChapter {
  /** Segment d'URL, en anglais comme tout identifiant. */
  slug: string;
  /** Clé du titre, dans l'espace de noms du guide. */
  titleKey: string;
  /** Clé du résumé affiché sur la carte du sommaire. */
  blurbKey: string;
}

export interface GuideOutline {
  /** Namespace `next-intl` des textes du guide. */
  namespace: string;
  /** Couleur d'accent, alignée sur la catégorie. */
  accent: string;
  /** Clé du libellé « Guide », qui n'a pas le même nom partout. */
  badgeKey?: string;
  /**
   * Clé de la description des métadonnées. Par défaut l'introduction, mais
   * celle des Demon Wedges contient une balise riche, illisible en texte brut.
   */
  descriptionKey?: string;
  chapters: GuideChapter[];
}

/** Chapitre dont les clés suivent la convention habituelle. */
function chapter(slug: string, titleKey: string): GuideChapter {
  return { slug, titleKey, blurbKey: `chapterBlurb_${slug}` };
}

const OUTLINES: Record<string, GuideOutline> = {
  genimons: {
    namespace: "genimonGuide",
    accent: "var(--color-anemo)",
    chapters: [
      chapter("raise", "raiseTitle"),
      chapter("passive", "passiveTitle"),
      chapter("traits", "traitsTitle"),
      chapter("training", "trainingTitle"),
      chapter("fusion", "fusionTitle"),
      chapter("shop", "shopTitle"),
      chapter("list", "listTitle"),
    ],
  },

  weapons: {
    namespace: "calamityGuide",
    accent: "var(--color-crimson-bright)",
    descriptionKey: "metaDescription",
    chapters: [
      chapter("rules", "rulesTitle"),
      chapter("proficiency", "proficiencyTitle"),
      chapter("obtain", "obtainTitle"),
      chapter("furnace", "furnaceTitle"),
      chapter("potential", "potentialTitle"),
      chapter("path", "pathTitle"),
      chapter("materials", "materialsTitle"),
      chapter("cost", "costTitle"),
    ],
  },

  mods: {
    namespace: "itemsAbout",
    accent: "var(--color-hydro)",
    badgeKey: "guideBadge",
    descriptionKey: "metaModsDescription",
    chapters: [
      chapter("structure", "structureTitle"),
      chapter("affinity", "affinityTitle"),
      // Niveaux et tolérance dans le même chapitre : l'un ne se comprend pas sans l'autre.
      chapter("numbers", "numbersTitle"),
      chapter("tracks", "trackTitle"),
      chapter("center", "centerTitle"),
      chapter("stacking", "stackTitle"),
      chapter("reading", "quickTitle"),
    ],
  },
};

/** Vrai si le guide de la catégorie est découpé. Les autres gardent une seule page. */
export function hasGuideOutline(categoryId: string): boolean {
  return categoryId in OUTLINES;
}

export function getGuideOutline(categoryId: string): GuideOutline | null {
  return OUTLINES[categoryId] ?? null;
}

export function getGuideChapter(categoryId: string, slug: string): GuideChapter | null {
  return OUTLINES[categoryId]?.chapters.find((c) => c.slug === slug) ?? null;
}

export interface ChapterNeighbours {
  previous: GuideChapter | null;
  next: GuideChapter | null;
  /** Rang du chapitre, à partir de 1, pour l'afficher au lecteur. */
  position: number;
  total: number;
}

/** Chapitre précédent et suivant. Pas de bouclage : aux bords, `null`. */
export function getChapterNeighbours(categoryId: string, slug: string): ChapterNeighbours | null {
  const outline = OUTLINES[categoryId];
  if (!outline) return null;
  const index = outline.chapters.findIndex((c) => c.slug === slug);
  if (index === -1) return null;
  return {
    previous: outline.chapters[index - 1] ?? null,
    next: outline.chapters[index + 1] ?? null,
    position: index + 1,
    total: outline.chapters.length,
  };
}

/** Toutes les paires (catégorie, chapitre), pour la génération statique. */
export function getAllGuideChapterParams(): { category: string; chapter: string }[] {
  return Object.entries(OUTLINES).flatMap(([category, outline]) =>
    outline.chapters.map((c) => ({ category, chapter: c.slug })),
  );
}
