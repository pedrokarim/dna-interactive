/**
 * Stat d'une priorité de build vers sa clé de libellé (namespace `characterDetail`).
 *
 * Sert à l'onglet Build de la fiche et à la fenêtre « Build rapide ». Les builds
 * curés ne parlent pas tous pareil : en plus des clés du builder (`STAT_KEYS`),
 * il y a celles des attributs du jeu (`StrongValue`) et des synonymes
 * (`Morale`, `Resolve`, `CritDamage`…). Sans alias, ces clés s'affichent brutes,
 * en anglais, dans toutes les langues.
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
