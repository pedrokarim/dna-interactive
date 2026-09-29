"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ArrowLeft, Box, EyeOff, Heart } from "lucide-react";
import { useAtom } from "jotai";
import type { CosmeticDetailView } from "@/lib/cosmetics/detail";
import type { VisualKey } from "@/lib/cosmetics/types";
import { bannerStatus, formatDate, formatNumber, useNow } from "@/lib/cosmetics/format";
import { cosmeticsFavoritesAtom, toggleCosmeticFavoriteAtom } from "@/lib/store";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DnaStatRow } from "@/components/dna/StatRow";
import { DnaStars } from "@/components/dna/RarityStars";
import { DnaItemIcon } from "@/components/dna/ItemIcon";
import { RARITIES, rarityAttr, toRarityLevel } from "@/components/dna/rarity";
import { cn } from "@/components/dna/cn";
import BannerStatusTag from "./BannerStatusTag";

/** Ordre des visuels dans le sélecteur de la scène. */
const VISUAL_ORDER: VisualKey[] = ["bust", "portrait", "wide", "icon"];
type StageView = VisualKey | "model3d";

export default function CosmeticDetailClient({ cosmetic }: { cosmetic: CosmeticDetailView }) {
  const t = useTranslations("cosmetics");
  const tc = useTranslations("common");
  const locale = useLocale();
  const now = useNow();
  const [favorites] = useAtom(cosmeticsFavoritesAtom);
  const [, toggleFavorite] = useAtom(toggleCosmeticFavoriteAtom);
  const favoriteKey = `${cosmetic.category}/${cosmetic.id}`;
  const isFavorite = favorites.has(favoriteKey);

  // Tenue déclinée pour plusieurs personnages : les visuels suivent le personnage choisi.
  const [characterIndex, setCharacterIndex] = useState(0);
  const visualsDiffer = useMemo(
    () => new Set(cosmetic.characters.map((character) => JSON.stringify(character.visuals))).size > 1,
    [cosmetic.characters],
  );
  const activeCharacter = cosmetic.characters[visualsDiffer ? characterIndex : 0] ?? null;
  const visuals = useMemo(
    () => ({ ...cosmetic.visuals, ...(activeCharacter?.visuals ?? {}) }),
    [cosmetic.visuals, activeCharacter],
  );
  const availableVisuals = VISUAL_ORDER.filter((key) => visuals[key]);
  const [stageView, setStageView] = useState<StageView>(availableVisuals[0] ?? "icon");
  const activeView: StageView = stageView === "model3d" || visuals[stageView] ? stageView : (availableVisuals[0] ?? "icon");
  const activeSrc = activeView === "model3d" ? null : (visuals[activeView] ?? null);

  // Bannières : en cours d'abord (horloge du visiteur), puis de la plus récente à la plus ancienne.
  const sortedBanners = useMemo(() => {
    const rank = (banner: CosmeticDetailView["banners"][number]) => {
      if (!now) return 1;
      const status = bannerStatus(banner.start, banner.end, now);
      return status === "current" ? 0 : status === "upcoming" ? 1 : status === "permanent" ? 2 : 3;
    };
    return [...cosmetic.banners].sort((a, b) => rank(a) - rank(b) || (b.start ?? "").localeCompare(a.start ?? ""));
  }, [cosmetic.banners, now]);

  const rarityLevel = toRarityLevel(cosmetic.rarity);
  const tint = rarityLevel ? RARITIES[rarityLevel].hex : "#ba9869";
  const categoryTitle = t(`categories.${cosmetic.category}.title`);

  return (
    <div className="space-y-4 md:space-y-8" data-rarity={rarityAttr(rarityLevel)}>
      {/* Barre du haut : retour + favori */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/cosmetics/${cosmetic.category}`}
          className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-panel/60 px-3 py-2 text-sm text-parch/85 transition-colors hover:border-gold/40 hover:text-parch"
        >
          <ArrowLeft className="h-4 w-4" />
          {categoryTitle}
        </Link>
        <button
          type="button"
          onClick={() => toggleFavorite(favoriteKey)}
          aria-pressed={isFavorite}
          className={cn(
            "inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors",
            isFavorite
              ? "border-crimson/50 bg-crimson/15 text-crimson-bright"
              : "border-white/10 bg-panel/60 text-parch/85 hover:border-crimson/40 hover:text-crimson-bright",
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-crimson-bright")} />
          {isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
        </button>
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1fr_360px]">
        {/* Scène : visuel + bandeau nom + sélecteur de visuels */}
        <div
          className="relative flex min-h-[520px] items-center justify-center overflow-hidden border border-white/10"
          style={{
            background: `radial-gradient(60% 60% at 50% 40%, ${tint}26, transparent 62%), linear-gradient(180deg, rgba(20,19,17,0.4), rgba(8,7,6,0.6))`,
          }}
        >
          <div className="absolute left-4 top-4 z-10 max-w-[80%] md:left-6 md:top-6">
            <p className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-gold">
              {cosmetic.subcategoryLabel ? `${categoryTitle} · ${cosmetic.subcategoryLabel}` : categoryTitle}
            </p>
            <h1 className="dna-rarity-name mt-0.5 font-display text-3xl font-semibold [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] md:text-5xl">
              {cosmetic.name}
            </h1>
            <span aria-hidden className="dna-rarity-line mt-2 block h-px w-24" />
            {cosmetic.rarity ? <DnaStars value={cosmetic.rarity} className="mt-2 text-sm" /> : null}
            {visualsDiffer && activeCharacter ? (
              <p className="mt-1 font-display text-lg italic text-muted">{activeCharacter.name}</p>
            ) : null}
          </div>

          {/* Sol lumineux */}
          <span
            aria-hidden
            className="absolute bottom-[8%] left-1/2 h-14 w-72 -translate-x-1/2 rounded-[50%] blur-md"
            style={{ background: `radial-gradient(ellipse, ${tint}3a, transparent 70%)` }}
          />

          {activeView === "model3d" ? (
            <div className="relative z-[1] flex max-w-sm flex-col items-center gap-3 border border-dashed border-gold/30 bg-ink/50 px-8 py-10 text-center">
              <Box className="h-10 w-10 text-gold/70" aria-hidden />
              <p className="font-display text-xl text-parch">{t("model3dTitle")}</p>
              <p className="text-sm text-muted">{t("model3dSoon")}</p>
            </div>
          ) : activeView === "icon" ? (
            <div className="relative z-[1] flex h-72 w-72 items-center justify-center md:h-96 md:w-96">
              <span
                aria-hidden
                className="absolute inset-[12%] rounded-full blur-2xl"
                style={{ background: `radial-gradient(circle, ${tint}40, transparent 65%)` }}
              />
              {/* Hauteur imposée : l'icône du jeu (256 px) garde sa marge transparente, on l'agrandit. */}
              <DnaItemIcon
                src={activeSrc}
                alt={cosmetic.name}
                width={256}
                height={256}
                className="relative h-full w-full object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
              />
            </div>
          ) : activeSrc ? (
            <img
              src={activeSrc}
              alt={`${cosmetic.name} - ${t(`visuals.${activeView}`)}`}
              width={activeView === "portrait" ? 256 : 1024}
              height={activeView === "portrait" ? 1024 : 1024}
              className={cn(
                "relative z-[1] w-auto max-w-[94%] select-none object-contain drop-shadow-[0_18px_50px_rgba(0,0,0,0.6)]",
                activeView === "wide" ? "max-h-[70%]" : "h-[600px] max-h-full",
              )}
              style={
                activeView === "portrait"
                  ? {
                      // Bande étroite au fond opaque : fondu latéral et bas, comme sur les fiches personnage.
                      maskImage:
                        "linear-gradient(to right, transparent, #000 18%, #000 82%, transparent), linear-gradient(to bottom, #000 80%, transparent)",
                      maskComposite: "intersect",
                      WebkitMaskImage:
                        "linear-gradient(to right, transparent, #000 18%, #000 82%, transparent), linear-gradient(to bottom, #000 80%, transparent)",
                      WebkitMaskComposite: "source-in",
                    }
                  : undefined
              }
            />
          ) : null}

          {/* Sélecteur de visuels : les formats 2D du jeu, puis l'emplacement 3D réservé. */}
          <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center gap-1.5 md:left-6">
            {availableVisuals.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStageView(key)}
                aria-pressed={activeView === key}
                className={cn(
                  "px-2.5 py-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] transition-colors",
                  activeView === key
                    ? "border border-gold/60 bg-gold/20 text-gold-bright"
                    : "border border-white/10 bg-ink/60 text-muted hover:border-gold/30 hover:text-parch",
                )}
              >
                {t(`visuals.${key}`)}
              </button>
            ))}
            {cosmetic.has3dModel ? (
              <button
                type="button"
                onClick={() => setStageView("model3d")}
                aria-pressed={activeView === "model3d"}
                title={t("model3dSoon")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 font-caps text-[0.55rem] uppercase tracking-[0.14em] transition-colors",
                  activeView === "model3d"
                    ? "border border-gold/60 bg-gold/20 text-gold-bright"
                    : "border border-dashed border-white/20 bg-ink/60 text-muted hover:border-gold/30 hover:text-parch",
                )}
              >
                <Box className="h-3 w-3" aria-hidden />
                {t("visuals.model3d")}
                <span className="text-[0.5rem] normal-case tracking-normal text-muted-2">{t("soon")}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Panneau d'informations */}
        <aside className="flex flex-col gap-4">
          <DnaPanel className="p-4 md:p-5">
            <DnaSectionLabel>{t("info")}</DnaSectionLabel>
            <div className="mt-2">
              <DnaStatRow label={tc("category")} value={categoryTitle} />
              {cosmetic.subcategoryLabel ? <DnaStatRow label={t("slot")} value={cosmetic.subcategoryLabel} /> : null}
              {cosmetic.rarity ? <DnaStatRow label={tc("rarity")} value={<DnaStars value={cosmetic.rarity} />} /> : null}
              {cosmetic.releaseVersion ? <DnaStatRow label={tc("version")} value={cosmetic.releaseVersion} /> : null}
              {cosmetic.refund ? (
                <DnaStatRow
                  label={t("refund")}
                  value={<CurrencyAmount amount={cosmetic.refund.amount} currency={cosmetic.refund.currency} locale={locale} />}
                />
              ) : null}
              <DnaStatRow label={t("gameId")} value={cosmetic.gameId} />
            </div>
            {cosmetic.hiddenUntilOwned ? (
              <p className="mt-3 flex items-start gap-2 border border-white/10 bg-ink/50 px-3 py-2 text-xs text-muted">
                <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/80" aria-hidden />
                {t("hiddenHint")}
              </p>
            ) : null}
          </DnaPanel>

          {cosmetic.obtain.length > 0 || cosmetic.obtainNote || cosmetic.shop.length > 0 ? (
            <DnaPanel className="p-4 md:p-5">
              <DnaSectionLabel>{t("obtainTitle")}</DnaSectionLabel>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cosmetic.obtain.map((method) => (
                  <span key={method} className="rounded-sm border border-gold/25 bg-gold/10 px-2 py-1 text-xs text-gold">
                    {t(`obtain.${method}`)}
                  </span>
                ))}
              </div>
              {/* La note du jeu ne sert que si elle précise la pastille (« Coffret de départ IV »). */}
              {cosmetic.obtainNote && (cosmetic.obtain.length === 0 || cosmetic.obtain.includes("starterPack")) ? (
                <p className="mt-2 text-sm text-parch/80">{cosmetic.obtainNote}</p>
              ) : null}
              {cosmetic.shop.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {cosmetic.shop.map((offer, index) => (
                    <li key={index} className="flex items-center justify-between gap-3 border-b border-white/6 py-1.5 text-sm">
                      <CurrencyAmount amount={offer.price} currency={offer.currency} locale={locale} />
                      {offer.limit ? <span className="text-xs text-muted">{t("purchaseLimit", { count: offer.limit })}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </DnaPanel>
          ) : null}
        </aside>
      </div>

      {cosmetic.description ? (
        <DnaPanel className="p-4 md:p-6">
          <DnaSectionLabel>{t("descriptionTitle")}</DnaSectionLabel>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-parch/85 md:text-base">{cosmetic.description}</p>
        </DnaPanel>
      ) : null}

      {cosmetic.characters.length > 1 ? (
        <DnaPanel className="p-4 md:p-6">
          <DnaSectionLabel>{t("charactersTitle", { count: cosmetic.characters.length })}</DnaSectionLabel>
          <p className="mt-2 text-sm text-muted">{visualsDiffer ? t("charactersHint") : t("charactersHintShared")}</p>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-12">
            {cosmetic.characters.map((character, index) => {
              const content = (
                <>
                  <span className="block aspect-square w-full overflow-hidden rounded-sm bg-ink/80">
                    {character.avatar ? (
                      <img src={character.avatar} alt="" width={96} height={96} loading="lazy" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="w-full truncate text-center text-[11px] text-parch/85">{character.name}</span>
                </>
              );
              // Déclinaisons visuellement distinctes : on choisit le personnage sur la scène.
              // Sinon (même visuel pour tous), la vignette mène à la fiche du personnage.
              return visualsDiffer ? (
                <button
                  key={character.charId}
                  type="button"
                  onClick={() => setCharacterIndex(index)}
                  aria-pressed={index === characterIndex}
                  title={character.name}
                  className={cn(
                    "group flex flex-col items-center gap-1 border p-1.5 transition-colors",
                    index === characterIndex ? "border-gold/60 bg-gold/10" : "border-white/10 bg-ink/50 hover:border-gold/30",
                  )}
                >
                  {content}
                </button>
              ) : (
                <Link
                  key={character.charId}
                  href={`/characters/${character.slug}`}
                  title={character.name}
                  className="group flex flex-col items-center gap-1 border border-white/10 bg-ink/50 p-1.5 transition-colors hover:border-gold/40"
                >
                  {content}
                </Link>
              );
            })}
          </div>
          {visualsDiffer && activeCharacter ? (
            <Link
              href={`/characters/${activeCharacter.slug}`}
              className="mt-3 inline-flex text-sm text-gold transition-colors hover:text-gold-bright"
            >
              {t("viewCharacter", { name: activeCharacter.name })}
            </Link>
          ) : null}
        </DnaPanel>
      ) : activeCharacter ? (
        <DnaPanel className="p-4 md:p-6">
          <DnaSectionLabel>{t("characterTitle")}</DnaSectionLabel>
          <Link
            href={`/characters/${activeCharacter.slug}`}
            className="group mt-3 inline-flex items-center gap-3 border border-white/10 bg-ink/50 p-2 pr-4 transition-colors hover:border-gold/40"
          >
            {activeCharacter.avatar ? (
              <img src={activeCharacter.avatar} alt="" width={56} height={56} className="h-14 w-14 rounded-sm object-cover" />
            ) : null}
            <span className="font-display text-lg text-parch group-hover:text-gold-bright">{activeCharacter.name}</span>
          </Link>
        </DnaPanel>
      ) : null}

      {cosmetic.variants.length > 0 ? (
        <DnaPanel className="p-4 md:p-6">
          <DnaSectionLabel>{t("variantsTitle", { count: cosmetic.variants.length })}</DnaSectionLabel>
          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
            {cosmetic.variants.map((variant) => (
              <Link
                key={variant.id}
                href={`/cosmetics/${cosmetic.category}/${variant.id}`}
                title={variant.name}
                aria-current={variant.current ? "page" : undefined}
                data-rarity={rarityAttr(toRarityLevel(variant.rarity))}
                className={cn(
                  "dna-rarity-tile group relative flex aspect-square flex-col overflow-hidden rounded-sm border bg-ink/80 p-2",
                  variant.current && "ring-1 ring-gold/70",
                )}
              >
                <div className="flex flex-1 items-center justify-center overflow-hidden">
                  <DnaItemIcon src={variant.icon} alt={variant.name} width={96} height={96} loading="lazy" className="max-h-full max-w-full object-contain" />
                </div>
                <p className="dna-rarity-name mt-1 truncate text-[11px] font-semibold">{variant.name}</p>
              </Link>
            ))}
          </div>
        </DnaPanel>
      ) : null}

      {cosmetic.banners.length > 0 ? (
        <DnaPanel className="p-4 md:p-6">
          <DnaSectionLabel>{t("bannersTitle")}</DnaSectionLabel>
          <ul className="mt-4 grid gap-2 lg:grid-cols-2">
            {sortedBanners.map((banner) => (
              <li key={banner.id} className="min-w-0">
                <Link
                  href={`/cosmetics/banners/${banner.id}`}
                  className="group flex items-center gap-3 border border-white/10 bg-ink/50 p-2 transition-colors hover:border-gold/40"
                >
                  {banner.image ? (
                    <img src={banner.image} alt="" width={168} height={60} loading="lazy" className="hidden h-[60px] w-[168px] shrink-0 object-cover sm:block" />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base text-parch group-hover:text-gold-bright">{banner.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {t(`bannerTypes.${banner.type}`)}
                      {banner.start
                        ? ` · ${t("bannerPeriod", { start: formatDate(banner.start, locale) ?? "", end: formatDate(banner.end, locale) ?? "" })}`
                        : ""}
                    </span>
                  </span>
                  {now ? <BannerStatusTag status={bannerStatus(banner.start, banner.end, now)} className="shrink-0" /> : null}
                </Link>
              </li>
            ))}
          </ul>
        </DnaPanel>
      ) : null}
    </div>
  );
}

function CurrencyAmount({
  amount,
  currency,
  locale,
}: {
  amount: number;
  currency: { name: string; icon: string | null };
  locale: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums text-parch">
      {currency.icon ? <img src={currency.icon} alt="" width={20} height={20} className="h-5 w-5 object-contain" /> : null}
      <span>{formatNumber(amount, locale)}</span>
      <span className="text-xs text-muted">{currency.name}</span>
    </span>
  );
}
