import type { ElementKey } from "@/components/dna/elements";
import type { Locale } from "@/i18n/config";

/**
 * Personnages annoncés mais pas encore extractibles.
 *
 * Le jeu déclare certains personnages plusieurs versions à l'avance : leur fiche
 * technique est complète dans `Char.lua` et `BattleChar.lua` bien avant que les
 * textures arrivent. L'extraction les écarte exprès (« aucun portrait livré = non
 * sorti », cf. `research_data/extract-characters.ts`), sinon la liste aurait des
 * cartes cassées.
 *
 * Ici on tient à la main une fiche « à venir » qui n'affiche que ce qui est
 * établi. Elle vit sur la même URL que la future fiche (`/characters/<slug>`),
 * branchée dans la route dynamique juste avant le `notFound()`. Quand le perso
 * sort et arrive dans `characters.json`, la vraie fiche passe devant toute seule :
 * il ne reste qu'à supprimer l'entrée ci-dessous.
 *
 * Trois niveaux de fiabilité, jamais mélangés à l'affichage :
 *   `dataMined` : lu dans les fichiers du jeu, donc sûr
 *   `announced` : annoncé officiellement (date, bannière, doubleurs)
 *   `community` : connu de la communauté, à confirmer à la sortie
 */

export type UpcomingConfidence = "dataMined" | "announced" | "community";

export type UpcomingFact = {
  label: string;
  value: string;
  confidence: UpcomingConfidence;
};

export type UpcomingSkill = {
  name: string;
  /** Type de compétence tel que le jeu le nomme (Skill1, Skill2, Passive, Ultra…). */
  slot: string;
  description: string;
  confidence: UpcomingConfidence;
};

/**
 * Tout ce qui se lit sur la fiche, dans une langue. Les noms propres (nom,
 * titre, faction) et l'histoire viennent du jeu dans chaque langue ; sans
 * texte du jeu dans une langue, on reprend le nom anglais et on traduit le
 * reste.
 */
export type UpcomingText = {
  name: string;
  subtitle: string;
  campLabel: string;
  lore: string[];
  /** D'où vient le dossier ; par défaut, l'encyclopédie du jeu. */
  loreSource?: string;
  facts: UpcomingFact[];
  /** Sources vérifiables, affichées telles quelles en bas de fiche. */
  sources: { label: string; url?: string }[];
  skills: UpcomingSkill[];
};

export type UpcomingCharacter = {
  /** Slug d'URL : doit être celui que donnera `getCharacterSlug` à la sortie. */
  slug: string;
  /** Nom latin, pour les mots-clés et le texte de secours. */
  name: string;
  /** Nom interne dans les fichiers du jeu (`GUIPathVariable`). */
  internalName: string;
  charId: number;
  element: ElementKey;
  rarity: number;
  maxLevel: number;
  campKey: string;
  /**
   * Une entrée par langue du site, toutes obligatoires : une fiche qui n'existe
   * qu'en français ne passe pas le typecheck.
   */
  text: Record<Locale, UpcomingText>;
  /**
   * Armes, rôle et stats conseillées déclarés dans `BattleChar`. Vides tant que
   * le jeu n'y met que des valeurs copiées d'un autre perso : la fiche masque
   * alors ces blocs.
   */
  weaponTags: string[];
  positioning: string[];
  recommendAttr: string[];
  /**
   * Statistiques de base niveau 1 et courbes de croissance (`ATKS`, `DEFS`…).
   * Absentes tant que les fichiers du jeu ne portent que des valeurs provisoires.
   */
  baseStats?: { atk: number; def: number; maxHp: number; maxEs: number; maxSp: number };
  growthCurves?: { atk: string; def: string; maxHp: string; maxEs: string };
  /**
   * Visuels officiels recadrés (`public/assets/upcoming/`) quand le studio en a
   * publié : portrait 3:4 pour la fiche, vignette carrée pour la bande d'accueil.
   * Sans eux, on affiche le cartouche avec l'initiale gravée.
   */
  portrait?: string;
  avatar?: string;
  /**
   * Annoncé officiellement comme prochaine récompense du théâtre immersif, sans
   * dates. Le suivi `/theatre` l'affiche dans la case « Prochaine » tant que la
   * vraie rotation n'est pas dans les données du jeu.
   */
  theatreNext?: boolean;
  /** Version de sortie telle que déclarée par le jeu (`ReleaseVersion` / 100). */
  version: string;
  versionName: string;
  /** Date de sortie ISO `AAAA-MM-JJ`, si officiellement annoncée. */
  releaseDate?: string;
  bannerName?: string;
  /** Nombre d'apparences déclarées par le jeu, absent tant qu'il n'en déclare pas. */
  skinCount?: number;
  skinNames?: string[];
  voiceActorEn?: string;
  /** Noms des objets d'ascension, absents tant que le jeu ne les a pas traduits. */
  ascensionItems?: { thought: string; sigil: string };
  /** Identifiants des compétences déclarées dans `BattleChar.SkillList`. */
  skillIds: number[];
};

/** Bande-annonce officielle de la 1.8, d'où viennent la date, l'obtention et les visuels. */
const SRC_V18_PV = "https://x.com/DNAbyss_EN/status/2123597203490935100";

/** Les faits annoncés par le PV, mêmes valeurs dans toutes les langues sauf l'obtention. */
function katyaFacts(labels: [string, string, string, string], obtain: string): UpcomingFact[] {
  return [
    { label: labels[0], value: obtain, confidence: "announced" },
    { label: labels[1], value: "The Genius's Rhapsody", confidence: "announced" },
    { label: labels[2], value: "Flame Within Iron", confidence: "announced" },
    { label: labels[3], value: "Count Dracupurr", confidence: "announced" },
  ];
}

// Vide entre deux annonces, c'est normal. Falsi y était jusqu'à la 1.6, Rhythm:
// Flamewrought jusqu'à la 1.7, quand le jeu a livré leur nom et leurs portraits ;
// la vraie fiche a alors pris le relais sur la même URL.
//
// Katya : son `BattleChar` est une ébauche. Stats identiques à celles de Margie
// (3301) et armes Claymore + Crossbow, donc ni l'un ni l'autre n'est repris ici.
// Son histoire est l'encyclopédie du jeu (`WikiText_2010150x`) dans chaque
// langue ; le texte allemand du jeu s'arrête au 2e paragraphe, la suite est
// traduite de l'anglais. Le `{nickname2}` du jeu (le nom du protagoniste) est
// remplacé par son surnom, le Faucheur Pâle.
export const UPCOMING_CHARACTERS: UpcomingCharacter[] = [
  {
    slug: "katya",
    name: "Katya",
    internalName: "Kajia",
    charId: 3203,
    element: "Fire",
    rarity: 5,
    maxLevel: 80,
    campKey: "Tongmeng",
    weaponTags: [],
    positioning: [],
    recommendAttr: [],
    portrait: "/assets/upcoming/katya-portrait.webp",
    avatar: "/assets/upcoming/katya-avatar.webp",
    theatreNext: true,
    version: "1.8",
    versionName: "Where the Whistle Calls",
    releaseDate: "2026-12-01",
    bannerName: "Frightful Grins",
    skinNames: ["Darling Disaster"],
    voiceActorEn: "Holly Earl",
    skillIds: [320301, 320311, 320302, 320303],
    text: {
      fr: {
        name: "Katya",
        subtitle: "Roi des Bêtes",
        campLabel: "Les Déchus",
        lore: [
          "Jeune Charon capturée par les Griffons durant l’opération de la Forteresse de Lonza. Elle affirme ne pas appartenir aux Déchus, prétendant avoir été enlevée par eux pour assister aux modifications mécaniques de la forteresse.",
          "De son nom complet Katya Oen. À l’origine simple civile, elle fut réquisitionnée de force par l’Empire pour effectuer des travaux de maintenance à la Forteresse de Lonza. Après avoir été secourue par les Déchus, elle choisit de les rejoindre. Elle participa à leur attaque contre la Légion Hyperboréenne, mais, contrairement aux autres, ne prit pas la fuite : elle se livra volontairement, dans l’unique but de rencontrer le Faucheur Pâle. Ses motivations demeurent inconnues.",
          "Réapparaît dans le Chapitre du Vagabond de la Nuit. À Givrelac, elle mit en œuvre un plan complexe en ordonnant à ses subordonnés de placer des bombes dans la Gare des Cent-Fleurs. Les forces de sécurité furent ainsi contraintes de concentrer leur attention sur la protection de la Corneille, laissant les trains ordinaires vulnérables, ce qui lui permit d’en détourner un.",
          "Elle occupe actuellement le titre de Roi des Bêtes parmi les Brumaires des Déchus. Le véritable objectif du détournement semble avoir été d’incendier un Arbre Céleste, mais ses motivations profondes demeurent inconnues.",
        ],
        facts: katyaFacts(
          ["Obtention", "Nouveau pistolet", "Nouveau lance-grenades", "Skin d’arme"],
          "Théâtre immersif (gratuit)",
        ),
        sources: [
          { label: "Bande-annonce officielle de la version 1.8 (20 novembre 2026)", url: SRC_V18_PV },
          { label: "Encyclopédie du jeu, version 1.7" },
        ],
        skills: [],
      },
      en: {
        name: "Katya",
        subtitle: "Beast-King of the Rabble",
        campLabel: "The Forsakens",
        lore: [
          "A young Charon lady captured by the Griffins during the Lonza Fortress Operation. She claims not to be a member of The Forsakens, insisting she was a civilian conscripted by the group to assist with mechanical modifications at the fortress.",
          "Full name: Katya Oen. Formerly a civilian, she was forcibly requisitioned by the Empire to perform maintenance duties at Lonza Fortress. She later defected to The Forsakens, who had rescued her during their occupation of the fortress. Katya participated in The Forsakens' assault on the Hyperborean Legion, but deliberately stayed behind when the others retreated, surrendering herself in order to meet the one known as the Pale Reaper. Her motives remain unclear.",
          "Reappears in Chapter Noctoyager. In Icelake, she set an elaborate plan in motion, ordering one of her subordinates to plant bombs in Bloomfield Station. This forced the station's security to focus on protecting the Jackdaw, leaving the ordinary trains lightly guarded and allowing her to hijack one of them.",
          "She currently serves as the Beast-King of the Hazering within the Forsakens. Her apparent objective in hijacking the train was to set a Heaventree ablaze, though her true motives remain unknown.",
        ],
        facts: katyaFacts(
          ["How to get", "New Pistol", "New Grenade Launcher", "Weapon skin"],
          "Immersive Theatre (free)",
        ),
        sources: [
          { label: "Official version 1.8 trailer (November 20, 2026)", url: SRC_V18_PV },
          { label: "In-game encyclopedia, version 1.7" },
        ],
        skills: [],
      },
      de: {
        name: "Katya",
        subtitle: "Beast-King of the Rabble",
        campLabel: "Die Verlassenen",
        lore: [
          "Eine junge Charon-Frau, die während der Operation in der Lonza-Festung von der Einheit Greif gefangen genommen wurde. Sie behauptet, kein Mitglied der Verlassenen zu sein, und beteuert, lediglich eine Zivilistin zu sein, die von der Gruppe zwangsrekrutiert wurde, um bei mechanischen Modifikationen innerhalb der Festung zu helfen.",
          "Vollständiger Name: Katya Oen. Ursprünglich eine Zivilistin, wurde sie vom Imperium zwangsrekrutiert, um Wartungsarbeiten in der Lonza-Festung auszuführen. Während der Besetzung der Festung wurde sie von den Verlassenen gerettet und schloss sich ihnen anschließend an. Katya beteiligte sich am Angriff der Verlassenen auf die Hyperboreische Legion, blieb jedoch absichtlich zurück, als sich die übrigen zurückzogen: Sie ergab sich freiwillig, um dem „bleichen Schnitter“ zu begegnen. Ihre Beweggründe sind bis heute unklar.",
          "Taucht im Kapitel „Noctoyager“ wieder auf. In Icelake setzte sie einen ausgeklügelten Plan in Gang: Sie ließ einen ihrer Untergebenen Bomben im Bahnhof Bloomfield legen. Die Sicherheitskräfte mussten sich daraufhin auf den Schutz der Jackdaw konzentrieren, die gewöhnlichen Züge blieben kaum bewacht, und sie konnte einen davon entführen.",
          "Derzeit ist sie der „Beast-King“ des Hazering innerhalb der Verlassenen. Ihr offensichtliches Ziel bei der Zugentführung war es, einen Heaventree in Brand zu setzen, doch ihre wahren Beweggründe sind unbekannt.",
        ],
        facts: katyaFacts(
          ["Erhalt", "Neue Pistole", "Neuer Granatwerfer", "Waffen-Skin"],
          "Immersives Theater (kostenlos)",
        ),
        sources: [
          { label: "Offizieller Trailer zu Version 1.8 (20. November 2026)", url: SRC_V18_PV },
          { label: "Enzyklopädie im Spiel, Version 1.7" },
        ],
        skills: [],
      },
      es: {
        name: "Katya",
        subtitle: "Rey de las bestias",
        campLabel: "Los Abandonados",
        lore: [
          "Joven Charon capturada por los Grifos durante la operación de la Fortaleza de Lonza. Afirma no pertenecer a los Abandonados, alegando haber sido secuestrada por ellos para asistir en las modificaciones mecánicas de la fortaleza.",
          "Su nombre completo es Katya Oen. Originalmente una simple civil, fue reclutada a la fuerza por el Imperio para realizar trabajos de mantenimiento en la Fortaleza de Lonza. Tras ser rescatada por los Abandonados, eligió unirse a ellos. Participó en su ataque contra la Legión Hiperbórea, pero, a diferencia de los demás, no huyó: se entregó voluntariamente, con el único objetivo de encontrarse con el «Segador Pálido». Sus motivaciones permanecen desconocidas.",
          "Reaparece en el Capítulo Noctoviajero. Elaboró un plan intrincado en Lago Glacial: ordenó a sus subordinados instalar bombas en la Estación Cien Flores para concentrar las fuerzas de seguridad en la protección de La Grajilla, dejando los trenes ordinarios sin protección, y finalmente secuestró uno de ellos.",
          "Actualmente ejerce como «Rey de las bestias» de Los Brumarios dentro de Los Abandonados. El verdadero objetivo del secuestro del tren parece ser incendiar el Árbol Celestial, aunque sus motivaciones más profundas siguen siendo desconocidas.",
        ],
        facts: katyaFacts(
          ["Obtención", "Nueva pistola", "Nuevo lanzagranadas", "Aspecto de arma"],
          "Teatro inmersivo (gratis)",
        ),
        sources: [
          { label: "Tráiler oficial de la versión 1.8 (20 de noviembre de 2026)", url: SRC_V18_PV },
          { label: "Enciclopedia del juego, versión 1.7" },
        ],
        skills: [],
      },
      jp: {
        name: "カーチャ",
        subtitle: "獣王",
        campLabel: "フォーセイクン同盟",
        lore: [
          "「鷲獅子」隊に捕らえられたカロンの少女。自らを「フォーセイクン同盟の一員ではない」と主張しており、同盟のメンバーに強制的に連行され、要塞の改造作業を手伝わされたただの町民だと語っている。",
          "本名カーチャ・イオン。本来はロンザ要塞での修繕作業に従事するため、帝国によって強制的に徴用された一般市民だった。その後、自身を救ってくれたフォーセイクン同盟への感謝と信念から同盟に加わり、ヒュペリア帝国を狙った襲撃計画にも深く関与するようになった。だが、作戦後に他の同盟メンバーが要塞から撤退するなか、彼女だけはあえてそこに残り、意図的に捕縛された。それは「蒼白の死神」と呼ばれる人物の姿をこの目で見るためだった。その理由については、いまだ明かされていない。",
          "「夜の航海」篇で再登場。アイスレイク城で複雑な計画を立て、配下にフラワー駅への爆弾設置を命じることで、防衛戦力をカラス号の護衛へ集中させ、通常列車の守りを手薄にし、最終的にその通常列車を乗っ取った。",
          "現在はフォーセイクン同盟・ミストヴェイルの「獣王」を務めている。列車を乗っ取った真の狙いは天上樹に火を放つことだったようだが、そのさらに奥にある動機は判然としない。",
        ],
        facts: katyaFacts(["入手方法", "新ピストル", "新ランチャー", "武器スキン"], "体験型劇場（無料）"),
        sources: [
          { label: "バージョン1.8公式PV（2026年11月20日）", url: SRC_V18_PV },
          { label: "ゲーム内図鑑（バージョン1.7）" },
        ],
        skills: [],
      },
      kr: {
        name: "카지아",
        subtitle: "야수왕",
        campLabel: "포세이큰 동맹",
        lore: [
          "'그리핀' 소대에 포로로 붙잡힌 카론 소녀. 자신은 포세이큰 동맹 소속이 아니라, 요새 개조 작업을 위해 동맹 구성원에게 강제로 동원된 평범한 마을 주민이라고 주장한다.",
          "본명은 카지아 어언이며, 원래는 제국에 의해 론샤 요새 수리 작업에 강제 동원된 평민이다. 이후 자신을 구해준 포세이큰 동맹에 자발적으로 합류하여, 휘페르보레아 군단을 상대로 한 공격 계획에 가담했다. 하지만 동맹원들과 함께 철수하지 않고 일부러 요새에 남아 포로가 된다. '창백한 사신'으로 불리는 인물을 직접 만나기 위해서인데, 그 이유는 알 수 없다.",
          "밤의 항해편에서 재등장. 아이스레이크 시티에서 복잡한 계획을 세워 부하들이 블룸필드역에 폭탄을 설치하도록 했다. 이로 인해 역의 방어력이 갈까마귀호 보호에 집중되면서 일반 열차의 경비가 허술해졌으며, 결국 일반 열차를 납치하는 데 성공했다.",
          "현재 포세이큰 동맹 미스트 새도우의 '야수왕'을 맡고 있다. 열차 납치의 진짜 목적은 천국의 나무에 불을 붙이기 위한 것으로 보이지만, 더 깊은 동기는 알 수 없다.",
        ],
        facts: katyaFacts(["획득 방법", "신규 권총", "신규 핸드 캐논", "무기 스킨"], "몰입형 연극 (무료)"),
        sources: [
          { label: "버전 1.8 공식 PV (2026년 11월 20일)", url: SRC_V18_PV },
          { label: "게임 내 도감 (버전 1.7)" },
        ],
        skills: [],
      },
      tc: {
        name: "卡嘉",
        subtitle: "牲王",
        campLabel: "神棄者同盟",
        lore: [
          "被「獅鷲」小隊隊員俘虜的卡戎少女，自稱並非神棄者同盟的成員，而是被同盟成員綁來協助改裝要塞的普通鎮民。",
          "全名卡嘉·厄恩，實際上是被帝國強行徵用來到龍莎要塞從事維修勞動的平民，後來選擇加入救下自己的神棄者同盟。參與策劃了針對海伯利亞軍團的襲擊，卻並未同其他成員一起撤離要塞，而是故意留下被俘，只為能夠親眼見到人稱「蒼白死神」的那個人，理由不明。",
          "於夜航篇再度登場。在冰湖城制定了繁複的計劃，安排下屬在百花車站安裝炸彈，使得車站的防衛力量集中保護寒鴉號，導致普通列車的防衛空虛，並最終劫持了普通列車。",
          "目前擔任神棄者同盟霧影會的「牲王」。劫持列車的真實目的似乎是希望點燃天之樹，更深層的動機則不得而知。",
        ],
        facts: katyaFacts(["獲取方式", "新手槍", "新榴炮", "武器外觀"], "沉浸式戲劇（免費）"),
        sources: [
          { label: "1.8 版本官方 PV（2026 年 11 月 20 日）", url: SRC_V18_PV },
          { label: "遊戲內圖鑑（1.7 版本）" },
        ],
        skills: [],
      },
    },
  },
];

const bySlug = new Map(UPCOMING_CHARACTERS.map((c) => [c.slug, c] as const));

/** Personnage annoncé pour la prochaine rotation du théâtre immersif, s'il y en a un. */
export const ANNOUNCED_THEATRE_NEXT: UpcomingCharacter | null = UPCOMING_CHARACTERS.find((c) => c.theatreNext) ?? null;

/** Les textes de la fiche dans la langue demandée ; l'anglais pour une langue inconnue. */
export function getUpcomingText(character: UpcomingCharacter, locale: string): UpcomingText {
  return character.text[locale as Locale] ?? character.text.en;
}

/** Personnage à venir correspondant au segment d'URL, ou `null`. */
export function getUpcomingCharacter(slug: string): UpcomingCharacter | null {
  return bySlug.get(slug.trim().toLowerCase()) ?? null;
}

/**
 * Statistique à un niveau donné : `base × multiplicateur de courbe`.
 * Même formule que les fiches complètes ; `MaxSp` n'a pas de courbe.
 */
export function statAtLevel(base: number, curve: Record<string, number> | undefined, level: number): number {
  const multiplier = curve?.[level] ?? 1;
  return Math.round(base * multiplier);
}
