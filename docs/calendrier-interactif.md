# Calendrier des événements — frise défilable

> Un **vrai calendrier** : tous les événements du jeu, passés comme futurs, sur une
> frise qu'on fait défiler librement. Un curseur très visible marque le jour
> courant — **celui du visiteur**, pas une date figée. Design system DNA, données
> réelles curées.

## Comportements attendus

### Navigation temporelle
- **Défilement horizontal libre** : molette, trackpad, glissement de la barre,
  flèches du clavier (la frise est focusable). Aucune borne — on peut remonter
  des années en arrière ou aller des années en avant.
- La **plage rendue** s'étend automatiquement d'un an dès qu'on approche d'un
  bord (`RANGE_EXTEND_DAYS`), et `scrollLeft` est corrigé avant peinture pour que
  rien ne bouge sous le curseur.
- **◀ / ▶** : décalent la vue de ~60 % d'écran (confort, pas une contrainte).
- **« Aujourd'hui »** : recentre sur le jour courant. Si ce jour est hors écran,
  une pastille **AUJ.** apparaît du bon côté pour y revenir en un clic.

### Le curseur « aujourd'hui »
- Date = **horloge locale du visiteur** (`localTodayIso`), pas l'horloge serveur
  ni une constante. Elle est resynchronisée à chaque retour sur l'onglet
  (`visibilitychange`, `focus`) et une fois par minute : minuit passe tout seul,
  et revenir sur le site ne réaffiche pas la date d'avant.
- Premier rendu = date calculée côté serveur, remplacée dès le montage par celle
  du navigateur → pas d'écart d'hydratation.
- Réglage admin `calendarToday` : **forçage** optionnel (test, capture). Rempli,
  il fige la frise pour tout le monde — à laisser vide en temps normal.

### Zoom
- 3 niveaux = **nombre de jours tenant à l'écran** : 2 semaines / 1 mois (défaut)
  / 2 mois. L'échelle `pxPerDay = largeur visible / span` est donc recalculée à
  chaque redimensionnement (`ResizeObserver`).
- Le zoom **conserve la date au centre** de la vue.

### Chargement par fenêtre
- Le serveur ne rend que `[aujourd'hui − 120 j, aujourd'hui + 240 j]`.
- Au défilement, `GET /api/calendar/events?from=&to=` complète **uniquement les
  trous** (les bornes chargées restent un intervalle contigu) — on ne recharge
  jamais ce qu'on a déjà, et jamais tout le calendrier.
- Anti-rebond 220 ms + annulation de la requête précédente ; les barres hors
  écran (± un écran) ne sont pas montées dans le DOM, donc leurs bannières ne
  sont pas téléchargées.

### Filtres
- **Chips de catégorie** (Bannières, Armes, Événements, Épreuves, Récompenses) —
  toggle, couleur = teinte de la catégorie.

### Détail d'un événement
- **Clic sur une barre** → panneau : titre, catégorie, dates réelles, **statut**
  (À venir / En cours / Terminé) + « démarre dans N j » / « se termine dans N j »,
  lien interne (`href`) et lien vers l'annonce officielle (`sourceUrl`).
- **Hover** : tooltip (bannière, dates, statut, description).

### Repères visuels
- **Bandeau des mois** collant (le nom du mois reste lisible même quand son
  bandeau commence hors écran) + **graduations** dont le pas s'adapte à l'échelle.
- Barres **calées en voies** (façon Gantt) : chacune prend la première voie libre,
  avec une largeur plancher pour rester lisible. Le **filet du bas** ne couvre que
  la durée réelle, pour ne pas mentir sur la période.

## Données
- Source : table `calendar_events` (admin), repli sur la liste curée statique de
  `src/lib/events/calendar.ts` si la table est vide/absente.
- Aucune source tierce créditée au front (uniquement `sourceUrl` officiels).

## Découpage technique
- **Lib pure** `src/lib/events/calendar.ts` (aucune horloge lue à l'intérieur :
  la date du jour est toujours un paramètre → testable et sûre en SSR) :
  `addDaysIso`, `diffDays`, `localTodayIso`, `eventStatus`, `layoutBars`,
  `monthBands`, `dayTicks`, `tickStepForScale`, `eventsInRange`.
- **Accès données** `src/lib/events/db.ts` : `getCalendarEvents` (tout, pour
  l'admin) et `getCalendarEventsInRange` (fenêtre, pour la frise).
- **API** `src/app/api/calendar/events/route.ts` — `from`/`to` validés, plage
  bornée à ~5 ans par requête.
- **Composant client** `src/components/calendar/CalendarTimeline.tsx` : frise,
  défilement, extension de plage, chargement par fenêtre, curseur du jour.
- **Conteneurs** : `src/components/home/EventCalendar.tsx` (home, état local,
  `variant="compact"`) et `src/components/calendar/CalendarPageClient.tsx` (page
  `/calendar`, `variant="full"`, zoom/filtres/**date regardée** dans l'URL via
  nuqs en `history: "replace"`).

## Étapes d'implémentation
1. ✅ Cadrage.
2. ✅ Lib paramétrique.
3. ✅ Widget interactif (navigation, zoom, filtres, détail).
4. ✅ Branché dans la home.
5. ✅ Page `/calendar` plein écran + état en URL.
6. ✅ **Refonte frise** : défilement libre sans borne, curseur sur l'horloge du
   visiteur, chargement par fenêtre, calage en voies, bandeau des mois.
7. ⏳ Reste : `href` par événement (lien vers perso/arme/guide) ; glisser-déposer
   pour paner à la souris.
