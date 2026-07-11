import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/Layout";
import { EmailHeading } from "./components/Primitives";
import { dna, fonts } from "./theme";

type Props = {
  name: string;
  email: string;
  subjectLabel: string;
  message: string;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Section style={{ marginBottom: "14px" }}>
      <Text style={fieldLabel}>{label}</Text>
      <Text style={fieldValue}>{value}</Text>
    </Section>
  );
}

/** Email interne reçu à chaque message du formulaire de contact. */
export function ContactMessage({ name, email, subjectLabel, message }: Props) {
  return (
    <EmailLayout preview={`${subjectLabel} — ${name}`} locale="fr">
      <EmailHeading>Nouveau message de contact</EmailHeading>
      <Field label="Nom" value={name} />
      <Field label="Email" value={email} />
      <Field label="Sujet" value={subjectLabel} />
      <Section style={{ marginBottom: "4px" }}>
        <Text style={fieldLabel}>Message</Text>
        <Text style={{ ...fieldValue, whiteSpace: "pre-wrap" }}>{message}</Text>
      </Section>
    </EmailLayout>
  );
}

export default ContactMessage;

const fieldLabel: React.CSSProperties = {
  margin: "0 0 4px",
  color: dna.gold,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  fontFamily: fonts.sans,
};

const fieldValue: React.CSSProperties = {
  margin: 0,
  padding: "10px 14px",
  backgroundColor: dna.ink2,
  borderLeft: `3px solid ${dna.gold}`,
  color: dna.parch,
  fontSize: "15px",
  lineHeight: "22px",
  fontFamily: fonts.sans,
};
