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
  --color-ink:   #e6dcc6;  /* fond de page */
  --color-panel: #faf7ef;  /* surfaces */
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
| `gold-bright` | l'or le plus **contrasté** (texte d'accent) | `#e3cd95` | `#5a4512` |
| `gold-deep` | l'or le plus **discret** (fonds de dégradés) | `#897240` | `#d8c384` |
| `muted-2` | le gris le plus effacé | `#6a6150` | `#6b6253` |
| `white` / `black` | voiles plus clair / plus sombre que la surface | `#fff` / `#000` | `#241d13` / `#faf7ef` |

Sans cette inversion, `from-gold-deep/40 to-ink/70` (les CTA) perdrait son sens
de lecture.

## Pas de blanc pur

Le fond est un **ivoire chaud** (`#e6dcc6`), les surfaces un ivoire plus clair
(`#faf7ef`). Un blanc pur éblouit sur un écran et jurerait avec l'or laiton de
la marque. Le texte est une encre brune (`#241d13`), pas un noir : **13,5:1**
sur le fond, très au-dessus du minimum AA.

L'écart entre le fond et les surfaces a dû être **creusé** : au premier jet,
`#eee7d9` et `#f7f2e7` ne se distinguaient presque pas, et les cartes
flottaient sans structure sur la page.

Les teintes d'élément sont assombries : pensées pour briller sur du noir,
`hydro` (`#5fa8ff`) et `anemo` (`#57d6a6`) tombent sous 2:1 sur de l'ivoire —
ils passent respectivement à `#14487f` et `#16704f`.

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

## Les trois pièges du basculement, et leurs parades

Redéfinir les tokens ne suffit pas : trois familles de classes ne parlent pas
en tokens et se retournent contre le thème clair.

### 1. `border-white/10`, `bg-white/5`, `bg-black/25`

Environ **440 occurrences**. Elles ne veulent pas dire « blanc » ou « noir »,
mais « un voile plus clair / plus sombre que la surface ». Sur de l'ivoire, un
voile blanc est invisible — c'est ce qui donnait des cartes sans structure,
posées sur un fond de la même couleur.

Parade : le thème clair **redéfinit `--color-white` et `--color-black`**.

```css
:root[data-theme="light"] {
  --color-white: #241d13;   /* le « blanc » des voiles devient l'encre */
  --color-black: #faf7ef;
}
```

Une classe écrite sans y penser devient donc juste dans les deux thèmes. Les
rares `text-white` posés sur un fond **qui ne bascule pas** (badge cramoisi,
bouton Discord, barre du calendrier) sont écrits `text-[#fff]` en littéral.

### 2. Les zones qui doivent rester sombres : `.dna-force-dark`

La carte de build exportée a un fond peint en dur (dégradés bleu nuit). Sans
rien faire, seul son **texte** bascule : on lit du sombre sur du sombre. La
classe `dna-force-dark` redéclare toute la palette sombre sur le conteneur ;
les custom properties héritant, le sous-arbre entier redevient sombre.

C'est la parade générale pour **tout visuel destiné à sortir du site** : il doit
être identique quel que soit le thème du lecteur.

### 3. Le texte POSÉ SUR de l'or

Une pastille dorée (`DnaPill`, `DnaNouveau`, un chip actif, un bouton voté)
porte un texte sombre en dur : correct tant que l'or est clair. En thème clair
l'or devient foncé — le texte sombre disparaît dessus. C'est ce qui rendait
« DNA v1.5 », « Nouveau » et les filtres actifs illisibles.

Deux tokens réglent la famille entière :

| Token | Rôle | Sombre | Clair |
|---|---|---|---|
| `on-gold` | texte sur un **aplat** doré plein | `#241a08` | `#faf7ef` |
| `gold-hover` | accent de texte au survol des surfaces dorées | `#fff6e6` | `#241d13` |

Mesuré après correction : **6,96:1 en clair**, 9,08:1 en sombre, sur tous les
éléments concernés.

**Règle générale** : dès qu'une couleur est posée SUR une autre qui bascule,
elle doit basculer avec elle. Un texte en dur sur un fond en token est un bug
en puissance.

### 4. Les couleurs de texte passées en `style={{ }}`

`ELEMENTS[...].hex` servait à la fois de couleur de texte, de teinte de lueur
(`${hex}14`, une concaténation d'alpha qui interdit une variable CSS) et de
couleur d'image Open Graph (rendue serveur, sans thème). Le champ `color` a
donc été ajouté à côté de `hex` : il vaut `var(--color-pyro)` et suit le thème.
`hex` reste pour les deux autres usages.

### Les vignettes de carte

En sombre, le voile posé sur l'illustration l'**assombrit** : elle reste
visible par contraste avec le fond noir. En clair, ce même voile l'**éclaircit**
et la fait disparaître. On remonte donc l'illustration (`.dna-card-art`,
opacité 0,52) au lieu de toucher au voile — c'est lui qui garantit le contraste
du texte posé dessus.

## Mesurer plutôt que regarder

Le contraste se vérifie **par la mesure**, sur les deux thèmes, page par page.
Deux pièges méthodologiques rencontrés :

- Tailwind v4 exprime les couleurs en `oklab()`. Un parseur qui n'attend que du
  `rgb()` lit `oklab(0.23 0.005 0.02)` comme un RGB noir et invente des
  violations. Convertir en peignant la couleur dans un `<canvas>` 1 × 1 et en
  relisant le pixel.
- Un fond en **dégradé ou en image** ne se réduit pas à une couleur : le
  mesurer produit des faux positifs en masse. Ces éléments doivent être écartés
  du calcul, pas « corrigés ».

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
