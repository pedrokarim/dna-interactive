/**
 * Système de niveaux « Voyageur » — logique pure (aucune dépendance runtime).
 *
 * L'XP est DÉRIVÉE de l'état existant (builds publiés, likes reçus, vues, votes
 * donnés) : pas de table dédiée ni de backfill, toujours cohérent. Les sources
 * temporelles (connexion / série) viendront avec un vrai tracking.
 *
 * Courbe : XP pour passer du niveau n à n+1 = 100·n → montées rapides au début,
 * plus lentes ensuite. Récompense purement cosmétique (titre).
 */

/** Barèmes d'XP (réglables). */
export const XP = {
  perBuild: 40, // par build publié
  perLike: 8, // par like reçu
  perVoteGiven: 2, // par vote donné (engagement)
  viewMilestones: [
    { at: 100, xp: 15 },
    { at: 500, xp: 40 },
    { at: 1000, xp: 100 },
  ],
} as const;

/** Bonus d'XP cumulés aux paliers de vues d'un build. */
export function viewMilestoneXp(views: number): number {
  return XP.viewMilestones.reduce((sum, m) => sum + (views >= m.at ? m.xp : 0), 0);
}

export type Contributions = {
  buildsPublished: number;
  likesReceived: number;
  votesGiven: number;
  /** Vues par build (pour les paliers). */
  buildViews: number[];
};

export const EMPTY_CONTRIBUTIONS: Contributions = {
  buildsPublished: 0,
  likesReceived: 0,
  votesGiven: 0,
  buildViews: [],
};

/** XP totale dérivée des contributions. */
export function xpFromContributions(c: Contributions): number {
  const viewsXp = c.buildViews.reduce((sum, v) => sum + viewMilestoneXp(v), 0);
  return (
    c.buildsPublished * XP.perBuild +
    c.likesReceived * XP.perLike +
    c.votesGiven * XP.perVoteGiven +
    viewsXp
  );
}

/** XP cumulée nécessaire pour atteindre un niveau (L1 = 0). */
export function xpToReachLevel(level: number): number {
  const l = Math.max(1, level);
  return 50 * (l - 1) * l; // somme de 100·n pour n=1..L-1
}

/** Niveau atteint pour une XP donnée (≥ 1). */
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  // 50·(L-1)·L ≤ xp  ⇔  L ≤ (1 + √(1 + xp/12.5)) / 2
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2));
}

/** Paliers de titres (thématique abysse — renommables). */
export const TITLE_TIERS: { min: number; title: string }[] = [
  { min: 1, title: "Éclaireur" },
  { min: 10, title: "Voyageur" },
  { min: 20, title: "Chasseur d'Abysse" },
  { min: 30, title: "Gardien" },
  { min: 40, title: "Virtuose" },
  { min: 50, title: "Abyssonaute" },
];

export function titleForLevel(level: number): string {
  let title = TITLE_TIERS[0].title;
  for (const tier of TITLE_TIERS) if (level >= tier.min) title = tier.title;
  return title;
}

export type LevelProgress = {
  xp: number;
  level: number;
  title: string;
  /** XP acquise dans le niveau courant. */
  xpIntoLevel: number;
  /** XP totale du niveau courant (pour atteindre le suivant). */
  xpForLevelSpan: number;
  /** XP cumulée pour atteindre le niveau suivant. */
  nextLevelAtXp: number;
  /** Ratio 0..1 de progression vers le niveau suivant. */
  ratio: number;
};

/** Progression complète (niveau, titre, barre) pour une XP donnée. */
export function levelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = levelFromXp(safeXp);
  const current = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);
  const span = next - current;
  const into = safeXp - current;
  return {
    xp: safeXp,
    level,
    title: titleForLevel(level),
    xpIntoLevel: into,
    xpForLevelSpan: span,
    nextLevelAtXp: next,
    ratio: span > 0 ? Math.min(1, into / span) : 0,
  };
}
