"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { DnaButton, DnaPanel, cn, useConfirm } from "@/components/dna";

const CATEGORIES = ["Bannière", "Arme", "Événement", "Épreuve", "Récompense"] as const;
type Category = (typeof CATEGORIES)[number];

type EventRow = {
  id: string;
  title: string;
  category: Category;
  startDate: string;
  endDate: string;
  image: string | null;
  href: string | null;
  description: string | null;
  sourceUrl: string | null;
  sortOrder: number;
  hidden: boolean;
};

type FormState = {
  id?: string;
  title: string;
  category: Category;
  startDate: string;
  endDate: string;
  image: string;
  href: string;
  description: string;
  sourceUrl: string;
  sortOrder: number;
  hidden: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  category: "Événement",
  startDate: "",
  endDate: "",
  image: "",
  href: "",
  description: "",
  sourceUrl: "",
  sortOrder: 0,
  hidden: false,
};

const inputClass =
  "w-full rounded-sm border border-white/10 bg-ink/60 px-3 py-2 text-sm text-parch outline-none transition-colors placeholder:text-muted-2 focus:border-gold/50";
const labelClass = "mb-1 block font-caps text-[0.55rem] uppercase tracking-[0.16em] text-muted";

export function CalendarAdminClient() {
  const { confirm } = useConfirm();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/calendar-events");
      const json = await res.json();
      setEvents(Array.isArray(json.events) ? json.events : []);
      setMigrationPending(Boolean(json.migrationPending));
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => {
    setError(null);
    setForm({ ...EMPTY_FORM });
  };
  const startEdit = (ev: EventRow) => {
    setError(null);
    setForm({
      id: ev.id,
      title: ev.title,
      category: ev.category,
      startDate: ev.startDate,
      endDate: ev.endDate,
      image: ev.image ?? "",
      href: ev.href ?? "",
      description: ev.description ?? "",
      sourceUrl: ev.sourceUrl ?? "",
      sortOrder: ev.sortOrder,
      hidden: ev.hidden,
    });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    const payload = {
      ...(form.id ? { id: form.id } : {}),
      title: form.title.trim(),
      category: form.category,
      startDate: form.startDate,
      endDate: form.endDate,
      image: form.image.trim() || null,
      href: form.href.trim() || null,
      description: form.description.trim() || null,
      sourceUrl: form.sourceUrl.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      hidden: form.hidden,
    };
    try {
      const res = await fetch("/api/admin/calendar-events", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Échec de l'enregistrement.");
        return;
      }
      setForm(null);
      await load();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ev: EventRow) => {
    const ok = await confirm({
      title: "Supprimer l'événement",
      message: `« ${ev.title} » sera définitivement supprimé du calendrier.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    await fetch("/api/admin/calendar-events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ev.id }),
    });
    await load();
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <div className="space-y-5">
      {migrationPending ? (
        <DnaPanel className="border-crimson/40 p-4">
          <p className="font-sans text-sm text-[#ffb3a6]">
            Table <code className="font-mono">calendar_events</code> absente. Lance la migration
            (<code className="font-mono">bun run db:push</code>) puis recharge — le calendrier utilise la liste curée
            en attendant.
          </p>
        </DnaPanel>
      ) : null}

      {!form ? (
        <div className="flex items-center justify-between">
          <p className="font-caps text-[0.6rem] uppercase tracking-[0.18em] text-muted">
            {loading ? "Chargement…" : `${events.length} événement${events.length > 1 ? "s" : ""}`}
          </p>
          <DnaButton variant="gold" icon={<Plus className="h-4 w-4" />} onClick={startCreate}>
            Ajouter un événement
          </DnaButton>
        </div>
      ) : null}

      {/* Formulaire */}
      {form ? (
        <DnaPanel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-parch">{form.id ? "Modifier l'événement" : "Nouvel événement"}</h2>
            <button type="button" onClick={() => setForm(null)} aria-label="Fermer" className="text-parch/70 hover:text-gold">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Titre</label>
              <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Nom de l'événement" />
            </div>
            <div>
              <label className={labelClass}>Catégorie</label>
              <select className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value as Category)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Ordre (tri)</label>
              <input type="number" className={inputClass} value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Début</label>
              <input type="date" className={inputClass} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Fin</label>
              <input type="date" className={inputClass} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Bannière (URL ou /assets/… — paysage de préférence)</label>
              <input className={inputClass} value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://… ou /assets/events/…" />
              {form.image ? (
                <div className="mt-2 overflow-hidden rounded-sm border border-white/15">
                  {/* Aperçu au format de la barre du calendrier : bannière large. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="" className="h-20 w-full object-cover object-[50%_28%]" />
                </div>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Lien (href — clic sur l'événement)</label>
              <input className={inputClass} value={form.href} onChange={(e) => set("href", e.target.value)} placeholder="/characters/… ou https://…" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Infos (tooltip / détail)</label>
              <textarea className={cn(inputClass, "min-h-20 resize-y")} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Source (non affichée au front)</label>
              <input className={inputClass} value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="URL de l'annonce officielle" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
              <input type="checkbox" checked={form.hidden} onChange={(e) => set("hidden", e.target.checked)} className="accent-gold" />
              <span className="font-sans text-sm text-parch/85">Masqué (non affiché dans le calendrier)</span>
            </label>
          </div>

          {error ? <p className="mt-3 font-sans text-sm text-[#ffb3a6]">{error}</p> : null}

          <div className="mt-4 flex items-center gap-2">
            <DnaButton variant="gold" onClick={save} disabled={saving || !form.title || !form.startDate || !form.endDate}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </DnaButton>
            <DnaButton variant="ghost" onClick={() => setForm(null)}>
              Annuler
            </DnaButton>
          </div>
        </DnaPanel>
      ) : null}

      {/* Liste */}
      {!form && !loading ? (
        events.length === 0 ? (
          <DnaPanel className="p-6 text-center">
            <p className="font-sans text-sm text-muted">Aucun événement en base. Le calendrier utilise la liste curée par défaut.</p>
          </DnaPanel>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <div
                key={ev.id}
                className={cn(
                  "flex items-center gap-3 rounded-sm border border-line/20 bg-panel/60 p-3",
                  ev.hidden && "opacity-60",
                )}
              >
                {ev.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.image} alt="" className="h-10 w-16 shrink-0 rounded-sm border border-white/15 object-cover object-[50%_28%]" />
                ) : (
                  <span className="h-10 w-16 shrink-0 rounded-sm border border-white/10 bg-ink/60" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display text-sm text-parch">{ev.title}</span>
                    {ev.hidden ? (
                      <span className="shrink-0 rounded-sm border border-white/15 px-1.5 py-0.5 font-caps text-[0.5rem] uppercase tracking-[0.14em] text-muted">
                        Masqué
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 font-mono text-[0.62rem] text-muted">
                    {ev.category} · {ev.startDate} → {ev.endDate}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(ev)}
                  aria-label="Modifier"
                  className="flex h-8 w-8 items-center justify-center rounded-sm border border-line/20 text-parch/75 transition-colors hover:border-gold hover:text-gold"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(ev)}
                  aria-label="Supprimer"
                  className="flex h-8 w-8 items-center justify-center rounded-sm border border-line/20 text-parch/75 transition-colors hover:border-crimson-bright/50 hover:text-[#ffb3a6]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
