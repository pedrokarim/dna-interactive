/**
 * Gabarit commun des aperçus Discord du site :
 *
 *   ## [Titre](url)
 *   Description
 *   **Libellé** valeur · **Libellé** valeur
 *   -# Note
 *   [vignette à droite, ou grande image dessous]
 *   ───
 *   [boutons]
 *
 * Le titre, la description et la note sont des textes bruts, échappés ici.
 * Les lignes sont du markdown déjà construit avec `field()` ou `maskedLink()`.
 */
import {
  actionRow,
  container,
  gallery,
  linkButton,
  section,
  separator,
  text,
  thumbnail,
  type ComponentEmbed,
  type ContainerChild,
} from "./components";
import { escapeMarkdown, maskedLink } from "./markdown";
import { MAX_BUTTONS_PER_ROW } from "./serialize";

export type PreviewButton = { label: string; url: string; emoji?: string };

export type PreviewInput = {
  title: string;
  /** Adresse absolue de la page : le titre pointe vers elle. */
  url: string;
  description?: string | null;
  /** Lignes de markdown déjà échappées (`field()`), jointes par un retour à la ligne. */
  lines?: Array<string | null | undefined | false>;
  /** Petite note grise en bas du texte (`-#`). */
  note?: string | null;
  /** Vignette à droite du texte. */
  thumbnail?: string | null;
  thumbnailAlt?: string | null;
  /** Grande image sous le texte. */
  image?: string | null;
  imageAlt?: string | null;
  /** Cinq au plus : les suivants sont ignorés. */
  buttons?: PreviewButton[];
  accentColor?: number | null;
};

export function buildPreviewEmbed(input: PreviewInput): ComponentEmbed {
  const parts = [`## ${maskedLink(input.title, input.url)}`];
  if (input.description) parts.push(escapeMarkdown(input.description));
  for (const line of input.lines ?? []) if (line) parts.push(line);
  if (input.note) parts.push(`-# ${escapeMarkdown(input.note)}`);
  const body = text(parts.join("\n"));

  const children: ContainerChild[] = [
    input.thumbnail ? section([body], thumbnail(input.thumbnail, input.thumbnailAlt ?? undefined)) : body,
  ];
  if (input.image) children.push(gallery([{ url: input.image, description: input.imageAlt ?? undefined }]));

  const buttons = (input.buttons ?? []).slice(0, MAX_BUTTONS_PER_ROW);
  if (buttons.length > 0) {
    children.push(separator({ divider: true, spacing: 1 }));
    children.push(actionRow(buttons.map((b) => linkButton(b.label, b.url, b.emoji))));
  }
  return container(children, input.accentColor);
}
