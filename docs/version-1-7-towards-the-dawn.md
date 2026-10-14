# Version 1.7 « Towards the Dawn » – ce qui est annoncé

Relevé du 14 octobre 2026, à partir des seules sources officielles (compte X
`@DNAbyss_EN`, rubrique News du site officiel, PV de version). Chaque ligne
indique son niveau de fiabilité :

- **daté** – période publiée officiellement, au jour près ;
- **annoncé** – montré ou écrit officiellement, mais sans date ;
- **déduit** – tiré d'indices officiels concordants, jamais publié tel quel.

Rien ici ne vient d'un site tiers, et le front n'en crédite aucun.

## Calendrier

| Quoi | Statut | Détail |
|---|---|---|
| Sortie de la 1.7 | **déduit** : 20 octobre 2026 | Aucune date officielle au 14 octobre. Mais tous les événements 1.6 ferment le 19 octobre à 17:00 ou le 20 octobre à 05:00 (UTC+8), le passe « Rimeveil Nocturne » est disponible « jusqu'au 20 octobre », et « A Flame Rekindled » se présente comme l'annonce de la « nouvelle version ». La 1.6 était sortie un mardi, six semaines plus tôt (8 septembre) : le 20 octobre est aussi un mardi, six semaines après. |
| A Flame Rekindled | **daté** : 15 octobre 10:00 – 27 octobre 05:00 (UTC+8) | Connexion 5 jours différents : Sabliers immaculés, Indices de Mandat scellé, Carmine Globules, Luno Memento, pièces. Prérequis : chapitre Noctoyager « Head to the House Mentioned by the Girl » et fonction Événements. **Dans `CALENDAR_EVENTS`.** |
| Capriccio of Whimsy | **daté** (1.6) | Bannière de skins Berenica et Psyche, déborde sur la 1.7 jusqu'au 9 novembre à 17:00. |

Tout le reste du programme ci-dessous attend ses dates : il entrera dans
`CALENDAR_EVENTS` à la publication des notes de version (Steam, `allnews`) ou
des annonces d'événement, jamais avant.

## Nouveau personnage : Rhythm: Flamewrought

- **Titre** : « First-Light Farer » (en jeu, `{ First-Light Farer }`).
- **Élément** : Electro (icône éclair sur l'affiche officielle, post « Art of
  Combat | Electro »).
- **Doublage anglais** : Sophie Colquhoun.
- **Obtention** : gratuite via les Covert Commissions (Mandats scellés), ou
  achat de fragments en boutique. Le PV la montre en récompense du théâtre
  immersif (« New Character Available – Rhythm: Flamewrought ») : même schéma
  que Falsi en 1.6, rotation datée à attendre.
- **Arme de prédilection** : « Blessed Burden », son « objet le plus précieux »
  selon sa fiche officielle.
- **Fiche officielle** : identité « Wanderer » ; aime sa famille, ses amis, les
  choses symétriques ; déteste la 6ᵉ Légion.
- **Histoire** : ancienne adjudante (Warrant Officer) de l'Escorte, à Icelake.
  Elle quitte l'armée après que la 6ᵉ Légion a englouti un proche sous de fausses
  promesses (Blues) ; elle se donne à elle-même la commission d'y mettre fin :
  « les Charons étaient des citoyens de l'Empire, pas des sujets d'expérience ».
- **Variante d'un personnage existant** : Rhythm est déjà au catalogue
  (`char-lise`, Electro, 5★). « Flamewrought » est annoncée comme *New
  Character* : à l'extraction, vérifier si le jeu la déclare comme un personnage
  distinct (nouveau `charId`) ou comme une forme du même, avant de décider entre
  fiche séparée et groupe multi-élément (`MULTI_ELEMENT_GROUPS`).

Visuels officiels conservés hors dépôt (cf. plus bas) : affiche « Flamewrought »
(1920×1080), fiche « Path to Inner Light », fiche personnage et notes d'histoire
du site officiel.

## Armes

| Arme | Type | Obtention | Statut |
|---|---|---|---|
| Blessed Burden | Grenade (榴炮) | Forge gratuite ou boutique | **annoncé** (« Ironcast Project », 14 octobre) |
| The Hatter's Banquet | Arc (d'après le visuel) | – | **annoncé** (PV) |
| Endless Enigma | Épée, **arme de calamité** | – | **annoncé** (PV) |

Blessed Burden – description : « To live on is a blessing the living must
bear. » Forge : Blueprint: Blessed Burden, Blessed Burden: Bolt, Frame,
Barrel, pièces et Bomb. Amélioration : pièces, Vermilion Teardrop, Chain,
Weapon Component: Frame et Bolt.

## Intron VII : Zhiliu et Yuming

Annoncé le 13 octobre (news officielle 9421).

- **Zhiliu** – « Confluence of Kairos » : enchaîner la même compétence de
  combat ou ultime donne 1 cumul de [Hexagram] (+6 % de vitesse de compétence,
  les dégâts de compétence ignorent 6 % de la DÉF, 10 s, 5 cumuls max). Au
  maximum, la durée de [Four Realms Align] est suspendue ; [Zhen-Xun
  Convergence] consomme 1 cumul de [Electro Disruption] de la cible pour
  augmenter son multiplicateur de [600 % × Overflow Intensity].
- **Yuming** – « Sinless Cagedman » : [Starstorm Descent] donne à Yuming et aux
  alliés autant de cumuls de [Xuanjiao's Blessing] que de personnages Electro
  dans l'équipe (10 s, 3 max). Chaque cumul : +30 % de Moral et +12,5 % de
  dégâts Electro ; à 2 cumuls, +20 % de pénétration ; à 3, Xuanjiao absorbe les
  dégâts de PV subis par les alliés autres que Yuming.
- **Déblocage** : Intron VI atteint, puis 30 Pensées du personnage, 1 Pensée
  d'essence, 2 Twilight Tread, 5 matériaux de compétence or et 20 matériaux
  d'ascension or.
- **Pensée d'essence** : en vente limitée au Memento du théâtre immersif contre
  des [Repertoire Keepsake] (1 par acte 6 et 12 de l'[Immortal Repertoire] en
  cours, perdus à la fin du théâtre) ; elle passe au Memento permanent, contre
  des [Repertoire Ticket], à la version suivante.
- **Matériaux d'ascension or** : plans obtenus par la quête [Return to Snow]
  (Journey Across the Lands · Where the Wind Rises – A Visitor to Haojing), puis
  forge.

Le site déduit déjà le 7ᵉ intron (`UltraPassive`, cf. `catalog.ts`) : ces deux
effets arriveront avec l'extraction 1.7.

## Cosmétiques (PV)

- **Myriade « Threads Between Reverie »** (nouvelle) : skin « Veil In
  Shadows » de Rhythm: Flamewrought, avec vitrine d'amélioration ; skin d'arme
  « Bones in Blossom » ; posture « Crescent Wishes ».
- **Atelier of Candy Dreams** : événement cosmétique d'Halloween, récompenses
  dont la gamme limitée « Treats Galore ».
- **Reruns de Myriade** : « Volant Viridity » (Su Yi) et « Fading Echoes
  Adrift ».
- **Civic Ordinance** : nouvelle vague de la gamme thématique à durée limitée.
- Skin d'arme « Cosmic Invitation », effet de Demon Wedge à variante de
  mouvement « Whirling Crescent », monture « Throne of Contemplation: Leaden
  Grey ».

## Événements (PV, sans dates)

| Événement | Ce qu'en dit le PV |
|---|---|
| The Flame She'll Be | Histoire de Rhythm : « sous le phare éteint, le vent d'Icelake reste glacial ; elle frappe aux portes et apporte la chaleur à ceux qui sont dedans ». |
| Nocturnal Evermore | Défi : « vaincre le cauchemar qui ne finit jamais », affronter des ennemis redoutables pour des récompenses. |
| As Tomorrow Nears | Connexion 7 jours (Sabliers immaculés, ×3 le 7ᵉ jour). |
| Immersive Theatre | Rotation avec Rhythm: Flamewrought en récompense. |
| Vibrant Strokes | Collectionner des skins éligibles pour gagner des points et débloquer des récompenses. |
| Friendly Games | Lulu Lunoloot propose un défi avec mise à la clé. |
| Bountiful Day | Taux de drop de Demon Wedges augmentés sur les commissions du Manuel du Noctoyager. |
| Immersive Theatre: Ensemble Act | Coop du théâtre immersif. |
| Starry Sojourn | Temps de jeu cumulé en zone coopérative. |
| Phoxhunter Summit | Marqué « New Gameplay » : formule revue. |

Un événement génimon apparaît aussi dans le PV, sans titre lisible.

## Médias récupérés

Hors dépôt, dans `research_data/official-v1.7/` (ignoré par git) :

- `rhythm-flamewrought-keyart.webp` (affiche 1920×1080) et
  `rhythm-flamewrought-keyart-crop.webp` (recadrage 16:9 sans le texte, prêt
  pour une barre de la frise ou une carte) ;
- `rhythm-flamewrought-profile.webp`, `blessed-burden.webp`,
  `a-flame-rekindled.webp`, `intron-7-preview.webp` ;
- `news-9419-*`, `news-9421-*`, `news-9424-*` : les longues images des
  articles du site officiel (fiche, histoire, intron, forge) ;
- `pv-frames/` : un plan 2560×1440 par carton du PV (Myriade, événements,
  armes). **Ne pas reprendre** les plans d'« Atelier of Candy Dreams » où un
  disque orange masque une partie de l'image : c'est dans la vidéo d'origine.

Dans le dépôt : `public/assets/events/a-flame-rekindled.webp` (1600×900).

## Sources officielles

- PV de version : <https://x.com/DNAbyss_EN/status/2109464074065264792>
- Rhythm, « Path to Inner Light » : <https://x.com/DNAbyss_EN/status/2109524467831414810>
  et news 9419 du site officiel
- Rhythm, « Art of Combat » : <https://x.com/DNAbyss_EN/status/2109886853939909087>
- Intron VII : <https://x.com/DNAbyss_EN/status/2109932166788608243>, news 9421
- Blessed Burden : <https://x.com/DNAbyss_EN/status/2110203946069291086>, news 9424
- A Flame Rekindled : <https://x.com/DNAbyss_EN/status/2110219043135258965>

Les news du site officiel se lisent par son API, la page étant rendue en
JavaScript : `POST https://duetnightabyss.dna-panstudio.com/api/common/get-content-detail.html`
avec `id=<n>`. Les identifiants sont croissants ; ceux de la 1.7 commencent à
9418. La liste (`get-list.html`, `id=<catégorie>`) est figée depuis avril et ne
les montre pas : sonder les identifiants un à un.

## À faire à la sortie

1. Notes de version Steam (`allnews`) : dater chaque événement ci-dessus, puis
   `/maj-calendrier`.
2. Extraction 1.7 : Rhythm: Flamewrought, ses compétences, Blessed Burden,
   The Hatter's Banquet, Endless Enigma et son arbre de Potentiel, les deux
   Intron VII.
3. Accueil : portrait vedette et `NewCharactersBanner` à partir des visuels
   ci-dessus et du buste extrait.
