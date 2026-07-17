import "server-only";
import { createHash } from "node:crypto";

// Fenêtre de dédup des votes : 24 h. La même IP ne compte qu'une fois par build
// dans la fenêtre courante ; à la fenêtre suivante elle peut revoter (abus accepté).
const WINDOW_MS = 24 * 60 * 60 * 1000;

// Accepte aussi bien `Request.headers` (routes API) que le `ReadonlyHeaders`
// de `next/headers` (composants serveur).
type HeaderGetter = { get(name: string): string | null };

/** IP du client derrière Vercel (x-forwarded-for), avec fallbacks. */
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
 * - Stable pendant la fenêtre de 24 h ⇒ un même visiteur peut retirer son vote
 *   (toggle) tant qu'il est dans la même fenêtre.
 * - Change à la fenêtre suivante ⇒ la même IP peut voter à nouveau plus tard.
 * - Non réversible : aucune IP en clair n'est stockée en base (RGPD friendly).
 */
export function getVoterKey(headers: HeaderGetter): string {
  const ip = getClientIp(headers);
  const bucket = Math.floor(Date.now() / WINDOW_MS);
  // Sel = AUTH_SECRET. Un fallback en dur (ancien "dna-vote-salt") serait public
  // → une IP pourrait être forcée par brute-force et le vote dé-anonymisé. On
  // exige donc un vrai secret (présent en prod, requis par Auth.js).
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET manquant — impossible de dériver une clé de vote sûre.");
  }
  return createHash("sha256").update(`${ip}:${bucket}:${secret}`).digest("hex");
}
