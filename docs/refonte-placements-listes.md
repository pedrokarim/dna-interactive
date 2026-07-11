# Refonte des placements — pages « liste » (matière de travail)

> Doc de travail interne. Objectif : refaire **l'organisation / le placement** des
> éléments sur nos pages liste (Personnages, Items/Armes/Sets…), en s'inspirant de
> l'agencement du site de référence **tout en gardant 100 % notre design system DNA**.
> On garde le layout « hub / dashboard » déjà validé sur `home-poc`
> (sidebar gauche + topbar + contenu pleine largeur).
>
> Screenshots analysés (scratchpad de session) : `ref-characters-*.png`,
> `ref-weapons-*.png`, `ref-equipment-*.png`. La réf tourne en v3.0.11 (jeu Arknights:
> Endfield) ; nous, DNA (Duet Night Abyss). On ne reprend que la **structure**.

---

## 0. Règles absolues (à ne pas oublier en implémentant)

- **AUCUNE zone de pub.** La réf réserve un gros bloc bannière (≈ 960×250) juste sous
  l'en-tête de chaque page liste, + d'autres emplacements. **On les supprime tous, on
  ne réserve aucun espace.** Le contenu (recherche + filtres) remonte directement sous
  l'en-tête.
- **Design system DNA uniquement** : `DnaChip`, `DnaCharacterCard`, `DnaPanel`,
  `DnaCornerBrackets`, `DnaStars`, `DnaTag`, `DnaPill`, `DnaNouveau`, `DnaSegmented`,
  `DnaField`, `font-caps/display/mono`, tokens or laiton/cramoisi/éléments. Zéro brique
  visuelle inventée, zéro couleur hors palette.
- Pas de crédit/URL/mention de la réf dans le **front** (règle projet). Ce doc est
  interne uniquement.
- 7 locales, `Link` de `@/i18n/navigation`, textes via `next-intl`.

---

## 1. Le « gabarit de page liste » (structure commune à toutes les listes)

De haut en bas, dans la zone de contenu (à droite de la sidebar) :

```
┌───────────────────────────────────────────────────────────────────────────┐
│  // OPERATOR.DATABASE                                    ┌───────────────┐  │  ← en-tête
│  PERSONNAGES                                             │ 29  INDEXED   │  │
│  ▔▔▔▔ (soulignement)                                     │     TROUVÉS   │  │
│                                                          └───────────────┘  │
│                                                                             │
│  [❌ PAS DE BANNIÈRE PUB ICI — supprimée]                                    │
│                                                                             │
│  ⌕ Rechercher des personnages…                          (barre pleine largeur)│
│                                                                             │
│  (★6) (★5) (★4) | (◭Physique)(◭Thermique)… | (rôles) | (types d'arme)        │  ← filtres
│                                                                             │
│  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐                                   │  ← grille
│  │   ││   ││   ││   ││   ││   ││   ││   │  …                                 │
│  └───┘└───┘└───┘└───┘└───┘└───┘└───┘└───┘                                   │
└───────────────────────────────────────────────────────────────────────────┘
```

### 1.1 En-tête de page (le motif clé à reprendre)
- **Eyebrow mono** en capitales, préfixé `//` : `// OPERATOR.DATABASE`,
  `// ARSENAL.DATABASE`, `// GEAR.SETS`. Couleur accent (chez nous : `text-gold`
  ou `text-muted`), petit, `tracking` large. → `font-mono` / `DnaSectionLabel`.
- **Titre XL** en capitales (`PERSONNAGES`, `ARMES`, `SETS D'ÉQUIPEMENT`) —
  `font-display` très gros, suivi d'un **court soulignement** accent (barre jaune chez
  eux → barre `bg-gold`/`dna-underline` chez nous).
- **Compteur d'index en haut à droite** (aligné baseline du titre) :
  gros nombre + micro-label sur 2 lignes `INDEXED` / `PERSONNAGES TROUVÉS`, **encadré
  par des équerres**. → `DnaCornerBrackets` + `font-display` pour le chiffre + `font-caps`
  pour le label. C'est LE placement de « nombre global » de la page.

### 1.2 Barre de recherche
- Pleine largeur (ou presque), arrondie, icône loupe à gauche, placeholder
  « Rechercher des … ». → `DnaField` avec `icon`.

### 1.3 Rangées de filtres (chips)
Ordre et regroupement observés, **de gauche à droite / haut en bas** :
1. **Rareté** : `★6` `★5` `★4` (icône étoile + label).
2. **Élément / type de dégâts** : `Physique` `Thermique` `Cryogénique` `Naturel`
   `Électrique` — **chaque chip porte l'icône colorée de l'élément**.
3. **Rôle / classe** : `Garde` `Défenseur` `Soutien` `Magicien` `Avant-garde`
   `Attaquant` `Unité des Arts`.
4. **Type d'arme** : `Espadon` `Canon portatif` `Arme d'hast` `Épée`.

→ Chez nous : `DnaChip` (a déjà `selected` + `color` hex élémentaire). On garde le
même **ordre de familles** (rareté → élément → rôle → arme). Chips à icône = `icon`
inline. Les listes plus simples (Armes) n'ont que rareté + type d'arme.

### 1.4 Filtres « étapes » (variante Sets d'Équipement)
Au lieu de chips multiples, une **rangée segmentée** exclusive :
`Toutes les Étapes` (actif) · `Début de Jeu (Niv10-28)` · `Mi-Jeu (Niv36-50)` ·
`Fin de Jeu (Niv70)`. → `DnaSegmented` / `DnaTabs`.

---

## 2. Placement des ÉLÉMENTS (icône d'élément du jeu) sur une carte

### 2.1 Carte **personnage** (le cas riche)
DOM réf (simplifié) :
```html
<a href="/characters/camille/">
  <div class="rarity-container-6 element-fire">           <!-- cadre teinté rareté+élément -->
    <div class="absolute top-1.5 left-1/2 -translate-x-1/2">  <!-- HAUT-CENTRE -->
      <em class="op-tag new">NOUVEAU</em>
    </div>
    <img class="w-full h-full object-cover" src="…charicon…">  <!-- portrait 3:4 -->
    <div class="absolute top-2 left-2"><img …profession…></div>     <!-- HAUT-GAUCHE : classe -->
    <div class="absolute top-2 right-2"><img …heat.webp></div>       <!-- HAUT-DROITE : ÉLÉMENT -->
    <div class="absolute top-9 right-2"><img …Polearm.webp></div>    <!-- SOUS l'élément : type d'arme -->
    <div class="absolute bottom-0 … bg-gradient-to-t">…nom…</div>    <!-- BAS : nom sur dégradé -->
  </div>
</a>
```
Placements à retenir :
- **Élément → coin HAUT-DROITE.** Sous lui, **empilé**, le **type d'arme**.
- **Classe / rôle → coin HAUT-GAUCHE.**
- **Rareté → cadre/glow coloré** de toute la carte (pas de chiffre).
- **NOUVEAU → haut-centre** (onglet).
- **Nom → bandeau bas** sur dégradé sombre montant.
- Portrait `aspect-ratio: 3/4` (mobile) → `152/212` (≥640px).

> 🟢 **Bonne nouvelle** : notre `DnaCharacterCard` fait **déjà** presque tout ça
> (glow teinté par élément, badges d'élément empilés, étoiles de rareté, tags d'armes,
> `aspect-[3/4]`, `topRight`). Il suffit d'**aligner les positions** (élément +
> arme empilés en haut-droite, classe en haut-gauche, NOUVEAU haut-centre) pour matcher
> l'organisation de la réf. Voir §5.

### 2.2 Carte **arme**
```html
<a class="rarity-container-6" href="/weapons/exemplar/">
  <div class="aspect-square relative">
    <img class="object-contain" src="…wpn_claym_0004…">     <!-- icône centrée -->
    <span class="op-tag absolute top-2 right-2">6★</span>    <!-- HAUT-DROITE : RARETÉ (chiffre) -->
  </div>
  <div class="absolute bottom-0 … character-card-info">
    <h3>Exemplaire</h3><p>Espadon</p>                        <!-- nom + sous-type -->
  </div>
</a>
```
- Icône d'arme centrée sur un **fond dégradé teinté par la rareté** (orange = 6★).
- **Rareté = tag `6★` en HAUT-DROITE** (ici c'est un chiffre, pas juste un cadre).
- Nom + sous-type d'arme en bas. Petit ornement croix `+` aux coins de la carte.

### 2.3 Carte **set d'équipement** (cas « fiche » riche, pas une vignette)
```html
<button class="op-card">
  <div class="op-card-head">
    <span class="op-slot filled r2" style="--rar:…">        <!-- slot icône, barre d'accent rareté à gauche -->
      <img src="…item_equip…">
    </span>
    <div class="op-card-meta">
      <h4>Prototype d'armure lourde</h4>
      <div class="op-card-cap">Body · Lv.28</div>            <!-- slot + NIVEAU (nombre) -->
    </div>
  </div>
  <div class="op-card-bar"><span class="op-card-bar-cap">Voir ↗</span></div>
</button>
```
Variante « liste de sets » (grille 4 col) = **cartes texte** :
icône (slot teinté rareté + barre d'accent à gauche) + nom + **compteur `15 PIÈCES`**
(en petites caps sous le nom) + **description avec nombres surlignés** (`+5%`, `+15%`
en vert/or ; mots-clés en violet/or) + fond filigrane circulaire discret + lien « Voir ↗ ».

---

## 3. Placement des NOMBRES (récapitulatif transversal)

| Nombre | Où | Forme | Équivalent DNA |
|---|---|---|---|
| **Total de résultats** | En-tête, **haut-droite**, dans équerres | gros `font-display` + label 2 lignes `INDEXED / … TROUVÉS` | `DnaCornerBrackets` + `font-display` + `font-caps` |
| **Rareté (arme/item)** | **haut-droite** de la vignette | tag `6★` (pastille) | `DnaPill` / `DnaTag` / `DnaStars` |
| **Rareté (perso)** | tout le cadre | cadre/glow coloré (sans chiffre) | glow `DnaCharacterCard` |
| **Nb de pièces** | sous le nom (set) | `15 PIÈCES` en petites caps | `font-caps text-muted` |
| **Niveau** | méta du set | `Lv.28`, `Body · Lv.28` | `DnaStatRow` / texte caps |
| **Stats inline** (+5 %, +15 %) | dans les descriptions | **surlignés en couleur** (+% vert/or, mots-clés violet) | `text-anemo`/`text-gold`/`text-electro` sur le nombre |
| **Numéro de section** (home) | à droite du ruban de section | `05`, `04` en `font-mono` gris | déjà fait sur `home-poc` |

Principe : **un nombre « compteur » se pose toujours en haut-droite** (page = header,
carte = coin) ; **un nombre « valeur » se surligne en couleur** dans le texte.

---

## 4. Les petits éléments qui « traînent » (ornements) — inventaire

À reproduire avec nos primitives (ils font le « style hub ») :
- **Eyebrow mono `//SECTION.NAME`** au-dessus de chaque titre de page → `font-mono`.
- **Soulignement court** sous le titre → barre `bg-gold` (ou `dna-underline` animé).
- **Équerres d'angle** autour du compteur d'en-tête et de certaines cartes/stats →
  `DnaCornerBrackets` (déjà utilisé sur `home-poc`).
- **Croix `+` aux coins** des vignettes (armes) → petites équerres/`+` décoratifs.
- **Cadres/glow de rareté** sur les cartes → couleur or/élément.
- **Filigrane circulaire discret** en fond des cartes de set → `dna-watermark` /
  radial très faible.
- **Motif géométrique/topographique** en fond de page → gradient + lignes très faibles.
- **Badges de statut** : `NOUVEAU` (haut-centre carte), `BETA`/`ALPHA` (sur outils) →
  `DnaNouveau`, `DnaTag` (hydro/gold).
- **Breadcrumb topbar** `//COMMUNITY.HUB` + **pilule version** `EF 1.3` → chez nous
  `//COMMUNITY.HUB` + `DnaPill` `DNA v1.4` (déjà sur `home-poc`).
- **Sous-titres mono `//…`** sur les cartes d'outil (`//BUILD.FORGE`, `//GEAR.INDEX`) →
  `font-mono` (déjà sur `home-poc`).

---

## 5. Grilles & responsive (colonnes + gap par type de liste)

| Liste | Colonnes (desktop) | Gap | Format carte | Notre carte |
|---|---|---|---|---|
| **Personnages** | ~8 col très serrées | 4px | portrait `3/4` → `152/212` | `DnaCharacterCard` |
| **Armes** | 6 col | 16px | vignette **carrée**, icône centrée + tag rareté + nom bas | carte vignette (à cadrer sur DnaPanel + rareté) |
| **Sets d'équipement** | 4 col | 16px | **fiche texte** riche (256px) : icône + nom + nb pièces + effet | `DnaPanel` + `DnaStatRow`/`DnaCornerBrackets` |

Responsive : réduire le nb de colonnes par breakpoint (ex. perso 8→4→3→2, armes 6→4→3→2,
sets 4→2→1). La sidebar passe en **drawer** (déjà géré dans `home-poc`).

---

## 6. Mapping composant par composant (réf → DNA)

| Élément réf | Composant / classe DNA |
|---|---|
| eyebrow `// X.DATABASE` | `font-mono` (ou `DnaSectionLabel`) |
| titre XL + soulignement | `font-display` + barre `bg-gold` / `dna-underline` |
| compteur d'en-tête (équerres) | `DnaCornerBrackets` + `font-display` |
| barre de recherche | `DnaField` (icon loupe) |
| chips rareté/élément/rôle/arme | `DnaChip` (`selected`, `color`) |
| segmented « étapes » | `DnaSegmented` / `DnaTabs` |
| carte perso (élément H-D, classe H-G, rareté=cadre, nom bas) | `DnaCharacterCard` (aligner positions) |
| carte arme (rareté tag H-D, nom bas) | `DnaPanel` + rareté + `DnaStars`/`DnaPill` |
| carte set (icône+nom+nb pièces+effet surligné) | `DnaPanel` + `DnaStatRow` + accents couleur |
| tag `NOUVEAU` | `DnaNouveau` |
| tag rareté `6★` | `DnaPill` / `DnaTag` / `DnaStars` |
| nombres inline surlignés | `text-anemo`/`text-gold`/`text-electro` |
| croix/équerres d'angle carte | `DnaCornerBrackets` |
| pilule version, breadcrumb | `DnaPill`, `font-mono` (topbar `home-poc`) |
| **bannières pub** | ❌ **supprimées, rien** |

---

## 7. TODO / prochaines étapes

1. Valider ce doc (placements) avec Karim.
2. Décliner le **gabarit de page liste** en composant partagé
   (`ListPageShell` : en-tête eyebrow+titre+compteur équerres, `DnaField`, rangées de
   filtres `DnaChip`, grille). **Sans aucun emplacement pub.**
3. Refondre `/characters` sur ce gabarit (carte = `DnaCharacterCard` repositionnée :
   élément + type d'arme empilés haut-droite, classe haut-gauche, `NOUVEAU` haut-centre).
4. Refondre `/items` et `/items/[category]` (armes = grille carrée ; mods/sets = fiches
   texte avec nombres surlignés + compteur « N pièces »).
5. Généraliser eyebrow mono + compteur d'en-tête + ornements sur toutes les listes.
6. Décision transverse : bascule complète du site sur le layout sidebar (`home-poc`)
   vs conservation ponctuelle de `SiteHeader` — à trancher avec Karim.

## Annexe — remplacements de copy déjà demandés
- Sidebar `home-poc` : remplacer **« Soutenir le projet »** (projet 100 % gratuit) par
  autre chose (ex. « Contribuer » / « Rejoindre la communauté » / « Feedback »).
