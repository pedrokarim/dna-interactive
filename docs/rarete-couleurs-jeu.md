# Système de rareté du jeu — couleurs et assets réutilisables

Relevé fait à partir des textures UI extraites (FModel), pour rapprocher notre
interface de celle de Duet Night Abyss. Aujourd'hui la rareté n'existe chez nous
que comme **filtre / tri / étoiles** (`stats.rarity`, `DnaStars`) : aucun codage
couleur. Le jeu, lui, code la rareté par couleur partout — un joueur qui arrive
sur le site devrait reconnaître la rareté d'un objet au premier coup d'œil.

## Où sont les assets

Racine :
`D:\duet-night-abyss-research\FModel_Output\Exports\EM\Content\UI\Texture\Static\Image\Common\`

| Dossier | Fichiers | Rôle |
| --- | --- | --- |
| `Item/` | `T_Item_Hover_1..6`, `T_Item_Hover_NoQuality`, `T_ItemHover_Pack` | **Dégradé de survol de la case d'objet, par rareté** |
| `Item/` | `T_Item_Appearance_Grey/Green/Blue/Purple/Gold/Red/NoQuality` | Fond de vignette « apparence » par rareté |
| `Item/` | `T_Item_Pack` (atlas), `T_Com_Item_Base_S/M/L`, `T_Item_Mask_*`, `T_Item_MaskOutline_S/M/L` | Fonds de case + cadre ornemental doré |
| `Item/` | `T_Show_Item`, `T_Show_Item_Empty`, `T_Show_ItemMask` | Carte objet plein format (fenêtre ovale + ornement) |
| `Tips/` | `T_Com_TipsTextColor_1..6` | **Dégradé de remplissage du texte**, par rareté |
| `Tips/` | `T_Com_TipsLineColor_1..6`, `T_ComTipsOutLine` | **Filet séparateur** teinté par rareté |
| `Tag/` | `T_Com_QualityTag_Blue/Purple/Gold/Red` + `_Bg`, `_01` | Filigrane papillon teinté (fond de panneau détail, rareté ≥ 3) |
| `GetItem/` | `T_GetItem_01..19`, `T_GetItem_VX_01..10` | Effets d'obtention d'objet |

## Correspondance rareté → couleur

L'atlas `T_ItemHover_Pack` donne l'ordre sans ambiguïté ; il correspond au
nommage par couleur des `T_Item_Appearance_*` :

| Rareté | Nom jeu | Texture hover | Présent dans nos données |
| --- | --- | --- | --- |
| 1 | Grey | `T_Item_Hover_1` | oui (mods, resources) |
| 2 | Green | `T_Item_Hover_2` | oui |
| 3 | Blue | `T_Item_Hover_3` | oui |
| 4 | Purple | `T_Item_Hover_4` | oui |
| 5 | Gold | `T_Item_Hover_5` | oui (toutes les armes) |
| 6 | Red | `T_Item_Hover_6` | **pas en tant que `rarity`** — correspond aux armes de calamité (`WeaponSubType === "Hyper"`) |
| — | NoQuality | `T_Item_Hover_NoQuality` | objets sans rareté (gris neutre très sombre) |

Le niveau 6 rouge n'apparaît jamais dans `stats.rarity` (max = 5). C'est le
palier « calamité » : à brancher sur le helper `calamity-weapons.ts` plutôt que
sur `rarity`.

Note : `T_Com_QualityTag_*` n'existe qu'en Blue / Purple / Gold / Red — le
filigrane n'est utilisé qu'à partir de la rareté 3.

## Valeurs échantillonnées

### Dégradé de survol (`T_Item_Hover_N`, 324×324, sombre en haut → blanc en bas)

Le dégradé monte depuis le bas de la case : c'est une lueur, pas un fond plat.

| Rareté | haut (5 %) | 25 % | **cœur (45 %)** | 62 % | 78 % |
| --- | --- | --- | --- | --- | --- |
| 1 gris | `#333333` | `#545454` | `#939393` | `#C8C9C8` | `#EFEFEF` |
| 2 vert | `#2E392E` | `#476147` | `#7CAC7C` | `#C9DDB4` | `#EFF6E9` |
| 3 bleu | `#313646` | `#515E7D` | `#859BCE` | `#C9DFEE` | `#F2F7FC` |
| 4 violet | `#392B39` | `#624563` | `#A878AE` | `#C8AFDF` | `#F1E8F6` |
| 5 or | `#3B3427` | `#69583E` | `#BA9869` | `#EBDDA4` | `#F9F8E3` |
| 6 rouge | `#412526` | `#79383C` | `#D6616B` | `#FAB6AA` | `#FEF3EE` |
| NoQuality | `#181818` | `#1C1C1C` | `#262526` | `#434443` | `#707070` |

La colonne « cœur » est la teinte identitaire de chaque rareté — c'est elle qu'on
prendrait comme token si on n'en garde qu'une.

### Couleur de texte (`T_Com_TipsTextColor_N`, dégradé vertical, blanc en bas)

| Rareté | teinte haute | teinte médiane |
| --- | --- | --- |
| 1 | `#BAC3BA` | `#DEE3DE` |
| 2 | `#94D1B5` | `#DEFFFF` |
| 3 | `#A7BCFF` | `#BDEBFF` |
| 4 | `#B5559C` | `#F48FF4` |
| 5 | `#FFEB94` | `#FFFFCE` |
| 6 | `#B25155` | `#FF8D9A` |

### Filet séparateur (`T_Com_TipsLineColor_N`, dégradé horizontal → transparent)

| Rareté | couleur vive (bord gauche) | ombre |
| --- | --- | --- |
| 1 | `#8C8D8C` | `#2E2D2E` |
| 2 | `#4F876B` | `#1B2724` |
| 3 | `#555587` | `#212439` |
| 4 | `#84517B` | `#292029` |
| 5 | `#C0965B` | `#3F301E` |
| 6 | `#A4545A` | `#2C1C1E` |

### Filigrane papillon (`T_Com_QualityTag_*`, 648×648, très translucide)

| Rareté | teinte |
| --- | --- |
| 3 bleu | `#8FAEEF` |
| 4 violet | `#BA66D3` |
| 5 or | `#B29666` |
| 6 rouge | `#FA7068` |

## Compatibilité avec notre palette

Notre or maison (`--color-gold: #c2a86a`) et l'or rareté 5 du jeu (`#BA9869`
cœur, `#C0965B` filet) sont quasi identiques : la rareté 5 s'intègre sans
retouche. Le cramoisi maison (`#8e1813`) est nettement plus sombre que le rouge
calamité (`#D6616B`) — ce sont deux rôles différents, ne pas les confondre.

Attention : les teintes du jeu sont désaturées et « poudrées » (le vert tire sur
le sauge, le bleu sur l'ardoise). Ne pas les remplacer par des couleurs saturées
type Tailwind `green-500` / `blue-500`, ça casserait la parenté visuelle.

## Implémentation

### API

- `src/components/dna/rarity.ts` — `RARITIES` (teinte / texte / filet par
  niveau), `RarityLevel`, `toRarityLevel`, `rarityAttr`, `CALAMITY_RARITY`.
  Réexporté par le barrel `@/components/dna`.
- `src/lib/items/rarity.ts` — `resolveItemRarity(item)` : lit `stats.rarity` et
  **remonte les armes de calamité au palier 6** (elles portent une rareté 5 dans
  les données).
- `globals.css` — tokens `--color-rarity-1..6` (utilitaires Tailwind
  `text-rarity-5`, `border-rarity-3`…) pour les usages **statiques**.

### Classes CSS (usage dynamique)

Le niveau est porté par `data-rarity="1".."6"` (ou `"none"`) sur un conteneur ;
les variables héritées alimentent les classes suivantes :

| Classe | Effet |
| --- | --- |
| `.dna-rarity-slot` | Case d'objet : lueur qui monte du bas, discrète au repos, pleine au survol du `.group` parent. Reproduit `T_Item_Hover_N`. |
| `.dna-rarity-tile` | Même lueur sur une vignette pleine carte (mode Simplifié), qui porte elle-même le survol. |
| `.dna-rarity-name` | Nom teinté (`T_Com_TipsTextColor_N`). |
| `.dna-rarity-line` | Filet séparateur vif → transparent (`T_Com_TipsLineColor_N`). |
| `.dna-rarity-chip` | Pastille de rareté. |

L'intensité de la lueur passe par `--rarity-a`, déclarée en `@property` pour
être interpolable (sans ça la transition serait un saut sec). `prefers-reduced-motion`
la neutralise via la règle globale.

Rien n'importe les PNG du jeu : tout est reproduit en CSS. Le grain des textures
est trop discret pour justifier une image, et les tailles seraient inadaptées.

### Surfaces câblées

- Liste d'objets (`ItemsGridClient`) — les **trois** modes Simplifié / Liste /
  Détaillé : case teintée, nom teinté, pastille de rareté teintée.
- Fiche objet (`ItemDetailClient`) — titre teinté + filet sous le titre. Le
  médaillon et le stage restent teintés par l'**élément** : c'est un axe
  d'information différent, les mélanger brouillerait les deux.
- Builder — `DnaItemPicker` et `DnaSlotRow` : case + nom teintés.
- Storybook — `DNA/Fondations/Rareté` (échelle complète + cases survolables).

## Reste à faire

- **Filigrane papillon** (`T_Com_QualityTag_*`) en fond du hero de la fiche à
  partir de la rareté 3 : seul élément non reproductible en CSS, il faudrait
  importer les 4 PNG dans `public/`.
- **Légende de rareté** dans les listes — non fait volontairement : le code
  couleur vient du jeu, les joueurs le connaissent déjà, et une légende
  demanderait 6 libellés × 7 locales.
- Les libellés `Rarete` / `Polarite` des pastilles restent en dur (non
  accentués, non traduits) — antérieur à ce chantier, non traité ici.

Le cadre ornemental `T_Item_MaskOutline_M` et la carte `T_Show_Item` sont
également récupérables, mais ils relèvent d'un autre chantier (cadres de cartes)
que du code couleur de rareté.
