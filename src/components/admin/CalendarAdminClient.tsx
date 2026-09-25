"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn, useConfirm } from "@/components/dna";
import {
  FIELD_WIDTH,
  FORM_MAX_WIDTH,
  AdminActions,
  AdminActionsDivider,
  AdminChip,
  AdminEmpty,
  AdminIconButton,
  AdminIdentity,
  AdminPanel,
  AdminStatus,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
  AdminTh,
  AdminTr,
} from "./ui";

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
  "w-full border border-white/12 bg-black/25 px-2.5 py-1.5 font-sans text-[0.82rem] text-parch outline-none transition-colors placeholder:text-muted-2 focus:border-gold/50";
const labelClass = "mb-1 block font-caps text-[0.54rem] uppercase tracking-[0.16em] text-muted-2";
/**
 * Bouton de formulaire. Ici le libellé reste visible : valider ou annuler une
 * saisie n'est pas une action de ligne, et une icône seule y serait un piège.
 */
const formButtonClass =
  "inline-flex items-center gap-1.5 border px-3 py-1.5 font-sans text-[0.78rem] transition-colors disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Administration du calendrier des événements.
 *
 * Deux régimes assumés : une **liste** en tableau dense, où chaque action tient
 * dans une icône, et un **formulaire** où les libellés restent écrits. Ce n'est
 * pas une incohérence : dans une liste on répète le même geste sur des dizaines
 * de lignes, dans un formulaire on le fait une fois et il engage une saisie.
 */
export function CalendarAdminClient() {
  const { confirm } = useConfirm();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
    <div className="flex flex-col gap-4">
      {migrationPending ? (
        <p className="border border-crimson-bright/40 bg-crimson/10 px-3 py-2 font-sans text-[0.8rem] text-crimson-soft">
          Table <code className="font-mono">calendar_events</code> absente. Crée-la en SQL ciblé
          (<code className="font-mono">drizzle-kit push</code> est inutilisable sur cette base), puis recharge. En
          attendant, le calendrier public affiche la liste curée.
        </p>
      ) : null}

      {form ? (
        <AdminPanel
          label={form.id ? "Modifier l'événement" : "Nouvel événement"}
          className={FORM_MAX_WIDTH}
          actions={<AdminIconButton icon={X} label="Fermer le formulaire" onClick={() => setForm(null)} />}
        >
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="cal-title">
                Titre
              </label>
              <input
                id="cal-title"
                className={cn(inputClass, FIELD_WIDTH.medium)}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Nom de l'événement"
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="cal-category">
                Catégorie
              </label>
              <select
                id="cal-category"
                className={cn(inputClass, FIELD_WIDTH.short)}
                value={form.category}
                onChange={(e) => set("category", e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-admin-surface">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="cal-order">
                Ordre de tri
              </label>
              <input
                id="cal-order"
                type="number"
                className={cn(inputClass, FIELD_WIDTH.num)}
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value))}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="cal-start">
                Début
              </label>
              <input
                id="cal-start"
                type="date"
                className={cn(inputClass, FIELD_WIDTH.date)}
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="cal-end">
                Fin (jour inclus)
              </label>
              <input
                id="cal-end"
                type="date"
                className={cn(inputClass, FIELD_WIDTH.date)}
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="cal-image">
                Bannière — URL ou /assets/… (paysage de préférence)
              </label>
              <input
                id="cal-image"
                className={cn(inputClass, FIELD_WIDTH.long)}
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="https://… ou /assets/events/…"
              />
              {form.image ? (
                <div className={cn("mt-2 overflow-hidden border border-white/12", FIELD_WIDTH.long)}>
                  {/* Aperçu au cadrage réel de la frise : bannière large. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="" className="h-16 w-full object-cover object-[50%_28%]" />
                </div>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="cal-href">
                Lien au clic
              </label>
              <input
                id="cal-href"
                className={cn(inputClass, FIELD_WIDTH.long)}
                value={form.href}
                onChange={(e) => set("href", e.target.value)}
                placeholder="/characters/… ou https://…"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="cal-description">
                Détail affiché au survol
              </label>
              <textarea
                id="cal-description"
                className={cn(inputClass, FIELD_WIDTH.text, "min-h-20 resize-y")}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="cal-source">
                Source (jamais affichée sur le site)
              </label>
              <input
                id="cal-source"
                className={cn(inputClass, FIELD_WIDTH.long)}
                value={form.sourceUrl}
                onChange={(e) => set("sourceUrl", e.target.value)}
                placeholder="URL de l'annonce officielle"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.hidden}
                onChange={(e) => set("hidden", e.target.checked)}
                className="accent-gold"
              />
              <span className="font-sans text-[0.82rem] text-parch/85">Masqué – retiré du calendrier public</span>
            </label>

            {error ? <p className="sm:col-span-2 font-sans text-[0.8rem] text-crimson-soft">{error}</p> : null}

            <div className="flex items-center gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !form.title || !form.startDate || !form.endDate}
                className={cn(formButtonClass, "border-gold/50 bg-gold/10 text-gold-bright hover:border-gold hover:bg-gold/20")}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => setForm(null)}
                className={cn(formButtonClass, "border-white/12 text-parch/75 hover:border-white/30 hover:text-parch")}
              >
                Annuler
              </button>
            </div>
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel
        label="Événements"
        count={events.length}
        actions={<AdminIconButton icon={Plus} label="Ajouter un événement" tone="active" onClick={startCreate} />}
      >
        {loading ? (
          <AdminTableSkeleton rows={5} columns={5} />
        ) : events.length === 0 ? (
          <AdminEmpty icon={CalendarDays} text="Aucun événement en base – le calendrier utilise la liste curée." />
        ) : (
          <AdminTable minWidth="44rem">
            <thead>
              <tr>
                <AdminTh width="4.5rem" />
                <AdminTh>Événement</AdminTh>
                <AdminTh width="8rem">Catégorie</AdminTh>
                <AdminTh width="12rem">Période</AdminTh>
                <AdminTh width="6.5rem">Statut</AdminTh>
                <AdminTh width="5.5rem" align="right">
                  Actions
                </AdminTh>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <AdminTr key={ev.id} dimmed={ev.hidden}>
                  <AdminTd>
                    {ev.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ev.image}
                        alt=""
                        className="h-8 w-14 shrink-0 border border-white/12 object-cover object-[50%_28%]"
                      />
                    ) : (
                      <span aria-hidden className="block h-8 w-14 border border-white/8 bg-white/[0.02]" />
                    )}
                  </AdminTd>
                  <AdminTd>
                    <AdminIdentity primary={ev.title} secondary={ev.href ?? undefined} />
                  </AdminTd>
                  <AdminTd>
                    <AdminChip>{ev.category}</AdminChip>
                  </AdminTd>
                  <AdminTd>
                    <span className="font-mono text-[0.7rem] text-muted tabular-nums">
                      {ev.startDate} → {ev.endDate}
                    </span>
                  </AdminTd>
                  <AdminTd>
                    {ev.hidden ? <AdminStatus tone="neutral">Masqué</AdminStatus> : <AdminStatus tone="ok">Publié</AdminStatus>}
                  </AdminTd>
                  <AdminTd align="right">
                    <AdminActions>
                      <AdminIconButton icon={Pencil} label="Modifier l'événement" onClick={() => startEdit(ev)} />
                      <AdminActionsDivider />
                      <AdminIconButton icon={Trash2} label="Supprimer l'événement" tone="danger" onClick={() => void remove(ev)} />
                    </AdminActions>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>
    </div>
  );
}
