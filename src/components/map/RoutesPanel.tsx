"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useAtom, useSetAtom } from "jotai";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, EyeOff, Flag, Heart, Link2, Undo2, X } from "lucide-react";
import { GlyphIcons } from "@/components/icons/GameGlyph";
import { Link } from "@/i18n/navigation";
import { cn, DnaCornerBrackets, DnaSwitch, useConfirm } from "@/components/dna";
import type { NormalizedMap } from "@/lib/map/taxonomy";
import {
  ROUTE_COLORS,
  drawingAtom,
  fitRouteAtom,
  focusedRouteIdAtom,
  routesAtom,
  shownRouteIdsAtom,
  type FarmRoute,
} from "@/lib/map/routes";
import { MAP_EASE } from "./ActiveTypesRail";
import { useMapLabels } from "./useMapLabels";

/** Catégories proposées comme « cible » d'un itinéraire, dans cet ordre. */
const TARGET_CATEGORIES = ["materials", "geniemons", "exploration", "chests", "puzzles"];

type Sort = "top" | "recent";
type FormValues = { title: string; description: string; typeIds: string[]; visibility: "public" | "private" };
/**
 * Tracé terminé en attente d'enregistrement ; `editing` = itinéraire modifié,
 * `values` = saisie du formulaire, conservée quand on repart retracer.
 */
type Draft = { points: [number, number][]; editing?: FarmRoute; values?: FormValues };

/**
 * Itinéraires de farm de la carte courante : ceux de la communauté et les
 * siens. Tri par votes ou par date, filtre par ressource ciblée ; clic = tracé
 * affiché et cadré. Tracé, modification et publication pour les comptes
 * connectés, signalement des itinéraires des autres.
 */
export function RoutesPanel({
  map,
  onClose,
  initialRouteId,
}: {
  map: NormalizedMap;
  onClose: () => void;
  /** Itinéraire ouvert par un lien partagé (`?route=`). */
  initialRouteId?: string | null;
}) {
  const t = useTranslations("map");
  const tErrors = useTranslations("apiErrors");
  const { status } = useSession();
  const { confirm } = useConfirm();
  const [routes, setRoutes] = useAtom(routesAtom);
  const [shown, setShown] = useAtom(shownRouteIdsAtom);
  const setFocused = useSetAtom(focusedRouteIdAtom);
  const setFitRoute = useSetAtom(fitRouteAtom);
  const [drawing, setDrawing] = useAtom(drawingAtom);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [redrawOf, setRedrawOf] = useState<Omit<Draft, "points"> | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("top");
  const [targetFilter, setTargetFilter] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/map/routes?mapId=${encodeURIComponent(map.id)}`, { cache: "no-store" });
      const data = (await r.json()) as { routes?: FarmRoute[] };
      setRoutes(data.routes ?? []);
      return data.routes ?? [];
    } catch {
      setRoutes([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [map.id, setRoutes]);

  const focusRoute = useCallback(
    (id: string) => {
      setShown((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setFitRoute({ id, nonce: Date.now() });
    },
    [setShown, setFitRoute],
  );

  useEffect(() => {
    setShown([]);
    void load().then((list) => {
      // Lien partagé : on affiche et on cadre l'itinéraire dès qu'il est chargé.
      if (initialRouteId && list.some((r) => r.id === initialRouteId)) focusRoute(initialRouteId);
    });
  }, [load, setShown, initialRouteId, focusRoute]);

  // Ressources ciblées par au moins un itinéraire : les seuls filtres utiles.
  const targets = useMemo(() => {
    const ids = new Set(routes.flatMap((r) => r.typeIds));
    return map.types.filter((g) => ids.has(g.id));
  }, [routes, map]);

  const visible = useMemo(() => {
    const list = targetFilter ? routes.filter((r) => r.typeIds.includes(targetFilter)) : routes;
    return [...list].sort((a, b) =>
      sort === "top" ? b.voteCount - a.voteCount || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt),
    );
  }, [routes, targetFilter, sort]);

  const toggleShown = (id: string) =>
    setShown((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const vote = async (route: FarmRoute) => {
    const r = await fetch(`/api/map/routes/${route.id}/vote`, { method: route.votedByMe ? "DELETE" : "POST" });
    if (!r.ok) return;
    const data = (await r.json()) as { voted: boolean; voteCount: number };
    setRoutes((prev) => prev.map((x) => (x.id === route.id ? { ...x, votedByMe: data.voted, voteCount: data.voteCount } : x)));
  };

  const share = async (route: FarmRoute) => {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ mapId: map.id, route: route.id }).toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(route.id);
      setTimeout(() => setCopied((c) => (c === route.id ? null : c)), 1800);
    } catch {
      window.prompt(t("routeShare"), url.toString());
    }
  };

  const remove = async (route: FarmRoute) => {
    const ok = await confirm({
      title: t("routeDelete"),
      message: t("routeDeleteConfirm", { title: route.title }),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      danger: true,
    });
    if (!ok) return;
    const r = await fetch(`/api/map/routes/${route.id}`, { method: "DELETE" });
    if (r.ok) {
      setRoutes((prev) => prev.filter((x) => x.id !== route.id));
      setShown((prev) => prev.filter((x) => x !== route.id));
    }
  };

  // --- Mode tracé ------------------------------------------------------------
  if (drawing !== null)
    return (
      <Shell title={redrawOf ? t("routeRedrawing") : t("routeDrawing")} onClose={() => { setDrawing(null); setRedrawOf(undefined); }}>
        <p className="font-sans text-[0.78rem] leading-relaxed text-parch/85">{t("routeDrawingHint")}</p>
        <p className="mt-2 font-mono text-[0.7rem] text-muted">{t("routePointCount", { count: drawing.length })}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={drawing.length === 0}
            onClick={() => setDrawing(drawing.slice(0, -1))}
            className="flex h-8 items-center gap-1.5 border border-line/25 px-2.5 font-sans text-[0.78rem] text-parch/85 hover:border-gold/50 disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden />
            {t("routeUndo")}
          </button>
          <button
            type="button"
            disabled={drawing.length < 2}
            onClick={() => {
              setDraft({ points: drawing, ...redrawOf });
              setRedrawOf(undefined);
              setDrawing(null);
            }}
            className="flex h-8 flex-1 items-center justify-center border border-gold/50 bg-gold/15 font-sans text-[0.8rem] text-gold-bright hover:bg-gold/25 disabled:opacity-40"
          >
            {t("routeFinish")}
          </button>
        </div>
      </Shell>
    );

  // --- Enregistrement (création ou modification) ----------------------------
  if (draft)
    return (
      <RouteForm
        map={map}
        points={draft.points}
        initial={draft.editing}
        values={draft.values}
        error={error}
        onCancel={() => {
          setDraft(null);
          setError(null);
        }}
        onRedraw={(values) => {
          setRedrawOf({ editing: draft.editing, values });
          setDrawing(draft.points);
          setDraft(null);
        }}
        onSubmit={async (values) => {
          setError(null);
          const editing = draft.editing;
          const r = await fetch(editing ? `/api/map/routes/${editing.id}` : "/api/map/routes", {
            method: editing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mapId: map.id, points: draft.points, ...values }),
          });
          const data = (await r.json().catch(() => ({}))) as { id?: string; error?: string };
          if (!r.ok) return setError(data.error ?? tErrors("invalidData"));
          const id = editing?.id ?? data.id!;
          setDraft(null);
          await load();
          focusRoute(id);
        }}
      />
    );

  // --- Liste -----------------------------------------------------------------
  return (
    <Shell title={t("routes")} onClose={onClose}>
      {status === "authenticated" ? (
        <button
          type="button"
          onClick={() => setDrawing([])}
          className="flex h-8 w-full items-center justify-center gap-2 border border-gold/50 bg-gold/15 font-sans text-[0.8rem] text-gold-bright hover:bg-gold/25"
        >
          <GlyphIcons.edit className="h-3.5 w-3.5" aria-hidden />
          {t("routeDraw")}
        </button>
      ) : (
        <p className="border border-dashed border-line/25 px-2.5 py-2 font-sans text-[0.75rem] text-muted">
          {t.rich("routeSignIn", {
            link: (chunks) => (
              <Link href="/login" className="text-gold underline underline-offset-2 hover:text-gold-bright">
                {chunks}
              </Link>
            ),
          })}
        </p>
      )}

      {routes.length > 1 && (
        <div className="mt-3 flex items-center gap-1.5">
          {(["top", "recent"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={sort === s}
              onClick={() => setSort(s)}
              className={cn(
                "border px-2 py-0.5 font-sans text-[0.7rem] transition-colors",
                sort === s ? "border-gold/60 bg-gold/15 text-gold-bright" : "border-line/20 text-muted hover:text-parch",
              )}
            >
              {s === "top" ? t("routeSortTop") : t("routeSortRecent")}
            </button>
          ))}
        </div>
      )}

      {targets.length > 1 && (
        <div role="group" aria-label={t("routeFilter")} className="mt-2 flex flex-wrap gap-1">
          {targets.map((g) => (
            <TargetChip key={g.id} map={map} typeId={g.id} active={targetFilter === g.id} onClick={() => setTargetFilter(targetFilter === g.id ? null : g.id)} />
          ))}
        </div>
      )}

      <div className="custom-scrollbar mt-3 max-h-[55vh] overflow-y-auto">
        {loading ? (
          <p className="py-4 text-center font-sans text-[0.75rem] text-muted">{t("routesLoading")}</p>
        ) : visible.length === 0 ? (
          <p className="py-4 text-center font-sans text-[0.75rem] text-muted">{t("routesEmpty")}</p>
        ) : (
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {visible.map((route, index) => {
                const shownIndex = shown.indexOf(route.id);
                const isShown = shownIndex >= 0;
                const color = ROUTE_COLORS[Math.max(shownIndex, 0) % ROUTE_COLORS.length];
                return (
                  <motion.li
                    key={route.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: MAP_EASE, delay: Math.min(index, 10) * 0.025 } }}
                    exit={{ opacity: 0, x: 16, transition: { duration: 0.15 } }}
                    onMouseEnter={() => setFocused(route.id)}
                    onMouseLeave={() => setFocused(null)}
                    className={cn("border bg-ink-2/60 p-2 transition-colors", isShown ? "border-line/40" : "border-line/15")}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleShown(route.id)}
                        aria-pressed={isShown}
                        aria-label={isShown ? t("routeHide") : t("routeShow")}
                        title={isShown ? t("routeHide") : t("routeShow")}
                        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border border-line/25 transition-colors"
                        style={isShown ? { borderColor: color, color } : undefined}
                      >
                        {isShown ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted" />}
                      </button>
                      {/* Le titre cadre la carte sur l'itinéraire (et l'affiche). */}
                      <button type="button" onClick={() => focusRoute(route.id)} className="min-w-0 flex-1 text-left">
                        <span className="flex items-center gap-1.5 font-sans text-[0.82rem] text-parch hover:text-gold-bright">
                          {route.visibility === "private" && <GlyphIcons.lock className="h-3 w-3 shrink-0 text-muted" aria-label={t("routePrivate")} />}
                          <span className="truncate">{route.title}</span>
                        </span>
                        <span className="block truncate font-sans text-[0.66rem] text-muted">
                          {route.isMine ? t("routeMine") : (route.authorName ?? t("routeAnonymous"))} · {t("routePointCount", { count: route.points.length })}
                        </span>
                        <RouteTypeIcons map={map} typeIds={route.typeIds} />
                        {route.description && (
                          <span className="mt-1 line-clamp-2 block font-sans text-[0.7rem] leading-snug text-parch/70">{route.description}</span>
                        )}
                      </button>
                      {route.visibility === "public" && (
                        <button
                          type="button"
                          onClick={() => void vote(route)}
                          aria-pressed={route.votedByMe}
                          aria-label={t("routeVote")}
                          className={cn(
                            "flex shrink-0 items-center gap-1 px-1.5 py-0.5 font-mono text-[0.68rem] transition-colors",
                            route.votedByMe ? "text-crimson-soft" : "text-muted hover:text-crimson-soft",
                          )}
                        >
                          <motion.span key={String(route.votedByMe)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                            <Heart className={cn("h-3.5 w-3.5", route.votedByMe && "fill-current")} aria-hidden />
                          </motion.span>
                          {route.voteCount}
                        </button>
                      )}
                    </div>

                    {/* Actions secondaires : discrètes, révélées au survol ou au focus. */}
                    <div className="mt-1.5 flex items-center justify-end gap-0.5">
                      {route.visibility === "public" && (
                        <RowAction label={copied === route.id ? t("routeShareCopied") : t("routeShare")} onClick={() => void share(route)}>
                          {copied === route.id ? <Check className="h-3.5 w-3.5 text-ok" /> : <Link2 className="h-3.5 w-3.5" />}
                        </RowAction>
                      )}
                      {route.isMine ? (
                        <>
                          <RowAction label={t("routeEdit")} onClick={() => setDraft({ points: route.points, editing: route })}>
                            <GlyphIcons.edit className="h-3.5 w-3.5" />
                          </RowAction>
                          <RowAction label={t("routeDelete")} danger onClick={() => void remove(route)}>
                            <GlyphIcons.delete className="h-3.5 w-3.5" />
                          </RowAction>
                        </>
                      ) : (
                        status === "authenticated" &&
                        route.visibility === "public" && (
                          <RowAction label={t("routeReport")} danger onClick={() => setReporting(reporting === route.id ? null : route.id)}>
                            <Flag className="h-3.5 w-3.5" />
                          </RowAction>
                        )
                      )}
                    </div>

                    <AnimatePresence>
                      {reporting === route.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: MAP_EASE }}
                          className="overflow-hidden"
                        >
                          <ReportForm routeId={route.id} onDone={() => setReporting(null)} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </Shell>
  );
}

function RowAction({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("grid h-6 w-6 place-items-center text-muted-2 transition-colors", danger ? "hover:text-crimson-soft" : "hover:text-gold-bright")}
    >
      {children}
    </button>
  );
}

function ReportForm({ routeId, onDone }: { routeId: string; onDone: () => void }) {
  const t = useTranslations("map");
  const tErrors = useTranslations("apiErrors");
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (state === "sent") return <p className="mt-2 font-sans text-[0.72rem] text-ok">{t("routeReportSent")}</p>;
  return (
    <form
      className="mt-2 space-y-1.5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const r = await fetch(`/api/map/routes/${routeId}/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        if (r.ok) {
          setState("sent");
          setTimeout(onDone, 1600);
        } else {
          const data = (await r.json().catch(() => ({}))) as { error?: string };
          setMessage(data.error ?? tErrors("invalidData"));
          setState("error");
        }
      }}
    >
      <textarea
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        minLength={3}
        maxLength={160}
        rows={2}
        placeholder={t("routeReportPlaceholder")}
        aria-label={t("routeReport")}
        className="w-full resize-none border border-line/25 bg-ink px-2 py-1.5 font-sans text-[0.75rem] text-parch outline-none placeholder:text-muted-2 focus:border-crimson-bright/60"
      />
      {message && <p role="alert" className="font-sans text-[0.7rem] text-crimson-soft">{message}</p>}
      <div className="flex justify-end gap-1.5">
        <button type="button" onClick={onDone} className="px-2 py-1 font-sans text-[0.72rem] text-muted hover:text-parch">
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={reason.trim().length < 3 || state === "sending"}
          className="border border-crimson-bright/50 bg-crimson/20 px-2.5 py-1 font-sans text-[0.72rem] text-crimson-soft hover:bg-crimson/30 disabled:opacity-40"
        >
          {t("routeReportSend")}
        </button>
      </div>
    </form>
  );
}

function TargetChip({ map, typeId, active, onClick }: { map: NormalizedMap; typeId: string; active: boolean; onClick: () => void }) {
  const { typeName } = useMapLabels();
  const g = map.types.find((x) => x.id === typeId);
  if (!g) return null;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      title={typeName(g)}
      className={cn(
        "flex items-center gap-1 border py-0.5 pl-0.5 pr-1.5 font-sans text-[0.66rem] transition-colors",
        active ? "border-gold/60 bg-gold/15 text-gold-bright" : "border-line/20 text-parch/70 hover:border-line/50",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={g.icon} alt="" className="h-4 w-4 object-contain" />
      <span className="max-w-[7rem] truncate">{typeName(g)}</span>
    </button>
  );
}

function RouteTypeIcons({ map, typeIds }: { map: NormalizedMap; typeIds: string[] }) {
  const { typeName } = useMapLabels();
  const groups = typeIds.map((id) => map.types.find((g) => g.id === id)).filter(Boolean);
  if (groups.length === 0) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {groups.map((g) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={g!.id} src={g!.icon} alt={typeName(g!)} title={typeName(g!)} className="h-5 w-5 object-contain" />
      ))}
    </span>
  );
}

function RouteForm({
  map,
  points,
  initial,
  values,
  error,
  onCancel,
  onRedraw,
  onSubmit,
}: {
  map: NormalizedMap;
  points: [number, number][];
  initial?: FarmRoute;
  /** Saisie en cours, prioritaire sur `initial` (retour d'un nouveau tracé). */
  values?: FormValues;
  error: string | null;
  onCancel: () => void;
  onRedraw: (values: FormValues) => void;
  onSubmit: (values: FormValues) => Promise<unknown>;
}) {
  const t = useTranslations("map");
  const { typeName } = useMapLabels();
  const [title, setTitle] = useState(values?.title ?? initial?.title ?? "");
  const [description, setDescription] = useState(values?.description ?? initial?.description ?? "");
  const [typeIds, setTypeIds] = useState<string[]>(values?.typeIds ?? initial?.typeIds ?? []);
  const [isPublic, setIsPublic] = useState((values?.visibility ?? initial?.visibility ?? "public") === "public");
  const current = (): FormValues => ({ title, description, typeIds, visibility: isPublic ? "public" : "private" });
  const [saving, setSaving] = useState(false);
  const candidates = useMemo(
    () =>
      map.types
        .filter((g) => TARGET_CATEGORIES.includes(g.category) && !g.id.startsWith("raw:"))
        .sort((a, b) => TARGET_CATEGORIES.indexOf(a.category) - TARGET_CATEGORIES.indexOf(b.category)),
    [map],
  );
  const valid = title.trim().length >= 3;

  return (
    <Shell title={initial ? t("routeEdit") : t("routePublish")} onClose={onCancel}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid || saving) return;
          setSaving(true);
          await onSubmit({ title: title.trim(), description: description.trim(), typeIds, visibility: isPublic ? "public" : "private" });
          setSaving(false);
        }}
      >
        <p className="mb-2 font-mono text-[0.68rem] text-muted">
          {t("routePointCount", { count: points.length })} ·{" "}
          <button type="button" onClick={() => onRedraw(current())} className="text-gold underline underline-offset-2 hover:text-gold-bright">
            {t("routeEditPath")}
          </button>
        </p>
        <input
          autoFocus
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("routeTitlePlaceholder")}
          aria-label={t("routeTitle")}
          className="h-8 w-full border border-line/25 bg-ink-2 px-2 font-sans text-sm text-parch outline-none placeholder:text-muted-2 focus:border-gold/60"
        />
        <textarea
          value={description}
          maxLength={500}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("routeDescriptionPlaceholder")}
          aria-label={t("routeDescription")}
          className="mt-2 w-full resize-none border border-line/25 bg-ink-2 px-2 py-1.5 font-sans text-[0.8rem] text-parch outline-none placeholder:text-muted-2 focus:border-gold/60"
        />
        <p className="mt-2 font-sans text-[0.72rem] text-muted">{t("routeTargets")}</p>
        <div className="custom-scrollbar mt-1 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
          {candidates.map((g) => {
            const on = typeIds.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={on}
                disabled={!on && typeIds.length >= 10}
                onClick={() => setTypeIds((prev) => (on ? prev.filter((x) => x !== g.id) : [...prev, g.id]))}
                className={cn(
                  "flex items-center gap-1 border py-0.5 pl-0.5 pr-1.5 font-sans text-[0.68rem] transition-colors disabled:opacity-40",
                  on ? "border-gold/60 bg-gold/15 text-gold-bright" : "border-line/20 text-parch/75 hover:border-line/50",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.icon} alt="" className="h-4 w-4 object-contain" />
                {typeName(g)}
              </button>
            );
          })}
        </div>
        <label className="mt-3 flex items-center justify-between gap-3">
          <span className="font-sans text-[0.78rem] text-parch/85">{t("routePublic")}</span>
          <DnaSwitch checked={isPublic} onChange={setIsPublic} aria-label={t("routePublic")} />
        </label>
        {error && <p role="alert" className="mt-2 font-sans text-[0.72rem] text-crimson-soft">{error}</p>}
        <button
          type="submit"
          disabled={!valid || saving}
          className="mt-3 flex h-8 w-full items-center justify-center border border-gold/50 bg-gold/15 font-sans text-[0.8rem] text-gold-bright hover:bg-gold/25 disabled:opacity-40"
        >
          {saving ? t("routeSaving") : t("routeSave")}
        </button>
      </form>
    </Shell>
  );
}

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useTranslations("map");
  return (
    <section
      aria-label={title}
      className="pointer-events-auto relative w-[320px] border border-line/30 bg-ink/95 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md"
    >
      <DnaCornerBrackets size={12} />
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="font-caps text-[0.58rem] uppercase tracking-[0.22em] text-gold/85">{title}</h2>
        <button type="button" onClick={onClose} aria-label={t("close")} className="text-muted hover:text-parch">
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Contenu animé à chaque changement d'étape (liste → tracé → formulaire). */}
      <motion.div key={title} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: MAP_EASE }}>
        {children}
      </motion.div>
    </section>
  );
}
