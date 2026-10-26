"use client";

import { useState } from "react";
import { cn } from "./cn";
import { optimizedImageUrl } from "@/lib/images/optimized";

/** Ancien fallback recyclé du pin de carte Leaflet — traité comme "pas d'image". */
const MARKER = "/marker-default.svg";
/** Placeholder DNA "image indisponible" (public/item-fallback.svg). */
export const ITEM_FALLBACK_ICON = "/item-fallback.svg";

type DnaItemIconProps = {
  /** Source de l'icône. `null`/vide/marker → placeholder DNA. */
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  title?: string;
};

/**
 * Icône d'item robuste : rend le placeholder DNA (`item-fallback.svg`) quand la
 * source est absente, vaut l'ancien marker, ou échoue au chargement (404 runtime).
 * Drop-in pour les `<img>` d'items — conserve `className`/tailles du site.
 *
 * L'image passe par l'optimiseur de Next, à deux fois `width` (écrans haute
 * densité) : les icônes sont des PNG de 256 px, affichées entre 20 et 96 px.
 * Sans `width`, on garde 256 px, la taille d'origine, en AVIF/WebP.
 */
export function DnaItemIcon({ src, alt, className, width, height, loading, title }: DnaItemIconProps) {
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);

  const clean = src && src !== MARKER ? src : null;
  const isFallback = !clean || erroredSrc === clean;
  const effective = isFallback ? ITEM_FALLBACK_ICON : optimizedImageUrl(clean, Math.min((width ?? 128) * 2, 384));

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={effective}
      alt={alt}
      title={title}
      width={width}
      height={height}
      loading={loading}
      onError={() => {
        if (clean && erroredSrc !== clean) setErroredSrc(clean);
      }}
      className={cn(className, isFallback && "opacity-90")}
      data-fallback={isFallback ? "" : undefined}
    />
  );
}
