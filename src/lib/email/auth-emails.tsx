import "server-only";
import { render } from "@react-email/render";
import { sendMail } from "./mailer";
import { VerifyEmail } from "@/emails/VerifyEmail";
import { ResetPassword } from "@/emails/ResetPassword";
import { SetPassword } from "@/emails/SetPassword";
import { Welcome } from "@/emails/Welcome";
import type { EmailLocale } from "@/emails/components/Layout";

// Les emails ne gèrent que fr/en ; toute autre locale du site retombe sur en.
export function toEmailLocale(locale?: string | null): EmailLocale {
  return locale === "fr" ? "fr" : "en";
}

const subjects = {
  verify: { fr: "Confirme ton adresse email — DNA Interactive", en: "Confirm your email — DNA Interactive" },
  reset: { fr: "Réinitialisation de ton mot de passe — DNA", en: "Reset your password — DNA" },
  setPw: { fr: "Définir un mot de passe — DNA", en: "Set a password — DNA" },
  welcome: { fr: "Bienvenue sur DNA Interactive", en: "Welcome to DNA Interactive" },
} as const;

type Base = { to: string; name?: string | null; locale?: EmailLocale; userId?: string | null };

export async function sendVerificationEmail({ to, name, locale = "en", verifyUrl, userId }: Base & { verifyUrl: string }) {
  const html = await render(<VerifyEmail verifyUrl={verifyUrl} name={name} locale={locale} />);
  return sendMail({ to, subject: subjects.verify[locale], html, track: { kind: "verify_email", userId } });
}

export async function sendPasswordResetEmail({ to, name, locale = "en", resetUrl, userId }: Base & { resetUrl: string }) {
  const html = await render(<ResetPassword resetUrl={resetUrl} name={name} locale={locale} />);
  return sendMail({ to, subject: subjects.reset[locale], html, track: { kind: "reset_password", userId } });
}

export async function sendSetPasswordEmail({ to, name, locale = "en", setUrl, userId }: Base & { setUrl: string }) {
  const html = await render(<SetPassword setUrl={setUrl} name={name} locale={locale} />);
  return sendMail({ to, subject: subjects.setPw[locale], html, track: { kind: "set_password", userId } });
}

export async function sendWelcomeEmail({ to, name, locale = "en", ctaUrl, userId }: Base & { ctaUrl: string }) {
  const html = await render(<Welcome ctaUrl={ctaUrl} name={name} locale={locale} />);
  return sendMail({ to, subject: subjects.welcome[locale], html, track: { kind: "welcome", userId } });
}
