/**
 * Service worker de DNA Interactive – notifications Web Push uniquement.
 *
 * Volontairement minimal : PAS de mise en cache, PAS d'interception de `fetch`.
 * Un service worker qui met en cache une application Next.js casse plus qu'il
 * n'apporte (routes RSC, revalidation, déploiements). Celui-ci se contente de
 * recevoir les messages poussés et d'ouvrir la bonne page au clic.
 */

const FALLBACK_ICON = "/assets/images/logo_optimized.png";

// Prend la main sans attendre la fermeture des onglets : une nouvelle version
// du worker doit remplacer l'ancienne immédiatement, sinon un abonnement peut
// rester servi par du code obsolète pendant des jours.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // Charge utile non-JSON (test manuel depuis les DevTools) : on affiche le texte brut.
    payload = { title: "DNA Interactive", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "DNA Interactive";
  const options = {
    body: payload.body || "",
    icon: FALLBACK_ICON,
    badge: FALLBACK_ICON,
    image: payload.image || undefined,
    // `tag` regroupe : une annonce mise à jour remplace sa notification au lieu
    // d'en empiler une seconde.
    tag: payload.tag || "dna-announcement",
    renotify: false,
    // Jamais de `requireInteraction` : la notification se referme d'elle-même.
    // C'est la différence entre informer et harceler.
    data: { url: payload.url || "/notifications" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Un onglet du site est déjà ouvert : on le réutilise plutôt que d'en
      // ouvrir un de plus à chaque notification.
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
