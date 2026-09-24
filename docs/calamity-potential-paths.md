# Chemins de Potentiel des armes de calamité

Comment on choisit l'ordre d'investissement conseillé qu'un build affiche sur
l'arbre de Potentiel, et pourquoi.

## La règle du jeu

Un arbre compte **10 nœuds** sur 6 paliers, répartis en 1 / 2 / 2 / 2 / 2 / 1.
Les deux branches sont deux chaînes parallèles qui **convergent** : le nœud du
palier V exige les **deux** nœuds du palier IV.

**À chaque palier de I à IV, le premier Potentiel choisi est gratuit ; l'autre
reste accessible mais coûte des matériaux.** Les paliers 0 et V n'en offrent
qu'un, donc ils ne se choisissent pas.

Ce n'est donc pas un embranchement définitif : on finit par tout prendre. Ce
qui se choisit, c'est **lequel des deux prendre gratuitement**, quatre fois.
Un chemin conseillé dit exactement ça, et c'est là que passent les matériaux.

> Une source publique annonce au contraire un choix « permanent » qui
> verrouillerait la branche. C'est faux, et nos propres données le montrent :
> le nœud du palier V a **deux** prérequis, un par branche.

## La structure, identique sur les quatre armes

| Palier | Ce qu'on y trouve | Ce qui décide |
| --- | --- | --- |
| 0 | la génération de calamité de base | rien, automatique |
| **I** | **deux sources de calamité** | le kit : laquelle le personnage déclenche vraiment |
| **II** | une statistique brute | d'où viennent ses dégâts |
| **III** | un amplificateur conditionnel | son style de jeu |
| **IV** | une seconde statistique brute | même logique qu'au II |
| V | le bouquet final | rien, automatique |

Le palier I est le plus discriminant : une source de calamité que le
personnage ne déclenche pas ne vaut rien, quelle que soit sa valeur affichée.

## L'identité de chaque arme

Chaque arme est bâtie autour d'un mécanisme, et elle ne rend son plein effet
qu'à un personnage qui l'exploite. C'est ce qui guide le palier I.

| Arme | Mécanisme | Le personnage idéal |
| --- | --- | --- |
| `weapons-10299` Conflit perpétuel | **Invocations** : les familiers génèrent la calamité et héritent d'attributs | un invocateur |
| `weapons-10399` Braise souveraine | **Arme de consonance de mêlée** : tout l'arbre l'amplifie | qui joue sa consonance au corps-à-corps |
| `weapons-20298` Plume sanguine | **PV et Désordre élémentaire** ; le palier V donne PV max +300 % | qui encaisse ou consomme du Désordre |
| `weapons-20599` Requiem d'épines | **Points de Combo** convertis en [Extinction] | qui brûle du Combo |

## La méthode, palier par palier

**Palier I — la source de calamité.** On prend celle que le personnage
déclenche le plus souvent. Sur Conflit perpétuel, un invocateur prend
« Triomphe » (80 points par invocation) ; un personnage sans familier prend
« Déroute », qui ne dépend pas d'eux. Une source jamais déclenchée est un
nœud mort.

**Palier II — la statistique.** `SkillIntensity` si les dégâts viennent des
compétences, `ATK` s'ils viennent des attaques d'arme. On lit `positioning` et
la priorité de compétences du build pour trancher.

**Palier III — l'amplificateur.** Il est toujours conditionnel : attaques
chargées contre attaques normales, invocation contre consommation, portée
contre multiplicateur. On prend la condition que le personnage remplit.

**Palier IV — la seconde statistique.** Même lecture qu'au palier II, avec ce
qui reste.

## Ce que cette méthode ne fait pas

Elle **ne mesure rien**. Elle raisonne sur le texte des nœuds et le kit du
personnage, pas sur des dégâts simulés. Deux conséquences :

- un chemin conseillé ici est une **déduction documentée**, pas un relevé ;
- quand deux nœuds se valent pour un personnage, on prend celui qui sert le
  plus tôt dans la progression, et la note du build le dit.

Aucune fiche publique ne publie d'ordre recommandé à ce jour. Si l'une le
fait un jour, elle prime sur cette méthode et il faudra recouper.

## Où ça vit

Le chemin est porté par l'**entrée d'arme du build**, pas par le build entier :
un même personnage peut recommander deux armes de calamité avec deux ordres
différents.

```json
{
  "itemId": "weapons-20599",
  "rank": "best",
  "potentialOrder": [20599001, 20599002, 20599004, 20599006, 20599008, 20599010]
}
```

L'ordre liste les nœuds dans l'ordre de prise. Les nœuds absents de la liste
restent accessibles — ce sont ceux qu'on paiera en matériaux plus tard.

## Liens

- Les règles générales des Demon Wedges : [`demon-wedge-build-rules.md`](./demon-wedge-build-rules.md)
- L'arbre lui-même : `src/components/items/CalamityPotentialTree.tsx`
- Les données : `src/data/weapons/calamity-potentials.json`
