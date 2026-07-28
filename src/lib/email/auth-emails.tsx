import "server-only";
import { render } from "@react-email/render";
import { sendMail } from "./mailer";
import { VerifyEmail } from "@/emails/VerifyEmail";
import { ResetPassword } from "@/emails/ResetPassword";
import { SetPassword } from "@/emails/SetPassword";
import { Welcome } from "@/emails/Welcome";
import type { EmailLocale } from "@/emails/components/Layout";
import { locales } from "@/i18n/config";

// Les emails couvrent les 7 langues du site ; une locale inconnue retombe sur en.
export function toEmailLocale(locale?: string | null): EmailLocale {
  return locales.includes(locale as EmailLocale) ? (locale as EmailLocale) : "en";
}

const subjects: Record<"verify" | "reset" | "setPw" | "welcome", Record<EmailLocale, string>> = {
  verify: {
    fr: "Confirme ton adresse email — DNA Interactive",
    en: "Confirm your email — DNA Interactive",
    de: "Bestätige deine E-Mail-Adresse — DNA Interactive",
    es: "Confirma tu correo — DNA Interactive",
    jp: "メールアドレスの確認 — DNA Interactive",
    kr: "이메일 확인 — DNA Interactive",
    tc: "確認你的電子郵件 — DNA Interactive",
  },
  reset: {
    fr: "Réinitialisation de ton mot de passe — DNA",
    en: "Reset your password — DNA",
    de: "Passwort zurücksetzen — DNA",
    es: "Restablecer tu contraseña — DNA",
    jp: "パスワードの再設定 — DNA",
    kr: "비밀번호 재설정 — DNA",
    tc: "重設你的密碼 — DNA",
  },
  setPw: {
    fr: "Définir un mot de passe — DNA",
    en: "Set a password — DNA",
    de: "Passwort festlegen — DNA",
    es: "Definir una contraseña — DNA",
    jp: "パスワードの設定 — DNA",
    kr: "비밀번호 설정 — DNA",
    tc: "設定密碼 — DNA",
  },
  welcome: {
    fr: "Bienvenue sur DNA Interactive",
    en: "Welcome to DNA Interactive",
    de: "Willkommen bei DNA Interactive",
    es: "Te damos la bienvenida a DNA Interactive",
    jp: "DNA Interactive へようこそ",
    kr: "DNA Interactive에 오신 것을 환영합니다",
    tc: "歡迎來到 DNA Interactive",
  },
};

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
