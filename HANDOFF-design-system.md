# Passation — Refonte des interfaces avec le Design System DNA

> But de ce document : permettre à un autre chat de **continuer la refonte des pages restantes**
> exactement dans le même esprit. Lis-le en entier avant de toucher au code.

## 0. Contexte & objectif

Site = **DNA Interactive**, companion du jeu *Duet Night Abyss* (Next.js 16 App Router + Turbopack,
React 19, Tailwind v4, next-intl, jotai, nuqs, **bun** — PAS npm).

On reconstruit **toutes les interfaces du site** en utilisant le **design system DNA** (look du jeu :
sombre + or laiton mat + cramoisi, typo Cinzel/Cormorant/Jost). Branche : `main` (commits = points de revert,
chacun atomique). **JAMAIS de `Co-Authored-By: Claude` ni "Generated with Claude" dans les commits/PR.**

## 1. ⚠️ PRINCIPE CARDINAL (l'utilisateur s'est fâché PLUSIEURS fois) : ADAPTER, NE PAS CASSER

- On regarde **le prototype + le design system PUIS on s'adapte à l'existant**. On ne remplace pas
  le réel par des placeholders du proto.
- **Garder les vrais assets** : icônes d'élément du jeu (`/assets/items/mods/T_Armory_*.png`), portraits,
  images, et toutes les features (favoris, zoom, multi-élément, langues, switch de portraits…).
- **Garder les éléments astucieux/complexes** (liste EXPLICITE de l'utilisateur, NE PAS modifier, juste ré-intégrer) :
  - la **carte de build** (`ResponsiveQuickBuildCard` dans `QuickBuildModal`) + la **disposition DW/MOD**
    (grille de Demon Wedges / "Sceaux démoniaques" qui imite le jeu) ;
  - le **showcase personnages** (`NewCharactersBanner`) ;
  - l'**arbre des plans de forge** (`DraftDetailClient`) ;
  - la section **Intron** des fiches perso (la dispo des vœux) ;
  - les **StatBars** colorées par élément (composant `StatBar` dans `CharacterDetailClient`).
- On ne **retravaille avec le DS que le générique** (panneaux, boutons, chips, en-têtes, cartes simples,
  dispositions). Page par page : identifier ce qui se garde vs ce qui se retravaille.
- Recolorer le markup ≠ design system (rejeté). Remplacer le réel par le proto = saccage (rejeté aussi).
  La voie = **appliquer les composants/structure du DS SUR le contenu réel**.

## 2. ⚠️ RÈGLES VISUELLES NON NÉGOCIABLES (durement apprises)

1. **UNIFIER les coins.** Interdiction absolue d'avoir un élément arrondi à côté d'un élément net.
   - **Panneaux / cartes / tuiles / conteneurs / boutons / pills = NETS** (aucun `rounded-lg/xl/2xl/md`).
   - **Seuls les vrais cercles restent ronds** (`rounded-full` : badges élément, médaillons de compétence,
     avatars, puces, knobs). Une pill-tag = NETTE (`rounded-sm` au max), pas `rounded-full`.
   - Réf. CSS du DS (`design-lab/assets/dna-ui.css`) : `.dna-panel` = 0 radius ; `.dna-btn` = 7px ;
     `.dna-tag` ≈ net ; cercles = 50%.
2. **PAS de filet intérieur "qui crée de l'espace".** On a retiré `DnaPanel inner` (le double-filet `inset:7px`)
   car l'utilisateur le percevait comme de l'espace perdu tout autour. → Utiliser **`DnaPanel` simple** (bordure nette).
3. **Vrais composants du DS, pas du "coloriage".** Les cartes doivent être des `DnaPanel`, les libellés
   des `DnaSectionLabel` (◈), les lignes de stats des `DnaStatRow`, les tags des `DnaTag` — pas des `div`
   ad-hoc juste recolorées.

## 3. Où est le design system

- **Référence visuelle vivante** : `design-lab/` (HTML pur, ouvert en `file://`). `design-lab/assets/dna-ui.css`
  contient TOUS les composants `dna-*`. `design-lab/design-system.html` = la référence. Prototypes de pages : `proto-*.html`.
  Pour la fiche perso, le proto retenu est **`proto-char-arsenal.html`** (+ variantes `proto-char-cinematic.html`,
  `proto-char-dossier.html`). On NE versionne PAS `research_data/` (gitignore).
- **Composants React réutilisables** : `src/components/dna/` (barrel `@/components/dna`). Les principaux :
  - `Panel` → `<DnaPanel inner? crest? className>` (NB : on n'utilise PAS `inner`, cf. règle 2).
  - `SectionLabel` → `<DnaSectionLabel>` (◈ + filet doré).
  - `StatRow` → `<DnaStatRow label value accent={hexElement?} />`.
  - `Tag` → `<DnaTag tone="gold|crimson">` (net, capitales Cinzel).
  - `Chip`, `Segmented`, `Button`, `ElementBadge`, `RarityStars`/`DnaStars`, `Avatar`, `Crest`, `Divider`, `CharacterCard`…
  - `elements.ts` → `ELEMENTS[ElementKey] = {label, token, hex, glyph, icon}`. **`ELEMENTS[key].hex`** sert à
    teinter par élément (inline style). `ELEMENT_KEYS`, `type ElementKey`.
  - `cn.ts` → mini-clsx maison.
- Tokens DNA exposés en utilitaires Tailwind v4 via `@theme` dans `src/app/globals.css` :
  `bg-ink`, `bg-panel`, `text-gold`, `text-gold-bright`, `border-line/25`, `font-display` (Cormorant),
  `font-caps` (Cinzel), `font-sans` (Jost), `text-electro/pyro/hydro/anemo/lumino/umbro`, `text-muted/muted-2/parch`, `crimson`.
- Couleurs élément (hex) : electro `#a48ed0`, pyro `#e2664a`, hydro `#5fa8ff`, anemo `#57d6a6`,
  lumino `#e3cd95`, umbro `#8e84ff`. Or `#c2a86a`, or clair `#e3cd95`, cramoisi `#8e1813`.

## 4. La dispo "Arsenal" (modèle de référence, déjà implémentée sur la fiche perso)

`src/components/characters/CharacterDetailClient.tsx` (≈2800 lignes) a été transformé en **shell Arsenal** —
c'est LE modèle à suivre pour les pages riches :

- **Top bar fine** en haut (retour, favori, build rapide, langue, prev/next).
- **Rail vertical d'onglets À GAUCHE** (`<nav>` avec `TAB_CONFIG.map`, icônes lucide, actif = `bg-gold/20`
  + barre dorée à gauche) — il **REMPLACE** l'ancienne barre d'onglets horizontale et **pilote** la zone de contenu.
- **Zone de contenu** à droite du rail : `{activeTab === 'stats' && (…)}`, `'build'`, `'skills'`, `'portraits'`,
  `'intron'`, `'translations'`, `'tech'`.
  - Onglet **Attributs** = render du perso **centré** (portrait bust par défaut, lueur + sol teintés par
    `elHex`) + **bandeau nom** en overlay (Niv, nom Cormorant + badge élément vraie icône, sous-titre, étoiles)
    + **panneau stats à droite** (ATQ coloré par élément via `DnaStatRow accent={elHex}`) + stats détaillées
    (StatBars conservées).
  - Onglet **Build** = la carte de build + grille DW/MOD (CONSERVÉE telle quelle).
- Teinte par élément : `const elHex = ELEMENTS[character.element.key as ElementKey]?.hex ?? "#c2a86a"`.
- Toutes les **cartes = `DnaPanel`** (nettes, sans `inner`), en-têtes = `DnaSectionLabel` (◈),
  tags = `DnaTag`, lignes récap = `DnaStatRow`.

## 5. État d'avancement (déjà fait, committé sur `main`)

- **Liste personnages** (`CharactersGridClient`) : grille en `DnaCharacterCard` (vraies icônes d'élément,
  multi-élément, favoris/zoom), filtres `DnaChip`, bascule `DnaSegmented`. (Vues Liste/Détaillé : déjà
  correctes, vraies icônes — peu/pas retouchées.)
- **Accueil** (`src/app/[locale]/page.tsx`) : fonds violets résiduels → sombre/or, titres de section en
  Cormorant. **BuildShowcase + NewCharactersBanner préservés.**
- **BuildShowcase** : amélioration validée = gradient de fond + boutons **teintés par l'élément** du perso
  actif (la carte de build interne reste inchangée).
- **Fiche perso** (`CharacterDetailClient`) : **shell Arsenal complet** (rail + render + stats),
  **cartes en `DnaPanel`/`DnaSectionLabel`/`DnaStatRow`/`DnaTag`**, **coins unifiés (tout net, cercles ronds)**,
  filet intérieur retiré. Intron/Build/DW-MOD/StatBars/switch portraits/vraies données = conservés.

Derniers commits (les plus récents en haut) :
`3673016` unifie les coins (tout net) · `6c58dc3` cartes en composants DS · `ae8e942` shell Arsenal complet ·
`00a77b6` hero Arsenal · `b37f87b` BuildShowcase teinté élément · `cc8e58b` accueil.

## 6. Pages RESTANTES à faire (la mission de ce nouveau chat)

Appliquer le DS (cartes `DnaPanel` nettes, `DnaSectionLabel` ◈, `DnaTag`, boutons DS, coins unifiés,
teinte élément où pertinent) en **adaptant à l'existant** :

1. **Items** : liste (`src/components/items/ItemsGridClient.tsx`, ~1438 l, 3 view modes) + détail.
   - ⚠️ Les items sont des **icônes** (tuiles, fond transparent) → garder le patron tuile, NE PAS coller
     `DnaCharacterCard`. Garder les **vraies icônes de mod** (`item.icon.publicPath`).
   - ⚠️ **Arbre des plans de forge** (`DraftDetailClient`) + **dispo MOD/DW** = CONSERVER tels quels.
2. **Carte** (`/map`) : habiller le HUD autour. NB : bug PRÉ-EXISTANT `<button>` imbriqué (hydratation),
   sans rapport — ne pas s'en alarmer.
3. **Codes de rédemption**, **À propos**, **Contact**, **Support** : pages génériques → cartes `DnaPanel`,
   en-têtes ◈, boutons DS.
4. **Chrome global** : nav header + footer (cohérence coins/typo).

Pour chaque page : 1) lire l'existant et repérer garder-vs-retravailler, 2) appliquer le DS au générique,
3) `node_modules/.bin/tsc --noEmit` (exit 0), 4) vérifier en live, 5) **commit atomique**.

## 7. Workflow de vérification

- Dev server : `http://localhost:3000` (déjà lancé en général). Routes en `/fr/...` (localePrefix always).
- Vérifier visuellement via Chrome DevTools MCP (`navigate_page` + `take_screenshot`), checker
  `list_console_messages` (errors).
- Typecheck : `node_modules/.bin/tsc --noEmit`. `**/*.stories.tsx` exclus du tsconfig.
- Commits atomiques par page (messages en français, sans signature Claude).

## 8. Pièges connus

- Tailwind v4 : `@source "../**/*.{ts,tsx,mdx}";` en tête de `globals.css` (sinon utilitaires manquants en Storybook).
- Le niveau perso par défaut = `maxLevel` (80) → les stats du hero sont les valeurs niv. max (ex. ATQ 276 est
  réel, pas un bug ; le 1628 des protos était factice).
- `ELEMENT_COLORS`/`ELEMENT_ICONS`/`RARITY_COLORS` sont des maps locales dans `CharacterDetailClient` (classes
  Tailwind + chemins d'icônes réelles) — séparées de `@/components/dna/elements` (qui donne les hex).
