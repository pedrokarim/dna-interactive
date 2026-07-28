import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { dna, fonts } from "../theme";
import type { Locale } from "@/i18n/config";

/** Les emails couvrent les mêmes langues que le site. */
export type EmailLocale = Locale;

/** Locale du site → code BCP 47 valide pour l'attribut `lang`. */
const htmlLang: Record<EmailLocale, string> = {
  fr: "fr",
  en: "en",
  de: "de",
  es: "es",
  jp: "ja",
  kr: "ko",
  tc: "zh-Hant",
};

type Props = {
  preview: string;
  children: ReactNode;
  locale?: EmailLocale;
  /** Lien du pied de page (site public). */
  siteUrl?: string;
};

const footerCopy: Record<EmailLocale, { tagline: string; fine: string }> = {
  fr: {
    tagline: "Compagnon Duet Night Abyss",
    fine: "Tu reçois cet email suite à une action sur ton compte DNA Interactive. Si tu n'es pas à l'origine de cette demande, ignore ce message.",
  },
  en: {
    tagline: "Duet Night Abyss companion",
    fine: "You're receiving this email because of an action on your DNA Interactive account. If you didn't request it, you can safely ignore this message.",
  },
  de: {
    tagline: "Begleiter für Duet Night Abyss",
    fine: "Du erhältst diese E-Mail wegen einer Aktion in deinem DNA-Interactive-Konto. Falls du sie nicht angefordert hast, kannst du diese Nachricht ignorieren.",
  },
  es: {
    tagline: "Compañero de Duet Night Abyss",
    fine: "Recibes este correo por una acción en tu cuenta de DNA Interactive. Si no la has solicitado, puedes ignorar este mensaje.",
  },
  jp: {
    tagline: "Duet Night Abyss のお供に",
    fine: "このメールは、DNA Interactive アカウントでの操作に伴ってお送りしています。お心当たりがない場合は、そのまま破棄してください。",
  },
  kr: {
    tagline: "Duet Night Abyss 동반자",
    fine: "이 메일은 DNA Interactive 계정에서 발생한 작업으로 인해 발송되었습니다. 요청하지 않으셨다면 이 메시지를 무시하셔도 됩니다.",
  },
  tc: {
    tagline: "Duet Night Abyss 夥伴",
    fine: "你收到這封郵件，是因為你的 DNA Interactive 帳號有相關操作。若非你本人所為，可直接忽略這則訊息。",
  },
};

/**
 * Layout de base des emails DNA : fond sombre, carte "panel" bordée d'or, en-tête
 * marque + filet doré, pied de page discret. Respecte le design system (coins nets).
 */
export function EmailLayout({
  preview,
  children,
  locale = "en",
  siteUrl = "https://dna.ascencia.re",
}: Props) {
  const copy = footerCopy[locale];
  return (
    <Html lang={htmlLang[locale]}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* En-tête marque */}
          <Section style={header}>
            <Img
              src={`${siteUrl}/assets/images/logo_optimized.png`}
              width="60"
              height="60"
              alt="DNA Interactive"
              style={logo}
            />
            <Text style={kicker}>DNA&nbsp;INTERACTIVE</Text>
            <div style={rule} />
          </Section>

          {/* Carte principale */}
          <Section style={card}>{children}</Section>

          {/* Pied de page */}
          <Section style={footer}>
            <Text style={footerText}>
              {copy.tagline} —{" "}
              <Link href={siteUrl} style={footerLink}>
                dna.ascencia.re
              </Link>
            </Text>
            <Hr style={footerHr} />
            <Text style={footerFine}>{copy.fine}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: dna.ink,
  margin: 0,
  padding: "32px 12px",
  fontFamily: fonts.sans,
};

const container: React.CSSProperties = {
  maxWidth: "560px",
  margin: "0 auto",
};

const header: React.CSSProperties = {
  padding: "0 4px 18px",
  textAlign: "center",
};

const logo: React.CSSProperties = {
  display: "block",
  margin: "0 auto 12px",
};

const kicker: React.CSSProperties = {
  margin: 0,
  color: dna.gold,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "4px",
  textTransform: "uppercase",
  textAlign: "center",
};

const rule: React.CSSProperties = {
  marginTop: "10px",
  height: "2px",
  background: `linear-gradient(90deg, ${dna.gold}, ${dna.goldBright}, ${dna.gold})`,
};

const card: React.CSSProperties = {
  backgroundColor: dna.panel,
  border: `1px solid ${dna.line}`,
  padding: "32px",
};

const footer: React.CSSProperties = {
  padding: "20px 4px 0",
};

const footerText: React.CSSProperties = {
  margin: 0,
  color: dna.muted,
  fontSize: "12px",
};

const footerLink: React.CSSProperties = {
  color: dna.gold,
  textDecoration: "none",
};

const footerHr: React.CSSProperties = {
  borderColor: dna.line,
  margin: "12px 0",
};

const footerFine: React.CSSProperties = {
  margin: 0,
  color: dna.muted2,
  fontSize: "11px",
  lineHeight: "16px",
};
