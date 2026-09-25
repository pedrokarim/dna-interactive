import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, BookOpenText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getGuideOutline } from "@/lib/items/guide-chapters";

/**
 * Sommaire d'un guide : le chapô, puis une carte par chapitre.
 *
 * C'est la page qu'on atteint en cliquant « Guide » ; elle remplace le mur de
 * texte d'avant. Chaque carte dit ce que son chapitre traite, pour qu'on
 * choisisse au lieu de faire défiler.
 */
export async function GuideLobby({
  categoryId,
  categorySlug,
  locale,
  /** Rendu sous le chapô : bandeaux, repères, ce que le guide veut montrer d'emblée. */
  children,
}: {
  categoryId: string;
  categorySlug: string;
  locale: string;
  children?: React.ReactNode;
}) {
  const outline = getGuideOutline(categoryId);
  if (!outline) return null;

  const t = await getTranslations({ locale, namespace: outline.namespace });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const accent = outline.accent;
  const border = `color-mix(in srgb, ${accent} 28%, transparent)`;

  return (
    <div className="max-w-5xl space-y-8">
      <section className="border bg-panel/65 p-6 md:p-8" style={{ borderColor: border }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/items/${categorySlug}`}
            className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-sm text-parch transition-colors hover:border-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("backToList")}
          </Link>
          <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 px-3 py-1 text-xs text-parch">
            <BookOpenText className="h-3.5 w-3.5" style={{ color: accent }} />
            {t(outline.badgeKey ?? "badge")}
          </span>
        </div>

        <h1 className="mt-5 font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
        {/*
          Rendu riche : l'introduction des Demon Wedges porte une balise <mod>.
          Fournir le gestionnaire ne gêne pas les guides qui n'en ont pas.
        */}
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-parch/85">
          {t.rich("intro", { mod: (chunks) => <span style={{ color: accent }}>{chunks}</span> })}
        </p>

        {children}
      </section>

      <ol className="grid gap-4 md:grid-cols-2">
        {outline.chapters.map((c, i) => (
          <li key={c.slug}>
            <Link
              href={`/items/${categorySlug}/about/${c.slug}`}
              className="group flex h-full items-start gap-4 border border-white/10 bg-panel/50 p-5 transition-colors hover:border-white/25"
            >
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border font-caps text-sm"
                style={{ borderColor: border, color: accent }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-display text-lg text-parch">
                  {t(c.titleKey)}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: accent }}
                  />
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-parch/75">{t(c.blurbKey)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
