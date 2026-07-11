import { Button, Heading, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { dna, fonts } from "../theme";

export function EmailHeading({ children }: { children: ReactNode }) {
  return <Heading style={heading}>{children}</Heading>;
}

export function EmailText({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <Text style={muted ? textMuted : text}>{children}</Text>;
}

/** Bouton d'action doré, coins nets. */
export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ padding: "8px 0 4px" }}>
      <Button href={href} style={button}>
        {children}
      </Button>
    </Section>
  );
}

/** Repli en clair pour les clients qui n'ouvrent pas le bouton. */
export function EmailFallbackLink({ href }: { href: string }) {
  return (
    <Text style={fallback}>
      Ou copie ce lien dans ton navigateur :<br />
      <span style={fallbackUrl}>{href}</span>
    </Text>
  );
}

/** Encart d'information (fond légèrement teinté, filet doré à gauche). */
export function EmailNote({ children }: { children: ReactNode }) {
  return <Text style={note}>{children}</Text>;
}

const heading: React.CSSProperties = {
  margin: "0 0 16px",
  color: dna.parch,
  fontFamily: fonts.display,
  fontSize: "24px",
  lineHeight: "30px",
  fontWeight: 400,
};

const text: React.CSSProperties = {
  margin: "0 0 16px",
  color: dna.body,
  fontSize: "15px",
  lineHeight: "24px",
};

const textMuted: React.CSSProperties = {
  ...text,
  color: dna.muted,
  fontSize: "13px",
};

const button: React.CSSProperties = {
  backgroundColor: dna.gold,
  color: dna.ink,
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  padding: "13px 24px",
  textDecoration: "none",
};

const fallback: React.CSSProperties = {
  margin: "16px 0 0",
  color: dna.muted,
  fontSize: "12px",
  lineHeight: "18px",
};

const fallbackUrl: React.CSSProperties = {
  color: dna.gold,
  wordBreak: "break-all",
};

const note: React.CSSProperties = {
  margin: "16px 0 0",
  padding: "12px 14px",
  backgroundColor: dna.ink2,
  borderLeft: `3px solid ${dna.gold}`,
  color: dna.muted,
  fontSize: "13px",
  lineHeight: "20px",
};
