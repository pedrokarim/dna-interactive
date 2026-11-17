import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { render } from "@react-email/render";
import { getDb, schema } from "@/db";
import { isMissingTableError } from "@/lib/db-errors";
import { sendMail } from "@/lib/email/mailer";
import { toEmailLocale } from "@/lib/email/auth-emails";
import { getSiteUrl } from "@/lib/auth/site";
import { Announcement } from "@/emails/Announcement";
import type { AnnouncementRecord } from "./announcements";

/**
 * Envoi d'une annonce par email.
 *
 * On n'envoie qu'aux adresses vérifiées, aux comptes non bannis et aux
 * utilisateurs qui ont gardé les annonces activées. Une annonce réservée aux
 * admins ne part qu'aux admins.
 *
 * Envois par petits lots : le SMTP mutualisé coupe sur un pic de connexions, et
 * un échec sur une adresse ne doit pas annuler le reste.
 */
export async function sendAnnouncementEmails(
  row: AnnouncementRecord,
): Promise<{ sent: number; failed: number; skipped: boolean }> {
  const db = getDb();
  let recipients: Array<{ id: string; email: string | null }>;
  try {
    recipients = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(
        and(
          isNotNull(schema.users.emailVerified),
          isNotNull(schema.users.email),
          eq(schema.users.banned, false),
          eq(schema.users.announcementEmails, true),
          ...(row.audience === "admins" ? [eq(schema.users.role, "admin")] : []),
        ),
      );
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
    return { sent: 0, failed: 0, skipped: true };
  }

  const siteUrl = getSiteUrl();
  const ctaUrl = row.href ? new URL(row.href, siteUrl).toString() : `${siteUrl}/notifications`;
  const preferencesUrl = `${siteUrl}/profile`;

  let sent = 0;
  let failed = 0;
  const BATCH = 10;

  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (user) => {
        if (!user.email) return;
        // La locale du destinataire n'est pas stockée : l'habillage est en
        // anglais, langue par défaut des emails. Le corps de l'annonce part tel
        // quel, il n'est rédigé qu'une fois.
        const locale = toEmailLocale(null);
        try {
          const html = await render(
            <Announcement
              title={row.title}
              body={row.body}
              ctaUrl={row.href ? ctaUrl : null}
              preferencesUrl={preferencesUrl}
              locale={locale}
            />,
          );
          const result = await sendMail({
            to: user.email,
            subject: row.title,
            html,
            track: { kind: "announcement", userId: user.id },
          });
          if (result.skipped) failed += 1;
          else sent += 1;
        } catch {
          failed += 1;
        }
      }),
    );
  }

  return { sent, failed, skipped: false };
}
