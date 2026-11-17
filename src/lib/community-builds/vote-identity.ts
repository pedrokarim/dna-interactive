import "server-only";
import { createHash } from "node:crypto";

// Fenêtre de dédoublonnage des votes : 24 h. Une IP ne compte qu'une fois par build
// dans la fenêtre en cours et peut revoter à la suivante (abus accepté).
const WINDOW_MS = 24 * 60 * 60 * 1000;

// Accepte aussi bien `Request.headers` (routes API) que le `ReadonlyHeaders`
// de `next/headers` (composants serveur).
type HeaderGetter = { get(name: string): string | null };

/**
 * IP du client (x-forwarded-for), avec replis. nginx remplace l'en-tête par la vraie
 * adresse restaurée depuis Cloudflare, donc la première valeur est fiable.
 */
export function getClientIp(headers: HeaderGetter): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "0.0.0.0";
}

/**
 * Clé de vote anonyme = sha256(IP + fenêtre 24 h + secret).
 *
 * Stable pendant la fenêtre, donc le visiteur peut retirer son vote ; elle change
 * à la fenêtre suivante, donc la même IP peut revoter plus tard. Le hash ne
 * redonne pas l'IP et aucune IP n'est stockée en clair (RGPD).
 */
export function getVoterKey(headers: HeaderGetter): string {
  const ip = getClientIp(headers);
  const bucket = Math.floor(Date.now() / WINDOW_MS);
  // Sel = AUTH_SECRET. Un sel en dur (l'ancien "dna-vote-salt") serait public : on
  // retrouverait l'IP par force brute. On exige un vrai secret (présent en prod,
  // requis par Auth.js).
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET manquant — impossible de dériver une clé de vote sûre.");
  }
  return createHash("sha256").update(`${ip}:${bucket}:${secret}`).digest("hex");
}
