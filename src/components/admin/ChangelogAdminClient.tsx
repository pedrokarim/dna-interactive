"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, ScrollText, Trash2, X } from "lucide-react";
import { cn, useConfirm } from "@/components/dna";
import { CHANGELOG_TYPES, isValidVersion, type ChangelogType } from "@/lib/changelog/types";
import {
  FIELD_WIDTH,
  FORM_MAX_WIDTH,
  AdminActions,
  AdminActionsDivider,
  AdminChip,
  AdminEmpty,
  AdminFormButton,
  AdminIconButton,
  AdminIdentity,
  AdminPanel,
  AdminStatus,
  AdminTable,
  AdminTableSkeleton,
  AdminTd,
  AdminTh,
  AdminTr,
  adminInputClass,
  adminLabelClass,
} from "./ui";

type Translation = { title: string; description: string; items: string[] };

type Entry = {
  id: string;
  version: string;
  date: string;
  type: ChangelogType;
  translations: Record<string, Translation>;
  hidden: boolean;
  updatedAt: string;
};

const TYPE_LABELS: Record<ChangelogType, string> = {
  feature: "Nouveauté",
  update: "Mise à jour",
  fix: "Correction",
  enhancement: "Amélioration",
  security: "Sécurité",
};

const EMPTY_TRANSLATION: Translation = { title: "", description: "", items: [] };

type Draft = {
  id?: string;
  version: string;
  date: string;
  type: ChangelogType;
  hidden: boolean;
  translations: Record<string, Translation>;
};

function emptyDraft(defaultLocale: string): Draft {
  return {
    version: "",
    date: new Date().toISOString().slice(0, 10),
    type: "feature",
    hidden: false,
    translations: { [defaultLocale]: { ...EMPTY_TRANSLATION } },
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/**
 * Administration du changelog.
 *
 * Le journal vivait en dur : une note coûtait huit fichiers à modifier, ce qui
 * décourage d'en écrire. Ici une entrée se saisit en une fois.
 *
 * Les langues sont un onglet dans le formulaire, pas huit champs empilés : la
 * langue par défaut est obligatoire, les autres se remplissent quand on veut, et
 * la page publique retombe sur celle qui existe. C'est ce qui permet de rester
 * multilingue sans rendre l'écriture pénible.
 */
export function ChangelogAdminClient() {
  const { confirm } = useConfirm();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [locales, setLocales] = useState<string[]>([]);
  const [defaultLocale, setDefaultLocale] = useState("fr");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [tab, setTab] = useState("fr");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/changelog");
      const data = await response.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setLocales(Array.isArray(data.locales) ? data.locales : []);
      if (data.defaultLocale) {
        setDefaultLocale(data.defaultLocale);
        setTab(data.defaultLocale);
      }
    } catch {
      setMessage({ tone: "error", text: "Chargement du changelog impossible." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => {
    setMessage(null);
    setDraft(emptyDraft(defaultLocale));
    setTab(defaultLocale);
  };

  const startEdit = (entry: Entry) => {
    setMessage(null);
    setDraft({
      id: entry.id,
      version: entry.version,
      date: entry.date,
      type: entry.type,
      hidden: entry.hidden,
      translations: JSON.parse(JSON.stringify(entry.translations)) as Record<string, Translation>,
    });
    setTab(entry.translations[defaultLocale] ? defaultLocale : Object.keys(entry.translations)[0] ?? defaultLocale);
  };

  const setTranslation = (locale: string, patch: Partial<Translation>) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            translations: {
              ...d.translations,
              [locale]: { ...EMPTY_TRANSLATION, ...d.translations[locale], ...patch },
            },
          }
        : d,
    );
  };

  const save = async () => {
    if (!draft) return;
    if (!isValidVersion(draft.version)) {
      setMessage({ tone: "error", text: "Version attendue au format numérique, ex. « 2.4.0 »." });
      return;
    }
    if (!draft.translations[defaultLocale]?.title?.trim()) {
      setMessage({ tone: "error", text: `Le titre en « ${defaultLocale} » est obligatoire.` });
      return;
    }

    // On n'envoie que les langues réellement remplies : une langue au titre vide
    // n'est pas une traduction, elle empêcherait juste le repli de jouer.
    const translations: Record<string, Translation> = {};
    for (const [locale, text] of Object.entries(draft.translations)) {
      if (!text.title.trim()) continue;
      translations[locale] = {
        title: text.title.trim(),
        description: text.description.trim(),
        items: text.items.map((i) => i.trim()).filter(Boolean),
      };
    }

    setBusy("form");
    const payload = {
      ...(draft.id ? { id: draft.id } : {}),
      version: draft.version.trim(),
      date: draft.date,
      type: draft.type,
      hidden: draft.hidden,
      translations,
    };
    const response = await fetch("/api/admin/changelog", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    setBusy(null);

    if (!response?.ok) {
      const error = await response?.json().catch(() => null);
      setMessage({ tone: "error", text: error?.error ?? "Enregistrement impossible." });
      return;
    }
    setMessage({ tone: "ok", text: draft.id ? "Entrée mise à jour." : "Entrée publiée." });
    setDraft(null);
    await load();
  };

  const remove = async (entry: Entry) => {
    const ok = await confirm({
      title: "Supprimer l'entrée",
      message: `La version ${entry.version} disparaîtra du journal public. Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    setBusy(entry.id);
    await fetch("/api/admin/changelog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id }),
    }).catch(() => null);
    setBusy(null);
    await load();
  };

  const toggleHidden = async (entry: Entry) => {
    setBusy(entry.id);
    await fetch("/api/admin/changelog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, hidden: !entry.hidden }),
    }).catch(() => null);
    setBusy(null);
    await load();
  };

  const current = draft?.translations[tab] ?? EMPTY_TRANSLATION;

  return (
    <div className="flex flex-col gap-4">
      {message ? (
        <p className={cn("font-sans text-[0.8rem]", message.tone === "ok" ? "text-gold" : "text-crimson-soft")}>
          {message.text}
        </p>
      ) : null}

      {draft ? (
        <AdminPanel
          label={draft.id ? `Modifier la version ${draft.version || "…"}` : "Nouvelle entrée"}
          className={FORM_MAX_WIDTH}
          actions={<AdminIconButton icon={X} label="Fermer le formulaire" onClick={() => setDraft(null)} />}
        >
          <div className="grid gap-3 p-3 sm:grid-cols-3">
            <div>
              <label className={adminLabelClass} htmlFor="cl-version">
                Version
              </label>
              <input
                id="cl-version"
                className={cn(adminInputClass, FIELD_WIDTH.num)}
                value={draft.version}
                onChange={(e) => setDraft((d) => (d ? { ...d, version: e.target.value } : d))}
                placeholder="2.5.0"
              />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="cl-date">
                Date
              </label>
              <input
                id="cl-date"
                type="date"
                className={cn(adminInputClass, FIELD_WIDTH.date)}
                value={draft.date}
                onChange={(e) => setDraft((d) => (d ? { ...d, date: e.target.value } : d))}
              />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="cl-type">
                Catégorie
              </label>
              <select
                id="cl-type"
                className={cn(adminInputClass, FIELD_WIDTH.short)}
                value={draft.type}
                onChange={(e) => setDraft((d) => (d ? { ...d, type: e.target.value as ChangelogType } : d))}
              >
                {CHANGELOG_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-[#0b0d12]">
                    {TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Onglets de langue : la langue par défaut porte une pastille, les
                langues déjà remplies aussi, pour voir d'un coup ce qui reste. */}
            <div className="sm:col-span-3">
              <span className={adminLabelClass}>Langue rédigée</span>
              <div className="flex flex-wrap gap-1">
                {locales.map((locale) => {
                  const filled = Boolean(draft.translations[locale]?.title?.trim());
                  return (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => setTab(locale)}
                      className={cn(
                        "inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[0.7rem] uppercase transition-colors",
                        tab === locale
                          ? "border-gold/50 bg-gold/12 text-gold-bright"
                          : "border-white/12 text-muted hover:border-white/30 hover:text-parch",
                      )}
                    >
                      {locale}
                      {locale === defaultLocale ? <span className="text-[0.58rem] text-gold">*</span> : null}
                      {filled ? <span aria-hidden className="h-1 w-1 rounded-full bg-[#7bbf7b]" /> : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 font-sans text-[0.7rem] text-muted-2">
                * langue obligatoire. Les autres sont facultatives : une entrée non traduite s&apos;affiche dans la
                langue où elle a été écrite.
              </p>
            </div>

            <div className="sm:col-span-3">
              <label className={adminLabelClass} htmlFor="cl-title">
                Titre ({tab})
              </label>
              <input
                id="cl-title"
                className={cn(adminInputClass, FIELD_WIDTH.medium)}
                value={current.title}
                onChange={(e) => setTranslation(tab, { title: e.target.value })}
                placeholder="Ce que la version apporte, en une ligne"
              />
            </div>

            <div className="sm:col-span-3">
              <label className={adminLabelClass} htmlFor="cl-description">
                Résumé ({tab})
              </label>
              <textarea
                id="cl-description"
                rows={3}
                className={cn(adminInputClass, FIELD_WIDTH.text, "resize-y")}
                value={current.description}
                onChange={(e) => setTranslation(tab, { description: e.target.value })}
                placeholder="Deux ou trois phrases, côté visiteur. Pas de détail technique."
              />
            </div>

            <div className="sm:col-span-3">
              <label className={adminLabelClass} htmlFor="cl-items">
                Points, un par ligne ({tab})
              </label>
              <textarea
                id="cl-items"
                rows={8}
                className={cn(adminInputClass, FIELD_WIDTH.text, "resize-y font-mono text-[0.76rem]")}
                value={current.items.join("\n")}
                onChange={(e) => setTranslation(tab, { items: e.target.value.split("\n") })}
                placeholder={"🔔 Une ligne par point\n✨ Le **gras** est rendu"}
              />
              <p className="mt-1 font-sans text-[0.7rem] text-muted-2">
                Une ligne par point. Les emoji sont libres, et <code className="font-mono">**gras**</code> est
                interprété.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-2 sm:col-span-3">
              <input
                type="checkbox"
                checked={draft.hidden}
                onChange={(e) => setDraft((d) => (d ? { ...d, hidden: e.target.checked } : d))}
                className="accent-gold"
              />
              <span className="font-sans text-[0.82rem] text-parch/85">Masquée — retirée du journal public</span>
            </label>

            <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
              <AdminFormButton variant="primary" onClick={() => void save()} disabled={busy === "form"}>
                {busy === "form" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {draft.id ? "Enregistrer" : "Publier l'entrée"}
              </AdminFormButton>
              <AdminFormButton onClick={() => setDraft(null)}>Annuler</AdminFormButton>
            </div>
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel
        label="Journal des versions"
        count={entries.length}
        actions={
          draft ? null : <AdminIconButton icon={Plus} label="Nouvelle entrée" tone="active" onClick={startCreate} />
        }
      >
        {loading ? (
          <AdminTableSkeleton rows={5} columns={5} />
        ) : entries.length === 0 ? (
          <AdminEmpty icon={ScrollText} text="Aucune entrée — le journal public affiche la liste écrite en dur." />
        ) : (
          <AdminTable minWidth="46rem">
            <thead>
              <tr>
                <AdminTh width="5.5rem">Version</AdminTh>
                <AdminTh>Titre</AdminTh>
                <AdminTh width="8rem">Catégorie</AdminTh>
                <AdminTh width="9rem">Langues</AdminTh>
                <AdminTh width="6rem">Date</AdminTh>
                <AdminTh width="6.5rem">Statut</AdminTh>
                <AdminTh width="6rem" align="right">
                  Actions
                </AdminTh>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const langs = Object.keys(entry.translations);
                return (
                  <AdminTr key={entry.id} dimmed={entry.hidden}>
                    <AdminTd>
                      <span className="font-caps text-[0.78rem] text-gold">v{entry.version}</span>
                    </AdminTd>
                    <AdminTd>
                      <AdminIdentity
                        primary={entry.translations[defaultLocale]?.title ?? entry.translations[langs[0]]?.title ?? "—"}
                        secondary={`${entry.translations[defaultLocale]?.items.length ?? 0} point(s)`}
                      />
                    </AdminTd>
                    <AdminTd>
                      <AdminChip>{TYPE_LABELS[entry.type]}</AdminChip>
                    </AdminTd>
                    <AdminTd>
                      <span className="font-mono text-[0.68rem] text-muted">
                        {langs.length === locales.length ? `les ${langs.length}` : langs.join(" ")}
                      </span>
                    </AdminTd>
                    <AdminTd>
                      <span className="font-mono text-[0.7rem] text-muted-2">{formatDate(entry.date)}</span>
                    </AdminTd>
                    <AdminTd>
                      {entry.hidden ? (
                        <AdminStatus tone="neutral">Masquée</AdminStatus>
                      ) : (
                        <AdminStatus tone="ok">Publiée</AdminStatus>
                      )}
                    </AdminTd>
                    <AdminTd align="right">
                      <AdminActions>
                        <AdminIconButton icon={Pencil} label="Modifier l'entrée" onClick={() => startEdit(entry)} />
                        <AdminIconButton
                          icon={entry.hidden ? Eye : EyeOff}
                          label={entry.hidden ? "Republier" : "Masquer du journal"}
                          tone={entry.hidden ? "active" : "default"}
                          busy={busy === entry.id}
                          onClick={() => void toggleHidden(entry)}
                        />
                        <AdminActionsDivider />
                        <AdminIconButton
                          icon={Trash2}
                          label="Supprimer l'entrée"
                          tone="danger"
                          disabled={busy === entry.id}
                          onClick={() => void remove(entry)}
                        />
                      </AdminActions>
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </tbody>
          </AdminTable>
        )}
      </AdminPanel>
    </div>
  );
}
