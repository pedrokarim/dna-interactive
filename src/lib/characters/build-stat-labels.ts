/**
 * Statistique d'une priorité de build → clé de libellé (namespace `characterDetail`).
 *
 * Partagée par l'onglet Build de la fiche et la fenêtre « Build rapide ». Les
 * builds curés n'emploient pas tous le même vocabulaire : à côté des clés du
 * builder (`STAT_KEYS`), on trouve celles des attributs du jeu (`StrongValue`)
 * et quelques synonymes (`Morale`, `Resolve`, `CritDamage`…). Sans alias, ces
 * clés s'affichaient telles quelles, en anglais, dans toutes les langues.
 */
export const BUILD_STAT_LABEL_KEYS: Record<string, string> = {
  ATK: "statATK",
  ATK_Fire: "statATKFire",
  ATK_Water: "statATKWater",
  ATK_Thunder: "statATKThunder",
  ATK_Wind: "statATKWind",
  ATK_Light: "statATKLight",
  ATK_Dark: "statATKDark",
  DEF: "statDEF",
  HP: "statHP",
  MaxHp: "statMaxHp",
  MaxES: "statMaxES",
  MaxSp: "statMaxSp",
  SkillIntensity: "statSkillIntensity",
  SkillEfficiency: "statSkillEfficiency",
  SkillSustain: "statSkillSustain",
  SkillRange: "statSkillRange",
  SkillSpeed: "statSkillSpeed",
  SkillDmg: "statSkillDmg",
  SkillDamage: "statSkillDmg",
  CritRate: "statWeaponCRI",
  CritDmg: "statCritDmg",
  CritDamage: "statCritDmg",
  // Morale = Vigueur, Resolve = Ténacité : les noms du jeu (`StrongValue`, `EnmityValue`).
  StrongValue: "statStrongValue",
  Morale: "statStrongValue",
  EnmityValue: "statEnmityValue",
  Resolve: "statEnmityValue",
  PEN: "statDamageRateAlmighty",
  Penetration: "statDamageRateAlmighty",
  ElementDmg: "statElementDmg",
  UmbroDamage: "statElementDmg",
};
