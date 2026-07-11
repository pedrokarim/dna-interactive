import "server-only";
import { render } from "@react-email/render";
import { ContactMessage } from "@/emails/ContactMessage";

type Input = { name: string; email: string; subjectLabel: string; message: string };

/** Rend l'email de contact (design system DNA) en HTML prêt à envoyer. */
export function renderContactEmail(input: Input): Promise<string> {
  return render(<ContactMessage {...input} />);
}
