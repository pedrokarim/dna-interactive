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
    fallbackName: "aventurier",
  },
  en: {
    preview: "Your DNA Interactive account is ready",
    hi: (n: string) => `You're all set, ${n}!`,
    intro:
      "Your email is confirmed. You can now publish builds, vote for your favorites, and link your Discord or Google accounts whenever you like.",
    cta: "Explore DNA",
    fallbackName: "adventurer",
  },
  de: {
    preview: "Dein DNA-Interactive-Konto ist bereit",
    hi: (n: string) => `Alles bereit, ${n}!`,
    intro:
      "Deine E-Mail ist bestätigt. Du kannst jetzt Builds veröffentlichen, für deine Favoriten abstimmen und dein Discord- oder Google-Konto jederzeit verknüpfen.",
    cta: "DNA entdecken",
    fallbackName: "Abenteurer",
  },
  es: {
    preview: "Tu cuenta de DNA Interactive está lista",
    hi: (n: string) => `¡Todo listo, ${n}!`,
    intro:
      "Tu correo está confirmado. Ya puedes publicar builds, votar por tus favoritos y vincular tus cuentas de Discord o Google cuando quieras.",
    cta: "Explorar DNA",
    fallbackName: "aventurero",
  },
  jp: {
    preview: "DNA Interactive のアカウントが利用可能になりました",
    hi: (n: string) => `準備が整いました、${n}さん！`,
    intro:
      "メールアドレスが確認されました。これでビルドを公開したり、お気に入りに投票したり、いつでも Discord や Google アカウントを連携したりできます。",
    cta: "DNA を見てみる",
    fallbackName: "冒険者",
  },
  kr: {
    preview: "DNA Interactive 계정이 준비되었습니다",
    hi: (n: string) => `준비 완료입니다, ${n}님!`,
    intro:
      "이메일이 확인되었습니다. 이제 빌드를 공개하고, 마음에 드는 빌드에 투표하고, 원할 때 Discord나 Google 계정을 연결할 수 있습니다.",
    cta: "DNA 둘러보기",
    fallbackName: "모험가",
  },
  tc: {
    preview: "你的 DNA Interactive 帳號已就緒",
    hi: (n: string) => `一切就緒，${n}！`,
    intro:
      "你的電子郵件已確認。現在你可以發佈配裝、為喜歡的配裝投票，並隨時綁定 Discord 或 Google 帳號。",
    cta: "探索 DNA",
    fallbackName: "冒險者",
  },
} as const;

export function Welcome({ ctaUrl, name, locale = "en" }: Props) {
  const t = copy[locale];
  const who = name?.trim() || t.fallbackName;
  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <EmailHeading>{t.hi(who)}</EmailHeading>
      <EmailText>{t.intro}</EmailText>
      <EmailButton href={ctaUrl}>{t.cta}</EmailButton>
    </EmailLayout>
  );
}

export default Welcome;
