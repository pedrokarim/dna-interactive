import { getCharacterById, getCharacterSlug, resolveCharacterDisplayName } from "@/lib/characters/catalog";
import { getItemByCategoryAndId, getItemTranslation } from "@/lib/items/catalog";
import type { TheatreFeaturedKind, TheatreRotation } from "./rotations";

/**
 * Ce qu'une rotation met en avant, prêt à afficher : un nom dans la langue du
 * visiteur, un visuel, un lien vers la fiche.
 *
 * `known` est faux quand l'identifiant ne correspond à rien dans nos données
 * (saisie à la main erronée, ou personnage pas encore intégré) : on affiche
 * alors l'identifiant brut plutôt que de masquer la rotation.
 */
export type TheatreFeaturedView = {
  kind: TheatreFeaturedKind;
  id: string;
  name: string;
  href: string | null;
  /** Affiche en hauteur (bande 1:4), pour la frise des rotations. */
  poster: string | null;
  /** Grande illustration carrée, pour la rotation mise en avant. */
  bust: string | null;
  /** Petit visuel carré, pour les listes. */
  icon: string | null;
  known: boolean;
};

export type TheatreRotationView = TheatreRotation & { featuredView: TheatreFeaturedView };

export function resolveFeatured(featured: TheatreRotation["featured"], locale: string): TheatreFeaturedView {
  const language = locale.toUpperCase();

  if (featured.kind === "character") {
    const character = getCharacterById(featured.id);
    if (character) {
      const portraits = character.portraits;
      return {
        kind: "character",
        id: character.id,
        name: resolveCharacterDisplayName(character, language),
        href: `/characters/${getCharacterSlug(character)}`,
        poster: portraits?.gacha?.publicPath ?? null,
        bust: portraits?.bust?.publicPath ?? null,
        icon: portraits?.head?.publicPath ?? portraits?.icon?.publicPath ?? null,
        known: true,
      };
    }
  } else {
    const weapon = getItemByCategoryAndId("weapons", featured.id);
    if (weapon) {
      const icon = weapon.icon?.publicPath ?? null;
      return {
        kind: "weapon",
        id: weapon.id,
        name: getItemTranslation(weapon, language, ["EN"]).modName ?? weapon.id,
        href: `/items/weapons/${weapon.id}`,
        // Les armes de calamité ont une affiche et une grande illustration à côté
        // de leur icône ; l'affichage retombe sur l'icône si elles manquent.
        poster: icon ? icon.replace("/T_Head_", "/T_Gacha_") : null,
        bust: icon ? icon.replace("/T_Head_", "/T_Bust_") : null,
        icon,
        known: true,
      };
    }
  }

  return { kind: featured.kind, id: featured.id, name: featured.id, href: null, poster: null, bust: null, icon: null, known: false };
}

export function toRotationView(rotation: TheatreRotation, locale: string): TheatreRotationView {
  return { ...rotation, featuredView: resolveFeatured(rotation.featured, locale) };
}
