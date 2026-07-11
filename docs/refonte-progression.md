# Refonte layout — suivi des conversions

> Suivi au fil de l'eau de la migration des pages vers le nouveau layout hub
> (`AppShell` + gabarit pleine largeur, plus de contenu centré, aucune pub).
> Cadre & décisions : `docs/refonte-placements-listes.md` + mémoire projet
> `project_dashboard_layout_refonte`.
>
> Légende statut : ✅ fait · 🔜 en cours · ⏳ à faire · ➖ inchangé (volontaire)

## Socle
- ✅ `AppShell` — sidebar persistante repliable + topbar + footer (`src/components/site/AppShell.tsx`)
- 🔜 `ListPageShell` — gabarit page liste (en-tête eyebrow + titre + compteur équerres, recherche, filtres, grille)

## Pages

| Page | Route | Statut | Notes |
|---|---|---|---|
| Home hub | `/home-poc` | ✅ | Nouvelle home (deviendra `/`). Box image+dégradé+teinte. Sections calquées sur la réf : Hero, Base de données, Outils, Communauté, **Codes cadeaux** (copier), **Calendrier des événements** (Gantt), **Builds de personnages** (carrousel), stats. Pubs supprimées ; Suivi/Guides/Plans d'usine/projet frère non repris (pas de système équivalent). |
| Home marketing | `/` (actuelle) | ➖ | Conservée → future page marketing/fonctionnalités. Garde son chrome. |
| Carte interactive | `/map` | ➖ | Ne bouge quasi pas (volontaire). |
| Personnages (liste) | `/characters` | ✅ | **Pilote** du gabarit liste. `characters/layout.tsx` → `AppShell` pleine largeur ; en-tête reskiné (eyebrow mono + titre + compteur équerres) ; logique filtres/grille inchangée ; grille simplifiée → 6 col en 2xl. |
| Personnage (fiche) | `/characters/[id]` | ✅ | Hérite `AppShell` du layout ; rend en pleine largeur (compteur `#id`, panneau stats). Aucun `<main>` propre → pas de conflit. |
| Base de données (hub) | `/items` | ✅ | `items/layout.tsx` → `AppShell` (breadcrumb `//GEAR.DATABASE`) ; en-tête gabarit + compteur catégories en équerres ; grille catégories 4 col en 2xl. |
| Items (catégorie) | `/items/[category]` | ✅ | `ItemsGridClient` : en-tête reskiné en gabarit + compteur en équerres ; logique filtres/tri/pagination inchangée. |
| Item (fiche) | `/items/[category]/[itemId]` | ✅ | Hérite `AppShell` ; rend en pleine largeur (compteur `#id`, stats, build DW). |
| Guide catégorie | `/items/[category]/about` | ✅ | Hérite `AppShell`. Pas de `<main>` propre. |
| Plans de forge | `/items/drafts` (+ `[draftId]`) | ✅ | Hérite `AppShell`. |
| Favoris | `/items/favoris` | ✅ | Hérite `AppShell` ; `ItemsGridClient` (en-tête déjà en gabarit). |
| Builder | `/builder` | ✅ | `page.tsx` → `AppShell` (//BUILD.FORGE), pleine largeur. |
| Builds communauté | `/builds` | ✅ | `page.tsx` → `AppShell` (//SHARED.LOADOUTS), pleine largeur. En-tête `DnaSectionLabel` conservé (à harmoniser en gabarit plus tard). |
| Build (fiche) | `/builds/[id]` | ✅ | `page.tsx` → `AppShell` (//SHARED.LOADOUTS), pleine largeur. |
| Commissions | `/commissions` | ✅ | `page.tsx` → `AppShell` (//COVERT.OPS.LIVE), pleine largeur. |
| Codes | `/codes` | ✅ | `page.tsx` → `AppShell` (//REDEEM.CODES), pleine largeur. |
| Changelog | `/changelog` | ✅ | `changelog/layout.tsx` → `AppShell` (//PATCH.NOTES). Contenu centré lisible conservé. |
| À propos | `/about` | ✅ | `page.tsx` → `AppShell` (//ABOUT.PROJECT). |
| Support | `/support` | ✅ | `page.tsx` → `AppShell` (//SUPPORT.DESK). |
| Contact | `/contact` | ✅ | `contact/layout.tsx` → `AppShell` (//CONTACT.CHANNEL). |
| Profil | `/profile` | ✅ | `page.tsx` → `AppShell` (//ACCOUNT.PROFILE). |
| Admin | `/admin` | ➖ | Back-office gated (404 pour non-admin), chrome propre `AdminDashboardClient` — laissé standalone comme la carte (hors nav publique). À basculer si souhaité. |
| Confidentialité | `/confidentialite` | ✅ | `page.tsx` → `AppShell` (//PRIVACY.POLICY). |

## Systèmes fonctionnels à câbler (front prêt, backend plus tard)

Le layout hub introduit des éléments qui deviendront **réellement fonctionnels** une fois
adossés au système de connexion (auth Discord déjà en place, cf. builder communautaire).
État actuel = placeholders visuels ; voici comment ils seront dégroupés/câblés.

### 1. Système de notifications (cloche topbar)
- **UI** : cloche dans le header `AppShell` + `DnaNotifDot` (point) → au clic, ouvre un
  **panneau déroulant** de notifications (liste scrollable, groupées par date, état lu/non-lu,
  bouton « tout marquer lu »).
- **Données** (backend à venir) : table `notifications` par utilisateur —
  `{ id, userId, type, payload, readAt, createdAt }`.
  Types envisagés : `new_content` (perso/arme/patch ajouté), `build_vote` /
  `build_comment` (interactions sur mes builds), `code_added` (nouveau code de rédemption),
  `event_start` (bannière/événement du calendrier qui démarre), `system` (annonces).
- **Compteur** : nombre de non-lues → badge chiffré sur la cloche (remplace le point statique).
- **Flux** : v1 = polling `GET /api/notifications` au chargement + à intervalle ; v2 = SSE/WebSocket.
  Marquage lu : `POST /api/notifications/read`. Rien n'est envoyé au client sans session.
- **État actuel** : cloche + point statiques, non cliquables. À rendre fonctionnel après auth.

### 2. Niveau / XP utilisateur (profil sidebar)
- **UI** : `Voyageur · Lv.XX` (placeholder `XX` en attendant le back).
- **Données** : XP par compte, gagné via actions (builds publiés, votes reçus, contributions,
  connexions). Niveau dérivé d'une courbe d'XP. Affiché aussi possiblement sur la fiche profil.
- **État actuel** : `Lv.XX` en dur. À brancher sur le compte connecté.

### 3. Profil (avatar + pseudo)
- Avatar + pseudo (`pedrokarim`) et bouton avatar topbar → viendront de la **session Discord**
  (avatar, username). Menu compte (profil, déconnexion) au clic. Placeholder « K » pour l'instant.

## Journal
- 2026-07-11 — Socle `AppShell` posé (sidebar persistante). Home hub `home-poc` enrichie (images/dégradés). Doc de suivi créé.
- 2026-07-11 — `/characters` converti (pilote) : layout → `AppShell`, en-tête gabarit, pleine largeur, mobile OK. Chrome hérité sur la fiche.
- 2026-07-11 — `AppShell` : toggle collapse **déplacé dans le header** (fonctionnel), retiré de la sidebar ; niveau `Lv.42`→`Lv.XX` ; « Contribuer » → **Twitter/X** (`x.com/ascencia64`). Systèmes notifications/niveau/profil documentés (à câbler post-auth).
- 2026-07-11 — Home hub enrichie sur la base de la réf **complète** (capturée via scroller interne 5116px) : ajout Codes cadeaux (copier), Calendrier des événements (Gantt placeholder), carrousel Builds de personnages, section Communauté. Données de démo à brancher (codes → `/codes`, builds → `/builds`, calendrier → données jeu).
- 2026-07-11 — `/items` (hub) + `/items/[category]` convertis : `items/layout.tsx` → `AppShell`, en-têtes en gabarit + compteurs en équerres, pleine largeur. Sous-pages items héritent du chrome.
- 2026-07-11 — `/builds`, `/codes`, `/commissions` convertis : SiteHeader/SiteFooter → `AppShell`, pleine largeur (chrome par `page.tsx`).
- 2026-07-11 — Pages contenu converties : `/changelog`, `/contact` (via layout), `/about`, `/support`, `/profile`, `/confidentialite` (via page.tsx) → `AppShell`. Largeur de lecture conservée (texte).
- 2026-07-11 — `/builder` + `/builds/[id]` convertis. Fiches détail (`characters/[id]`, `items/.../[itemId]`, `about`, `drafts`, `favoris`) vérifiées : héritent du shell, rendent en pleine largeur, aucun `<main>` imbriqué. `admin` laissé standalone. **Refonte layout : terminée** (hors home marketing `/` et carte, volontaires).
- 2026-07-11 — Home hub **câblée sur les vraies données** : `home-poc/page.tsx` (server, `force-dynamic`) → codes réels (`GAME_CODES`), top builds + total (DB via `src/lib/community-builds/list.ts` `getTopBuilds`/`getBuildsTotal`, sûrs si table absente), compteurs personnages/items réels, portraits perso réels dans le carrousel, format nombres selon la locale. Restent en placeholder : **calendrier** (pas de source jeu, labellisé démo) et profil/notifications (auth, cf. « Systèmes à câbler »). Admin : rien à faire (dashboard propre).

## Méthode de conversion (recette réutilisable)
1. Le chrome vient soit d'un `<section>/layout.tsx` local, soit de `SiteHeader`/`SiteFooter` dans la `page.tsx`. Repérer lequel.
2. Remplacer par `AppShell` (breadcrumb `//X.DATABASE`) + wrapper pleine largeur `mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8`. Retirer le `container mx-auto` centré.
3. Reskiner l'en-tête en gabarit : eyebrow `font-mono` `// LABEL`, titre `font-display` XL, soulignement `bg-gold`, compteur en `DnaCornerBrackets` haut-droite. Ne PAS toucher la logique (filtres, tri, pagination, data).
4. Élargir les grilles (`2xl:grid-cols-*`) pour exploiter l'espace.
5. i18n : réutiliser les clés existantes, ne pas coder de FR en dur.
