# Cosmétiques et bannières de la Myriade

Section `/cosmetics`, ouverte le 29/09/2026 (jeu en 1.6) : tous les cosmétiques du jeu, classés comme dans la garde-robe, et les bannières d’invocation de skins.

## Mettre à jour après un patch du jeu

Une seule commande, une fois `research_data/Datas/` à jour (procédure habituelle : paks → unluac → Datas) :

```bash
bun run extract:cosmetics:site
```

Le script `research_data/extract-cosmetics.ts` :

1. relit les tables du jeu avec un vrai interpréteur Lua (wasmoon), sans parseur fait main ;
2. lit la version du jeu dans `GlobalConstant.CurrentVersion` et n’écarte que ce qui n’est pas encore sorti ;
3. repère les textures manquantes et les exporte lui-même depuis les paks (`Export-DnaAssets.ps1 -PathFile`) ;
4. convertit les visuels dans `public/assets/cosmetics/` (icônes en PNG palette, grands visuels en WebP) ;
5. écrit `src/data/cosmetics/{catalog,items,banners}.json`.

Rien n’est codé en dur : ni liste d’objets, ni bannière, ni version. Les nouveaux cosmétiques et les nouvelles bannières apparaissent d’eux-mêmes.

Option `--no-export` : régénère les données sans lancer l’export des textures (plus rapide quand rien de visuel n’a changé).

### À vérifier après coup

- Le script liste les objets **écartés faute d’icône dans les paks**. C’est normal pour le contenu annoncé mais pas encore livré (skins d’armes « Bixiao », par exemple). Si un objet déjà sorti y figure, sa texture est sans doute dans un patch : relancer l’export avec `-PaksDir` sur le dossier du patch.
- Une erreur « fichier tronqué ? » signale une décompilation interrompue. C’est arrivé à `Model_decompiled.lua` (8 705 lignes au lieu de 13 269) : relancer unluac sur le `.lua` du dernier patch qui contient la table.
- `git diff --stat src/data/cosmetics public/assets/cosmetics` pour voir ce qui a changé.

## Tables du jeu utilisées

| Catégorie du site | Table | Remarque |
|---|---|---|
| Tenues | `Skin` | regroupées par `SkinSeries` (tenues universelles de boutique) ; modèle via `Model` + `CharPartModel` |
| Coiffures | `Hair` | seules les coiffures nommées ; les autres sont celles, par défaut, de chaque personnage |
| Accessoires, effets, animations de victoire | `CharAccessory` | `AccessoryType` : `Hat`, `Head`, `Face`, `Back`, `Tail`, `Waist`, `Hair`, `FX_*`, `MVP` |
| Skins d’armes | `WeaponSkin` | sous-catégorie = `ApplicationType` (type d’arme) |
| Ornements et effets de compétence | `WeaponAccessory` | `StanceFXType` : `Accessory` = ornement, sinon effet |
| Montures | `Mount` | |
| Postures (gestes) et teintures | `Resource` | `ResourceSType` = `GestureItem` / `Dyeing` |
| Bannières | `SkinGacha`, `SkinGachaItem`, `SkinGachaTab`, `SkinGachaCumulative`, `GachaProbability` | contenu, taux, paliers |
| Prix | `ShopItem` | offres directes et `GoShopTypeId` ; les packs groupés (`ItemType = "Reward"`) sont ignorés |

La taxonomie (catégories, emplacements, icônes d’onglet) reprend celle de la garde-robe du jeu : `AppearanceMainTab`, `AppearanceTab`, `AppearanceSubTab`.

## Règles reprises du code du jeu

Vérifiées dans les scripts d’interface décompilés (`D:\duet-night-abyss-research\Scripts_1.6_decompiled`) :

- **Sorti ou non** : `ReleaseVersion <= GlobalConstant.CurrentVersion`, la même comparaison que les archives du jeu.
- **`IsHide`** veut dire « masqué dans la garde-robe tant qu’il n’est pas possédé » (`Armory_CharAppearance_Component` le lève pour les objets détenus). Ce sont de vrais cosmétiques, affichés avec le badge « Secret ».
- **`ExcludeCollect`** ne concerne que le score de collection : sans effet sur le catalogue.
- **Types des pools de bannière** : `GachaCommon.GachaItemTypeMap` (2 tenue, 3 skin d’arme, 4 accessoire, 5 ornement, 6 ressource).
- **Un tirage 5★ sur une bannière limitée** : 45 % la tenue, 45 % 25 Prismes iridescents, 10 % 50 Prismes iridescents. Taux de base 0,3 % (5★) et 5,1 % (4★), garantie en 90 tirages.

## Historique des tirages : impossible

L’écran d’historique du jeu est une interface native qui interroge le serveur par le protocole du jeu (`CallServer("OpenGachaRecord")`). Il n’y a ni URL ni jeton à récupérer dans les journaux, contrairement à Genshin ou Wuthering Waves. Aucun import d’historique n’est donc proposé.

## Visionneuse 3D (plus tard)

Chaque fiche a déjà son onglet « 3D », réservé, quand le jeu fournit un modèle. Les chemins des modèles sont conservés dans les données (`model.paths`). La faisabilité est validée : CUE4Parse exporte en glTF, la texture de couleur est `PM_Diffuse`, les teintures d’armes se recalculent (canaux R/G/B × `染色1/2/3`), les coloris d’accessoires sont des cases d’un atlas 2×2. Reste à décider de l’hébergement des modèles (environ 400 à 500 Mo).
