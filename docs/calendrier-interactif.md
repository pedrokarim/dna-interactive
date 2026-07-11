# Calendrier des événements — interactif (cadrage)

> Objectif : passer du Gantt statique de la home à un **calendrier interactif** où
> l'on peut **se déplacer dans le temps**, zoomer, filtrer et consulter le détail
> d'un événement. Design system DNA, données réelles curées.

## Comportements attendus

### Navigation temporelle
- **◀ / ▶** : décalent la fenêtre visible d'un pas (1 semaine par défaut).
- **« Aujourd'hui »** : recentre la fenêtre sur la **date de référence** (patch courant).
- (option v2) **glisser-déposer** horizontal pour paner la timeline.

### Zoom
- 3 niveaux : **2 semaines** / **1 mois (défaut)** / **2 mois**. Le zoom garde le
  **centre** de la fenêtre courante et régénère les graduations.

### Filtres
- **Chips de catégorie** (Bannières, Armes, Événements, Épreuves, Récompenses) —
  toggle pour masquer/afficher les lignes correspondantes. `DnaChip`, couleur = teinte
  de la catégorie.

### Détail d'un événement
- **Clic sur une barre** → popover : titre, catégorie, dates réelles, **statut**
  (À venir / En cours / Terminé) + « démarre dans N j » ou « se termine dans N j »,
  et un **lien** si pertinent (`href`).
- **Hover** : tooltip court (dates).

### Repères visuels
- **Ligne « aujourd'hui »** verticale + label, recalculée pour la fenêtre courante.
- Barres **clampées** à la fenêtre ; débordement gauche/droite = petit chevron
  « continue » (l'événement commence avant / finit après la fenêtre).
- **Scroll horizontal** de secours si le contenu dépasse (mobile).

## Données
- Source unique : `src/lib/events/calendar.ts` (événements réels curés — patch 1.4).
- Enrichir chaque événement : `id`, `title`, `category`, `start`, `end`, `subtitle?`,
  `href?`. À rafraîchir à chaque version du jeu (aucune source tierce créditée au front).
- **Date de référence** (`CALENDAR_TODAY`) configurable — c'est « aujourd'hui » dans le
  monde du jeu, pas l'horloge système (les événements sont datés juillet 2026).

## Découpage technique
- **Lib pure paramétrique** (déterministe, pas de `Date.now()`) :
  - `addDaysIso`, `diffDays`, `clampPct`.
  - `eventStatus(ev, refIso)` → `"past" | "ongoing" | "upcoming"`.
  - `computeRows(events, windowStartIso, windowDays, categories?)` → barres
    (`leftPct`, `widthPct`, `overflowLeft`, `overflowRight`, `status`).
  - `generateTicks(windowStartIso, windowDays)` → `{ iso, pct }[]` (labels formatés
    côté composant avec `Intl(locale)`).
  - `markerPct(iso, windowStartIso, windowDays)`.
- **Composant client** `src/components/home/EventCalendar.tsx` :
  - État local : `windowStart` (ISO), `spanDays` (14/30/60), `activeCategories`.
  - Boutons ◀ ▶ / Aujourd'hui / zoom ; chips de filtre ; popover de détail.
  - Accessibilité : `aria-label` sur les contrôles, navigation clavier, respect
    `reduced-motion`.
- **Emplacements** :
  - **Home** : widget interactif (remplace le Gantt statique).
  - **(v2)** page `/calendar` plein écran + état en URL via **nuqs** (fenêtre/zoom
    partageables).

## Étapes d'implémentation
1. ✅ Cadrage (ce doc).
2. ✅ Refactor `calendar.ts` en lib paramétrique (`id`, `href?`, statut, fenêtres,
   ticks, `markerPct`, `computeRows(window)`).
3. ✅ Composant `src/components/home/EventCalendar.tsx` interactif : navigation
   ◀ ▶ / Aujourd'hui, zoom 2 sem/1 mois/2 mois (garde le centre), filtres par
   catégorie, clic → détail (statut + jours restants), repère « aujourd'hui »,
   chevrons de débordement, scroll horizontal. Dates en `timeZone: UTC`.
4. ✅ Branché dans la home (remplace le Gantt statique).
5. ✅ Page `/calendar` plein écran (`variant="full"`) + **état fenêtre/zoom/filtres
   en URL** (nuqs, partageable) ; entrée « Calendrier » dans la sidebar ; la home
   garde sa version (`EventCalendar`, état local) avec un lien « Plein écran → ».
   Vue partagée `CalendarView` (présentation) pilotée par deux conteneurs.
6. ⏳ Reste : `href` par événement (lien vers perso/arme/guide) ; drag-to-pan.
