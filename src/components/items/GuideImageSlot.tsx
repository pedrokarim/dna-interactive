import { getTranslations } from "next-intl/server";
import { ImagePlus } from "lucide-react";
import { cn } from "@/components/dna/cn";
import { GuideImageZoom } from "@/components/items/GuideImageZoom";
import {
  expectedGuideFileName,
  resolveGuideImage,
  type CalamityGuideSlot,
} from "@/lib/items/guide-images";

type GuideImageSlotProps = {
  slot: CalamityGuideSlot;
  /** Légende affichée sous l'image, et texte alternatif quand elle est présente. */
  caption: string;
  /**
   * Explication des repères numérotés incrustés dans l'image. Les cadres rouges
   * y sont numérotés dans l'ordre : le texte reste traduisible, l'image non.
   */
  legend?: string[];
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
export async function GuideImageSlot({
  slot,
  caption,
  legend,
  ratio = "16 / 9",
  className,
}: GuideImageSlotProps) {
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
          <GuideImageZoom src={source} alt={caption} zoomLabel={t("imageZoomHint")} />
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

      {source ? (
        <figcaption className="mt-2 text-xs leading-relaxed text-muted">
          {caption}
          {legend && legend.length > 0 ? (
            <ol className="mt-2 space-y-1">
              {legend.map((entry, index) => (
                <li key={entry} className="flex items-start gap-2">
                  <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full bg-crimson-bright/85 font-mono text-[0.6rem] leading-none text-white">
                    {index + 1}
                  </span>
                  <span className="text-parch/75">{entry}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
