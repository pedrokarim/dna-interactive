"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { BannerDetailView } from "@/lib/cosmetics/banners";
import type { BannerEntryView } from "@/lib/cosmetics/catalog";
import { bannerStatus, formatDate, formatNumber, formatRemaining, useNow } from "@/lib/cosmetics/format";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DnaStatRow } from "@/components/dna/StatRow";
import { DnaItemIcon } from "@/components/dna/ItemIcon";
import { RARITIES, rarityAttr, toRarityLevel } from "@/components/dna/rarity";
import { cn } from "@/components/dna/cn";
import BannerStatusTag from "./BannerStatusTag";

export default function BannerDetailClient({ banner }: { banner: BannerDetailView }) {
  const t = useTranslations("cosmetics");
  const locale = useLocale();
  const now = useNow();
  const status = now ? bannerStatus(banner.start, banner.end, now) : null;
  const heroVisual = banner.featured?.visuals.bust ?? banner.featured?.visuals.portrait ?? null;
  const percent = (value: number) => t("percent", { value: formatNumber(value, locale) });

  return (
    <div className="space-y-4 md:space-y-8">
      <Link
        href="/cosmetics/banners"
        className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-panel/60 px-3 py-2 text-sm text-parch/85 transition-colors hover:border-gold/40 hover:text-parch"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("bannersTitle")}
      </Link>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1fr_360px]">
        <div className="relative flex min-h-[460px] items-end overflow-hidden border border-white/10 bg-ink/70">
          {banner.image ? (
            <img src={banner.image} alt="" width={800} height={286} className="absolute inset-0 h-full w-full object-cover opacity-35 blur-[2px]" />
          ) : null}
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          {heroVisual ? (
            <img
              src={heroVisual}
              alt={banner.featured?.name ?? ""}
              width={1024}
              height={1024}
              className="absolute bottom-0 right-0 h-full w-auto max-w-[75%] object-contain object-bottom drop-shadow-[0_18px_50px_rgba(0,0,0,0.6)] [mask-image:linear-gradient(to_bottom,#000_80%,transparent)]"
            />
          ) : null}
          <div className="relative z-[1] max-w-xl p-5 md:p-7">
            <p className="font-caps text-[0.62rem] uppercase tracking-[0.22em] text-gold">{t(`bannerTypes.${banner.type}`)}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-parch [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] md:text-5xl">
              {banner.name}
            </h1>
            <span aria-hidden className="mt-2 block h-0.5 w-16 bg-gold" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {status ? <BannerStatusTag status={status} /> : null}
              <span className="text-sm text-parch/80">
                {status === "current" && banner.end && now
                  ? t("endsIn", { time: formatRemaining(banner.end, now, locale) })
                  : status === "upcoming" && banner.start && now
                    ? t("startsIn", { time: formatRemaining(banner.start, now, locale) })
                    : null}
              </span>
            </div>
            {banner.featured ? (
              <Link
                href={banner.featured.href}
                className="mt-4 inline-flex items-center gap-2 border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold transition-colors hover:bg-gold/20"
              >
                {t("viewFeatured", { name: banner.featured.name })}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <DnaPanel className="p-4 md:p-5">
            <DnaSectionLabel>{t("ratesTitle")}</DnaSectionLabel>
            <div className="mt-2">
              <DnaStatRow label={t("rateStar5")} value={percent(banner.rates.star5)} accent={RARITIES[5].hex} />
              <DnaStatRow label={t("rateStar4")} value={percent(banner.rates.star4)} accent={RARITIES[4].hex} />
              <DnaStatRow label={t("pityLabel")} value={t("pityValue", { count: banner.rates.pity })} />
              <DnaStatRow label={t("tenPullLabel")} value={t("tenPullValue")} />
            </div>
          </DnaPanel>
          <DnaPanel className="p-4 md:p-5">
            <DnaSectionLabel>{t("periodTitle")}</DnaSectionLabel>
            <div className="mt-2">
              {banner.start ? (
                <>
                  <DnaStatRow label={t("periodStart")} value={formatDate(banner.start, locale)} />
                  <DnaStatRow label={t("periodEnd")} value={formatDate(banner.end, locale)} />
                </>
              ) : (
                <DnaStatRow label={t("periodTitle")} value={t("bannerStatus.permanent")} />
              )}
            </div>
            {banner.costCurrencies.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{t("costLabel")}</span>
                {banner.costCurrencies.map((currency) => (
                  <span key={currency.name} className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                    {currency.icon ? <img src={currency.icon} alt="" width={16} height={16} className="h-4 w-4 object-contain" /> : null}
                    {currency.name}
                  </span>
                ))}
              </div>
            ) : null}
          </DnaPanel>
        </aside>
      </div>

      <DnaPanel className="p-4 md:p-6">
        <DnaSectionLabel>{t("poolStar5")}</DnaSectionLabel>
        <p className="mt-2 text-sm text-muted">{banner.type === "standard" ? t("poolStar5HintStandard") : t("poolStar5HintLimited")}</p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {banner.pools.star5.map((entry, index) => (
            <EntryRow key={`${entry.ref ?? entry.name}-${index}`} entry={entry} percent={percent} />
          ))}
        </div>
      </DnaPanel>

      <PoolGrid title={t("poolStar4")} entries={banner.pools.star4} />
      <PoolGrid title={t("poolStar3")} entries={banner.pools.star3} />

      {banner.cumulative.length > 0 ? (
        <DnaPanel className="p-4 md:p-6">
          <DnaSectionLabel>{t("cumulativeTitle")}</DnaSectionLabel>
          <ol className="mt-4 grid gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
            {banner.cumulative.map((step) => (
              <li key={step.pulls} className="flex flex-col gap-2 border border-white/10 bg-ink/50 p-3">
                <span className="font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold">{t("pullsCount", { count: step.pulls })}</span>
                {step.rewards.map((reward, index) => (
                  <span key={index} className="flex items-center gap-2 text-sm text-parch">
                    <DnaItemIcon src={reward.icon} alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
                    <span className="min-w-0 flex-1 leading-tight">{reward.name}</span>
                    <span className="shrink-0 whitespace-nowrap tabular-nums text-gold">×{" "}{formatNumber(reward.count, locale)}</span>
                  </span>
                ))}
              </li>
            ))}
          </ol>
        </DnaPanel>
      ) : null}

      {banner.exchange.length > 0 ? (
        <DnaPanel className="p-4 md:p-6">
          <DnaSectionLabel>{t("exchangeTitle")}</DnaSectionLabel>
          <p className="mt-2 text-sm text-muted">{t("exchangeHint")}</p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {banner.exchange.map((item, index) => (
              <EntryRow
                key={`${item.ref ?? item.name}-${index}`}
                entry={item}
                percent={percent}
                extra={
                  <span className="inline-flex items-center gap-1 text-xs tabular-nums text-parch/85">
                    {item.currency.icon ? <img src={item.currency.icon} alt="" width={16} height={16} className="h-4 w-4 object-contain" /> : null}
                    {formatNumber(item.price, locale)}
                    {item.limit ? <span className="text-muted"> · {t("purchaseLimit", { count: item.limit })}</span> : null}
                  </span>
                }
              />
            ))}
          </div>
        </DnaPanel>
      ) : null}
    </div>
  );
}

function EntryRow({
  entry,
  percent,
  extra,
}: {
  entry: BannerEntryView;
  percent: (value: number) => string;
  extra?: ReactNode;
}) {
  const content = (
    <>
      <span className="dna-rarity-slot flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border p-1">
        <DnaItemIcon src={entry.icon} alt="" width={56} height={56} className="max-h-full max-w-full object-contain" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="dna-rarity-name block truncate text-sm font-semibold">
          {entry.name}
          {entry.count > 1 ? <span className="font-normal text-muted"> × {entry.count}</span> : null}
        </span>
        {entry.probability ? <span className="block text-xs text-muted">{percent(entry.probability)}</span> : null}
        {extra}
      </span>
    </>
  );
  const className = "group flex items-center gap-3 border border-white/10 bg-ink/50 p-2.5 transition-colors";
  return entry.href ? (
    <Link href={entry.href} data-rarity={rarityAttr(toRarityLevel(entry.rarity))} className={cn(className, "hover:border-gold/40")}>
      {content}
    </Link>
  ) : (
    <div data-rarity={rarityAttr(toRarityLevel(entry.rarity ?? 5))} className={className}>
      {content}
    </div>
  );
}

function PoolGrid({ title, entries }: { title: string; entries: BannerEntryView[] }) {
  if (entries.length === 0) return null;
  return (
    <DnaPanel className="p-4 md:p-6">
      <DnaSectionLabel>{title}</DnaSectionLabel>
      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-7 xl:grid-cols-10">
        {entries.map((entry, index) => {
          const tile = (
            <>
              <div className="flex flex-1 items-center justify-center overflow-hidden">
                <DnaItemIcon src={entry.icon} alt={entry.name} width={96} height={96} loading="lazy" className="max-h-full max-w-full object-contain" />
              </div>
              <p className="dna-rarity-name mt-1 truncate text-[11px] font-semibold">{entry.name}</p>
            </>
          );
          const className = "dna-rarity-tile group relative flex aspect-square flex-col overflow-hidden rounded-sm border bg-ink/80 p-2";
          return entry.href ? (
            <Link key={`${entry.ref}-${index}`} href={entry.href} title={entry.name} data-rarity={rarityAttr(toRarityLevel(entry.rarity))} className={cn(className, "hover:-translate-y-0.5")}>
              {tile}
            </Link>
          ) : (
            <div key={`${entry.name}-${index}`} title={entry.name} data-rarity={rarityAttr(toRarityLevel(entry.rarity))} className={className}>
              {tile}
            </div>
          );
        })}
      </div>
    </DnaPanel>
  );
}
