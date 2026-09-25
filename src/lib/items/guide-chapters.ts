// ---------------------------------------------------------------------------
// Découpage des guides en chapitres.
//
// Un guide tenait jusqu'ici sur une seule page : celui des Géniemons faisait
// 7 000 pixels de haut, soit sept écrans de défilement. On les sert désormais
// comme une documentation — un sommaire, puis un chapitre par page, chacun
// renvoyant au suivant.
//
// Le registre ci-dessous est la seule source de vérité : l'ordre des chapitres,
// les adresses et le voisinage en découlent. Ajouter un chapitre consiste à
// ajouter une entrée, puis à la traiter dans le composant du guide concerné.
// ---------------------------------------------------------------------------

export interface GuideChapter {
  /** Segment d'adresse, en anglais comme tout identifiant. */
  slug: string;
  /** Clé du titre, dans l'espace de noms du guide. */
  titleKey: string;
  /** Clé du résumé affiché sur la carte du sommaire. */
  blurbKey: string;
}

export interface GuideOutline {
  /** Espace de noms `next-intl` où vivent les textes du guide. */
  namespace: string;
  /** Couleur d'accent, alignée sur la catégorie. */
  accent: string;
  chapters: GuideChapter[];
}

/** Raccourci : un chapitre dont les clés suivent la convention habituelle. */
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
};

/** Les catégories dont le guide est découpé. Les autres gardent une page unique. */
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

/**
 * Le chapitre précédent et le suivant. Les bords renvoient `null` plutôt qu'un
 * bouclage : une documentation ne tourne pas en rond, elle se termine.
 */
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
