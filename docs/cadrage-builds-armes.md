# Cadrage — Builds de Demon Wedges d'arme

**Date :** 2026-06-21
**Statut :** cadrage (à valider avant implémentation)
**Lié à :** `docs/demon-wedge-build-rules.md` (règles DW), `docs/cadrage-builder-communautaire.md` (builder communautaire)

## 1. Objectif & décision

Aujourd'hui un build ne configure que les Demon Wedges du **personnage**. Or, dans le jeu, les Demon Wedges sont **deux familles séparées et non interchangeables** : celles du **perso** et celles des **armes** (cf. `demon-wedge-build-rules.md` §1). On veut donc **un build de Demon Wedges par arme**, affiché in-app.

**Décision d'archi validée : « canonique par arme ».**
- Chaque arme a **un build DW officiel** (1 par arme), stocké comme donnée du projet.
- Il s'affiche **sur la fiche de l'arme**.
- Dans le **builder/les fiches de build perso**, pour chaque arme sélectionnée, on peut **choisir d'inclure ou non** le build DW de cette arme (toggle). On ne ré-édite pas les wedges d'arme à la main : on référence le build canonique.

## 2. Ce que les données permettent (vérifié)

Les Demon Wedges (`mods.items.json`) portent leur cible dans `typeCompatibility.textKeys` :

| Clé | Cible | Nb (≈) |
|---|---|---|
| `UI_Armory_Char` | wedge **perso** | 471 |
| `UI_Armory_Meleeweapon` | wedge **arme mêlée** | 95 |
| `UI_Armory_Longrange` | wedge **arme distance** | 84 |
| `UI_Armory_MeleeweaponUltra` | wedge **hyper-arme mêlée** | 47 |
| `UI_Armory_LongrangeUltra` | wedge **hyper-arme distance** | 41 |

→ On peut bâtir un **pool de wedges propre à chaque arme** (mêlée vs distance, normal vs ultra), filtré et **disjoint** des wedges perso. (`applicationType` corrèle aussi : 1‑5 = perso, 11‑16 = arme, etc. — mais `textKeys` est le signal propre.)

### Structure confirmée par l'UI du jeu (capture 2026-06-21)
L'écran « Sceaux démoniaques » d'une arme = **exactement la même disposition que le perso** : **8 cases extérieures + 1 centre**. Le **centre** = noyau d'**affinité** (« Modifier l'affinité ») et porte la **Tolérance** (ex. 100/100). Conséquences :
- **`DnaDemonWedgeEditor` est réutilisable tel quel** (8 + centre) — même schéma de slots que le perso.
- Vocabulaire des wedges d'arme distinct (Célérité, Fureur·Entrave, Fulgurance·Concentration, Limite, Concentration, Tranchant, Impact rapide, Âme tranchante, Pillage, Ascendant, Répression, Brutalité, Cycle·Entrave…).
- La **Tolérance** est une limite affichée, **non calculée** de notre côté.
- Le jeu gère des **« Ensembles »** (presets multiples par arme) → **hors périmètre** : on stocke un set canonique unique.
- Panneau **Attributs d'arme** à droite (ATQ tranchante, CRIT, DGT CRIT, vitesse d'attaque, chance de déclenchement, portée) → optionnel à afficher plus tard.

## 3. Modèle de données

### 3.1 Build d'arme canonique
Un fichier par arme (miroir des builds perso `src/data/characters/builds/`), ex. :
`src/data/weapons/builds/<weaponId>.json`

```jsonc
{
  "weaponId": "weapons-10402",
  "demonWedges": {
    "slots": [ { "position": 1, "itemId": "mods-XXXXX", "track": 1 } /* … 8 … */ ],
    "affinity": "Dark",          // CENTRE = affinité (élément), PAS un item wedge — confirmé §2/§7
    "note": { "FR": "…", "EN": "…" }
  },
  "note": { "FR": "…", "EN": "…" }
}
```
- `itemId` = un wedge **arme** (textKeys `Meleeweapon`/`Longrange`[`Ultra`]) **du bon type de classe** que l'arme.
- **Pas de `core`/centre item** : le centre de l'écran arme = *« Modifier l'affinité »* (sélecteur d'élément). On stocke juste `affinity` (clé d'élément). Aucun wedge d'arme n'est un « Quetzalcoatl ».
- Barrel `index.ts` comme pour les persos.

### 3.2 Référence dans un build (perso / communauté)
Par arme sélectionnée, un simple booléen d'inclusion (pas de copie des wedges) :
```jsonc
"weapons": { "melee": [ { "itemId": "weapons-10402", "rank": "best", "withWedges": true } ] }
```
- `withWedges` (défaut à décider) → l'UI déplie le build DW canonique de l'arme.
- Côté payload communauté : champ **optionnel**, validé serveur, n'altère pas l'existant.

## 4. Affichage in-app

1. **Fiche de l'arme** (`ItemDetailClient` weapons) : section « Build Demon Wedges recommandé » → réutiliser `DnaDemonWedgeEditor` en `readOnly` avec le pool d'arme.
2. **Fiche de build perso / modale** : sous chaque arme, si `withWedges`, déplier le build DW de l'arme (composant compact).
3. **Builder** : sous chaque arme sélectionnée, un toggle « Inclure le build DW de l'arme » (DnaSwitch). Pas d'édition des wedges d'arme en v1 (canonique).

## 5. Validation / règles

- Un wedge d'arme doit avoir `textKeys` arme (`Meleeweapon`/`Longrange`[`Ultra`]) **correspondant à la classe de l'arme** (mêlée/distance) ; **refuser** un wedge perso ou de classe opposée. (Analogue à la validation armes↔perso déjà en place.)
- Positions uniques, items du catalogue (mêmes garde-fous que les builds perso).
- Tolérance d'arme : **pas calculée** (comme pour le perso) — vérif manuelle, cf. `demon-wedge-build-rules.md` §4.
- Hyper-armes (`*Ultra`) : seulement pour les armes concernées (à mapper) — sinon pool normal.

## 6. Sourcing

- Matière = **Game8** (workflow officiel existant, cf. `research_data/docs/GUIDE_AJOUT_BUILD_PERSONNAGE.md`).
- ⚠️ **Jamais crédité dans le front** (pas de « Source: Game8 », pas d'URL game8.co dans les notes/UI/changelog) — règle de marque. La matière brute reste dans `research_data/` (non versionné).

### Recherche web (2026-06-21) — mécaniques confirmées
Sources publiques (allthings.how, gamewith, game8, lootbar, dtgre…) confirment :
- Demon Wedges = 2 types **perso / arme**, non interchangeables.
- **Tolérance** = cap par perso/arme, coût par wedge (augmente à l'upgrade) → **on ne la calcule pas**, on l'affiche comme info si dispo.
- **Track-matching** : wedge dans un slot de même track ⇒ coût de tolérance **divisé par 2** (notre champ `track`).
- **Track-Shift Modules** différents perso vs arme (cohérent avec « non interchangeables »).
- ⚠️ Certains guides disent « 6 slots » → **obsolète/partiel** (slots qui se débloquent en montant l'arme). La **capture jeu actuelle = 8 + centre** → on garde 8 + centre.
- À préciser en pratique : le **centre d'arme** est-il un **item wedge** (comme les Quetzalcoatl du perso) ou un simple **sélecteur d'affinité** (élément) ? → à lever en récupérant 1-2 builds réels.

## 7. Questions ouvertes (à résoudre avant/pendant l'implémentation)

1. ~~Nombre de slots / centre~~ → **RÉSOLU** : **8 cases + 1 centre**. Le centre = **affinité (élément)**, *pas* un item wedge (aucun « Quetzalcoatl » côté arme dans les données). Donc le build d'arme = 8 slots + `affinity`. `DnaDemonWedgeEditor` réutilisable (le centre affichera l'icône d'élément au lieu d'un mod).
2. **Hyper-armes** : quelles armes utilisent les wedges `*Ultra` ? (cf. `project_weapon_dupe_fusion_data` : 10299 / 20599.)
3. **Périmètre v1** : toutes les armes 5★ ? seulement celles citées dans les builds perso existants ? les armes « meta » d'abord ?
4. `withWedges` **par défaut à true ou false** ? (afficher d'office le build DW de l'arme, ou opt-in.)
5. Faut-il aussi une **priorité de stats** par arme, ou juste les wedges ?

## 8. Hors périmètre v1
- Édition libre des wedges d'arme dans le builder communautaire (on reste canonique).
- Calcul de tolérance.
- Builds d'arme proposés par la communauté (réservé aux builds officiels au début).

## 9. Étapes d'implémentation proposées
1. Helper de pool : filtrer les wedges arme par classe (mêlée/distance/ultra) depuis `textKeys`.
2. Schéma + dossier `src/data/weapons/builds/` + barrel + 2-3 armes pilotes (sourcées Game8) pour valider le modèle.
3. Affichage fiche arme (`DnaDemonWedgeEditor` readOnly).
4. Toggle + dépliage dans le builder / fiches de build perso (champ `withWedges`).
5. Validation serveur (wedge arme du bon type).
6. Étendre à toutes les armes du périmètre.
