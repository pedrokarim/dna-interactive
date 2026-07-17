import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * Chiffrement au repos des secrets d'auth (AES-256-GCM). Clé dérivée d'AUTH_SECRET
 * → les secrets ne sont jamais stockés en clair dans la base partagée. Format
 * stocké : `iv:tag:ciphertext` (base64). Décodage tolérant : si la clé a changé ou
 * le format est invalide → chaîne vide (⇒ fallback env côté runtime).
 */
function key(): Buffer {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  // Sans AUTH_SECRET, la clé dériverait d'une chaîne vide → les secrets OAuth
  // stockés dans la base PARTAGÉE (Kagura) seraient déchiffrables par quiconque
  // y a un accès lecture. On refuse de (dé)chiffrer plutôt que d'utiliser une
  // clé prévisible. (decryptSecret rattrape ce throw et retombe sur l'env.)
  if (!secret) {
    throw new Error(
      "AUTH_SECRET manquant — refus de chiffrer les secrets d'auth sous une clé prévisible.",
    );
  }
  return scryptSync(secret, "dna-auth-config-v1", 32);
}

export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(payload: string | null | undefined): string {
  if (!payload) return "";
  try {
    const [ivB, tagB, dataB] = payload.split(":");
    if (!ivB || !tagB || !dataB) return "";
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64"));
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(dataB, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}
