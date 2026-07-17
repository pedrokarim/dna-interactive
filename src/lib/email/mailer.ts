import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { createEmailEvent, injectPixel, type EmailKind } from "./tracking";

// Transport SMTP partagé (config LWS existante : SMTP_HOST/USER/PASS, port 465
// SSL). Singleton lazy pour éviter de recréer la connexion à chaque envoi.
let transport: Transporter | null = null;

function getTransport(): Transporter {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Certificat LWS valide → vérification TLS activée (défaut nodemailer),
    // pour empêcher un MITM d'intercepter les liens de reset/vérification.
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
  /** Active le suivi d'ouverture (asset injecté + événement enregistré). */
  track?: { kind: EmailKind; userId?: string | null };
};

/**
 * Envoie un email. Si le SMTP n'est pas configuré (dev), on ne jette pas : on
 * loggue et on renvoie `{ skipped: true }` pour que les flux restent testables
 * sans secrets.
 */
export async function sendMail({ to, subject, html, text, track }: SendMailInput): Promise<{ skipped: boolean }> {
  if (!isMailConfigured()) {
    console.warn("[mailer] SMTP non configuré — email non envoyé :", { to, subject });
    return { skipped: true };
  }

  let finalHtml = html;
  if (track) {
    const pixel = await createEmailEvent(to, track.kind, track.userId ?? null);
    if (pixel) finalHtml = injectPixel(html, pixel.pixelUrl);
  }

  await getTransport().sendMail({ from: defaultFrom(), to, subject, html: finalHtml, text });
  return { skipped: false };
}
