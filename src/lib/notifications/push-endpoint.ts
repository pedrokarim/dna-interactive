/**
 * Services de push reconnus, par suffixe de domaine.
 *
 * L'URL d'un abonnement vient du navigateur, donc d'une entrée non fiable, et
 * le serveur lui envoie ensuite une requête à chaque diffusion. Sans cette
 * liste, n'importe qui pouvait enregistrer une URL arbitraire : le serveur
 * l'appelait, et une adresse qui ne répond jamais retenait toute la diffusion.
 *
 *   fcm.googleapis.com        – FCM : Chrome, Edge sur Android, Opera, Brave, Samsung
 *   android.googleapis.com    – ancien point d'entrée de FCM
 *   push.services.mozilla.com – Firefox
 *   push.apple.com            – Safari
 *   notify.windows.com        – WNS : Edge sur Windows
 */
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "android.googleapis.com",
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
] as const;

/** Vrai si l'URL est en HTTPS et pointe vers un service de push reconnu. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  // Le port par défaut uniquement : un service de push ne s'expose pas ailleurs.
  if (url.port && url.port !== "443") return false;

  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}
