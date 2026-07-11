import "server-only";
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSiteUrl } from "@/lib/auth/site";

export type EmailKind = "verify_email" | "reset_password" | "set_password" | "welcome" | "contact";

// PNG 1×1 transparent servi par la route de suivi.
export const TRACKING_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

// Désactivable via EMAIL_TRACKING=off (par défaut : actif).
function trackingEnabled(): boolean {
  return process.env.EMAIL_TRACKING !== "off";
}

/**
 * Crée un événement d'envoi et renvoie l'URL de "l'asset" à charger dans l'email.
 * L'URL ressemble à une image classique (`/biribiri/<hash>.png`) — aucun mot-clé de
 * suivi, token opaque — pour ne pas être repérée comme pixel de tracking.
 */
export async function createEmailEvent(
  to: string,
  kind: EmailKind,
  userId?: string | null,
): Promise<{ token: string; pixelUrl: string } | null> {
  if (!trackingEnabled()) return null;
  try {
    const token = randomBytes(16).toString("hex");
    await getDb().insert(schema.emailEvents).values({ token, kind, recipient: to, userId: userId ?? null });
    return { token, pixelUrl: `${getSiteUrl()}/biribiri/${token}.png` };
  } catch (error) {
    console.error("[email-tracking] création de l'événement échouée:", error);
    return null;
  }
}

/** Insère l'asset de suivi juste avant </body> (ou en fin de HTML). */
export function injectPixel(html: string, pixelUrl: string): string {
  const img = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;overflow:hidden" />`;
  return html.includes("</body>") ? html.replace("</body>", `${img}</body>`) : html + img;
}

/** Enregistre une ouverture : 1re date + dernière date + compteur. */
export async function recordOpen(token: string, userAgent: string | null): Promise<void> {
  if (!token) return;
  try {
    await getDb()
      .update(schema.emailEvents)
      .set({
        openedAt: sql`coalesce(${schema.emailEvents.openedAt}, now())`,
        lastOpenedAt: sql`now()`,
        openCount: sql`${schema.emailEvents.openCount} + 1`,
        ...(userAgent ? { userAgent } : {}),
      })
      .where(eq(schema.emailEvents.token, token));
  } catch (error) {
    console.error("[email-tracking] enregistrement d'ouverture échoué:", error);
  }
}
