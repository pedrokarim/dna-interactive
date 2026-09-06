# Thème clair

Le site est né en sombre et le reste par défaut. Le thème clair se choisit dans
la barre du haut, à côté du sélecteur de langue : **Système / Clair / Sombre**.

## Le principe : redéfinir des valeurs, pas des rôles

Le design system ne connaît qu'un jeu de tokens (`--color-ink`,
`--color-panel`, `--color-parch`, `--color-gold`…) et **aucun composant
n'écrit de couleur en dur** — ils passent tous par `bg-panel`, `text-parch`,
`border-line/25`. Le thème clair se contente donc de redonner d'autres valeurs
à ces mêmes tokens, dans un seul bloc de `globals.css` :

```css
:root[data-theme="light"] {
  --color-ink:   #eee7d9;  /* fond de page */
  --color-panel: #f7f2e7;  /* surfaces */
  --color-parch: #241d13;  /* texte courant */
  …
}
```

**Conséquence : pas un seul composant n'a eu à changer.** C'est ce qui rend le
thème tenable dans la durée — un nouveau composant écrit avec les tokens est
correct dans les deux thèmes sans rien faire de plus.

Les **noms** gardent leur rôle d'origine, pas leur littéralité : `parch`
(parchemin) désigne la couleur du texte courant, qui est une encre brune en
clair ; `ink` désigne le fond de page, qui est un ivoire. Les seules inversions
sont celles des paires clair/sombre :

| Token | Rôle | Sombre | Clair |
|---|---|---|---|
| `gold-bright` | l'or le plus **contrasté** (texte d'accent) | `#e3cd95` | `#6d5518` |
| `gold-deep` | l'or le plus **discret** (fonds de dégradés) | `#897240` | `#d8c384` |
| `muted-2` | le gris le plus effacé | `#6a6150` | `#7d7364` |

Sans cette inversion, `from-gold-deep/40 to-ink/70` (les CTA) perdrait son sens
de lecture.

## Pas de blanc pur

Le fond est un **ivoire chaud** (`#eee7d9`), les surfaces un ivoire plus clair
(`#f7f2e7`). Un blanc pur éblouit sur un écran et jurerait avec l'or laiton de
la marque. Le texte est une encre brune (`#241d13`), pas un noir : **13,5:1**
sur le fond, très au-dessus du minimum AA.

Les teintes d'élément sont assombries : pensées pour briller sur du noir,
`hydro` (`#5fa8ff`) et `anemo` (`#57d6a6`) tombent sous 2:1 sur de l'ivoire.

## Mécanique

`data-theme` sur `<html>` porte le thème **résolu** — il ne vaut jamais que
`"dark"` ou `"light"`. La **préférence** (qui peut valoir `"auto"`) vit dans
`localStorage` sous `dna:theme`. Le CSS n'a donc qu'un seul sélecteur à
connaître.

L'attribut est écrit par un script inline **avant la première peinture**
(`THEME_INIT_SCRIPT` dans `src/lib/theme.ts`, appelé depuis le layout) : sans
lui, la page s'afficherait en sombre puis sauterait en clair après hydratation.
Même mécanique que l'état replié de la barre latérale.

Deux détails suivent le thème :

- `color-scheme`, qui colore les widgets natifs (`<select>`, champs, barres de
  défilement système) ;
- la balise `meta[name="theme-color"]`, qui colore la barre du navigateur
  mobile.

Le sélecteur (`src/components/site/ThemeSwitcher.tsx`) rend **les deux icônes**
(soleil et lune) et laisse le CSS n'en montrer qu'une, via `.dna-when-light` /
`.dna-when-dark` : le bouton est juste dès la première peinture, alors que le
serveur ne peut pas connaître le thème du visiteur. En mode « Système », un
écouteur `matchMedia` répercute les changements en direct, sans rechargement.

## Ce qui reste volontairement sombre

- **Les cases d'objet** (`data-rarity`). La texture vient du jeu et est peinte
  pour du sombre. On ne la touche pas : c'est le voile posé dessus qui
  s'inverse (`--rarity-veil`) et le nom de l'objet qui s'assombrit. Les
  vignettes se lisent comme un fragment d'interface du jeu incrusté dans la
  page.
- **Le fond de la carte interactive.** Les tuiles sont sombres ; seul le
  panneau latéral passe en clair. La carte reste une surface autonome.
- **Les cartes de build exportées** (`QuickBuildModal`) et **les images
  Open Graph**. Ce sont des visuels destinés à sortir du site : ils doivent
  rester identiques quel que soit le thème du visiteur.

## Le fond ambiant

Les illustrations de fond (cf. [wallpapers-fond-ambiant.md](./wallpapers-fond-ambiant.md))
sont peintes sur papier ivoire. En thème sombre, il faut les éteindre
(`brightness(0.34)`) ; en clair, elles n'ont presque rien à corriger — mais
elles ressortent bien plus, puisqu'elles partent du même ton que la page. Leur
opacité maximale descend donc de `0.5` à `0.3`, et le voile s'inverse avec
elles.

## Ajouter un composant

Rien de spécial : utiliser les tokens. Les deux pièges à éviter sont

1. **une couleur en dur** (`text-[#f4ecd8]`, `bg-black/60`) — elle ne suivra
   pas le thème ;
2. **une ombre portée noire opaque**, qui se voit beaucoup plus sur fond clair.

La palette des deux thèmes se regarde côte à côte dans Storybook :
`DNA/Fondations/Couleurs` (`bun run storybook`).
