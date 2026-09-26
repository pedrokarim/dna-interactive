# Traits conseillés sur un Géniemon

Comment on décide des Traits à viser pour un personnage, et surtout ce que
cette méthode ne prétend pas faire.

## Le problème

Un build conseille déjà un ou plusieurs Géniemons. Mais deux exemplaires de la
même espèce ne se valent pas : ce qui les sépare, ce sont les **Traits** greffés
dessus. Sans eux, la recommandation s'arrête à mi-chemin – on sait quoi
équiper, pas quoi farmer.

## Le principe : le build se répond à lui-même

Chaque build curé déclare déjà sa **priorité de statistiques**, dans l'ordre. Et
les Traits, eux, portent l'attribut du jeu qu'ils augmentent
(`BattlePet.AddAttrs[].AttrName`).

Les deux vocabulaires coïncident. Six correspondances sont **littérales** :

| Statistique du build | Attribut du Trait | Trait |
|---|---|---|
| `SkillEfficiency` | `SkillEfficiency` | Efficace |
| `SkillIntensity` | `SkillIntensity` | Brutal |
| `SkillSustain` | `SkillSustain` | Endurant |
| `SkillRange` | `SkillRange` | Cupide |
| `MaxHp` | `MaxHp` | Robuste |
| `DEF` | `Def` | Cuirassé |

Cinq autres se raccordent par leur **sens**, et le raccord est écrit dans le
script, jamais deviné :

| Statistique du build | Trait | Pourquoi |
|---|---|---|
| `ATK` | Féroce | « ATQ +… », le seul Trait qui porte l'attaque |
| `CritRate` | Téméraire | `WeaponCRIModifierRate` = taux critique |
| `CritDmg`, `CritDamage` | Revigoré | `WeaponCRDModifierRate` = dégâts critiques |
| `Morale` | Exalté | « Vigueur » dans les textes du jeu |
| `Resolve` | Obstiné | « Ténacité » dans les textes du jeu |

Les Traits retenus suivent **l'ordre de priorité du build**, et cet ordre se lit
comme une priorité de farm – pas comme un emplacement : le jeu ne fixe pas quel
Trait va dans quelle sphère.

## Les bornes

- On ne retient que les catégories **combat** et **statistiques**. Mobilité et
  exploration sont des conforts, pas des réponses à l'objectif d'un build.
- On ne dépasse jamais le nombre d'emplacements de la créature : trois pour une
  variante ordinaire, quatre pour une scintillante.
- **Une statistique sans Trait correspondant reste sans Trait.** `SkillDmg`,
  `MaxSp`, `ATK_Fire`, `SkillSpeed`, `Penetration` n'en ont aucun : on n'en
  invente pas, et l'emplacement reste vide.
- Un emplacement vide s'affiche « à définir ». C'est honnête : il vaut mieux
  montrer qu'il reste un choix à faire que de le combler au hasard.

## Ce que cette méthode ne fait pas

Elle **ne mesure rien**. Aucune simulation de dégâts, aucun relevé en jeu. Elle
déduit d'une donnée déjà curée – la priorité de statistiques du build – ce que
cette priorité implique côté Traits. Si la priorité est juste, les Traits le
sont ; si elle est fausse, ils le seront aussi.

Elle **hérite de la qualité de la priorité de statistiques**, et deux mesures
le montrent :

- **45 % des builds (25 sur 55) ont leur priorité n°1 sans Trait
  correspondant** – le plus souvent `SkillDmg`, qu'aucun Trait ne porte. Les
  Traits viennent alors des priorités suivantes. Ce n'est pas faux, mais ce
  n'est plus tout à fait « les trois premières priorités ».
- **18 personnages ont plusieurs builds partageant exactement la même priorité
  de statistiques.** Ils recevront donc des Traits identiques. Parfois c'est
  légitime (un même rôle à deux paliers de progression), parfois non : sur
  `char-haier`, « Tank Pyro (milieu de jeu) » et « DPS endgame » partagent la
  même liste, et sur `char-maer`, « DPS Pyro » et « Support » aussi. **C'est la
  curation des statistiques qu'il faut alors reprendre, pas les Traits** – qui
  ne font que la refléter.

Elle **ne classe pas deux Traits de même rang**. Quand plusieurs Traits
répondent à la même statistique, l'ordre du build tranche, faute de mieux.

Elle **laisse de côté des Traits sans doute excellents**, faute de pouvoir les
justifier par cette voie :

- **Vétéran** – « Niveau de Soutien de Géniemon et des passifs +1 ». Il
  augmente le passif même pour lequel on a choisi la créature, donc très
  probablement fort partout. Mais on ignore s'il dépasse le palier 4, et un
  « probablement » ne se code pas. À trancher par observation en jeu.
- **Discipliné** – le Soutien se déclenche seul dès qu'il est disponible, donc
  du temps de présence gagné. Même raison de prudence.

Ces deux-là sont de rareté **or uniquement** et viennent du Coffret de
sélection de Géniemon inactif, une fois par période. Les ajouter à la main sur
un build reste possible : le champ est libre, la méthode ne fait que proposer
un point de départ.

## Où ça vit

- Champ `traits` sur une entrée `genimon` d'un build, dans
  `src/data/characters/builds/<perso>.json`. Clés de Trait
  (`UI_PetEntry_Title03`), jamais des libellés traduits.
- Le script de dérivation est dans `research_data/` : il propose, un humain
  relit, et seule sa sortie est versionnée.
- Rendu sur la fiche du personnage sous chaque Géniemon, et sur la fiche du
  Géniemon dans la liste des personnages qui l'emmènent.
