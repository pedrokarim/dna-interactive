/**
 * Composants d'un « component embed » Discord : l'aperçu de lien que Discord
 * dessine à la place de la carte Open Graph.
 *
 * Doc : https://discord.com/developers/docs/link-previews/component-embeds
 * On ne décrit que les composants admis dans un aperçu de lien. Aucune
 * dépendance au framework, testable tel quel.
 */

export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  Section: 9,
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  Separator: 14,
  Container: 17,
} as const;

/** Seul style de bouton admis dans un aperçu : le bouton-lien. */
export const LINK_BUTTON_STYLE = 5;

export type UnfurledMedia = { url: string };

export type TextDisplay = { type: 10; content: string };

export type Thumbnail = {
  type: 11;
  media: UnfurledMedia;
  description?: string;
  spoiler?: boolean;
};

export type ButtonEmoji = { name: string; id?: string; animated?: boolean };

export type LinkButton = {
  type: 2;
  style: 5;
  url: string;
  label?: string;
  emoji?: ButtonEmoji;
  disabled?: boolean;
};

export type Section = {
  type: 9;
  components: TextDisplay[];
  accessory: Thumbnail | LinkButton;
};

export type MediaGalleryItem = { media: UnfurledMedia; description?: string; spoiler?: boolean };

export type MediaGallery = { type: 12; items: MediaGalleryItem[] };

export type Separator = { type: 14; divider?: boolean; spacing?: 1 | 2 };

export type ActionRow = { type: 1; components: LinkButton[] };

export type ContainerChild = TextDisplay | Section | MediaGallery | Separator | ActionRow;

export type Container = {
  type: 17;
  accent_color?: number;
  spoiler?: boolean;
  components: ContainerChild[];
};

/** Document complet, tel que Discord l'attend : un seul Container au premier niveau. */
export type ComponentEmbed = { component: Container };

export function text(content: string): TextDisplay {
  return { type: ComponentType.TextDisplay, content };
}

export function thumbnail(url: string, description?: string): Thumbnail {
  return description
    ? { type: ComponentType.Thumbnail, media: { url }, description }
    : { type: ComponentType.Thumbnail, media: { url } };
}

export function section(texts: TextDisplay[], accessory: Thumbnail | LinkButton): Section {
  return { type: ComponentType.Section, components: texts, accessory };
}

export function gallery(items: Array<{ url: string; description?: string }>): MediaGallery {
  return {
    type: ComponentType.MediaGallery,
    items: items.map(({ url, description }) =>
      description ? { media: { url }, description } : { media: { url } },
    ),
  };
}

export function separator(options: { divider?: boolean; spacing?: 1 | 2 } = {}): Separator {
  return { type: ComponentType.Separator, ...options };
}

export function linkButton(label: string, url: string, emoji?: string): LinkButton {
  const button: LinkButton = { type: ComponentType.Button, style: LINK_BUTTON_STYLE, url, label };
  if (emoji) button.emoji = { name: emoji };
  return button;
}

/** Une rangée de boutons. Discord en accepte cinq au plus : `serializeEmbed` refuse au-delà. */
export function actionRow(buttons: LinkButton[]): ActionRow {
  return { type: ComponentType.ActionRow, components: buttons };
}

export function container(children: ContainerChild[], accentColor?: number | null): ComponentEmbed {
  const component: Container = { type: ComponentType.Container, components: children };
  if (accentColor != null) component.accent_color = accentColor;
  return { component };
}

/** « #e2664a » donne 14837322, l'entier que Discord attend pour `accent_color`. */
export function hexToColor(hex: string | null | undefined): number | null {
  if (!hex) return null;
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  return match ? Number.parseInt(match[1], 16) : null;
}
