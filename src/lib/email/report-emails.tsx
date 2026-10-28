import "server-only";
import { render } from "@react-email/render";
import { ReportFollowUp, reportFollowUpCopy, type ReportOutcome } from "@/emails/ReportFollowUp";
import type { EmailLocale } from "@/emails/components/Layout";
import { getSiteUrl } from "@/lib/auth/site";
import { sendMail } from "./mailer";

type Input = {
  to: string;
  userId: string;
  name: string | null;
  locale: EmailLocale;
  outcome: ReportOutcome;
  buildTitles: string[];
};

/**
 * Informe la personne qui a signalé un build de la suite donnée. Les réponses
 * partent vers l'adresse de contact, comme pour le formulaire du site.
 */
export async function sendReportFollowUp({ to, userId, name, locale, outcome, buildTitles }: Input) {
  const element = (
    <ReportFollowUp
      outcome={outcome}
      buildTitles={buildTitles}
      name={name}
      locale={locale}
      ctaUrl={`${getSiteUrl()}/${locale}/builds`}
    />
  );
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return sendMail({
    to,
    subject: reportFollowUpCopy[locale].subject,
    html,
    text,
    replyTo: process.env.CONTACT_EMAIL || "contact@ascencia.re",
    track: { kind: "report_followup", userId },
  });
}
