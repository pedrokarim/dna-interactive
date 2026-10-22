# Document de cadrage – Planificateur de farm

**Statut :** v1 implémentée (phases P0 à P4), bêta – état réel en section 12
**Date :** 2026-10-22
**Décision attendue :** trancher les points restants de la section 11 (à vérifier en jeu)

---

## 1. Objectif

Le joueur choisit **ce qu’il veut monter** (un personnage, une arme, un Demon
Wedge, ou un build entier) et **jusqu’où**. Le site lui répond par une liste :

1. **ce qu’il faut** au total (matériaux, crédits, monnaie de mod, XP) ;
2. **ce qu’il lui manque**, une fois déduit ce qu’il possède déjà ;
3. **où l’obtenir**, regroupé par activité pour farmer plusieurs matériaux d’un coup.

Trois exigences posées dès le départ :

- **Personnages, armes et Demon Wedges** sont tous planifiables.
- **Le point d’entrée naturel est le build** : « je veux jouer ce build » doit
  produire tout le plan (perso, armes, wedges et leurs copies) en un clic.
- **Un planificateur par utilisateur**, qui s’ajuste à ce qui lui manque :
  il saisit son stock, coche ses étapes, et la liste se recalcule.

Hors périmètre v1 : Géniemons (montée et traits), consonances, cosmétiques,
taux de drop chiffrés (voir phase 5).

---

## 2. Ce que le jeu dit vraiment (données vérifiées)

Avant toute logique, l’inventaire des coûts **tels que le jeu les définit**.
Toutes les tables sont dans `research_data/Datas/<Table>_decompiled.lua`.
Le site n’en exploite aujourd’hui qu’une petite partie.

### 2.1 Personnages

| Étape | Table | Structure | Sur le site ? |
|---|---|---|---|
| XP de niveau (1 → 80) | `LevelUp` | `CharLevelMaxExp` par niveau, `CashToExp = 0.2` | non (seules les courbes de stats) |
| Objets d’XP | `Resource` 2011 à 2014 | `AddCharExpItem`, 500 / 2 000 / 8 000 / 20 000 XP | oui (catalogue) |
| Percées (6 paliers, niv. 20 → 70) | `CharBreak` | par perso : `CharBreakLevel`, `ItemId[]`, `ItemNum[]` | niveaux seuls, **pas les coûts** |
| Compétences | `SkillLevelUp` | par compétence et par niveau : `ItemId[]`, `ItemNum[]`, **`CharBreakLevel` requis** | non |
| Introns 1 à 6 | `CharCardLevelUp` | fragments du perso (`ResourceId1`, 30 par palier) | oui (`intronLevels`) |
| 7ᵉ intron | `UltraCharCardLevelUp` | 5 ressources | non |

Exemple réel (`CharBreak`, perso 1101, 1ʳᵉ percée) : crédits (101) + un
matériau de forge (20011) + un matériau de percée élémentaire (10021, famille
`BREAK_DARK`).

**Point clé pour la logique :** une compétence ne monte pas sans percée. Dans
`SkillLevelUp`, chaque niveau exige un nombre de percées (`CharBreakLevel`).
Viser une compétence au niveau 6 **implique** donc un minimum de percées, donc
un niveau de perso, donc de l’XP. Le planificateur doit en déduire les
prérequis lui-même (section 5.2).

### 2.2 Armes

| Étape | Table | Sur le site ? |
|---|---|---|
| XP de niveau (1 → 80) | `WeaponLevelUp` (`WeaponLevelMaxExp`) | non |
| Objets d’XP | `Resource` 2007 à 2010 (`AddWeaponExpItem`) | oui |
| Percées | `WeaponBreak` (même forme que `CharBreak`, matériaux `BREAK_MELEE` / `BREAK_RANGE`) | non |
| Fabrication | `Draft` : plan + pièces + crédits + durée | oui (`drafts.recipes.json`) |
| Affinage des armes de calamité | `HyperWeaponCardLevel` | oui (`calamity-forge-costs.json`) |
| Affinage des armes normales | `WeaponCardLevel` : `CardLevelMax = 5`, **aucun coût explicite** | à confirmer en jeu |

Une arme se **fabrique** : la recette demande le plan de forge (obtenu en
commission, `accessKeys: ["Walnut"]`), des pièces (« Brasier salvateur :
Verrou », « … : Armature », « … : Canon »), un support et des crédits
(`foundryCostByCoinType: { "101": 70000 }`). Ces pièces ont elles-mêmes leurs
sources, et certaines ressources ont leur propre recette : le coût d’une arme
est un **arbre**, pas une liste.

### 2.3 Demon Wedges

| Étape | Table | Sur le site ? |
|---|---|---|
| Rang (amélioration) | `ModLevel` : coût par niveau **et par rareté**, en crédits (101) et monnaie de mod (102) | non |
| Rang maximal | `Mod.MaxLevel` : 1, 3 ou 5 selon le wedge | brut, dans `fields` |
| Étoiles des wedges dorés | `CardLevelNeedModId` (le wedge lui-même), `CardLevelNeedNum = {1,1,2,2,3}`, plus la ressource 3016 | brut |
| Fabrication | `Draft` (214 recettes de wedges) | oui |
| Recyclage | `BreakDown` (rend de la monnaie de mod) | brut |

**Point clé :** un build peut demander **plusieurs exemplaires** du même wedge
(`char-aote` : `mods-51758` sur 5 emplacements). Le planificateur compte les
copies par `itemId`, jamais par emplacement, et multiplie le coût de rang par
le nombre de copies.

### 2.4 Sources d’obtention

| Source | Table | Ce qu’elle dit |
|---|---|---|
| Objet → donjons | `Resource2Dungeon` | pour chaque ressource, wedge, plan : la liste des donjons qui le donnent. **La source la plus utile.** |
| Catégorie de source | `Access` (87 clés) | `Dungeon`, `HardBoss`, `MonsterStrong`, `Walnut`, `Forging`, `Convert`, `Shop_*`, `Text_Collecting_<zone>`… |
| Donjons | `Dungeon`, `SelectDungeon`, `ModSelectDungeon`, `WeeklySelectDungeon` | récompenses, niveau, regroupement par chapitre (« Matériaux de percée »…) |
| Taux | `Reward`, `Drop` | poids et modes (`Fixed`, `Weight`, `Independent`, `Sequence`), récursifs |
| Conversion | `Convert` | 3 matériaux → 2 |
| Boutiques | `ShopItem` | prix, monnaie, limite d’achat, renouvellement |
| Récolte sur la carte | `src/lib/map/taxonomy.ts` | les types de points portent déjà des `resourceIds` |

Deux constats qui simplifient la logique :

- **Aucun coût d’entrée** dans les donjons (`DungeonCost = {0}` partout).
  L’énergie ne sert qu’au bonus de récompense. On ne peut donc pas raisonner
  en « énergie à dépenser » comme dans d’autres jeux ; on raisonne en
  **nombre de passages**.
- **Aucune rotation par jour de la semaine** dans les données. Pas de
  calendrier « lundi : tel donjon » à gérer.

---

## 3. Le principe en une phrase

> **Objectifs → besoins bruts → (fabrication éventuelle) → moins le stock →
> reste à farmer → regroupé par source.**

C’est une fonction **pure**, sans état ni accès réseau :

```ts
computePlan(goals, inventory, gameData) → PlanResult
```

Même entrée, même sortie. Elle tourne côté client (recalcul instantané à
chaque saisie) et peut être testée sans base ni navigateur. Le serveur ne fait
que stocker les objectifs et le stock.

---

## 4. Modèle de données

### 4.1 L’objectif (`PlannerGoal`)

Un objectif = **une cible**, son **état actuel** et son **état visé**.
L’écart entre les deux est ce qui coûte.

```ts
type PlannerGoal =
  | {
      kind: "character";
      id: string;               // uuid local
      characterId: string;      // "char-aote"
      element: string | null;   // persos multi-élément
      current: CharacterState;
      target: CharacterState;
    }
  | {
      kind: "weapon";
      id: string;
      itemId: string;           // "weapons-10402"
      owned: boolean;           // false → la fabrication entre dans le coût
      current: WeaponState;
      target: WeaponState;
    }
  | {
      kind: "demonWedge";
      id: string;
      itemId: string;           // "mods-51758"
      copies: number;           // exemplaires voulus (≥ 1)
      ownedCopies: number;      // exemplaires déjà possédés
      current: { rank: number; stars: number };
      target: { rank: number; stars: number };
    };

type CharacterState = {
  level: number;                    // 1 à 80
  breaks: number;                   // 0 à 6
  skills: [number, number, number]; // skillIndex 1 à 3
  intron: number;                   // 0 à 7
};

type WeaponState = { level: number; breaks: number; refinement: number };
```

Chaque objectif porte aussi :

- `priority` : son rang dans la liste, qui décide **à qui va le stock**
  quand deux objectifs se disputent le même matériau (section 5.4) ;
- `origin` : `{ type: "build", buildRef }` s’il vient d’un build, pour pouvoir
  le regrouper, le renommer et le retirer d’un bloc ;
- `paused` : un objectif en pause reste dans la liste mais ne compte plus.

### 4.2 Le stock (`PlannerInventory`)

```ts
type PlannerInventory = Record<MaterialKey, number>; // "res:20011" → quantité
```

Il ne contient **que les objets que le plan utilise**. Le joueur n’a jamais à
recopier tout son sac : la liste du plan est aussi le formulaire de saisie.

Le jeu ne laisse aucun inventaire lisible sur le disque (données reçues en
mémoire, cf. mémoire projet « Données de compte en local »), et la lecture
d’écran a été écartée. **La saisie reste donc manuelle**, et tout le travail
d’ergonomie (section 7) vise à la rendre rapide.

### 4.3 Le résultat (`PlanResult`)

```ts
type PlanResult = {
  lines: MaterialLine[];     // une ligne par matériau, agrégée
  currencies: { credits: number; modCoin: number };
  byGoal: Record<string, GoalBreakdown>; // détail et progression par objectif
  sources: SourceGroup[];    // « où farmer », trié par utilité
  warnings: PlanWarning[];   // prérequis ajoutés, données manquantes…
};

type MaterialLine = {
  resourceId: number;
  required: number;
  owned: number;      // stock alloué à ce plan
  missing: number;    // max(0, required - owned)
  craftable: boolean; // a une recette
  usedBy: string[];   // ids des objectifs concernés
};
```

---

## 5. Le calcul, étape par étape

### 5.1 Expansion : un objectif devient une liste de coûts

Pour chaque objectif, on parcourt les paliers entre `current` et `target` et on
additionne les coûts lus dans les tables :

| Cible | Paliers parcourus | Coût |
|---|---|---|
| Perso, niveau | `current.level` → `target.level` | somme des `CharLevelMaxExp` → XP |
| Perso, percées | `current.breaks + 1` → `target.breaks` | `CharBreak` |
| Perso, compétence *i* | `current.skills[i] + 1` → `target.skills[i]` | `SkillLevelUp` de la compétence *i* du perso |
| Perso, introns | `current.intron + 1` → `target.intron` | fragments (`CharCardLevelUp`, puis `UltraCharCardLevelUp`) |
| Arme non possédée | fabrication | recette `Draft` : plan + ingrédients + crédits |
| Arme, niveau et percées | idem perso | `WeaponLevelUp`, `WeaponBreak` |
| Wedge non possédé | `copies - ownedCopies` fabrications | recette `Draft` × nombre |
| Wedge, rang | `current.rank + 1` → `target.rank` | `ModLevel[rang][rareté]` × `copies` |
| Wedge, étoiles | `current.stars + 1` → `target.stars` | `CardLevelNeedNum` exemplaires sacrifiés + ressource 3016 |

Deux cas particuliers :

- **L’XP n’est pas un objet.** On calcule un total d’XP, puis on le traduit en
  objets d’XP (du plus gros au plus petit, sans gaspillage au-delà d’un objet
  de la plus petite valeur). Le stock d’objets d’XP s’exprime en XP
  équivalente : 3 objets de 20 000 = 60 000 XP disponibles. Le coût en crédits
  de la conversion (`CashToExp`) est à confirmer en jeu avant d’être affiché.
- **Les étoiles d’un wedge consomment des copies du même wedge.** Elles
  s’ajoutent à `copies` dans le besoin de fabrication.

### 5.2 Prérequis implicites

Le joueur ne doit pas avoir à savoir que la compétence 7 exige la 5ᵉ percée.
Après l’expansion, on **remonte les dépendances** :

1. Le niveau de compétence visé exige *n* percées (`SkillLevelUp.CharBreakLevel`).
2. La percée *n* exige le niveau de perso correspondant (`CharBreak.CharBreakLevel`,
   20, 30… 70).
3. Si `target.breaks` ou `target.level` est trop bas, on le **relève** et on
   ajoute un avertissement : « Compétence niveau 7 : 5 percées nécessaires,
   objectif relevé au niveau 60. »

On relève, on ne refuse jamais : l’objectif reste saisissable dans n’importe
quel ordre.

### 5.3 Fabrication : développer l’arbre

Un matériau qui a une recette peut être **farmé tel quel** ou **fabriqué**.
Le planificateur ne tranche pas à la place du joueur :

- **Par défaut**, on développe la recette **seulement si l’objet n’a aucune
  source directe** (`Resource2Dungeon` vide pour lui). C’est le cas des armes
  et de la plupart des produits de forge.
- Sur chaque ligne fabricable, un sélecteur « Farmer / Fabriquer » permet de
  changer d’avis ; le choix est mémorisé dans le plan (`craftChoices`).
- Le développement est **récursif** (ressource → ressource), avec une garde
  anti-boucle (ensemble des ids déjà sur le chemin) et une profondeur bornée.
- Le stock est déduit **à chaque niveau** : si le joueur possède déjà 2
  « Verrou », on n’en fabrique que ce qui manque, et on ne développe la
  recette que pour ce reste.
- Le plan de forge lui-même est une ligne du plan (il faut l’avoir).

Le coût en crédits de forge s’ajoute aux crédits ; la durée de forge
(`durationSec`) s’affiche à titre indicatif.

### 5.4 Allocation du stock entre objectifs

Plusieurs objectifs consomment souvent le même matériau (crédits, matériaux de
percée d’un même élément, monnaie de mod). Deux affichages en découlent, et il
faut les deux :

- **La vue agrégée** (« Matériaux ») additionne tous les besoins et retire le
  stock une seule fois. C’est la vraie liste de farm.
- **La vue par objectif** (« Objectifs ») dit où en est chacun. Le stock y est
  **alloué dans l’ordre de priorité** : l’objectif n° 1 se sert d’abord, le
  n° 2 prend le reste. Un objectif peut ainsi s’afficher « prêt » alors que le
  plan global manque encore de matériaux.

Réordonner les objectifs (glisser-déposer) change donc l’allocation, jamais le
total.

### 5.5 Où farmer : regrouper par source

Une fois les manques connus, on les rattache à leurs sources :

1. Pour chaque matériau manquant, la liste de ses donjons (`Resource2Dungeon`),
   ses catégories de source (`Access` résolu), ses boutiques, ses points de
   récolte sur la carte.
2. On inverse : **donjon → matériaux manquants qu’il donne**.
3. On trie les donjons par **nombre de lignes manquantes couvertes**
   (couverture gloutonne : on prend le donjon qui couvre le plus de manques,
   on retire ces manques, on recommence). Cela donne une feuille de route
   courte : « ces 3 donjons couvrent 9 de tes 11 manques ».
4. Les matériaux récoltables sur la carte renvoient vers la carte filtrée sur
   ce type, et vers les itinéraires de farm (`farm_routes.typeIds`) qui le
   ciblent : la brique existe déjà.
5. Les matériaux **non farmables** (fragments d’intron, objets de gacha ou
   d’événement) sont signalés comme tels et sortis de la feuille de route,
   sans être cachés.

Sans taux de drop, on ne promet **aucun nombre de passages**. La v1 dit *où*,
pas *combien de fois*. Les taux viennent en phase 5.

---

## 6. Planifier à partir d’un build

C’est l’entrée principale. Un build (officiel `src/data/characters/builds/`,
ou communautaire `builds.payload`) se traduit en objectifs ainsi :

| Partie du build | Objectif créé | Cible par défaut |
|---|---|---|
| `characterId` (+ `element`) | `character` | niveau 80, 6 percées |
| `skillPriority` | niveaux de compétence | priorité 5 → max, 4 → 8, 3 → 6, 2 → 4, 1 → niveau actuel *(proposition, réglable)* |
| `weapons.melee` / `ranged`, rang `best` | `weapon` | niveau 80, toutes percées |
| alternatives | non créées | proposées en case à cocher |
| `demonWedges.slots` + `centerItemId` | `demonWedge`, **regroupés par `itemId`** | `copies` = nombre d’emplacements, rang max du wedge |
| wedges d’arme (`weapons.*.demonWedges`) | `demonWedge`, ajoutés au même regroupement | idem |
| `genimon`, `team` | rien en v1 | – |

Règles :

- **Un écran de confirmation** montre les objectifs avant de les créer : le
  joueur décoche ce qu’il possède déjà, ajuste l’état actuel de chaque cible.
  Rien n’est ajouté en silence.
- **Fusion, jamais doublon.** Si le plan contient déjà ce perso ou cette arme,
  on garde l’objectif existant et on relève sa cible si celle du build est
  plus haute. Pour un wedge, on prend le maximum des copies demandées par les
  builds, pas leur somme (deux builds du même perso ne s’équipent pas en même
  temps). Deux persos différents qui utilisent le même wedge, eux,
  **additionnent** leurs copies.
- Le build source est mémorisé (`origin`) : « Retirer ce build du plan »
  enlève ce qu’il a apporté, sauf ce qu’un autre objectif utilise encore.
- Un build communautaire supprimé ou masqué ne casse pas le plan : les
  objectifs restent, l’origine devient « build supprimé ».

---

## 7. S’ajuster à ce qui manque

C’est le cœur du besoin : le plan doit **suivre** le joueur, pas être refait à
chaque session. Trois gestes, tous recalculés instantanément.

### 7.1 Saisir son stock

- Chaque ligne de matériau porte un compteur (« j’en ai ») modifiable au
  clavier, avec un bouton « J’ai tout » qui met le stock au besoin.
- Saisie **en lot** : une vue « Mettre à jour mon stock » liste uniquement les
  lignes du plan, dans l’ordre du sac du jeu (rareté, puis famille), pour
  recopier d’un écran à l’autre sans chercher.
- Les crédits et la monnaie de mod sont saisis une fois, en haut.

### 7.2 Valider une étape

Quand le joueur fait sa percée en jeu, il clique « Fait » sur l’étape. Deux
choses se passent ensemble :

1. l’état **actuel** de l’objectif avance (`current.breaks += 1`), donc ce
   coût sort du besoin ;
2. le coût de l’étape est **retiré du stock**, puisque le jeu l’a consommé.

Sans le point 2, le matériau serait compté deux fois comme « possédé ». Le
retrait est borné à zéro et annulable (« Annuler » pendant quelques secondes,
puis historique des 20 dernières étapes).

### 7.3 Ajuster l’objectif

- Changer l’état actuel ou visé à tout moment (sélecteurs de niveau, de
  percée, de compétence).
- Mettre un objectif en pause sans le perdre.
- Marquer un objectif « terminé » : il sort du calcul et passe dans un
  historique.

### 7.4 Ce que le joueur voit

- En tête : progression globale (part des matériaux réunis), crédits
  manquants, nombre de lignes encore à farmer.
- Onglet **Matériaux** : les manques d’abord, triés par quantité manquante
  rapportée au besoin ; les lignes complètes repliées en bas.
- Onglet **Objectifs** : une carte par objectif, avec sa progression et ses
  étapes cochables.
- Onglet **Où farmer** : la feuille de route de la section 5.5.

---

## 8. Un planificateur par utilisateur : stockage

### 8.1 Sans compte, puis avec compte

Même schéma que la carte (`map_progress`) :

- **Visiteur** : le plan vit dans le `localStorage` (`planner:v1`), via un
  atome jotai. Utilisable sans inscription.
- **Connecté** : le plan est en base, une ligne par compte, et suit le joueur
  d’un appareil à l’autre.
- **À la première connexion** avec un plan local non vide : on **propose**
  d’importer, de fusionner ou d’ignorer. On n’écrase jamais un plan serveur
  non vide par un plan local, ni l’inverse, et jamais par du vide (leçon de la
  progression effacée en prod le 25/09, cf. mémoire projet sur les
  migrations).

### 8.2 Table

```ts
export const farmPlans = pgTable("farm_plans", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  goals: jsonb("goals").$type<StoredPlannerGoal[]>().notNull().default([]),
  inventory: jsonb("inventory").$type<Record<string, number>>().notNull().default({}),
  craftChoices: jsonb("craft_choices").$type<Record<string, "farm" | "craft">>().notNull().default({}),
  schemaVersion: integer("schema_version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Une ligne par compte, réécrite en entier à chaque sauvegarde : quelques
dizaines d’objectifs et quelques centaines de quantités, inutile de les éclater.
Le nom `farm_plans` évite toute confusion avec `farm_routes` (itinéraires de
carte).

### 8.3 Validation côté serveur

Le serveur ne fait jamais confiance au client (même règle que les builds) :

- schéma zod strict, bornes explicites : 40 objectifs au plus, quantités entre
  0 et le plafond du jeu (`ResourceMax`), niveaux 1 à 80, percées 0 à 6,
  compétences dans les bornes de `SkillLevelUp`, `current ≤ target` ;
- **contrôle référentiel** : chaque `characterId`, `itemId` et `resourceId`
  doit exister dans le catalogue ; les entrées inconnues sont rejetées ;
- écriture en `PUT` complet avec `updatedAt` attendu : si un autre appareil a
  écrit entre-temps, on renvoie un conflit au lieu d’écraser ;
- sauvegarde côté client temporisée (une écriture par seconde au plus) et
  limitée en débit (`rate_limits`).

### 8.4 Évolution du schéma

`schemaVersion` permet de migrer un plan ancien **à la lecture**, avec un test
« plan v1 lu par le code v2 ». Si une donnée du jeu disparaît (wedge retiré,
compétence renumérotée), l’objectif reste affiché avec un avertissement, il
n’est jamais supprimé en silence.

---

## 9. Données à extraire

Rien de ce qui précède ne marche sans les coûts. Un extracteur dédié,
`research_data/extract-progression-costs.ts`, produit un dossier
`src/data/progression/` :

| Fichier | Source | Contenu |
|---|---|---|
| `character-xp.json` | `LevelUp` | XP par niveau (1 → 80) |
| `character-breaks.json` | `CharBreak` | par perso : 6 paliers `{ level, costs: [{ id, num }] }` |
| `skill-costs.json` | `SkillLevelUp` | par perso et `skillIndex` : coûts et percée requise par niveau |
| `intron-ultra.json` | `UltraCharCardLevelUp` | 7ᵉ intron |
| `weapon-xp.json` | `WeaponLevelUp` | XP par niveau |
| `weapon-breaks.json` | `WeaponBreak` | par arme |
| `mod-levels.json` | `ModLevel`, `Mod` | coût par rang et rareté, rang max par wedge, étoiles |
| `material-sources.json` | `Resource2Dungeon`, `Access`, `ShopItem`, `Convert` | par objet : donjons, catégories, boutiques |
| `dungeons.json` | `Dungeon`, `SelectDungeon`… | id, nom en 7 langues, chapitre, niveau |

Précautions déjà connues :

- les `AccessKey` exportés aujourd’hui sont des références `T.RT_xx` non
  résolues : réutiliser la résolution d’`extract-draft-recipes.ts` ;
- relier chaque compétence de `SkillLevelUp` au `skillIndex` 1 à 3 des builds,
  sans passer par les noms ;
- écrire en JSON indenté, fins de ligne CRLF, et **fusionner** avec l’existant
  plutôt qu’écraser (cf. la régression du catalogue d’armes) ;
- lancer le jeu avant d’extraire, pour que ses patchs soient téléchargés.

---

## 10. Phasage

| Phase | Contenu | Livrable vérifiable |
|---|---|---|
| **P0** | Extracteur (section 9) + `src/lib/planner/compute.ts` pur + tests | Coût de `char-aote` 1 → 80 comparé à l’écran du jeu |
| **P1** | Page `/planner`, objectifs **personnage**, stock, validation d’étapes, `localStorage` | Plan complet d’un perso sans compte |
| **P2** | Armes (dont fabrication récursive) et Demon Wedges (copies, rangs, étoiles) | Plan d’une arme non possédée |
| **P3** | « Planifier ce build » depuis la fiche perso, la fiche build et le builder | Le build de `char-aote` génère ses objectifs, fusion vérifiée |
| **P4** | Compte : table `farm_plans`, synchronisation, fusion à la connexion | Plan identique sur deux appareils |
| **P5** | « Où farmer » complet, lien carte et itinéraires, puis taux de drop (`Reward`) et estimation du nombre de passages | Feuille de route sur un plan réel |

Points d’entrée dans l’interface : un bouton « Planifier » sur la fiche
personnage, la fiche arme, la fiche Demon Wedge et la fiche build ; une entrée
« Planificateur » dans la barre latérale de l’`AppShell`.

Textes visibles : 7 langues, aucun vocabulaire technique d’extraction
(« table », « Lua », etc.) ; on parle de « matériaux », « donjons »,
« forge ».

---

## 11. Questions ouvertes

À trancher avant P0, la plupart en vérifiant en jeu :

1. **`CashToExp = 0.2`** : chaque point d’XP coûte-t-il 0,2 crédit ? À
   vérifier sur une montée de niveau réelle avant d’afficher ce coût.
2. **Niveau max des compétences** : `SkillLevelUp` décrit 9 montées (donc
   niveau 10) ; à confirmer à l’écran.
3. **Rangs des Demon Wedges** : `Mod.MaxLevel` vaut 1, 3 ou 5, mais `ModLevel`
   décrit 15 niveaux. À quoi servent les niveaux 6 à 15 ?
4. **Affinage des armes normales** : 5 niveaux, mais aucun coût dans les
   tables. Est-ce uniquement des doublons de l’arme ?
5. **Correspondance priorité → niveau de compétence** (section 6) : la grille
   proposée convient-elle, ou préfère-t-on « tout au max » par défaut ?
6. **Wedges en double entre builds** : maximum par perso et somme entre persos
   (section 6), ou laisser le joueur choisir ?
7. **Plan unique ou plusieurs plans nommés** par compte ? Le cadrage part sur
   un plan unique avec objectifs regroupables par build ; plusieurs plans
   compliquent l’allocation du stock, qui est forcément commune.
8. **Énergie et bonus de récompense** : le coût en énergie d’un passage bonifié
   est introuvable dans les données. Sans lui, pas d’estimation « énergie par
   jour » en P5.

---

## 12. État de l’implémentation (22/10/2026)

Ce qui existe, et ce qui a été tranché en route.

### Fichiers

| Rôle | Fichier |
|---|---|
| Extraction | `research_data/extract-planner.ts` (`bun run extract:planner:site`) → `src/data/planner/` |
| Calcul pur | `src/lib/planner/` (`goals.ts`, `compute.ts`, `builds.ts`, `schema.ts`) |
| Tests | `src/lib/planner/compute.test.ts` (`bun run test:unit`) |
| Données du client | `/api/planner/dataset/[locale]`, statique, une version par langue |
| Plan du compte | `/api/planner` (GET / PUT), table `farm_plans` (`bun run db:migrate:planner --env …`) |
| Interface | `/planner`, `src/components/planner/` ; boutons « Planifier ce build » sur la fiche perso (build officiel) et la fiche d’un build communautaire |

### Mécaniques confirmées dans le code du jeu

Relues dans les scripts décompilés (`Scripts_1.6_decompiled`), pas déduites des tables seules :

- **Compétences** : niveau 1 à 10 (`#SkillLevelUp + 1`), chaque palier exige un nombre d’ascensions (`Skill.lua`, `CheckCanLevelUp`).
- **Niveau** : plafonné par les ascensions faites (`Character.lua`, `AddExp`).
- **Demon Wedges** : rang max = `MaxLevel + ModCardLevelMax`. Les niveaux 6 à 15 de `ModLevel` sont ceux des étoiles : chaque rang au-delà de `MaxLevel` consomme `CardLevelNeedNum[i]` exemplaires du wedge, ou la ressource universelle 3016 (`Mod.lua`, `Armory_Mod_Enhance_C.lua`). Question 3 résolue.
- **Plans de forge** : consommés à chaque fabrication (`ForgeDataModel.lua`).

### Écarts avec le cadrage

- **Clés d’objet typées** (`res:`, `mod:`, `draft:`, `weapon:`) : les identifiants de ressources et de wedges se recouvrent.
- **Possession d’une arme ou d’exemplaires de wedge** lue dans le stock (`weapon:<id>`, `mod:<id>`), pas dans l’objectif : une seule source de vérité.
- **Fusion à la connexion automatique**, sans boîte de choix : union des objectifs (état le plus avancé gardé), stock au maximum des deux, copie de secours du plan local avant tout remplacement. Même logique que la progression de la carte.
- **Dernier écrit gagne** à l’enregistrement, comme la carte, au lieu d’un conflit sur `updatedAt`.
- **Rang visé par défaut d’un wedge** : le maximum sans étoile, les étoiles coûtant des exemplaires.
- **Clé d’un build officiel** : `official:<perso>:<élément>:<rang>`, le rang étant compté dans la liste filtrée par élément, comme l’onglet Build.

### Choisir un build depuis le planificateur (22/10/2026)

- Ajouter un **personnage** propose ses builds officiels (filtrés par élément) et les 12 builds communautaires les mieux notés, ou le personnage seul. Ajouter une **arme** propose ses builds de Demon Wedges. Un Demon Wedge s’ajoute directement.
- Chaque carte personnage ou arme du plan porte « Planifier un build » / « Planifier un build de Demon Wedges ».
- À l’import, on choisit le rang visé des Demon Wedges (maximum sans étoile, ou avec toutes les étoiles) et on voit ce que le build coûte avec le stock actuel, avant de l’ajouter.
- Un clic sur l’étiquette d’un build limite la liste de farm, les sources et le résumé à ce build.
- API : `/api/planner/builds?target=…&element=…` (liste) et `?key=…` (build réduit) ; clé d’un build d’arme `weapon:<weaponId>:<rang>`. Si la base tombe, les builds officiels restent proposés.
- Wedges d’arme comptés **au nom de l’arme** (`weaponWedges`), que le build vienne d’un perso (`withWedges`) ou de l’arme : les deux désignent les mêmes exemplaires, on prend le maximum au lieu d’additionner. Les wedges du perso et ceux de ses armes, eux, s’additionnent.

### Reste à faire

- ~~Créer la table `farm_plans` en production~~ : fait le 22/10/2026, par `ssh kagura-prod` et `psql` dans le conteneur `shared-postgres`, sous le rôle `dna` (propriétaire des autres tables). La base n’est plus joignable depuis le poste : `db:migrate:planner` ne sert qu’à la base locale.
- Vérifier en jeu les questions 1, 2 (maximum confirmé par le code), 4 et 8.
- Boutons « Planifier » sur les fiches arme et Demon Wedge (la page accepte déjà `?add=weapons-…` / `?add=mods-…`).
- Phase 5 : taux de drop (`Reward`) et nombre de passages estimé ; lien vers la carte pour les matériaux récoltables.

