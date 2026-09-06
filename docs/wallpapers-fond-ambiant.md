# Fonds d'écran du fond ambiant

Les six illustrations qui défilent derrière le site (cf. `DnaAmbientBackdrop`)
sont **propres au projet** : ni captures du jeu, ni visuels officiels. Le style
– papier ivoire fibreux, encres cobalt et or safran, tracés au compas, grain de
sérigraphie – a été choisi pour rester reconnaissable sans rejouer les
wallpapers de l'éditeur en diaporama.

## Où vivent les fichiers

| | |
|---|---|
| Originaux PNG (1672 × 941, ~2,8 Mo pièce) | `assets/wallpapers-originaux/` – **hors git** |
| Versions servies, WebP nettoyé (~250 Ko pièce) | `public/assets/wallpapers/` – versionnées |

Les originaux restent sur le disque pour pouvoir régénérer les WebP avec
d'autres réglages ; ils ne sont pas versionnés (17 Mo de PNG dans l'historique
ne se rattrapent pas).

## Nettoyage — obligatoire avant de servir une image générée

Les PNG sortis d'ImageGen embarquent un **manifeste C2PA signé**
(`c2pa`, `caBX`, `jumb`) et un champ XMP `trainedAlgorithmicMedia`. C'est ce que
lisent les plateformes pour tagger automatiquement « AI-generated ».

Le ré-encodage par `sharp` les supprime : sans `withMetadata()`, aucune
métadonnée de la source n'est reprise.

```js
// pour chaque original
await sharp(source).webp({ quality: 82, effort: 6 }).toFile(destination);
```

Puis **vérifier** que rien ne subsiste dans le fichier produit, en cherchant les
marqueurs `c2pa`, `caBX`, `jumb`, `trainedAlgorithmicMedia` et
`XML:com.adobe.xmp` dans les octets. Le premier passage a donné 17 Mo → 1,5 Mo,
zéro résidu.

> La note de référence sur le sujet vit dans le vault marketing
> (`brand/visuels-anti-detection-ia.md`), avec ses lignes rouges : une image
> générée doit se lire comme une illustration, jamais se faire passer pour une
> photo réelle. Ici c'est un décor assumé, sous un voile, derrière du contenu.

## Réglage d'affichage

Ces visuels sont peints sur **papier ivoire clair**. Servis tels quels sur
`--color-ink` (#0a0a0b), ils éclairciraient toute la page. Le composant les
ramène au niveau de l'encre du site :

```css
filter: brightness(0.34) saturate(1.25) contrast(1.12) blur(1.5px);
```

`saturate` compense la désaturation induite par la baisse de luminosité, pour
que les encres cobalt, safran et cramoisi restent lisibles. Le `blur` léger
évite que le fond ne se lise comme du contenu.

## Prompts d'origine

Mode : génération intégrée ImageGen, l'affiche fournie servant de référence de
style et les visuels officiels du projet de références thématiques.

Mode : génération intégrée ImageGen, avec l'affiche fournie comme référence de style et les visuels officiels du projet comme références thématiques.

## 1. Twin Eclipse

Fond d'écran paysage 16:9 original autour de la dualité de *Duet Night Abyss*. Deux silhouettes héroïques opposées — épée longue et arme à feu — se rencontrent dos à dos au centre d'un astrolabe monumental. Papier ivoire fibreux, large bande de nébuleuse verticale, sérigraphie éditoriale, aquarelle granuleuse, encre cobalt et or safran, tracés astronomiques précis, détails concentrés au centre et grands espaces négatifs. Sans texte, logo, interface ni filigrane.

## 2. Abyssal Carnival Orrery

Fond d'écran paysage 16:9 original représentant une grande roue gothique transformée en immense orrery céleste : rayons-constellations, nacelles en croissants de lune, palais effilé traversant le mécanisme et petites marionnettes articulées suspendues à des fils dorés. Papier ivoire, ruban de nébuleuse indigo, architecture à l'encre cobalt, détails or safran, cercles au compas, orbites pointillées et ambiance de fête foraine mélancolique. Composition dense à droite et espace calme à gauche. Sans texte, logo, interface ni filigrane.

## 3. Astral Snow Reverie

Fond d'écran paysage 16:9 original avec la silhouette graphique d'une héroïne aux cheveux courts et à la robe plumeuse, placée dans un mandala de flocon cristallin. Cape et rubans se dissolvant en constellations, étoiles et arcs liquides, petit esprit-chat près des pieds. Papier ivoire, colonne verticale d'aquarelle glacée, lune translucide, encre bleu de Prusse, cyan givré, gris argent et touches d'or safran. Sujet légèrement à droite et tiers gauche dégagé pour les icônes. Sans texte, logo, interface ni filigrane.

## 4. Abyss Cartographer

Fond d'écran paysage 16:9 conçu comme une planche d'architecte céleste : région flottante, forteresses, ponts, canaux et portes lunaires reliés par deux routes opposées. Traitement cyanotype et cartographie ancienne, lavis cobalt irrégulier, constructions au compas, détails en coupe et repères dorés. Zone calme à gauche, architecture concentrée au centre et à droite. Sans texte, logo, interface ni filigrane.

## 5. Gilded Nocturne

Fond d'écran paysage 16:9 sous forme de manuscrit enluminé : reliquaire en croissant ouvert comme un livre, deux aventuriers miniatures tournés vers des horizons opposés, halos de plumes, lys, armes filigranées, arches gothiques et grande roue lointaine. Gouache ultramarine, or ancien et papier ivoire façon vélin, composition centrale symétrique avec larges marges. Sans texte, logo, interface ni filigrane.

## 6. Vermilion Abyss

Fond d'écran paysage 16:9 en risographie japonaise rouge et indigo : guerrière à longue tresse devant un anneau d'éclipse brisé, double profil spectral, ailes stylisées, comètes et glyphes d'armes. Grain d'impression, décalage d'encre, aplats déchirés, gestes au pinceau sec et fines orbites dorées. Sujet décalé à gauche et espace respirant à droite. Sans texte, logo, interface ni filigrane.
