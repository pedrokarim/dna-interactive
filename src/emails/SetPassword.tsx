import { EmailLayout, type EmailLocale } from "./components/Layout";
import { EmailButton, EmailFallbackLink, EmailHeading, EmailNote, EmailText } from "./components/Primitives";

type Props = { setUrl: string; name?: string | null; locale?: EmailLocale };

// Pour les comptes créés via Discord/Google qui veulent AUSSI un mot de passe.
const copy = {
  fr: {
    preview: "Définis un mot de passe pour ton compte DNA",
    title: "Définir un mot de passe",
    intro:
      "Ton compte utilise une connexion Discord ou Google. Définis un mot de passe pour pouvoir aussi te connecter avec ton email, sans dépendre d'un service tiers.",
    cta: "Définir mon mot de passe",
    note: "Ce lien expire dans 1 heure. Tes connexions Discord/Google continueront de fonctionner en parallèle.",
  },
  en: {
    preview: "Set a password for your DNA account",
    title: "Set a password",
    intro:
      "Your account currently signs in with Discord or Google. Set a password to also sign in with your email, independent of any third-party service.",
    cta: "Set my password",
    note: "This link expires in 1 hour. Your Discord/Google sign-ins will keep working alongside it.",
  },
} as const;

export function SetPassword({ setUrl, name, locale = "en" }: Props) {
  const t = copy[locale];
  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <EmailHeading>{t.title}</EmailHeading>
      {name?.trim() ? <EmailText>{locale === "fr" ? `Salut ${name},` : `Hi ${name},`}</EmailText> : null}
      <EmailText>{t.intro}</EmailText>
      <EmailButton href={setUrl}>{t.cta}</EmailButton>
      <EmailNote>{t.note}</EmailNote>
      <EmailFallbackLink href={setUrl} />
    </EmailLayout>
  );
}

export default SetPassword;
