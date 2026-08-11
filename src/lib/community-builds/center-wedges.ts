/**
 * Centres d'affinité autorisés (Quetzalcoatl / Feathered Serpent).
 *
 * Il existe **deux tiers de centres**, et les deux sont légitimes :
 *
 * - **3★ génériques** (`mods-315xx`) : sans élément, accessibles tôt. Ce sont
 *   ceux que les guides recommandent sur les builds de progression.
 * - **4★/5★ élémentaires** : chaque élément expose **exactement deux** centres,
 *   un par polarité — d'où 24 IDs et non 20. Les variantes FR « Pouvoir »
 *   (EN « Spectrum ») de Fire et Thunder en font partie au même titre que les
 *   autres ; les avoir omises faisait refuser des builds légitimes.
 *
 *   Dark    : Éternité (41715/51715) · Vigueur  (41716/51716)
 *   Water   : Éveil    (41725/51725) · Éternité (41726/51726)
 *   Fire    : Décision (41735/51735) · Pouvoir  (41736/51736)
 *   Thunder : Pouvoir  (41745/51745) · Décision (41746/51746)
 *   Wind    : Ténacité (41755/51755) · Éternité (41756/51756)
 *   Light   : Vigueur  (41765/51765) · Décision (41766/51766)
 *
 * ⚠ Les 3★ n'ont aucun élément : l'icône du centre ne doit donc pas en déduire
 * une teinte élémentaire (cf. `centerWedgeElement`), sinon on retombe sur le
 * « centre lumineux sur le mauvais personnage ».
 */
export const CENTER_DEMON_WEDGE_ITEM_IDS = new Set([
  // 3★ génériques (sans élément) — builds de progression
  "mods-31502", // Helido / Vrille
  "mods-31512", // Prance / Essor
  "mods-31513", // Blastwave / Tumulte
  "mods-31521", // Recovery / Guérison
  "mods-31522", // Cutoff / Rupture
  "mods-31523", // Unyielding / Inflexible
  "mods-31524", // Vigilant / Vigilance
  "mods-31525", // Rescue / Soutien
  "mods-31526", // Steadfast / Roc
  "mods-31531", // Sidestep / Esquive
  "mods-31532", // Ignite / Ignition
  // 4★ / 5★ élémentaires
  "mods-41715",
  "mods-41716",
  "mods-41725",
  "mods-41726",
  "mods-41735",
  "mods-41736",
  "mods-41745",
  "mods-41746",
  "mods-41755",
  "mods-41756",
  "mods-41765",
  "mods-41766",
  "mods-51715",
  "mods-51716",
  "mods-51725",
  "mods-51726",
  "mods-51735",
  "mods-51736",
  "mods-51745",
  "mods-51746",
  "mods-51755",
  "mods-51756",
  "mods-51765",
  "mods-51766",
]);

export function isCenterDemonWedgeItemId(itemId: string | null | undefined) {
  return typeof itemId === "string" && CENTER_DEMON_WEDGE_ITEM_IDS.has(itemId);
}
