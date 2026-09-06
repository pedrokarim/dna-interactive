"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import ImageZoomModal from "@/components/ImageZoomModal";

/**
 * Illustration du guide, agrandissable.
 *
 * Les captures portent du texte de jeu : à la taille d'une figure d'article,
 * il est illisible. Un clic ouvre la visionneuse existante (zoom, rotation,
 * téléchargement), plutôt que d'imposer une image géante dans le fil de lecture.
 */
export function GuideImageZoom({
  src,
  alt,
  zoomLabel,
}: {
  src: string;
  alt: string;
  zoomLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={zoomLabel}
        aria-label={zoomLabel}
        className="group absolute inset-0 block cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
        <span className="pointer-events-none absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-sm border border-white/15 bg-ink/80 text-parch/70 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" />
        </span>
      </button>
      <ImageZoomModal imageUrl={open ? src : null} onClose={() => setOpen(false)} />
    </>
  );
}
