# Demon Wedges — mémo de règles pour builds cohérents

**Date :** 2026-06-18
**Objectif :** garder une référence exploitable pour créer, valider, importer et relire des builds Duet Night Abyss sans mettre des Demon Wedges incohérents.

## 1. Ce qu'est un Demon Wedge

Les Demon Wedges sont des équipements de build qui donnent des bonus aux personnages ou aux armes. Ils ne forment pas un seul pool universel :

- **Character Demon Wedges** : équipables sur un personnage.
- **Weapon Demon Wedges** : équipables sur une arme.

Un build sérieux doit donc toujours vérifier que le Wedge choisi correspond bien au support ciblé. Un Wedge prévu pour arme ne doit pas être traité comme un Wedge de personnage, et inversement.

Source : Game8 indique que les Demon Wedges sont séparés entre personnage et arme, et que seuls les Wedges du bon type peuvent être équipés.

## 2. Anatomie d'un build Demon Wedge

Dans notre modèle de build personnage, on manipule :

- **8 slots extérieurs** : les Demon Wedges principaux du personnage.
- **1 slot central** : le Wedge central, qui n'est pas un slot normal.
- **Un ajustement de track/polarité par slot** : stocké via `track` quand le build force une piste différente.
- **Une affinité/élément de build** : stockée dans `demonWedges.affinity`.

Le format applicatif est volontairement basé sur des IDs :

```json
{
  "demonWedges": {
    "slots": [
      { "position": 1, "itemId": "mods-51724", "track": 4 }
    ],
    "centerItemId": "mods-51746",
    "affinity": "Fire"
  }
}
```

Les positions extérieures sont **1 à 8**. Une position ne doit pas être dupliquée.

## 3. Règle importante du slot central

Le slot central n'accepte **pas n'importe quel Demon Wedge**.

Le centre sert d'ancre/condition de build. Les centres autorisés dans le builder sont les Wedges de type Quetzalcoatl comme `Décision de Quetzalcoatl`, `Vigueur de Quetzalcoatl`, `Ténacité de Quetzalcoatl` ou `Éternité de Quetzalcoatl`.

Plusieurs descriptions de ces Wedges centraux activent un effet seulement si une condition est remplie, par exemple :

- avoir au moins 4 Demon Wedges d'une certaine affinité/polarité ;
- ou avoir tous les Demon Wedges équipés différents.

**Conséquence pratique :**

- Un Wedge extérieur de stat ou d'effet classique ne doit jamais être importé, exporté ou publié comme centre.
- Les entrées appelées `Pouvoir` ne sont pas des centres valides dans notre builder, même si leur asset ressemble aux autres Quetzalcoatl.
- Le builder filtre le picker du centre sur les IDs autorisés.
- La validation serveur refuse aussi un `centerItemId` qui n'est pas dans cette liste.

Liste technique actuelle : `CENTER_DEMON_WEDGE_ITEM_IDS` dans `src/lib/community-builds/center-wedges.ts`.

Cette liste doit être mise à jour si le catalogue révèle de nouveaux Wedges centraux valides.

## 4. Tolérance

Chaque Demon Wedge a une valeur de **Tolerance**. Chaque personnage ou arme a une **Tolerance Limit**.

Règle de build :

- additionner le coût de tolérance des Wedges équipés ;
- ne pas dépasser la limite du personnage ou de l'arme ;
- tenir compte de l'évolution du personnage/arme, car les slots et la limite progressent avec les niveaux/ascensions.

Notre builder ne calcule pas encore la tolérance complète. Donc, pour un build généré automatiquement, il faut au minimum éviter les choix absurdes et garder une note de vérification manuelle si la donnée de tolérance n'est pas disponible côté catalogue.

## 5. Track / polarité

Les slots ont une piste, et les Demon Wedges ont aussi une piste/polarité.

Règle observée :

- si le Wedge correspond à la piste du slot, le coût de tolérance est réduit ;
- si le Wedge ne correspond pas, le coût augmente ;
- des **Track-Shift Modules** permettent de modifier la piste d'un Demon Wedge ;
- les modules de personnage et d'arme ne sont pas interchangeables.

Dans nos builds, `track` représente la piste réellement utilisée sur le slot. Quand `track` diffère de la polarité naturelle de l'item, il faut considérer que le build suppose un ajustement.

## 6. Méthode pour créer un build cohérent

1. Choisir le personnage et son élément actif.
2. Identifier son rôle : DPS, support, survie, application élémentaire, buff, etc.
3. Choisir les armes melee/ranged compatibles avec le rôle.
4. Choisir le Wedge central parmi les centres valides uniquement.
5. Construire les 8 Wedges extérieurs autour de la condition du centre.
6. Respecter les pistes/polarités quand possible pour limiter la tolérance.
7. Éviter les duplications sans raison : si un effet exige des Wedges différents, ne pas dupliquer.
8. Ajouter les Geniemons et priorités de stats en cohérence avec le rôle.
9. Vérifier les consonances d'arme séparément : ce ne sont pas les mêmes slots que les Demon Wedges personnage.

## 7. Import / export

Le builder accepte seulement :

- JSON ;
- XML.

Un import doit être rejeté si :

- le schéma n'est pas `dna.community-build` ;
- la version n'est pas supportée ;
- le fichier est trop gros pour un build ;
- le personnage, les armes, les Wedges ou les Geniemons n'existent pas dans le catalogue local ;
- l'élément ne correspond pas au personnage ;
- deux Demon Wedges utilisent la même position ;
- le centre n'est pas un Wedge central autorisé.

Le XML contient le même payload validé que le JSON. Le XML n'est pas un format libre pour injecter une autre structure.

## 8. Sources consultées

- Game8 — How to Equip Demon Wedges : https://game8.co/games/Duet-Night-Abyss/archives/561636
- Game8 — Track-Shift Modules : https://game8.co/games/Duet-Night-Abyss/archives/563663
- Game8 — List of All Demon Wedges : https://game8.co/games/Duet-Night-Abyss/archives/557228
- Boarhat — Build Planner DNA : https://boarhat.gg/games/duet-night-abyss/tools/build-planner/
- Steam Community — discussion de build/mods : https://steamcommunity.com/app/3950020/discussions/0/597415740309653916/

## 9. Points encore à améliorer dans l'app

- Ajouter un calcul de tolérance complet si les valeurs sont exposées proprement dans les données.
- Afficher plus explicitement la compatibilité track/polarité dans le builder.
- Séparer visuellement les Wedges centraux du reste du catalogue dans l'admin/catalogue.
- Ajouter une commande de vérification de builds qui audite tous les fichiers statiques et tous les builds publiés en base.
