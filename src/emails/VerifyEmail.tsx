import { EmailLayout, type EmailLocale } from "./components/Layout";
import { EmailButton, EmailFallbackLink, EmailHeading, EmailNote, EmailText } from "./components/Primitives";

type Props = { verifyUrl: string; name?: string | null; locale?: EmailLocale };

const copy = {
  fr: {
    preview: "Confirme ton adresse email pour activer ton compte DNA",
    hi: (n: string) => `Bienvenue ${n},`,
    intro: "Confirme ton adresse email pour activer ton compte et pouvoir te connecter avec ton mot de passe.",
    cta: "Confirmer mon email",
    note: "Ce lien expire dans 24 heures. Sans confirmation, la connexion par mot de passe reste bloquée.",
  },
  en: {
    preview: "Confirm your email to activate your DNA account",
    hi: (n: string) => `Welcome ${n},`,
    intro: "Confirm your email address to activate your account and sign in with your password.",
    cta: "Confirm my email",
    note: "This link expires in 24 hours. Until confirmed, password sign-in stays disabled.",
  },
} as const;

export function VerifyEmail({ verifyUrl, name, locale = "en" }: Props) {
  const t = copy[locale];
  const who = name?.trim() || (locale === "fr" ? "aventurier" : "adventurer");
  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <EmailHeading>{t.hi(who)}</EmailHeading>
      <EmailText>{t.intro}</EmailText>
      <EmailButton href={verifyUrl}>{t.cta}</EmailButton>
      <EmailNote>{t.note}</EmailNote>
      <EmailFallbackLink href={verifyUrl} />
    </EmailLayout>
  );
}

export default VerifyEmail;
