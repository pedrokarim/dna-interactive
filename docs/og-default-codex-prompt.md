# Prompt Codex — Image Open Graph par défaut (statique)

> À coller tel quel dans Codex. Tâche de **compositing déterministe** (pas de
> génération IA) : on réutilise nos vrais assets. Sortie unique :
> `public/assets/og/og-default.png` en **1200×630**.

---

Tu travailles dans le repo Next.js `dna-test`. Crée un script Node qui génère
l'image Open Graph **par défaut** du site, à partir de nos assets existants.
N'invente aucune image : compose à partir des fichiers ci-dessous.

## Sortie attendue
- Fichier : `public/assets/og/og-default.png`
- Dimensions exactes : **1200 × 630** px (ratio 1.91:1)
- Format PNG, optimisé (< 400 Ko si possible)
- Crée aussi le script sous `research_data/og/build-default-og.mjs` (ou
  `scripts/`), idempotent et relançable. Utilise `sharp` (déjà adapté au
  compositing). Si `sharp` n'est pas installé, ajoute-le en devDependency
  avec `bun add -d sharp`.

## Assets d'entrée (chemins réels)
- **Background** : `public/assets/official-v1.3/bg.webp`
  (key art officielle Duet Night Abyss v1.3 — large, colorée).
  Alternative possible si rendu trop chargé : `public/assets/worldview/worldview-1-4-2.webp`.
- **Logo** : `public/assets/images/logo_optimized.png`
  (emblème ADN indigo/violet sur fond transparent, carré).
- **Police du wordmark** : `src/app/_og/fonts/Cinzel.ttf`
  (Cinzel 700 — c'est la police de titres du site, à réutiliser pour cohérence).

## Composition (de l'arrière vers l'avant)
1. **Fond** : redimensionne le background en `cover` sur 1200×630 (recadrage
   centré, pas de déformation).
2. **Flou** : applique un flou gaussien marqué sur le fond — `blur(28)` à
   `blur(40)` (sharp `.blur(30)`). Le fond doit devenir une texture abstraite,
   pas une scène lisible.
3. **Assombrissement** : superpose un voile sombre pour le contraste du texte —
   un aplat `rgba(11, 10, 15, 0.58)` (couleur de fond du site = `#0b0a0f`) sur
   toute la surface. Ajoute si possible une légère vignette (bords plus sombres).
4. **Halo de marque** (optionnel, subtil) : un radial-gradient indigo très doux
   derrière le lockup central, teinte `#6366f1` (theme-color du site) à ~18 %
   d'opacité max. Discret.
5. **Lockup central — logo + nom sur LA MÊME LIGNE horizontale**, groupe centré
   (verticalement et horizontalement) :
   - À **gauche** : le logo, hauteur ~120 px (largeur proportionnelle).
   - À **droite** du logo, même ligne, aligné verticalement au centre :
     le texte **« DNA Interactive »** en Cinzel 700, ~76 px, couleur
     `#f4efe6` (parchemin), letter-spacing léger (~1–2 px).
   - Espace logo↔texte : ~28–32 px.
   - Le groupe (logo + texte) est centré comme un bloc unique.
6. **Sous-titre** (optionnel, sous le lockup, centré) : `Interactive Map & Resources`
   en plus petit (~30 px), couleur `#9b94a8`, letter-spacing ~4 px, capitales.

## Contraintes
- Le texte doit rester parfaitement lisible (contraste fort grâce au voile).
- Pas de texte qui touche les bords : marge de sécurité ≥ 60 px.
- Rendu net du logo et du texte (pas de flou sur eux — le flou ne concerne QUE
  le fond).
- N'écris que dans `public/assets/og/` et le dossier du script. Ne touche à
  aucun autre asset. **N'ajoute aucune mention d'un site tiers/concurrent.**

## Vérification
- Ouvre `public/assets/og/og-default.png`, confirme 1200×630 et que le logo +
  « DNA Interactive » sont nets, centrés, sur la même ligne, sur fond flouté
  sombre. Affiche la taille finale du fichier.
