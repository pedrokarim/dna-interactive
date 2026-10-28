import { Section, Text } from "@react-email/components";
import { EmailLayout, type EmailLocale } from "./components/Layout";
import { EmailButton, EmailHeading, EmailText } from "./components/Primitives";
import { dna, fonts } from "./theme";

/** Suite donnée à un signalement : le build a été modéré, ou il reste en ligne. */
export type ReportOutcome = "resolved" | "dismissed";

type Props = {
  outcome: ReportOutcome;
  buildTitles: string[];
  ctaUrl: string;
  name?: string | null;
  locale?: EmailLocale;
};

type Copy = {
  subject: string;
  preview: string;
  hi: (name: string) => string;
  resolved: (count: number) => string;
  dismissed: (count: number) => string;
  outro: string;
  cta: string;
  reply: string;
  fallbackName: string;
};

export const reportFollowUpCopy: Record<EmailLocale, Copy> = {
  fr: {
    subject: "Ton signalement a été traité",
    preview: "Merci pour ton signalement, voici la suite qui lui a été donnée.",
    hi: (n) => `Merci pour ton signalement, ${n}`,
    resolved: (c) =>
      c > 1
        ? "Nous avons examiné les builds que tu as signalés, et ils ont été modérés :"
        : "Nous avons examiné le build que tu as signalé, et il a été modéré :",
    dismissed: (c) =>
      c > 1
        ? "Nous avons examiné les builds que tu as signalés. Après vérification, ils respectent les règles du site et restent en ligne :"
        : "Nous avons examiné le build que tu as signalé. Après vérification, il respecte les règles du site et reste en ligne :",
    outro:
      "Ce type de retour nous aide à garder des builds fiables pour toute la communauté. N’hésite pas à continuer à signaler ce qui te semble faux.",
    cta: "Voir les builds",
    reply: "Une question ? Réponds simplement à cet e-mail.",
    fallbackName: "aventurier",
  },
  en: {
    subject: "Your report has been reviewed",
    preview: "Thanks for your report — here's what we did about it.",
    hi: (n) => `Thanks for your report, ${n}`,
    resolved: (c) =>
      c > 1
        ? "We reviewed the builds you reported, and they have been moderated:"
        : "We reviewed the build you reported, and it has been moderated:",
    dismissed: (c) =>
      c > 1
        ? "We reviewed the builds you reported. After checking, they follow the site's rules and will stay online:"
        : "We reviewed the build you reported. After checking, it follows the site's rules and will stay online:",
    outro:
      "Reports like yours help us keep builds reliable for the whole community. Feel free to keep flagging anything that looks wrong.",
    cta: "Browse builds",
    reply: "Questions? Just reply to this email.",
    fallbackName: "adventurer",
  },
  de: {
    subject: "Deine Meldung wurde bearbeitet",
    preview: "Danke für deine Meldung – so sind wir damit umgegangen.",
    hi: (n) => `Danke für deine Meldung, ${n}`,
    resolved: (c) =>
      c > 1
        ? "Wir haben die gemeldeten Builds geprüft und sie wurden moderiert:"
        : "Wir haben den gemeldeten Build geprüft und er wurde moderiert:",
    dismissed: (c) =>
      c > 1
        ? "Wir haben die gemeldeten Builds geprüft. Sie entsprechen den Regeln der Seite und bleiben online:"
        : "Wir haben den gemeldeten Build geprüft. Er entspricht den Regeln der Seite und bleibt online:",
    outro:
      "Meldungen wie deine helfen uns, die Builds für die ganze Community verlässlich zu halten. Melde gern weiterhin alles, was dir falsch vorkommt.",
    cta: "Builds ansehen",
    reply: "Fragen? Antworte einfach auf diese E-Mail.",
    fallbackName: "Abenteurer",
  },
  es: {
    subject: "Hemos revisado tu reporte",
    preview: "Gracias por tu reporte: esto es lo que hemos hecho.",
    hi: (n) => `Gracias por tu reporte, ${n}`,
    resolved: (c) =>
      c > 1
        ? "Hemos revisado los builds que reportaste y han sido moderados:"
        : "Hemos revisado el build que reportaste y ha sido moderado:",
    dismissed: (c) =>
      c > 1
        ? "Hemos revisado los builds que reportaste. Tras comprobarlos, cumplen las normas del sitio y seguirán publicados:"
        : "Hemos revisado el build que reportaste. Tras comprobarlo, cumple las normas del sitio y seguirá publicado:",
    outro:
      "Reportes como el tuyo nos ayudan a mantener builds fiables para toda la comunidad. No dudes en seguir avisándonos de lo que te parezca incorrecto.",
    cta: "Ver builds",
    reply: "¿Alguna pregunta? Responde a este correo.",
    fallbackName: "aventurero",
  },
  jp: {
    subject: "通報への対応が完了しました",
    preview: "ご通報ありがとうございます。対応内容をお知らせします。",
    hi: (n) => `ご通報ありがとうございます、${n}さん`,
    resolved: () => "通報いただいたビルドを確認し、対応（モデレーション）を行いました：",
    dismissed: () => "通報いただいたビルドを確認しました。サイトのルールに沿っているため、公開を継続します：",
    outro:
      "皆さまからの通報が、コミュニティ全体のビルドの信頼性を支えています。おかしいと感じたものがあれば、引き続きお知らせください。",
    cta: "ビルドを見る",
    reply: "ご不明な点は、このメールにそのまま返信してください。",
    fallbackName: "冒険者",
  },
  kr: {
    subject: "신고가 처리되었습니다",
    preview: "신고해 주셔서 감사합니다. 처리 결과를 알려 드립니다.",
    hi: (n) => `신고해 주셔서 감사합니다, ${n}님`,
    resolved: () => "신고하신 빌드를 검토했으며, 조치가 이루어졌습니다:",
    dismissed: () => "신고하신 빌드를 검토했습니다. 확인 결과 사이트 규칙에 맞아 계속 공개됩니다:",
    outro:
      "이런 신고 덕분에 커뮤니티 전체가 믿을 수 있는 빌드를 유지할 수 있습니다. 잘못되어 보이는 것이 있다면 앞으로도 알려 주세요.",
    cta: "빌드 보기",
    reply: "궁금한 점이 있으면 이 메일에 회신해 주세요.",
    fallbackName: "모험가",
  },
  tc: {
    subject: "你的檢舉已處理",
    preview: "感謝你的檢舉，以下是我們的處理結果。",
    hi: (n) => `感謝你的檢舉，${n}`,
    resolved: () => "我們已審查你檢舉的配裝，並已進行處理：",
    dismissed: () => "我們已審查你檢舉的配裝。經確認，它符合網站規範，將繼續公開：",
    outro: "像你這樣的回報，能幫助我們為整個社群維持可靠的配裝。若發現任何看起來有誤的內容，歡迎繼續告訴我們。",
    cta: "瀏覽配裝",
    reply: "有任何問題，直接回覆這封郵件即可。",
    fallbackName: "冒險者",
  },
};

export function ReportFollowUp({ outcome, buildTitles, ctaUrl, name, locale = "en" }: Props) {
  const t = reportFollowUpCopy[locale];
  const who = name?.trim() || t.fallbackName;
  const count = buildTitles.length;
  return (
    <EmailLayout preview={t.preview} locale={locale}>
      <EmailHeading>{t.hi(who)}</EmailHeading>
      <EmailText>{outcome === "resolved" ? t.resolved(count) : t.dismissed(count)}</EmailText>
      <Section style={list}>
        {buildTitles.map((title) => (
          <Text key={title} style={listItem}>
            {title}
          </Text>
        ))}
      </Section>
      <EmailText>{t.outro}</EmailText>
      <EmailButton href={ctaUrl}>{t.cta}</EmailButton>
      <EmailText muted>{t.reply}</EmailText>
    </EmailLayout>
  );
}

export default ReportFollowUp;

const list: React.CSSProperties = {
  margin: "0 0 16px",
  padding: "10px 14px",
  backgroundColor: dna.ink2,
};

const listItem: React.CSSProperties = {
  margin: "4px 0",
  color: dna.parch,
  fontFamily: fonts.display,
  fontSize: "15px",
  lineHeight: "22px",
};
