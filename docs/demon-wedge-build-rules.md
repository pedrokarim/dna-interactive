# Demon Wedges — mémo de règles pour builds cohérents

**Date :** 2026-06-18
**Objectif :** garder une référence exploitable pour créer, valider, importer et relire des builds Duet Night Abyss sans mettre des Demon Wedges incohérents.

## 1. Ce qu'est un Demon Wedge

Les Demon Wedges sont des équipements de build qui donnent des bonus aux personnages ou aux armes. Ils ne forment pas un seul pool universel :

- **Character Demon Wedges** : équipables sur un personnage.
- **Weapon Demon Wedges** : équipables sur une arme.

Un build sérieux doit donc toujours vérifier que le Wedge choisi correspond bien au support ciblé. Un Wedge prévu pour arme ne doit pas être traité comme un Wedge de personnage, et inversement.

### La règle d'éligibilité : `typeCompatibility.applicationType`

Un seul champ décide de ce sur quoi une pièce peut se poser :

| Type | Nb | Support autorisé |
| --- | --- | --- |
| `1` | 302 | **Personnage**, tous éléments (universel) |
| `11`–`16` | 238 | **Personnage d'un seul élément** — 11 Ombre · 12 Eau · 13 Feu · 14 Foudre · 15 Vent · 16 Lumière |
| `2`, `21`–`23`, `101`–`106` | 96 | **Arme de mêlée** |
| `3`, `31`–`35` | 91 | **Arme à distance** |
| `4`, `41`–`43` | 47 | Arme de mêlée **de consonance** (Ultra) |
| `5`, `51`–`53` | 41 | Arme à distance **de consonance** (Ultra) |
| = un `charId` | 1 | **Un personnage précis et lui seul** |

⚠️ Le dernier cas est un vrai piège : quand `applicationType` vaut un `charId`, la pièce est
**exclusive à ce personnage**. Aujourd'hui il n'y en a qu'une —
`Fengshi Type Ⅲ・Tracking Mode` (`mods-150401`), `applicationType = 1504` = **Su Yi**.
Tout personnage à pièce signature suivra ce schéma : ne jamais la proposer ailleurs.

### Combien de pièces, selon le support

| | Personnage | Arme normale | Arme de consonance |
| --- | --- | --- | --- |
| Emplacements | **8 + 1 centre** | **8**, pas de centre | **4**, pas de centre |
| Ouverts au départ | 4 | 4 | les 4 |
| Ouverture du reste | ascensions 1, 3, 4, 5 — centre à 2 | paliers 1, 2, 3, 4 | — |
| Piste imposée par la case | non (`-1`) | non (`-1`) | non (`-1`) |
| Cumul possible | `Covenanter's` à +5 | aucun | aucun |

Sources : `ModSlot` / `ModSlotUnlock` dans `Char_decompiled.lua` (9 entrées, identique pour
les 33 personnages), `Weapon_decompiled.lua` (8 entrées, 68 armes) et
`UWeapon_decompiled.lua` (4 entrées, 14 armes de consonance).

**Le centre n'existe que sur le personnage.** Un build d'arme n'a jamais de `centerItemId`.

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

Le centre sert d'ancre/condition de build. Ce sont les Wedges de type Quetzalcoatl
(`Feathered Serpent's`), et il en existe **deux tiers, tous deux valides** :

- **3★ génériques** (`mods-315xx`) : sans élément — Vigilance, Essor, Soutien, Esquive,
  Tumulte, Vrille, Rupture, Inflexible, Guérison, Roc, Ignition. Ce sont ceux que les
  guides publics recommandent sur les builds de progression, et plusieurs personnages les
  gardent en endgame.
- **4★/5★ élémentaires** : chaque élément expose **exactement deux** centres, un par
  polarité. Voir la table dans `src/lib/community-builds/center-wedges.ts`.

Plusieurs descriptions de ces Wedges centraux activent un effet seulement si une condition
est remplie, par exemple :

- avoir au moins 4 Demon Wedges d'une certaine affinité/polarité ;
- ou avoir tous les Demon Wedges équipés différents.

⚠️ Ces conditions ne sont **pas exposées dans nos données** (`passiveEffectsDescription`
est vide pour tous les centres) : elles viennent de l'observation en jeu. Ne pas les
affirmer comme certaines dans une note de build.

**Conséquence pratique :**

- Un Wedge extérieur de stat ou d'effet classique ne doit jamais être importé, exporté ou publié comme centre.
- Le builder filtre le picker du centre sur les IDs autorisés.
- La validation serveur refuse aussi un `centerItemId` qui n'est pas dans cette liste.

Liste technique actuelle : `CENTER_DEMON_WEDGE_ITEM_IDS` dans `src/lib/community-builds/center-wedges.ts` — **35 IDs** (11 génériques + 24 élémentaires).

> **Correction du 2026-08-11.** Ce mémo affirmait que les entrées `Pouvoir` n'étaient pas
> des centres valides. C'était faux : `Pouvoir` (EN « Spectrum ») est simplement le second
> centre de Fire et de Thunder, au même titre qu'`Éternité` ou `Vigueur` ailleurs. La liste
> ne contenait que 20 IDs et **refusait des builds légitimes**, y compris des builds livrés
> dans l'app. Les 4 `Pouvoir` et les 11 génériques 3★ ont été ajoutés.

## 3 bis. Règle de cumul : une seule famille est empilable

**On ne peut pas équiper deux fois le même Demon Wedge**, sauf s'il porte explicitement
cette clause dans `translations.<lang>.passiveEffectsDescription` :

> « Once upgraded to +#1, this Demon Wedge can be equipped in multiples. »
> (FR : « Une fois amélioré à +#1, ce Sceau démoniaque peut être équipé en plusieurs exemplaires. »)

Dans le catalogue actuel : **64 mods sur 829** portent cette clause, et ils appartiennent
**tous à la famille `Covenanter's`**. Toutes les autres familles — Typhon's, Griffin's,
Siren's, Bahamut's, Ifrit's, Summanus's, Hastur's, Helios's, Arbiter's, Phoenix's,
Sphinx's, Changeling's, Feathered Serpent's — sont **unique-only**.

Le doublon suppose la pièce montée **+5**. Un build qui empile doit donc le signaler.

**Wedges d'arme : aucun n'est empilable.** 0 des 288 wedges d'arme (Cerberus's, Lilith's,
Eldritch *, Fenrir's, Fafnir's, Pan's, Barbatos's) ne porte la clause. Deux fois la même
pièce sur une arme est donc **toujours** illégal.

Comment vérifier la liste :

```bash
node -e "
const m=require('./src/data/items/mods.items.json');
const s=m.filter(x=>/equipped in multiples/i.test(x.translations?.EN?.passiveEffectsDescription||''));
console.log(s.length, [...new Set(s.map(x=>x.translations.EN.demonWedgeName))]);
"
```

⚠️ **Limite actuelle de la validation** : `validateBuildReferences` ne vérifie que
l'unicité des **positions**, pas celle des `itemId`. Un doublon illégal passe donc encore
la validation serveur.

## 3 ter. Piège d'affichage : les icônes ne distinguent pas les Wedges

**828 mods sur 829 partagent leur icône** — 56 fichiers seulement pour tout le catalogue
(`T_Mod_Phoenix01.png` sert à 136 mods différents). Deux Wedges d'une même famille sont
donc **visuellement identiques** dans le builder.

Conséquence : un build qui « a l'air » de contenir deux fois la même pièce contient
probablement deux pièces différentes de la même famille. Toujours vérifier par `itemId`,
jamais à l'œil.

Cette liste doit être mise à jour si le catalogue révèle de nouveaux Wedges centraux valides.

## 4. Tolérance — chiffres réels

Chaque Demon Wedge a un coût (`tolerance.valuesByLevel`, +1 par niveau d'amélioration).
Chaque personnage a une **limite** : l'attribut `ModVolume`.

**Valeurs extraites de `LevelUp_decompiled.lua`** (courbe par niveau) :

> **limite = 19 + niveau** → **100 au niveau 80** (niveau max des personnages).

C'est ce qui explique le « /100 » affiché par les guides publics.

**Formule de coût** (validée : un build public annoncé à « 126/100 » se recalcule
exactement à 126 avec ce modèle) :

- piste du slot **alignée** sur la polarité de la pièce → coût **÷ 2** (arrondi au sup.) ;
- piste **non alignée** → coût **× 1,5** ;
- piste non renseignée → coût brut.

L'alignement des pistes n'est donc pas un détail : il fait passer un build de ~160 à ~90.
Un build dont les `track` sont laissés à `null` sera presque toujours hors limite.

**Disposition des cases** (`Char_decompiled.lua`) — identique pour les 33 personnages :

- `ModSlot = [-1 ×9]` : **aucune piste n'est imposée par la case**, le joueur est libre.
- `ModSlotUnlock = [0,0,0,0,1,3,4,5,2]` : 9 emplacements (8 + centre) ; 4 disponibles
  d'emblée, les autres s'ouvrent aux ascensions 1, 3, 4, 5, et le centre à l'ascension 2.

**Décision (2026-08-11) : on n'extrait PAS ces données.** La limite de tolérance est
dynamique — elle dépend du niveau du personnage — et le site expose déjà un sélecteur de
niveau côté lecteur (`CharacterDetailClient`, `ItemDetailClient`, via `levelup-curves`).
Un build est une **proposition** : c'est au joueur d'ajuster son niveau, pas à nous de
figer un plafond dans la donnée de build. `characters.json` n'expose donc que
atk/def/hp/es/sp, et c'est volontaire.

Ce qu'il faut retenir en pratique quand on écrit un build :

- se caler sur la limite du **niveau 80 (= 100)**, qui est le cas de référence ;
- **toujours renseigner les `track`** : un slot laissé à `null` coûte le prix brut au lieu
  de la moitié, et suffit à faire passer un build de ~90 à ~160.

Note : les références `T.RT_n` des Lua sont stockées **non résolues** dans nos JSON (ex.
`fields.ApplySlot: "T.RT_2"`). Elles restent utilisables comme discriminant, mais leur
valeur réelle est un tableau qu'il faut aller lire dans le fichier Lua d'origine — et la
table `T` est **locale à chaque fichier** (le `T.RT_2` de `Char` n'est pas celui de `Mod`).

## 5. Track / polarité

Les slots ont une piste, et les Demon Wedges ont aussi une piste/polarité.

Règle observée :

- si le Wedge correspond à la piste du slot, le coût de tolérance est réduit ;
- si le Wedge ne correspond pas, le coût augmente ;
- des **Track-Shift Modules** permettent de modifier la piste d'un Demon Wedge ;
- les modules de personnage et d'arme ne sont pas interchangeables.

Dans nos builds, `track` représente la piste réellement utilisée sur le slot.

⚠️ **`track` doit toujours être égal à la polarité du Wedge posé** (`affinity.id`).
Un `track` qui diffère n'est pas « un build qui suppose un ajustement » : c'est une
configuration strictement perdante, puisque le coût passe de **÷ 2** à **× 1,5**. Le
Track-Shift Module sert justement à ramener la piste sur la polarité de la pièce, pas
à l'en écarter. Un désalignement est donc toujours une erreur de saisie.

Piège observé : en remplaçant la pièce d'un slot sans recalculer son `track`, on laisse
la piste de l'ancienne pièce — les deux badges affichés sur la carte (polarité en haut
à droite, piste ajustée en bas à gauche) ne correspondent alors plus. C'est visible à
l'œil sur la fiche.

Contrôle :

```bash
node -e "
const fs=require('fs'),M=new Map(require('./src/data/items/mods.items.json').map(m=>[m.id,m]));
for(const f of fs.readdirSync('src/data/characters/builds').filter(x=>x.endsWith('.json')))
 for(const b of JSON.parse(fs.readFileSync('src/data/characters/builds/'+f,'utf8')))
  for(const s of b.demonWedges.slots)
   if(s.track!=null && s.track!==M.get(s.itemId)?.affinity?.id) console.log(f,'p'+s.position);
"
```

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
