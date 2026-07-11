import "server-only";

/** Base URL publique du site pour les liens dans les emails. */
export function getSiteUrl(): string {
  return (process.env.AUTH_URL ?? "https://dna.ascencia.re").replace(/\/+$/, "");
}

/** Le provider Google n'est actif que si ses deux clés sont présentes. */
export function isGoogleEnabled(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}
