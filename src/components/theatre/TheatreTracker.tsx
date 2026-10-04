"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, LocateFixed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DnaPanel, DnaProgress, DnaSectionMark, DnaTag, cn } from "@/components/dna";
import { formatRemaining, toIntlLocale, useNow } from "@/lib/cosmetics/format";
import {
  rotationLengthDays,
  rotationProgress,
  rotationStatus,
  theatreOverview,
  type TheatreRotationStatus,
} from "@/lib/theatre/rotations";
import type { TheatreFeaturedView, TheatreRotationView } from "@/lib/theatre/featured";

export type TheatreTrackerProps = {
  rotations: TheatreRotationView[];
  /** Horloge du serveur au rendu : premier affichage seulement, le client reprend la sienne. */
  serverNow: number;
};

/* ------------------------------------------------------------------ horloge */

/** Instant présent : l'horloge du visiteur dès qu'elle est connue, celle du serveur d'ici là. */
function useTheatreNow(serverNow: number): Date {
  const clientNow = useNow();
  return useMemo(() => clientNow ?? new Date(serverNow), [clientNow, serverNow]);
}

function useTheatreFormats() {
  const locale = useLocale();
  return useMemo(() => {
    const intl = toIntlLocale(locale);
    // Aucun `timeZone` : la bascule s'affiche à l'heure du visiteur, c'est celle
    // à laquelle il pourra se connecter.
    const instant = new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    const day = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" });
    const year = new Intl.DateTimeFormat(intl, { year: "numeric" });
    return {
      locale,
      instant: (iso: string) => instant.format(new Date(iso)),
      day: (iso: string) => day.format(new Date(iso)),
      year: (iso: string) => year.format(new Date(iso)),
    };
  }, [locale]);
}

/* ------------------------------------------------------------- petits blocs */

/** Visuel avec repli : l'affiche d'abord, l'icône si elle manque, rien sinon. */
function FeaturedImage({ sources, className }: { sources: (string | null)[]; className?: string }) {
  const candidates = useMemo(() => sources.filter((s): s is string => Boolean(s)), [sources]);
  const [index, setIndex] = useState(0);
  const src = candidates[index];
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" onError={() => setIndex((i) => i + 1)} className={className} />
  );
}

function useKindLabel() {
  const t = useTranslations("theatre");
  return (featured: TheatreFeaturedView) => (featured.kind === "weapon" ? t("kindWeapon") : t("kindCharacter"));
}

/** Lien vers la fiche quand elle existe, simple bloc sinon. */
function SheetLink({ href, className, children }: { href: string | null; className?: string; children: ReactNode }) {
  if (!href) return <div className={className}>{children}</div>;
  return (
    <Link href={href} className={cn(className, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60")}>
      {children}
    </Link>
  );
}

/* ---------------------------------------------------------- rotation en cours */

function CurrentRotation({ rotation, now }: { rotation: TheatreRotationView; now: Date }) {
  const t = useTranslations("theatre");
  const fmt = useTheatreFormats();
  const kindLabel = useKindLabel();
  const featured = rotation.featuredView;
  const progress = rotationProgress(rotation, now.getTime());

  return (
    <DnaPanel className="relative isolate flex min-h-[19rem] flex-col justify-between overflow-hidden p-5 sm:p-6">
      {/* Illustration fondue dans le panneau : aucun bord franc, elle passe sous le texte. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[58%] opacity-35 sm:w-[44%] sm:opacity-100">
        <FeaturedImage
          sources={[featured.bust, featured.icon]}
          className="h-full w-full object-cover object-top [mask-image:linear-gradient(to_right,transparent,black_40%)]"
        />
      </div>

      <div className="sm:max-w-[54%]">
        <DnaSectionMark size="sm">{t("now")}</DnaSectionMark>
        <h2 className="mt-2 font-display text-3xl font-semibold text-parch sm:text-4xl">{featured.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <DnaTag tone={featured.kind === "weapon" ? "crimson" : "gold"}>{kindLabel(featured)}</DnaTag>
          <span className="font-sans text-xs text-muted">{t("lengthDays", { days: rotationLengthDays(rotation) })}</span>
        </div>
        {rotation.note ? <p className="mt-3 text-sm text-parch/80">{rotation.note}</p> : null}
      </div>

      <div className="mt-6 sm:max-w-[54%]">
        <p className="font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted">{t("switchIn")}</p>
        <p className="font-display text-2xl font-semibold text-gold-bright tabular-nums">
          {formatRemaining(rotation.endsAt, now, fmt.locale)}
        </p>
        <DnaProgress className="mt-2" value={Math.round(progress * 100)} label={t("progressLabel")} />
        <p className="mt-2 flex justify-between gap-3 font-sans text-xs text-muted tabular-nums">
          <span>{fmt.instant(rotation.startsAt)}</span>
          <span>{fmt.instant(rotation.endsAt)}</span>
        </p>
        {featured.href ? (
          <Link
            href={featured.href}
            className="mt-4 inline-flex items-center gap-1.5 rounded-sm border border-line/30 px-3 py-1.5 font-caps text-[0.6rem] uppercase tracking-[0.16em] text-gold hover:border-gold hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            {t("viewSheet")} →
          </Link>
        ) : null}
      </div>
    </DnaPanel>
  );
}

/** Entre deux versions, le théâtre ferme quelques heures : rien n'est en cours. */
function ClosedNotice({ next, now }: { next: TheatreRotationView | null; now: Date }) {
  const t = useTranslations("theatre");
  const fmt = useTheatreFormats();
  return (
    <DnaPanel className="flex min-h-[19rem] flex-col justify-center p-6">
      <DnaSectionMark size="sm">{t("now")}</DnaSectionMark>
      <p className="mt-2 font-display text-2xl font-semibold text-parch">{t("closed")}</p>
      {next ? (
        <p className="mt-2 text-sm text-muted">
          {t("startsIn", { duration: formatRemaining(next.startsAt, now, fmt.locale) })}
        </p>
      ) : null}
    </DnaPanel>
  );
}

/* ------------------------------------------------- précédente / prochaine */

function NeighbourCard({ label, rotation, emptyTitle, emptyHint }: {
  label: string;
  rotation: TheatreRotationView | null;
  emptyTitle: string;
  emptyHint?: string;
}) {
  const fmt = useTheatreFormats();
  const kindLabel = useKindLabel();

  if (!rotation) {
    return (
      <DnaPanel className="flex flex-1 flex-col justify-center border-dashed p-4">
        <DnaSectionMark size="sm">{label}</DnaSectionMark>
        <p className="mt-1.5 font-display text-lg font-semibold text-parch/80">{emptyTitle}</p>
        {emptyHint ? <p className="mt-1 text-xs text-muted">{emptyHint}</p> : null}
      </DnaPanel>
    );
  }

  const featured = rotation.featuredView;
  return (
    <DnaPanel className="flex-1 transition-colors hover:border-line/50">
      <SheetLink href={featured.href} className="flex h-full items-center gap-3 p-4">
        <span className="block h-16 w-16 shrink-0 overflow-hidden border border-line/25 bg-ink/40">
          <FeaturedImage sources={[featured.icon]} className="h-full w-full object-cover" />
        </span>
        <span className="min-w-0">
          <DnaSectionMark size="sm">{label}</DnaSectionMark>
          <span className="mt-1 block truncate font-display text-lg font-semibold text-parch">{featured.name}</span>
          <span className="block font-sans text-xs text-muted tabular-nums">
            {kindLabel(featured)} · {fmt.day(rotation.startsAt)} → {fmt.day(rotation.endsAt)}
          </span>
        </span>
      </SheetLink>
    </DnaPanel>
  );
}

function Neighbours({ previous, current, next }: {
  previous: TheatreRotationView | null;
  current: TheatreRotationView | null;
  next: TheatreRotationView | null;
}) {
  const t = useTranslations("theatre");
  const fmt = useTheatreFormats();
  return (
    <div className="flex flex-col gap-4">
      <NeighbourCard
        label={t("next")}
        rotation={next}
        emptyTitle={t("notAnnounced")}
        emptyHint={current ? t("notAnnouncedHint", { date: fmt.instant(current.endsAt) }) : undefined}
      />
      <NeighbourCard label={t("previous")} rotation={previous} emptyTitle={t("none")} />
    </div>
  );
}

/* --------------------------------------------------------- frise des affiches */

const POSTER_WIDTH_CLASS = "w-[132px] sm:w-[150px]";

function StatusTag({ status }: { status: TheatreRotationStatus }) {
  const t = useTranslations("theatre");
  if (status === "past") return null;
  return (
    // Deux éléments : `font-caps` recale son texte en `position: relative`, ce
    // qui annulerait le placement absolu s'ils ne faisaient qu'un.
    <span className="absolute left-2 top-2">
      <span
        className={cn(
          "block rounded-sm px-1.5 py-0.5 font-caps text-[0.52rem] uppercase tracking-[0.14em]",
          status === "current" ? "bg-gold-bright text-ink" : "bg-black/70 text-white",
        )}
      >
        {status === "current" ? t("statusCurrent") : t("statusUpcoming")}
      </span>
    </span>
  );
}

function Poster({ rotation, status, showYear, posterRef }: {
  rotation: TheatreRotationView;
  status: TheatreRotationStatus;
  showYear: boolean;
  posterRef?: (node: HTMLLIElement | null) => void;
}) {
  const t = useTranslations("theatre");
  const fmt = useTheatreFormats();
  const kindLabel = useKindLabel();
  const featured = rotation.featuredView;

  return (
    <li ref={posterRef} className={cn("shrink-0 snap-start", POSTER_WIDTH_CLASS)} aria-current={status === "current" ? "true" : undefined}>
      {/* L'année n'est écrite qu'à son premier passage : elle sert de repère en remontant. */}
      <p className="h-5 font-caps text-[0.6rem] uppercase tracking-[0.18em] text-muted-2">{showYear ? fmt.year(rotation.startsAt) : ""}</p>
      <SheetLink
        href={featured.href}
        className={cn(
          // `dna-force-dark` : le texte est posé sur l'affiche, qui reste sombre
          // dans les deux thèmes.
          "dna-force-dark group relative block h-[300px] overflow-hidden border bg-ink/60 transition-[border-color,filter] duration-200 sm:h-[340px]",
          status === "current" ? "border-gold-bright" : "border-line/25 hover:border-line/60",
          status === "past" && "saturate-[0.55] hover:saturate-100 focus-visible:saturate-100",
        )}
      >
        <FeaturedImage
          sources={[featured.poster, featured.icon]}
          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 to-transparent" />
        <StatusTag status={status} />
        <span className="absolute inset-x-0 bottom-0 p-2.5">
          <span className="block font-display text-base font-semibold leading-tight text-white">{featured.name}</span>
          <span className="mt-0.5 block font-caps text-[0.52rem] uppercase tracking-[0.14em] text-white/70">{kindLabel(featured)}</span>
        </span>
      </SheetLink>
      <p className="mt-1.5 font-sans text-xs text-parch/85 tabular-nums">
        {fmt.day(rotation.startsAt)} → {fmt.day(rotation.endsAt)}
      </p>
      <p className="font-sans text-[0.68rem] text-muted">{t("lengthDays", { days: rotationLengthDays(rotation) })}</p>
    </li>
  );
}

/** Emplacement de la rotation suivante tant qu'elle n'est pas annoncée. */
function UnknownPoster({ switchAt }: { switchAt: string | null }) {
  const t = useTranslations("theatre");
  const fmt = useTheatreFormats();
  return (
    <li className={cn("shrink-0 snap-start", POSTER_WIDTH_CLASS)}>
      <p className="h-5" />
      <div className="flex h-[300px] flex-col items-center justify-center gap-2 border border-dashed border-line/35 p-3 text-center sm:h-[340px]">
        <span aria-hidden className="font-display text-4xl text-muted-2">?</span>
        <span className="font-display text-base font-semibold text-parch/80">{t("notAnnounced")}</span>
      </div>
      {switchAt ? <p className="mt-1.5 font-sans text-xs text-muted tabular-nums">{t("fromDate", { date: fmt.day(switchAt) })}</p> : null}
    </li>
  );
}

const SCROLL_BUTTON_CLASS =
  "inline-flex h-8 w-8 items-center justify-center rounded-sm border border-line/25 text-parch/80 transition-colors hover:border-gold hover:text-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-35";

function PosterStrip({ rotations, now, currentId, hasNext, switchAt }: {
  rotations: TheatreRotationView[];
  now: Date;
  currentId: string | null;
  hasNext: boolean;
  switchAt: string | null;
}) {
  const t = useTranslations("theatre");
  const fmt = useTheatreFormats();
  const scrollerRef = useRef<HTMLOListElement | null>(null);
  const anchorRef = useRef<HTMLLIElement | null>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  /* On déplace le défilement de la frise, pas celui de la page : `scrollIntoView`
     ferait sauter la fenêtre entière jusqu'à la frise au chargement. */
  const centerOnAnchor = useCallback((behavior: ScrollBehavior) => {
    const el = scrollerRef.current;
    const anchor = anchorRef.current;
    if (!el || !anchor) return;
    el.scrollTo({ left: anchor.offsetLeft - (el.clientWidth - anchor.clientWidth) / 2, behavior });
  }, []);

  useEffect(() => {
    centerOnAnchor("auto");
    updateEdges();
  }, [centerOnAnchor, updateEdges, rotations.length]);

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Sans rotation en cours, on se cale sur la dernière connue.
  const anchorId = currentId ?? rotations[rotations.length - 1]?.id ?? null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <DnaSectionMark size="sm">{t("history")}</DnaSectionMark>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t("historyHint")}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" className={SCROLL_BUTTON_CLASS} onClick={() => scrollByPage(-1)} disabled={edges.start} aria-label={t("scrollBack")}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={cn(SCROLL_BUTTON_CLASS, "w-auto gap-1.5 px-2.5 font-caps text-[0.58rem] uppercase tracking-[0.14em]")}
            onClick={() => centerOnAnchor("smooth")}
          >
            <LocateFixed className="h-3.5 w-3.5" />
            {t("backToNow")}
          </button>
          <button type="button" className={SCROLL_BUTTON_CLASS} onClick={() => scrollByPage(1)} disabled={edges.end} aria-label={t("scrollForward")}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ol
        ref={scrollerRef}
        onScroll={updateEdges}
        tabIndex={0}
        aria-label={t("history")}
        className="relative flex snap-x gap-3 overflow-x-auto pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        {rotations.map((rotation, index) => {
          const previous = rotations[index - 1];
          const showYear = !previous || fmt.year(previous.startsAt) !== fmt.year(rotation.startsAt);
          return (
            <Poster
              key={rotation.id}
              rotation={rotation}
              status={rotationStatus(rotation, now.getTime())}
              showYear={showYear}
              posterRef={rotation.id === anchorId ? (node) => { anchorRef.current = node; } : undefined}
            />
          );
        })}
        {hasNext ? null : <UnknownPoster switchAt={switchAt} />}
      </ol>
      <p className="text-xs text-muted-2">{t("localTime")}</p>
    </section>
  );
}

/* ------------------------------------------------------------------- export */

/** Suivi complet du théâtre immersif : ce qui joue, ce qui précédait, ce qui vient, et toute la frise. */
export function TheatreTracker({ rotations, serverNow }: TheatreTrackerProps) {
  const now = useTheatreNow(serverNow);
  const overview = useMemo(() => theatreOverview(rotations, now.getTime()), [rotations, now]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {overview.current ? <CurrentRotation rotation={overview.current} now={now} /> : <ClosedNotice next={overview.next} now={now} />}
        <Neighbours previous={overview.previous} current={overview.current} next={overview.next} />
      </div>
      <PosterStrip
        rotations={overview.rotations}
        now={now}
        currentId={overview.current?.id ?? null}
        hasNext={Boolean(overview.next)}
        switchAt={overview.current?.endsAt ?? null}
      />
    </div>
  );
}

/** Version courte pour l'accueil : la rotation en cours et ses deux voisines, sans la frise. */
export function TheatreNow({ rotations, serverNow }: TheatreTrackerProps) {
  const now = useTheatreNow(serverNow);
  const overview = useMemo(() => theatreOverview(rotations, now.getTime()), [rotations, now]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      {overview.current ? <CurrentRotation rotation={overview.current} now={now} /> : <ClosedNotice next={overview.next} now={now} />}
      <Neighbours previous={overview.previous} current={overview.current} next={overview.next} />
    </div>
  );
}
