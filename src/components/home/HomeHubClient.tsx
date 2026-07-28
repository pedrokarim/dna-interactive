"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Bot,
  Boxes,
  Calendar,
  Check,
  Compass,
  Copy,
  Database,
  Eye,
  FileStack,
  Gem,
  Hammer,
  Layers,
  Map as MapIcon,
  ScrollText,
  Search,
  Sparkles,
  Swords,
  ThumbsUp,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { DnaCornerBrackets, DnaNouveau, DnaTag, DnaRibbon, cn } from "@/components/dna";
import { EventCalendar } from "@/components/home/EventCalendar";
import type { CalendarEvent } from "@/lib/events/calendar";
import { useAppSettings } from "@/lib/settings/useAppSettings";
import { CONTACT_INFO } from "@/lib/constants";

export type HomeCode = { code: string; reward: string };
export type HomeBuildCard = {
  id: string;
  title: string;
  character: string;
  tags: string[];
  views: number;
  votes: number;
  author: string;
  portrait: string | null;
  tint: string;
};
export type HomeHubClientProps = {
  codes: HomeCode[];
  builds: HomeBuildCard[];
  communityCount: string;
  stats: { characters: string; items: string; builds: string };
  calendarEvents?: CalendarEvent[];
  calendarToday?: string;
};

/* CTA façon design system, appliqués directement sur un Link/anchor. */
const CTA_BASE =
  "dna-shine inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 font-sans text-sm tracking-wide transition-[transform,color,border-color] duration-200";
const CTA_GOLD = cn(
  CTA_BASE,
  "border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 text-gold-bright hover:-translate-y-px hover:border-gold-bright hover:text-[#fff6e6]",
);
const CTA_GHOST = cn(
  CTA_BASE,
  "border border-white/20 bg-gradient-to-b from-panel/70 to-ink/70 text-parch hover:-translate-y-px hover:border-white/45 hover:text-white",
);

/* ------------------------------------------------------------------ cartes outils */

type ToolCard = {
  href: string;
  title: string;
  mono: string;
  desc: string;
  icon: LucideIcon;
  badge?: string;
  bg?: string;
  tint?: string;
  external?: boolean;
};

/* --------------------------------------------------------------- primitives */

/** Carte « outil » — image de couverture + dégradé + accent teinté par élément. */
function ToolTile({ card, className }: { card: ToolCard; className?: string }) {
  const Icon = card.icon;
  const tint = card.tint ?? "var(--color-gold)";
  const inner = (
    <>
      {card.bg ? (
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-cover bg-right opacity-30 transition-[opacity,transform] duration-500 group-hover:scale-[1.04] group-hover:opacity-45" style={{ backgroundImage: `url(${card.bg})` }} />
      ) : null}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-panel via-panel/85 to-transparent" />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/75 to-transparent" />
      <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-6 h-28 w-28 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: tint }} />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, ${tint}, transparent)` }} />
      <DnaCornerBrackets size={12} className="opacity-40 transition-opacity group-hover:opacity-100" />
      <div className="relative z-[1] flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm border bg-ink/40" style={{ borderColor: tint, color: tint }}>
            <Icon aria-hidden className="h-4 w-4" />
          </span>
          <span className="font-display text-lg text-parch group-hover:text-gold-bright">{card.title}</span>
          {card.badge ? <DnaNouveau className="ml-1">{card.badge}</DnaNouveau> : null}
        </div>
        <span className="font-mono text-[0.62rem] tracking-wide text-muted">{card.mono}</span>
        <span className="mt-auto max-w-[88%] text-[0.8rem] leading-snug text-parch/75">{card.desc}</span>
      </div>
    </>
  );
  const classes = cn(
    "group relative flex min-h-[124px] items-stretch overflow-hidden rounded-sm border border-line/20 bg-panel/70 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-gold/70",
    className,
  );
  if (card.external) {
    return (
      <a href={card.href} target="_blank" rel="noopener noreferrer" className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={card.href} className={classes}>
      {inner}
    </Link>
  );
}

function SectionRibbon({ label, index, action }: { label: string; index?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <DnaRibbon>{label}</DnaRibbon>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-line/25 to-transparent" />
      {action}
      {index ? <span className="font-mono text-xs text-muted-2">{index}</span> : null}
    </div>
  );
}

function CodeCard({ code, reward }: HomeCode) {
  const t = useTranslations("homeHub");
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try {
      void navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponible */
    }
  };
  return (
    <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-sm border border-line/20 bg-panel/70 p-4">
      <DnaCornerBrackets size={10} className="opacity-40" />
      <div className="min-w-0">
        <div className="font-mono text-lg font-semibold tracking-wide text-gold-bright">{code}</div>
        <div className="mt-0.5 truncate text-[0.78rem] text-parch/70">{reward}</div>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={t("copyCodeAria", { code })}
        className="flex shrink-0 items-center gap-1.5 rounded-sm border border-gold/40 bg-gold/8 px-3 py-1.5 font-caps text-[0.6rem] uppercase tracking-[0.14em] text-gold transition-colors hover:border-gold hover:text-gold-bright"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}


function BuildShowcaseCard({ build }: { build: HomeBuildCard }) {
  const t = useTranslations("homeHub");
  const bg = build.portrait ?? "/assets/worldview/worldview-2.webp";
  return (
    <Link
      href={`/builds/${build.id}`}
      className="group relative flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-sm border border-line/20 bg-panel/70 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-gold/70"
    >
      <div className="relative h-44 overflow-hidden">
        <span aria-hidden className="absolute inset-0 bg-cover bg-[position:center_18%] opacity-80 transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${bg})` }} />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-panel via-panel/20 to-transparent" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, ${build.tint}, transparent)` }} />
        <span className="absolute right-2 top-2"><DnaTag>{t("community")}</DnaTag></span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="line-clamp-2 font-display text-base leading-tight text-parch group-hover:text-gold-bright">{build.title}</div>
        <div className="font-mono text-[0.62rem] text-muted">{build.character}</div>
        {build.tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {build.tags.map((t) => (
              <span key={t} className="rounded-[3px] border border-white/10 bg-ink/40 px-1.5 py-0.5 font-caps text-[0.5rem] uppercase tracking-[0.12em] text-parch/70">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-2 text-[0.7rem] text-muted">
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{build.views}</span>
          <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{build.votes}</span>
          <span className="ml-auto truncate text-parch/60">@{build.author}</span>
        </div>
      </div>
    </Link>
  );
}

/* ---------------------------------------------------------------- page (POC) */

export default function HomeHubClient({ codes, builds, communityCount, stats, calendarEvents, calendarToday }: HomeHubClientProps) {
  const t = useTranslations("homeHub");
  const { commissionsVisible } = useAppSettings();
  const databaseCards: ToolCard[] = [
    { href: "/characters", title: t("charactersTitle"), mono: "//ROSTER.DATABASE", desc: t("charactersDescription"), icon: Users, bg: "/assets/worldview/worldview-3.webp", tint: "var(--color-gold)" },
    { href: "/items", title: t("itemsTitle"), mono: "//GEAR.INDEX", desc: t("itemsDescription"), icon: Boxes, bg: "/assets/worldview/worldview-5.webp", tint: "var(--color-anemo)" },
    { href: "/items/weapons", title: t("weaponsTitle"), mono: "//HYPER.ARSENAL", desc: t("weaponsDescription"), icon: Swords, badge: t("new"), bg: "/assets/worldview/worldview-8.webp", tint: "var(--color-pyro)" },
    { href: "/items/genimons", title: t("genimonsTitle"), mono: "//COMPANION.PODEX", desc: t("genimonsDescription"), icon: Gem, bg: "/assets/worldview/worldview-9.webp", tint: "var(--color-hydro)" },
  ];
  const toolCards: ToolCard[] = [
    { href: "/builder", title: t("buildBuilderTitle"), mono: "//BUILD.FORGE", desc: t("buildBuilderDescription"), icon: Hammer, badge: t("new"), bg: "/assets/worldview/worldview-10.webp", tint: "var(--color-electro)" },
    { href: "/map", title: t("mapTitle"), mono: "//REGION.SURVEY.MAP", desc: t("mapShortDescription"), icon: MapIcon, bg: "/assets/worldview/worldview-6.webp", tint: "var(--color-hydro)" },
    { href: "/items/drafts", title: t("draftsTitle"), mono: "//CRAFT.BLUEPRINTS", desc: t("draftsDescription"), icon: FileStack, bg: "/assets/worldview/worldview-11.webp", tint: "var(--color-gold)" },
    { href: "/changelog", title: t("changelogTitle"), mono: "//PATCH.NOTES", desc: t("changelogDescription"), icon: Wrench, bg: "/assets/official-v1.3/bg.webp", tint: "var(--color-umbro)" },
  ];
  const communityCards: ToolCard[] = [
    { href: "/commissions", title: t("commissionsTitle"), mono: "//COVERT.OPS.LIVE", desc: t("commissionsDescription"), icon: ScrollText, bg: "/assets/worldview/worldview-4.webp", tint: "var(--color-pyro)" },
    { href: CONTACT_INFO.discord.url, title: "Discord", mono: "//COMMUNITY.HALL", desc: t("discordDescription"), icon: Bot, bg: "/assets/worldview/worldview-1.webp", tint: "var(--color-electro)", external: true },
  ];
  const visibleCommunityCards = commissionsVisible
    ? communityCards
    : communityCards.filter((card) => card.href !== "/commissions");
  const STATS = [
    { icon: Users, value: stats.characters, label: t("charactersStat") },
    { icon: Database, value: stats.items, label: t("itemsStat") },
    { icon: Layers, value: stats.builds, label: t("buildsStat") },
  ];
  return (
    <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* =============================================== HERO (marque + sélection) */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]">
        <div className="relative flex flex-col overflow-hidden rounded-sm border border-line/25 bg-panel/70 p-6">
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url(/assets/worldview/worldview-2.webp)" }} />
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-panel/80 to-transparent" />
          <DnaCornerBrackets size={18} />
          <span aria-hidden className="dna-watermark absolute -right-6 bottom-2 text-7xl">DNA</span>

          <div className="relative flex flex-col gap-4">
            <span className="font-caps text-[0.6rem] uppercase tracking-[0.34em] text-muted">Duet Night Abyss</span>
            <h1 className="bg-gradient-to-b from-[#f4ecd8] to-gold bg-clip-text font-display text-4xl font-semibold leading-[0.95] text-transparent sm:text-5xl">DNA Interactive</h1>
            <div className="flex items-center gap-1.5" aria-hidden>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={cn("h-2.5 w-2.5 rotate-45 border", i < 3 ? "border-gold bg-gold-bright" : "border-line/30")} />
              ))}
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-parch/75">{t("heroDescription")}</p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/map" className={CTA_GOLD}><Compass className="h-4 w-4" />{t("exploreTools")}</Link>
              <a href={CONTACT_INFO.discord.url} target="_blank" rel="noopener noreferrer" className={CTA_GHOST}><Bot className="h-4 w-4" />Discord</a>
            </div>
            <div className="relative mt-2 flex items-center gap-4 rounded-sm border border-line/20 bg-ink/50 p-4">
              <DnaCornerBrackets size={10} color="var(--color-gold-deep)" />
              <Search className="h-5 w-5 shrink-0 text-gold" />
              <span className="min-w-0">
                <span className="block font-caps text-[0.55rem] uppercase tracking-[0.22em] text-muted">{t("sharedBuilds")}</span>
                <span className="block font-display text-3xl font-semibold tabular-nums text-gold-bright">{communityCount}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-parch">{t("featuredSelection")}</h2>
              <span className="font-mono text-[0.7rem] text-muted">{"//FEATURED.THIS.WEEK"}</span>
            </div>
            <Link href="/changelog" className={cn(CTA_GHOST, "px-4 py-2 text-xs")}><Sparkles className="h-4 w-4" />{t("whatsNew")}</Link>
          </div>

          <Link href="/map" className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-sm border border-gold/70 bg-panel/70 p-6 shadow-[0_0_40px_-8px_rgba(194,168,106,0.45)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_0_60px_-6px_rgba(194,168,106,0.6)]">
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-45 transition-transform duration-700 group-hover:scale-[1.05]" style={{ backgroundImage: "url(/assets/worldview/worldview-6.webp)" }} />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
            <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent" />
            <DnaCornerBrackets size={20} color="var(--color-gold-bright)" />
            <div className="relative flex items-center gap-2">
              <DnaTag>{t("featured")}</DnaTag>
              <span className="rounded-sm border border-hydro/40 bg-hydro/10 px-1.5 py-0.5 font-caps text-[0.5rem] uppercase tracking-[0.16em] text-hydro">{t("beta")}</span>
            </div>
            <div className="relative">
              <h3 className="font-display text-3xl text-parch group-hover:text-gold-bright sm:text-4xl">{t("mapTitle")}</h3>
              <span className="font-mono text-xs text-muted">{"//REGION.SURVEY.MAP"}</span>
            </div>
            <div className="relative flex items-center justify-between gap-3">
              <p className="max-w-sm text-sm text-parch/75">{t("mapDescription")}</p>
              <span className="flex shrink-0 items-center gap-2 rounded-sm border border-gold bg-gradient-to-b from-gold-deep/40 to-ink/70 px-4 py-2 font-caps text-xs uppercase tracking-[0.14em] text-gold-bright dna-shine">{t("open")} <ArrowRight className="h-4 w-4" /></span>
            </div>
          </Link>

          <div className="grid gap-4 sm:grid-cols-2">
            <ToolTile card={{ href: "/builder", title: "Builder", mono: "//BUILD.FORGE", desc: t("builderDescription"), icon: Hammer, badge: t("new"), bg: "/assets/worldview/worldview-2.webp", tint: "var(--color-electro)" }} />
            {commissionsVisible ? (
              <ToolTile card={{ href: "/commissions", title: t("commissionsTitle"), mono: "//COVERT.OPS.LIVE", desc: t("commissionsDescription"), icon: ScrollText, bg: "/assets/worldview/worldview-4.webp", tint: "var(--color-pyro)" }} />
            ) : null}
          </div>
        </div>
      </section>

      {/* =============================================== BASE DE DONNÉES */}
      <section className="mt-10 flex flex-col gap-4">
        <SectionRibbon label={t("database")} index="03" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {databaseCards.map((c) => (
            <ToolTile key={c.href} card={c} />
          ))}
        </div>
      </section>

      {/* =============================================== OUTILS */}
      <section className="mt-10 flex flex-col gap-4">
        <SectionRibbon label={t("tools")} index="02" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {toolCards.map((c) => (
            <ToolTile key={c.href} card={c} />
          ))}
        </div>
      </section>

      {/* =============================================== COMMUNAUTÉ */}
      <section className="mt-10 flex flex-col gap-4">
        <SectionRibbon label={t("community")} index="01" />
        <ToolTile
          className="min-h-[104px]"
          card={{ href: "/builds", title: t("communityBuildsTitle"), mono: "//SHARED.LOADOUTS", desc: t("communityBuildsDescription"), icon: Layers, badge: t("new"), bg: "/assets/worldview/worldview-7.webp", tint: "var(--color-anemo)" }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleCommunityCards.map((c) => (
            <ToolTile key={c.href} card={c} />
          ))}
        </div>
      </section>

      {/* =============================================== CODES CADEAUX */}
      {codes.length > 0 ? (
        <section className="mt-10 flex flex-col gap-4">
          <SectionRibbon
            label={t("giftCodes")}
            action={<Link href="/codes" className="font-caps text-[0.6rem] uppercase tracking-[0.16em] text-gold hover:text-gold-bright">{t("allCodes")} →</Link>}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {codes.map((c) => (
              <CodeCard key={c.code} code={c.code} reward={c.reward} />
            ))}
          </div>
        </section>
      ) : null}

      {/* =============================================== CALENDRIER DES ÉVÉNEMENTS */}
      <section className="mt-10 flex flex-col gap-4">
        <SectionRibbon
          label={t("eventCalendar")}
          action={
            <span className="inline-flex items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted">
              <Calendar className="h-3.5 w-3.5" />{t("live")}
            </span>
          }
        />
        <EventCalendar events={calendarEvents} refToday={calendarToday} />
      </section>

      {/* =============================================== BUILDS DE PERSONNAGES */}
      {builds.length > 0 ? (
        <section className="mt-10 flex flex-col gap-4">
          <SectionRibbon
            label={t("characterBuilds")}
            action={<Link href="/builds" className="font-caps text-[0.6rem] uppercase tracking-[0.16em] text-gold hover:text-gold-bright">{t("viewAll")} →</Link>}
          />
          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 custom-scrollbar">
            {builds.map((b) => (
              <BuildShowcaseCard key={b.id} build={b} />
            ))}
          </div>
        </section>
      ) : null}

      {/* =============================================== bandeau stats rapide */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="relative flex items-center gap-4 rounded-sm border border-line/20 bg-panel/60 p-4">
              <DnaCornerBrackets size={10} />
              <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-gold/30 bg-gold/8 text-gold">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-2xl font-semibold tabular-nums text-parch">{s.value}</span>
                <span className="block font-caps text-[0.55rem] uppercase tracking-[0.2em] text-muted">{s.label}</span>
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
