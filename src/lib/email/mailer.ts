import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { createEmailEvent, injectPixel, type EmailKind } from "./tracking";

// Transport SMTP partagé (LWS : SMTP_HOST/USER/PASS, port 465 en SSL), créé au
// premier envoi puis réutilisé.
let transport: Transporter | null = null;

function getTransport(): Transporter {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Le certificat LWS est valide : on garde la vérification TLS par défaut de
    // nodemailer, sinon un MITM pourrait lire les liens de reset et de vérification.
    connectionTimeout: 30_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  return transport;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Expéditeur par défaut : le compte SMTP, libellé "DNA Interactive". */
function defaultFrom(): string {
  return `"DNA Interactive" <${process.env.SMTP_USER ?? "no-reply@ascencia.re"}>`;
}

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Adresse qui reçoit les réponses (sinon l'expéditeur). */
  replyTo?: string;
  /** Active le suivi d'ouverture (asset injecté + événement enregistré). */
  track?: { kind: EmailKind; userId?: string | null };
};

/**
 * Sans SMTP configuré (en dev), pas d'exception : on logue et on renvoie
 * `{ skipped: true }`, pour tester les parcours sans les secrets.
 */
export async function sendMail({ to, subject, html, text, replyTo, track }: SendMailInput): Promise<{ skipped: boolean }> {
  if (!isMailConfigured()) {
    console.warn("[mailer] SMTP non configuré — email non envoyé :", { to, subject });
    return { skipped: true };
  }

  let finalHtml = html;
  if (track) {
    const pixel = await createEmailEvent(to, track.kind, track.userId ?? null);
    if (pixel) finalHtml = injectPixel(html, pixel.pixelUrl);
  }

  await getTransport().sendMail({ from: defaultFrom(), to, subject, html: finalHtml, text, replyTo });
  return { skipped: false };
}
