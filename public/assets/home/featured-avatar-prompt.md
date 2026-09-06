# Portrait vedette de la carte DNA Interactive

## Source du personnage

Utiliser uniquement l'avatar carré officiel du personnage comme référence d'identité. Ne pas utiliser de splash art, de bust complet ou d'illustration en pied.

## Direction graphique

Réinterpréter exactement le portrait tête-épaules dans une esthétique d'affiche éditoriale : sérigraphie cobalt, aquarelle cyan granuleuse, fines constructions orbitales dorées, étoiles, gouttes, losanges et motifs propres au personnage. Préserver les traits reconnaissables de l'avatar et garder une lecture nette à petite taille.

Le fichier final doit être un PNG carré avec une transparence alpha réelle, sans damier intégré, sans texte, logo, signature, filigrane, bordure, arme, décor ou personnage supplémentaire.

## Intégration

Le chemin courant est défini par `HOME_FEATURED_AVATAR` dans `src/components/home/HomeHubClient.tsx`. Pour le prochain personnage, générer le nouvel avatar avec les mêmes contraintes puis remplacer uniquement `src`, `width` et `height` dans cette constante.
