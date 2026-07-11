import { EmailLayout, type EmailLocale } from "./components/Layout";
import { EmailButton, EmailFallbackLink, EmailHeading, EmailNote, EmailText } from "./components/Primitives";

type Props = { resetUrl: string; name?: string | null; locale?: EmailLocale };

const copy = {
  fr: {
    preview: "Réinitialise ton mot de passe DNA",
    title: "Réinitialisation du mot de passe",
    intro: "Tu as demandé à réinitialiser ton mot de passe. Choisis-en un nouveau via le bouton ci-dessous.",
    cta: "Choisir un nouveau mot de passe",
    note: "Ce lien expire dans 1 heure et ne peut servir qu'une fois. Si tu n'as rien demandé, ton mot de passe reste inchangé.",
  },
  en: {
    preview: "Reset your DNA password",
    title: "Reset your password",
    intro: "You asked to reset your password. Pick a new one using the button below.",
    cta: "Choose a new password",
    note: "This link expires in 1 hour and can be used once. If you didn't request it, your password stays unchanged.",
  },
} as const;

export function ResetPassword({ resetUrl, name, locale = "en" }: Props) {
  const t = copy[locale];
  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <EmailHeading>{t.title}</EmailHeading>
      {name?.trim() ? <EmailText>{locale === "fr" ? `Salut ${name},` : `Hi ${name},`}</EmailText> : null}
      <EmailText>{t.intro}</EmailText>
      <EmailButton href={resetUrl}>{t.cta}</EmailButton>
      <EmailNote>{t.note}</EmailNote>
      <EmailFallbackLink href={resetUrl} />
    </EmailLayout>
  );
}

export default ResetPassword;
