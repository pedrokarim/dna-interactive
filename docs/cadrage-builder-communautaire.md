# Document de cadrage — Builder de builds communautaire

**Statut :** brouillon v2 — arbitrages tranchés (section 6)
**Date :** 2026-06-17
**Auteur :** Karim
**Décision attendue :** GO/NO-GO sur le v1 décrit ici

---

## 1. Contexte & objectif

Aujourd'hui les builds sont **statiques** : un fichier JSON par personnage dans
`src/data/characters/builds/`, rédigés par nous (source Game8 à l'origine),
résolus côté serveur (`src/lib/characters/builds.ts`) et affichés sur la fiche
perso.

**L'idée :** ouvrir la création de builds aux utilisateurs.
- Chaque utilisateur peut publier **jusqu'à 3 builds par personnage**.
- Connexion **Discord** (simplicité de gestion + identité unique).
- Un **builder** : choix du perso, des armes, des génimons, des MOD/Demon
  Wedges, et des consonances quand le perso en a.
- **Persistance des brouillons** (localStorage + base) pour le confort.
- **Votes + classement** des builds communauté.
- Un **back-office admin** léger (signalements + gestion utilisateurs).
- Extensibilité : absorber les futurs ajouts de contenu (persos, MOD, armes).

Étape ultérieure (Akatsune) : **calculateur de dégâts/stats** pour classer
finement les builds. → **Phase 2** (section 8).

---

## 2. Faisabilité technique — état des lieux

| Brique | Existe déjà ? | Détail |
|---|---|---|
| Base de données | ✅ **OUI** | Neon Postgres + Drizzle ORM (`src/db/`), déjà en prod pour les commissions. Init lazy serverless-friendly. |
| Schéma de build riche | ✅ **OUI** | `CharacterBuild` (armes melee/ranged, 8 Demon Wedges + centre, stats priority, génimons, skill priority, consonance, team, multi-élément). |
| Pipeline de résolution ID → affichage | ✅ **OUI** | `resolveItemRef(category, id)` résout `weapons-*`, `mods-*`, `genimon-*` → nom/icône/rareté/élément/polarité. **Réutilisable tel quel.** |
| Données maîtres (catalogue) | ✅ **OUI** | `src/data/items/{weapons,mods,genimons}.items.json` + `catalog.json`. |
| Composants d'affichage de build | ✅ **OUI** (lecture) | `CharacterDetailClient.tsx`, `QuickBuildModal.tsx` (export PNG). À adapter en version **éditable**. |
| Validation | ✅ **OUI** | Zod déjà utilisé (`/api/contact`). |
| i18n | ✅ **OUI** | next-intl (EN/FR). |
| **Authentification / comptes** | ❌ **NON** | Aucun login. **Seul vrai chantier d'infra à créer.** |

**Verdict de faisabilité : FAISABLE, confortablement.** Les deux points durs
habituels (base de données + modèle de build) sont déjà résolus. Le travail se
concentre sur : (a) l'auth Discord, (b) l'UI du builder, (c) les brouillons,
(d) les votes/classement.

---

## 3. Architecture proposée

### 3.1 Authentification Discord

- **Solution : Auth.js (NextAuth v5) + `@auth/drizzle-adapter`.**
  - S'intègre directement à Drizzle/Neon déjà en place.
  - Provider Discord OAuth (scope `identify`, `email` optionnel).
  - Crée les tables `users / accounts / sessions / verificationTokens`.
  - Session par cookie httpOnly, compatible App Router + serverless Vercel.
- **Pré-requis externe :** application Discord Developer Portal (Client ID +
  Secret, redirect `/api/auth/callback/discord`).
- En plus sur `users` : `role` (`user` | `admin`), `banned` (bool),
  `discordId`, `createdAt`.

### 3.2 Modèle de données (nouvelles tables Drizzle)

```
users            (Auth.js)  + role, banned, discordId
accounts         (Auth.js)
sessions         (Auth.js)
verificationTokens (Auth.js)

builds                              -- builds PUBLIÉS (communauté)
  id           uuid (pk)
  userId       fk → users
  characterId  text                 -- "char-aote"
  element      text | null          -- persos multi-éléments
  title        text                 -- nom du build (3–60 car., voir §3.4)
  note         text | null          -- note globale optionnelle (≤ 200 car.)
  payload      jsonb                -- config, IDs NON résolus (voir 3.3)
  voteCount    int  default 0       -- dénormalisé pour le tri/classement
  createdAt    timestamptz
  updatedAt    timestamptz
  -- limite métier : max 3 builds PUBLIÉS par (userId, characterId)
  --   → vérifiée en transaction côté API + index (userId, characterId)

build_drafts                        -- brouillons (1 par perso/élément/user)
  id           uuid (pk)
  userId       fk → users
  characterId  text
  element      text | null
  title        text | null          -- partiel autorisé tant que brouillon
  note         text | null
  payload      jsonb                -- état partiel du build
  updatedAt    timestamptz
  -- unicité (userId, characterId, element) -- 1 brouillon serveur par cible

build_votes                         -- 1 vote / user / build
  buildId      fk → builds
  userId       fk → users
  createdAt    timestamptz
  -- pk (buildId, userId)

build_reports                       -- modération réactive
  id, buildId fk, reporterId fk, reason, createdAt
```

> La limite « 3 publiés / perso » est un COUNT → garantie applicativement dans
> une transaction (pas une contrainte SQL pure). **Les brouillons ne comptent
> pas** dans cette limite.

### 3.3 Format du `payload` (JSONB)

On stocke une **version « brute »** (IDs uniquement), miroir de `CharacterBuild`
sans les champs résolus :

```jsonc
{
  "weapons": { "melee": [{ "itemId": "weapons-10402", "rank": "best" }],
               "ranged": [ … ] },            // ≤ 3 armes (best + alternatives)
  "demonWedges": {
    "slots": [{ "position": 1, "itemId": "mods-51335", "track": 2 }, …],  // 8
    "centerItemId": "mods-517xx",
    "affinity": "…"
  },
  "genimon": [{ "itemId": "genimon-4xxx", "rank": "best" }],   // ≤ 3
  "consonanceWeapon": { "slots": ["mods-55xxx", …] } | null,
  "statsPriority": ["ATK", "CritRate", …],
  "skillPriority": [{ "skillName": "…", "skillIndex": 1, "priority": 3 }],
  "team": [{ "characterId": "char-…", "role": "Support" }]
}
```

- Validé par un **schéma Zod** au submit (forme + bornes : 8 slots, ≤3 armes,
  ≤3 génimons…).
- Chaque `itemId` est **vérifié contre le catalogue** (anti-triche : ID
  inexistant refusé).
- À la lecture : même `resolveItemRef` que les builds officiels →
  **composants d'affichage réutilisés**.

> **Texte libre volontairement minimal** (cf. décision 6-A) : pas de notes
> par item ni par slot pour les builds communauté en v1. Seuls `title` et `note`
> global sont du texte libre, tous deux bornés.

### 3.4 Limites & garde-fous de saisie

- `title` : **requis, 3 à 60 caractères**, trim, refus si vide après trim.
- `note` (globale, optionnelle) : **≤ 200 caractères**.
- Filtre anti-grossièretés léger sur `title` (liste simple) — optionnel.
- Rate-limit création/édition par utilisateur (pattern déjà présent sur
  `/api/contact`).
- Tout le reste du build = données **structurées** (IDs) → surface d'abus quasi
  nulle, d'où l'absence de modération a priori.

### 3.5 Persistance des brouillons (local + serveur)

Objectif : ne **jamais** perdre le travail en cours, même hors connexion ou sur
plusieurs appareils.

**Deux couches :**
1. **localStorage** (instantané, marche même non connecté) — autosave *debounced*
   (~800 ms) à chaque modification du builder.
   Clé : `dna:builder:draft:<characterId>[:<element>]`.
2. **`build_drafts` en base** (si connecté) — sauvegarde *debounced* plus longue
   + sur navigation/fermeture. 1 brouillon serveur par (user, perso, élément).

**Réconciliation (source de vérité = le plus récent via `updatedAt`) :**
- Ouverture du builder → charge le brouillon local ; si connecté, récupère aussi
  le brouillon serveur.
- Les deux existent et **diffèrent** → on propose à l'utilisateur de garder le
  plus récent (« Brouillon plus récent trouvé sur cet appareil / sur ton
  compte — lequel reprendre ? »). Last-write-wins par défaut.
- **Connexion alors qu'un brouillon local existe** → proposition de l'importer
  sur le compte.
- **Publication** → le brouillon (local + serveur) est consommé puis supprimé,
  un `build` publié est créé.

> Choix assumé : pas de CRDT/merge champ-par-champ (sur-ingénierie ici). Le
> last-write-wins avec prompt en cas de conflit suffit largement pour un builder.

### 3.6 API (App Router, pattern `route.ts` déjà en place)

| Endpoint | Méthode | Rôle | Protection |
|---|---|---|---|
| `/api/auth/[...nextauth]` | — | OAuth Discord (Auth.js) | — |
| `/api/builds` | GET | Builds publics (filtre `characterId`, tri `top`/`recent`) | public |
| `/api/builds` | POST | Publier un build | connecté + limite 3 + Zod + check IDs |
| `/api/builds/[id]` | PATCH/DELETE | Éditer / supprimer | propriétaire ou admin |
| `/api/builds/[id]/vote` | POST/DELETE | Voter / retirer son vote | connecté (1/user) |
| `/api/builds/[id]/report` | POST | Signaler | connecté |
| `/api/drafts` | GET/PUT/DELETE | Brouillon serveur de l'utilisateur | connecté |
| `/api/admin/builds` | GET/PATCH | Masquer/supprimer, voir signalements | **admin only** |
| `/api/admin/users` | GET/PATCH | Bannir / promouvoir | **admin only** |

### 3.7 Builder UI (le gros morceau)

Page `/[locale]/builder` (et/ou modale depuis la fiche perso) :
1. **Choix du personnage** (réutilise la grille existante).
2. **Élément** si multi-élément (logique `getActiveCharacterView` déjà là).
3. **Sélecteurs d'items** (armes / génimons / MOD-Demon Wedges / consonances) :
   pickers avec recherche + filtres (rareté, élément, polarité), alimentés par
   les JSON du catalogue.
4. **Grille Demon Wedge éditable** : 8 slots + centre, choix de track (polarité).
5. **Consonances** : section affichée **uniquement** si le perso a une
   consonance (IDs `mods-55xxx`).
6. **Priorités stats & skills**, **équipe**, **nom + note**.
7. **Autosave brouillon** en continu (§3.5) + aperçu live + **export PNG**
   réutilisé (`QuickBuildModal`).

### 3.8 Lecture, votes & classement

Sur la fiche perso, onglet builds : **deux tiers distincts**
- **Build officiel** : nos guides actuels (badge « Officiel »).
- **Alternatives communauté** : liste **triable par votes (classement)** ou par
  date, avec auteur Discord (pseudo + avatar), date, compteur de votes.

Système de votes :
- **Upvote simple** (1 vote par utilisateur par build, retirable).
- Tri « Top » = `voteCount` décroissant (dénormalisé pour la perf).
- Possibilité d'une **page classement** globale ou par perso (« meilleurs builds
  communauté »). Affinage par décroissance temporelle = phase 2.

### 3.9 Admin / back-office (léger)

- Garde d'accès `role === 'admin'` (middleware + check serveur).
- File des **signalements** : masquer / supprimer un build, bannir l'auteur.
- Gestion utilisateurs : bannir, promouvoir admin.
- **Extensibilité contenu :** rien à coder pour les « nouveaux traits/persos » —
  items et persos viennent du **pipeline d'extraction JSON** ; le builder
  consomme les nouveaux IDs dès qu'ils sont dans `src/data/`. Aucune migration
  par ajout de contenu.

### 3.10 Prototypage Storybook-first

Le projet dispose déjà d'un **Storybook 10** (`@storybook/nextjs-vite`, lancé via
`bun run storybook`) et d'une bibliothèque **`src/components/dna/`** (~29
composants, 31 stories). On **prototype les nouveaux éléments du builder en
stories isolées** (avec données fixtures) **avant** de les câbler à l'API/aux
données réelles — on valide look + interactions sans dépendre de l'auth ni de la
base.

**Conventions à respecter** (cf. stories existantes) :
- `import type { Meta, StoryObj } from "@storybook/nextjs-vite";`
- `title: "DNA/<Catégorie>/<Nom>"`, `tags: ["autodocs"]`.
- Composants préfixés `Dna*` dans `src/components/dna/`, exportés via le barrel.
- **Règles visuelles non négociables** : coins **nets** partout (seuls les vrais
  cercles restent ronds), vrais composants DS (pas de `div` recolorées),
  vraies icônes du jeu (pas les glyphes des protos).

**Inventaire composants — réutiliser vs prototyper :**

| Brique builder | Réutilise (DNA existant) | À prototyper (nouveau) |
|---|---|---|
| **ItemPicker** (recherche + filtres rareté/élément/polarité) | `DnaField`, `DnaChip`, `DnaTag`, `DnaRarityStars`, `DnaElementBadge`, `DnaTile`, `DnaTooltip` | `DnaItemPicker` (grille filtrable + sélection) |
| **Slots armes / génimons** (≤3, best/alt) | `DnaTile`, `DnaBadges` (rang), `DnaButton` | `DnaSlotRow` (emplacements + ajout/retrait) |
| **Grille Demon Wedge éditable** (8 + centre, track) | `DnaTile`, `DnaElementBadge`, `DnaSegmented` (choix track) | `DnaDemonWedgeEditor` (réutilise la dispo de la carte de build existante) |
| **Consonances** (4 slots, conditionnel) | `DnaTile`, `DnaSectionLabel` | `DnaConsonanceEditor` |
| **Priorités stats / skills** (ordonnables) | `DnaStatRow`, `DnaChip`, `DnaStepper` | `DnaPriorityList` (réordonnable) |
| **Équipe** | `DnaCharacterCard`, `DnaAvatar` | `DnaTeamPicker` |
| **Nom + note** (avec compteur de car.) | `DnaField` | extension compteur/limite |
| **Carte de build communauté + vote** | `DnaPanel`, `DnaAvatar`, `DnaPill`, `DnaButton` | `DnaCommunityBuildCard`, `DnaVoteButton` |
| **Indicateur d'autosave brouillon** | `DnaPill` | `DnaDraftStatus` (sauvegardé/en cours/erreur) |

> ⚠️ La **disposition Demon Wedge** (grille qui imite le jeu + sceau central) et
> la **carte de build** existent déjà (`QuickBuildModal`/`ResponsiveQuickBuildCard`)
> et sont sur la liste « à conserver, ne pas casser ». L'éditeur DW **part de
> cette dispo** plutôt que d'en réinventer une.

---

## 4. Réutilisation vs. création

| À réutiliser tel quel | À créer |
|---|---|
| Neon + Drizzle, pattern API, Zod | Auth.js Discord + tables comptes |
| `resolveItemRef` + catalogue items | Tables `builds` / `drafts` / `votes` / `reports` |
| Schéma `CharacterBuild` (référence) | Schéma Zod du `payload` + validation IDs |
| Composants d'affichage + export PNG | **Builder UI éditable** (pickers, grille) |
| Rate-limit `/api/contact` | Persistance brouillons (local + sync serveur) |
| i18n next-intl, design system DNA | Votes/classement + back-office admin |

---

## 5. Risques & points d'attention

- **UGC = responsabilité.** Même avec peu de texte libre, prévoir CGU/mentions
  + bouton signalement (déjà au plan). Charge de modération faible par design.
- **Spam / abus.** Login Discord + rate-limit + limite 3/perso + 1 vote/user.
- **RGPD.** Données Discord (id, pseudo, avatar) → page vie privée + suppression
  compte/builds/brouillons.
- **Cohérence des données.** Item disparu d'une extraction future → rendu
  « item inconnu » gracieux.
- **Conflits de brouillon.** Géré par last-write-wins + prompt (§3.5).
- **Périmètre du builder.** Écran le plus coûteux ; tenir la portée v1 (pickers
  simples mais solides, pas de drag&drop fancy).

---

## 6. Décisions tranchées

- **A. Modération → allégée (pas de file a priori).** Seul texte libre = `title`
  (3–60 car.) + `note` optionnelle (≤200). Validation stricte des IDs + bouton
  signalement réactif + admin peut masquer/bannir. ✅
- **B. Armes & génimons → ≤ 3 chacun, modèle best/alternatives** (cohérent avec
  le schéma actuel et avec le génimon que tu valides). ✅
- **C. Officiel vs communauté → deux tiers.** Nos guides Game8 = « Officiel » ;
  builds users = « Alternatives communauté ». ✅
- **D. Votes & classement → DANS le v1.** Upvote simple + tri Top/Récent. ✅
- **E. Calculateur de dégâts → phase 2.** ✅
- **F. Brouillons → persistance hybride** localStorage + `build_drafts`, sync
  last-write-wins. ✅

---

## 7. Découpage en lots & estimation indicative

| Lot | Contenu | Estimation |
|---|---|---|
| **0 — Auth** | Auth.js Discord, tables comptes, session, garde admin | 1–2 j |
| **1 — Données & API** | Tables builds/drafts/votes/reports, Zod payload, CRUD, limite 3, validation IDs, rate-limit | 2–3 j |
| **2a — Protos Storybook** | Stories isolées des nouveaux composants (`DnaItemPicker`, `DnaDemonWedgeEditor`, `DnaSlotRow`, `DnaPriorityList`…) avec fixtures, validation look/interactions | 2–3 j |
| **2b — Builder UI** | Câblage des composants validés aux données réelles + état, consonances conditionnelles, nom/note, aperçu | 3–4 j |
| **3 — Brouillons** | Autosave localStorage + sync `build_drafts` + réconciliation/prompts | 1–2 j |
| **4 — Lecture + votes** | Onglet officiel/communauté, vote, tri/classement | 2–3 j |
| **5 — Admin** | Back-office signalements + users | 1–2 j |
| **6 — Finitions** | i18n, RGPD/CGU, rendu gracieux items manquants, filtre nom | 1–2 j |

**Total v1 :** ~**13–21 j** de dev (≈ 3 à 4 semaines selon disponibilité).
Le lot 2 (builder) concentre l'essentiel de l'effort et du risque ; le prototypage
Storybook (2a) le dérisque en validant l'UI avant tout câblage.

---

## 8. Hors périmètre (phase 2+)

- **Calculateur de dégâts/stats** + classement pondéré (décroissance temporelle).
- Commentaires, favoris de builds communauté.
- Fork/dérivation d'un build existant.

---

## 9. Verdict

**Idée faisable et bien alignée avec l'existant.** L'infra critique (DB, schéma
de build, résolution d'items, validation) est déjà là. Nouveaux chantiers :
**auth Discord** (standard, faible risque), **builder UI** (coûteux mais
cadrable), **brouillons** et **votes/classement** (modérés). Modération
volontairement légère grâce à un format quasi 100 % structuré.

Recommandation : **GO sur le v1 décrit ici.** Prochaine étape une fois ce
cadrage validé : **plan d'implémentation détaillé lot par lot** (schémas Drizzle
précis, schéma Zod du payload, arbo des composants du builder).

---

## 10. Partage de build — lien + image (proposition)

> Origine : suggestion communauté (Akatsune) — *« un truc qui génère un lien à
> partager ou une image à partager pour se passer les builds »*.

### Ce qui existe déjà
- **Image** : export **PNG** de la carte de build (`QuickBuildModal` /
  `QuickBuildAccordion` via `html-to-image`), disponible sur les builds
  **officiels** et **communauté** (carte partageable dans l'aperçu).
- **Lien** : **permalien** des builds **publiés** (`?communityBuildId=…` +
  bouton « Copier le lien »), plus **import/export JSON/XML** depuis le builder
  et liens builder `?importBuildId=` / `?editBuildId=`.

### Le manque visé
Pouvoir partager un build **directement depuis le builder**, y compris **en
cours / non publié** et **sans compte** — sans devoir d'abord publier.

### A. Lien partageable
Deux options, complémentaires :

| Option | Principe | + | − |
|---|---|---|---|
| **A1 — lien auto-portant (recommandé)** | Encoder le payload (IDs only) compressé en base64url dans l'URL/hash : `/builder?b=<payload>`. À l'ouverture, le builder décode et pré-remplit. | Pas de DB, instantané, marche **sans compte**, réutilise le schéma import/export existant | URL longue (mitigeable : compression `deflate`), pas de stats |
| **A2 — build « non listé »** | Créer une entrée DB `status='unlisted'` avec un id court → `/builds/<id>` non indexé, révocable. | URL courte, révocable, stats possibles | Nécessite **connexion** + écriture DB |

Reco : **A1 pour le partage rapide** (couvre le cas « se passer un build »
entre amis, sans compte) ; A2 en complément pour les connectés qui veulent un
lien court/stable.

### B. Image partageable
Quasi acquis : il suffit d'**exposer l'export PNG dans le builder** pour le build
en cours (aujourd'hui le builder n'a que JSON/XML ; le PNG existe côté affichage).
Nécessite un petit **adaptateur `payload → CharacterBuild`** pour réutiliser
`QuickBuildCard` (déjà noté comme reste mineur du lot 2b). Bonus possible :
bouton « copier l'image dans le presse-papier » en plus du téléchargement.

### Effort indicatif
- **A1** (encodage/décodage URL + bouton « Copier le lien » dans le builder) : ~0,5–1 j.
- **B** (PNG depuis le builder via adaptateur) : ~0,5–1 j.
- **A2** (non listé en DB) : ~1 j (table/flag + route + révocation).

### Statut
**Amélioration proposée (phase 2 / quick-win).** A1 + B sont peu coûteux et à
forte valeur d'usage ; A2 optionnel. À valider avant planification.
