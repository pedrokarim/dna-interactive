import { EmailLayout, type EmailLocale } from "./components/Layout";
import { EmailButton, EmailHeading, EmailNote, EmailText } from "./components/Primitives";

type Props = {
  title: string;
  body?: string | null;
  ctaUrl?: string | null;
  /** Page de préférences, pour se désabonner en un clic. */
  preferencesUrl: string;
  locale?: EmailLocale;
};

/**
 * Email d'annonce.
 *
 * Le titre et le corps sont rédigés par l'administration : ils ne sont donc
 * PAS traduits. Seul l'habillage (bouton, mention de désabonnement) suit la
 * langue du destinataire.
 */
const copy = {
  fr: { cta: "Voir sur le site", unsub: "Tu reçois cet email parce que ton adresse est vérifiée sur DNA Interactive. Tu peux couper les annonces depuis tes préférences de notifications." },
  en: { cta: "View on the site", unsub: "You're receiving this because your address is verified on DNA Interactive. You can turn announcements off in your notification preferences." },
  de: { cta: "Auf der Seite ansehen", unsub: "Du erhältst diese E-Mail, weil deine Adresse bei DNA Interactive bestätigt ist. Ankündigungen lassen sich in deinen Benachrichtigungseinstellungen abschalten." },
  es: { cta: "Ver en el sitio", unsub: "Recibes este correo porque tu dirección está verificada en DNA Interactive. Puedes desactivar los anuncios en tus preferencias de notificaciones." },
  jp: { cta: "サイトで見る", unsub: "DNA Interactive でメールアドレスが確認済みのため配信しています。通知設定からお知らせを停止できます。" },
  kr: { cta: "사이트에서 보기", unsub: "DNA Interactive에서 이메일이 인증되어 발송되었습니다. 알림 설정에서 공지를 끌 수 있습니다." },
  tc: { cta: "在網站上查看", unsub: "你收到這封信是因為你的信箱已在 DNA Interactive 完成驗證。你可以在通知偏好中關閉公告。" },
} as const;

export function Announcement({ title, body, ctaUrl, preferencesUrl, locale = "en" }: Props) {
  const t = copy[locale];
  return (
    <EmailLayout preview={title} locale={locale}>
      <EmailHeading>{title}</EmailHeading>
      {body
        ? body
            .split(/\n{2,}/)
            .map((paragraph, index) => <EmailText key={index}>{paragraph}</EmailText>)
        : null}
      {ctaUrl ? <EmailButton href={ctaUrl}>{t.cta}</EmailButton> : null}
      <EmailNote>
        {t.unsub} – <a href={preferencesUrl}>{preferencesUrl}</a>
      </EmailNote>
    </EmailLayout>
  );
}

export default Announcement;
