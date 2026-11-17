/**
 * Validation et sérialisation d'un component embed.
 *
 * `serializeEmbed` rend `null` dès qu'une règle de Discord n'est pas respectée,
 * et la page garde sa carte Open Graph. Discord jette le bloc entier pour une
 * seule clé de trop sur un bouton.
 */
import {
  ComponentType,
  LINK_BUTTON_STYLE,
  type ComponentEmbed,
  type ContainerChild,
  type LinkButton,
  type UnfurledMedia,
} from "./components";

export const MAX_COMPONENTS = 40;
export const MAX_GALLERY_ITEMS = 10;
export const MAX_BUTTONS_PER_ROW = 5;
export const MAX_SECTION_TEXTS = 3;
export const MAX_BYTES = 3000;
export const MAX_MEDIA_URL_LENGTH = 2048;

/** Seules clés admises sur un bouton ; toute autre invalide le bloc entier. */
const BUTTON_KEYS = new Set(["id", "type", "url", "style", "label", "emoji", "disabled"]);

/** Composants admis à l'intérieur du Container. */
const CHILD_TYPES = new Set<number>([
  ComponentType.ActionRow,
  ComponentType.Section,
  ComponentType.TextDisplay,
  ComponentType.MediaGallery,
  ComponentType.Separator,
]);

function isHttpUrl(value: unknown, maxLength = Number.POSITIVE_INFINITY): boolean {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isMedia(media: UnfurledMedia | undefined): boolean {
  return !!media && isHttpUrl(media.url, MAX_MEDIA_URL_LENGTH);
}

function nonEmptyText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function checkButton(button: LinkButton, errors: string[]): void {
  for (const key of Object.keys(button)) {
    if (!BUTTON_KEYS.has(key)) errors.push(`bouton : clé « ${key} » interdite`);
  }
  if (button.type !== ComponentType.Button) errors.push("bouton : type attendu 2");
  if (button.style !== LINK_BUTTON_STYLE) errors.push("bouton : seul le style lien (5) est admis");
  if (!isHttpUrl(button.url)) errors.push(`bouton : adresse invalide « ${String(button.url)} »`);
  if (!nonEmptyText(button.label) && !nonEmptyText(button.emoji?.name)) {
    errors.push("bouton : il faut un label ou un emoji");
  }
}

/**
 * Règles de Discord que le bloc enfreint. Tableau vide : tout ce qui se vérifie
 * sans sérialiser est bon. La taille en octets se vérifie dans `serializeEmbed`.
 */
export function validateEmbed(embed: ComponentEmbed): string[] {
  const errors: string[] = [];
  const root = embed?.component;
  if (!embed || typeof embed !== "object" || Object.keys(embed).some((key) => key !== "component")) {
    errors.push("le document ne doit contenir que la clé « component »");
  }
  if (!root || root.type !== ComponentType.Container) {
    errors.push("le premier niveau doit être un seul Container (type 17)");
    return errors;
  }
  if (!Array.isArray(root.components) || root.components.length === 0) {
    errors.push("le Container est vide");
    return errors;
  }

  let components = 1; // le Container lui-même
  let galleryItems = 0;

  const visit = (child: ContainerChild) => {
    components += 1;
    if (!CHILD_TYPES.has(child.type)) {
      errors.push(
        (child.type as number) === ComponentType.Container
          ? "un Container ne peut pas contenir de Container"
          : `composant de type ${child.type} interdit dans un aperçu`,
      );
      return;
    }
    switch (child.type) {
      case ComponentType.TextDisplay:
        if (!nonEmptyText(child.content)) errors.push("Text Display vide");
        break;
      case ComponentType.Section: {
        const texts = child.components ?? [];
        if (texts.length < 1 || texts.length > MAX_SECTION_TEXTS) {
          errors.push(`une Section porte de 1 à ${MAX_SECTION_TEXTS} Text Display`);
        }
        for (const t of texts) {
          components += 1;
          if (t.type !== ComponentType.TextDisplay || !nonEmptyText(t.content)) {
            errors.push("une Section ne contient que des Text Display non vides");
          }
        }
        const accessory = child.accessory;
        components += 1;
        if (accessory?.type === ComponentType.Thumbnail) {
          if (!isMedia(accessory.media)) errors.push("vignette : adresse invalide");
        } else if (accessory?.type === ComponentType.Button) {
          checkButton(accessory, errors);
        } else {
          errors.push("une Section doit avoir une vignette ou un bouton en accessoire");
        }
        break;
      }
      case ComponentType.MediaGallery: {
        const items = child.items ?? [];
        if (items.length < 1) errors.push("galerie vide");
        galleryItems += items.length;
        for (const item of items) {
          if (!isMedia(item?.media)) errors.push("galerie : adresse de média invalide");
        }
        break;
      }
      case ComponentType.ActionRow: {
        const buttons = child.components ?? [];
        if (buttons.length < 1 || buttons.length > MAX_BUTTONS_PER_ROW) {
          errors.push(`une rangée porte de 1 à ${MAX_BUTTONS_PER_ROW} boutons`);
        }
        for (const button of buttons) {
          components += 1;
          checkButton(button, errors);
        }
        break;
      }
      case ComponentType.Separator:
        break;
    }
  };

  for (const child of root.components) visit(child);

  if (root.accent_color != null) {
    const color = root.accent_color;
    if (!Number.isInteger(color) || color < 0 || color > 0xffffff) errors.push("couleur d'accent hors de 0x000000–0xFFFFFF");
  }
  if (components > MAX_COMPONENTS) errors.push(`${components} composants, ${MAX_COMPONENTS} au plus`);
  if (galleryItems > MAX_GALLERY_ITEMS) errors.push(`${galleryItems} médias de galerie, ${MAX_GALLERY_ITEMS} au plus`);
  return errors;
}

/**
 * JSON à poser dans une page ou à servir tel quel. `<`, `>`, `&`, U+2028 et
 * U+2029 sont écrits en `\uXXXX` : aucun texte ne peut fermer une balise
 * `<script>`, et ça reste du JSON valide.
 *
 * Rend `null` si une règle de Discord n'est pas respectée, y compris au-delà de
 * 3 000 octets (comme chez Discord, un caractère échappé compte pour sa forme
 * `\uXXXX`).
 */
export function serializeEmbed(embed: ComponentEmbed): string | null {
  if (validateEmbed(embed).length > 0) return null;
  const json = JSON.stringify(embed).replace(
    /[<>&\u2028\u2029]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
  return new TextEncoder().encode(json).length <= MAX_BYTES ? json : null;
}
