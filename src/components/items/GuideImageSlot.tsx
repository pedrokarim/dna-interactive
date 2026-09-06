import { getTranslations } from "next-intl/server";
import { ImagePlus } from "lucide-react";
import { cn } from "@/components/dna/cn";
import {
  expectedGuideFileName,
  resolveGuideImage,
  type CalamityGuideSlot,
} from "@/lib/items/guide-images";

type GuideImageSlotProps = {
  slot: CalamityGuideSlot;
  /** Légende affichée sous l'image, et texte alternatif quand elle est présente. */
  caption: string;
  /** Rapport d'aspect réservé, pour que la mise en page ne bouge pas à l'arrivée de l'image. */
  ratio?: string;
  className?: string;
};

/**
 * Emplacement d'illustration du guide.
 *
 * Rend l'image si le fichier a été déposé, sinon un cadre qui annonce sa
 * place et le chemin exact attendu. La hauteur est réservée dans les deux cas :
 * ajouter l'image ne redistribue pas la page.
 */
export async function GuideImageSlot({ slot, caption, ratio = "16 / 9", className }: GuideImageSlotProps) {
  const t = await getTranslations("calamityGuide");
  const source = resolveGuideImage(slot);

  return (
    <figure className={cn("min-w-0", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden border",
          source ? "border-white/10 bg-ink/40" : "border-dashed border-crimson-bright/30 bg-crimson/[0.04]",
        )}
        style={{ aspectRatio: ratio }}
      >
        {source ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={source} alt={caption} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-4 text-center">
            <div>
              <ImagePlus className="mx-auto h-6 w-6 text-crimson-bright/70" aria-hidden />
              <p className="mt-2 font-caps text-[0.58rem] uppercase tracking-[0.2em] text-crimson-bright/80">
                {t("imageSlotLabel")}
              </p>
              <p className="mt-1 max-w-[26rem] text-sm text-parch/70">{caption}</p>
              <p className="mt-2 font-mono text-[0.68rem] text-muted-2">{expectedGuideFileName(slot)}</p>
            </div>
          </div>
        )}
      </div>
      {source ? <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption> : null}
    </figure>
  );
}
