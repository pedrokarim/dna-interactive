import { EmailLayout, type EmailLocale } from "./components/Layout";
import { EmailButton, EmailHeading, EmailText } from "./components/Primitives";

type Props = { ctaUrl: string; name?: string | null; locale?: EmailLocale };

const copy = {
  fr: {
    preview: "Ton compte DNA Interactive est prêt",
    hi: (n: string) => `Ton compte est prêt, ${n} !`,
    intro:
      "Ton email est confirmé. Tu peux désormais publier des builds, voter pour tes favoris et lier tes comptes Discord ou Google quand tu veux.",
    cta: "Explorer DNA",
  },
  en: {
    preview: "Your DNA Interactive account is ready",
    hi: (n: string) => `You're all set, ${n}!`,
    intro:
      "Your email is confirmed. You can now publish builds, vote for your favorites, and link your Discord or Google accounts whenever you like.",
    cta: "Explore DNA",
  },
} as const;

export function Welcome({ ctaUrl, name, locale = "en" }: Props) {
  const t = copy[locale];
  const who = name?.trim() || (locale === "fr" ? "aventurier" : "adventurer");
  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <EmailHeading>{t.hi(who)}</EmailHeading>
      <EmailText>{t.intro}</EmailText>
      <EmailButton href={ctaUrl}>{t.cta}</EmailButton>
    </EmailLayout>
  );
}

export default Welcome;
