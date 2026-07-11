# Calendrier — événements pilotables (BDD + admin + commande) — cadrage

> Évolution : le calendrier ne lit plus une liste **codée en dur** mais une table
> **`calendar_events` en base**, éditable via une **interface admin**, avec image,
> lien et infos par événement, **tooltips au survol**, et une **commande Claude** pour
> rafraîchir/ajouter des événements à chaque cycle. (Nécessite la BDD.)

## Modèle de données — `calendar_events`
```
calendar_events {
  id           uuid pk
  title        text            not null
  category     text            not null   -- banner | weapon | event | challenge | reward
  startDate    date            not null   -- date-only (UTC), pas d'heure
  endDate      date            not null
  image        text            null       -- URL ou /assets/... (vignette du « carré »)
  href         text            null       -- clic → page interne/externe (perso/arme/guide)
  description  text            null       -- infos affichées dans le tooltip / le détail
  sourceUrl    text            null       -- source (annonce officielle) — jamais affichée au front
  sortOrder    integer         default 0
  hidden       boolean         default false
  createdAt / updatedAt / createdById(admin)
}
```
- Table **additive** (aucun rename) → migration `db:push` sûre.
- `startDate/endDate` en **date-only** (cohérent avec la logique déterministe actuelle).

## Interface admin (`/admin` → onglet « Calendrier »)
CRUD complet, réservé admin (comme le reste de `/admin`) :
- **Liste** des événements (titre, catégorie, période, visible/masqué), tri.
- **Formulaire ajout/édition** : titre, catégorie, dates début/fin, **image** (voir §Décision),
  **lien** (`href`), **infos** (`description`, multi-ligne → tooltip), masqué on/off, ordre.
- **Suppression** (avec confirmation `DnaConfirmDialog`).
- Endpoints `POST/PATCH/DELETE /api/admin/calendar-events` (gating admin, comme `admin/*`).

## Calendrier (front)
- **Lecture BDD** : `getCalendarEvents()` (serveur) → passé au composant. **Fallback** sur la
  liste curée `src/lib/events/calendar.ts` si la table est vide/absente (jamais de calendrier vide,
  et ça marche avant la migration).
- **Vignette-image** par événement : petit **carré** (≈28px) à gauche de la ligne (remplace la
  pastille), image = `event.image` (fallback = pastille couleur catégorie).
- **Tooltips au survol** : survol d'une barre → tooltip riche (titre, période, statut, `description`).
  Le clic garde le panneau détail (avec le lien `href`).
- Toute l'interactivité actuelle conservée (navigation, zoom, filtres, page `/calendar` + URL).

## Commande Claude — mise à jour des événements
- Slash-command `/maj-calendrier` (`.claude/commands/maj-calendrier.md`) : m'instruit de
  **rechercher les événements en cours** (web, sources officielles), puis d'**upsert** en base
  via un script (`scripts/seed-calendar-events.ts`, exécuté en `bun`/`node`).
- Idempotent (upsert par clé naturelle titre+startDate) → relançable à chaque cycle, ajoute
  seulement les nouveaux / met à jour les existants.
- Seed initial = liste curée actuelle (hybride : assets repo + quelques bannières officielles).

## Sourcing des images (rappel décision « Hybride »)
- Par défaut : **assets déjà dans le repo** (portrait du perso lié, icône d'arme, image d'ambiance).
- Quelques **bannières officielles** pour les événements phares (téléchargées + hébergées dans
  `public/assets/events/`). **Jamais d'assets Game8/concurrent** ; `sourceUrl` non affichée.

## ⚠️ Décision bloquante — gestion de l'image
1. **URL d'image** (simple, recommandé) : l'admin colle une URL ; affichage via `<img>` +
   `next.config` `images.remotePatterns` (ou proxy) pour les domaines autorisés. Rapide, pas de stockage.
2. **Chemin repo** : l'admin référence un fichier déjà dans `public/assets/events/` (qu'on ajoute à la main / via la commande).
3. **Upload** : vrai upload (Vercel Blob/S3) — plus lourd (infra + coûts), à faire plus tard.
→ Reco : **URL + chemin repo** en v1, **upload** en v2.

## Coordination
- Tu es en **refonte DB/auth** en parallèle → j'ajoute une table **isolée** (`calendar_events`) et
  une **section admin distincte**, pour ne pas croiser tes changements. La **migration `db:push`**
  reste à pousser par toi (comme celle des votes IP).

## Étapes
1. ✅ Cadrage (ce doc).
2. ⏳ Table `calendar_events` (schema) + `getCalendarEvents()` (lecture, fallback statique).
3. ✅ Calendrier : **vignette-image** (carré à gauche de chaque ligne) + **tooltip au survol**
   (image, titre, catégorie, période, statut, description) + image/desc dans le détail au clic.
   `CalendarEvent` enrichi (`image`, `description`) ; `computeRows` accepte `sourceEvents`
   (prêt pour la BDD). Marche sur le fallback statique.
2b. ✅ Table `calendar_events` (schema) + `getCalendarEvents()` (lecture + fallback statique),
   events plombés jusqu'au calendrier (home + `/calendar`).
4. ✅ API `/api/admin/calendar-events` (GET/POST/PATCH/DELETE, gating admin, audit) +
   **page isolée `/admin/calendar`** (`CalendarAdminClient` : liste, formulaire, édition,
   suppression, notice migration). Isolée pour ne pas croiser la refonte admin en cours.
5. ✅ Script `scripts/seed-calendar-events.ts` (`bun run seed:calendar`, upsert idempotent
   par titre+date) + slash-command **`/maj-calendrier`** (`.claude/commands/`).

## ⚙️ Migration à pousser (par Karim)
La table `calendar_events` est **définie mais pas encore en base**. Pour l'activer :
```
bun run db:push       # crée la table (additive — répondre NON à tout rename proposé)
bun run seed:calendar # (optionnel) pré-remplit avec la liste curée actuelle
```
Tant que la migration n'est pas poussée, le calendrier utilise **automatiquement** la
liste curée statique (aucun crash). L'admin `/admin/calendar` affiche une notice.
