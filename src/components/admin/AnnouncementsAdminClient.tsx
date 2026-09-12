"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, Loader2, Mail, Megaphone, Pencil, Pin, Plus, Send, Trash2, X } from "lucide-react";
import { cn, useConfirm } from "@/components/dna";
import { ANNOUNCEMENT_AUDIENCES, ANNOUNCEMENT_KINDS, KIND_LABELS } from "@/lib/notifications/types";
import type { AnnouncementAudience, AnnouncementKind } from "@/lib/notifications/types";
import {
  FIELD_WIDTH,
  FORM_MAX_WIDTH,
  type FieldWidth,
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

type Announcement = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  image: string | null;
  kind: AnnouncementKind;
  audience: AnnouncementAudience;
  status: "draft" | "published";
  pinned: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  pushSentAt: string | null;
  emailSentAt: string | null;
  pushDeliveredCount: number;
  emailDeliveredCount: number;
  createdAt: string;
};

type Channels = {
  push: { configured: boolean; subscribers: number };
  email: { configured: boolean };
};

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  everyone: "Tout le monde",
  authenticated: "Connectés",
  admins: "Équipe",
};

const EMPTY_DRAFT = {
  title: "",
  body: "",
  href: "",
  image: "",
  kind: "info" as AnnouncementKind,
  audience: "everyone" as AnnouncementAudience,
  pinned: false,
  publishedAt: "",
  expiresAt: "",
};

type Draft = typeof EMPTY_DRAFT;

/** `datetime-local` ne comprend que « AAAA-MM-JJTHH:MM » en heure locale. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

/**
 * Back-office des annonces.
 *
 * Le cycle est volontairement en deux temps : on **publie** (l'annonce apparaît
 * dans la cloche de tout le monde, réversible), puis on **diffuse** sur les
 * canaux sortants (push, email – irréversible). Confondre les deux, c'est
 * envoyer un email à toute la base en corrigeant une faute de frappe.
 */
export function AnnouncementsAdminClient() {
  const { confirm } = useConfirm();
  const [items, setItems] = useState<Announcement[]>([]);
  const [channels, setChannels] = useState<Channels | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/announcements");
      const data = await response.json();
      setItems(Array.isArray(data.announcements) ? data.announcements : []);
      setChannels(data.channels ?? null);
    } catch {
      setMessage({ tone: "error", text: "Chargement des annonces impossible." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setFormOpen(false);
  };

  const startEdit = (item: Announcement) => {
    setDraft({
      title: item.title,
      body: item.body ?? "",
      href: item.href ?? "",
      image: item.image ?? "",
      kind: item.kind,
      audience: item.audience,
      pinned: item.pinned,
      publishedAt: toLocalInput(item.publishedAt),
      expiresAt: toLocalInput(item.expiresAt),
    });
    setEditingId(item.id);
    setFormOpen(true);
  };

  const submit = async (status: "draft" | "published") => {
    if (!draft.title.trim()) {
      setMessage({ tone: "error", text: "Un titre est requis." });
      return;
    }
    setBusy("form");
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      title: draft.title.trim(),
      body: draft.body.trim() || null,
      href: draft.href.trim() || null,
      image: draft.image.trim() || null,
      kind: draft.kind,
      audience: draft.audience,
      pinned: draft.pinned,
      status,
      publishedAt: fromLocalInput(draft.publishedAt),
      expiresAt: fromLocalInput(draft.expiresAt),
    };
    const response = await fetch("/api/admin/announcements", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    setBusy(null);
    if (!response?.ok) {
      const error = await response?.json().catch(() => null);
      setMessage({ tone: "error", text: error?.error ?? "Enregistrement impossible." });
      return;
    }
    setMessage({ tone: "ok", text: status === "published" ? "Annonce publiée." : "Brouillon enregistré." });
    resetForm();
    await load();
  };

  const remove = async (item: Announcement) => {
    const ok = await confirm({
      title: "Supprimer l'annonce",
      message: `« ${item.title} » disparaîtra du fil de tout le monde. Les emails et push déjà envoyés, eux, ne reviennent pas.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    setBusy(item.id);
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    }).catch(() => null);
    setBusy(null);
    await load();
  };

  const dispatch = async (item: Announcement, wanted: Array<"push" | "email">) => {
    const already = wanted.filter((channel) => (channel === "push" ? item.pushSentAt : item.emailSentAt));
    const ok = await confirm({
      title: already.length > 0 ? "Renvoyer l'annonce" : "Diffuser l'annonce",
      message:
        `« ${item.title} » va partir sur ${wanted.join(" et ")}, à destination de ${AUDIENCE_LABELS[item.audience].toLowerCase()}.` +
        (already.length > 0 ? ` Attention : déjà diffusée sur ${already.join(", ")}.` : "") +
        " Cette action est irréversible.",
      confirmLabel: "Diffuser",
      cancelLabel: "Annuler",
      danger: already.length > 0,
    });
    if (!ok) return;

    setBusy(item.id);
    const response = await fetch("/api/admin/announcements/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, channels: wanted, force: already.length > 0 }),
    }).catch(() => null);
    setBusy(null);

    const data = await response?.json().catch(() => null);
    if (!response?.ok) {
      setMessage({ tone: "error", text: data?.error ?? "Diffusion impossible." });
      return;
    }
    const parts: string[] = [];
    if (data?.report?.push) {
      parts.push(`push : ${data.report.push.sent} envoyés, ${data.report.push.pruned} obsolètes purgés`);
    }
    if (data?.report?.email) {
      parts.push(`email : ${data.report.email.sent} envoyés, ${data.report.email.failed} échecs`);
    }
    setMessage({ tone: "ok", text: parts.join(" · ") || "Diffusion terminée." });
    await load();
  };

  const published = useMemo(() => items.filter((item) => item.status === "published"), [items]);
  const drafts = useMemo(() => items.filter((item) => item.status === "draft"), [items]);

  const rowProps = { busy, channels, onEdit: startEdit, onRemove: remove, onDispatch: dispatch };

  return (
    <div className="flex flex-col gap-4">
      {/* --------------------------------------------------- état des canaux */}
      <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
        <ChannelCell
          icon={BellRing}
          label="Push navigateur"
          ready={Boolean(channels?.push.configured)}
          detail={
            channels?.push.configured
              ? `${channels.push.subscribers} abonnement${channels.push.subscribers > 1 ? "s" : ""}`
              : "clés VAPID absentes"
          }
        />
        <ChannelCell
          icon={Mail}
          label="Email"
          ready={Boolean(channels?.email.configured)}
          detail={channels?.email.configured ? "comptes vérifiés, annonces actives" : "SMTP non configuré"}
        />
      </div>

      <div className="flex items-center gap-3">
        {message ? (
          <p className={cn("font-sans text-[0.8rem]", message.tone === "ok" ? "text-gold" : "text-crimson-soft")}>
            {message.text}
          </p>
        ) : null}
        {formOpen ? null : (
          <span className="ml-auto">
            <AdminIconButton icon={Plus} label="Nouvelle annonce" tone="active" onClick={() => setFormOpen(true)} />
          </span>
        )}
      </div>

      {/* --------------------------------------------------------- formulaire */}
      {formOpen ? (
        <AdminPanel
          label={editingId ? "Modifier l'annonce" : "Nouvelle annonce"}
          className={FORM_MAX_WIDTH}
          actions={<AdminIconButton icon={X} label="Fermer le formulaire" onClick={resetForm} />}
        >
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={adminLabelClass} htmlFor="ann-title">
                Titre
              </label>
              <input
                id="ann-title"
                className={cn(adminInputClass, FIELD_WIDTH.medium)}
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Falsi arrive avec la 1.6"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={adminLabelClass} htmlFor="ann-body">
                Message
              </label>
              <textarea
                id="ann-body"
                rows={4}
                className={cn(adminInputClass, FIELD_WIDTH.text, "resize-y")}
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                placeholder="Deux paragraphes au maximum. Ce texte part tel quel dans l'email et la notification système."
              />
            </div>

            <TextField
              id="ann-href"
              width="long"
              label="Lien (facultatif)"
              value={draft.href}
              onChange={(v) => setDraft((d) => ({ ...d, href: v }))}
              placeholder="/characters/falsi"
            />
            <TextField
              id="ann-image"
              width="long"
              label="Image (facultatif)"
              value={draft.image}
              onChange={(v) => setDraft((d) => ({ ...d, image: v }))}
              placeholder="/assets/…"
            />

            <SelectField
              id="ann-kind"
              width="short"
              label="Catégorie"
              value={draft.kind}
              onChange={(v) => setDraft((d) => ({ ...d, kind: v as AnnouncementKind }))}
              options={ANNOUNCEMENT_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
            />
            <SelectField
              id="ann-audience"
              width="short"
              label="Audience"
              value={draft.audience}
              onChange={(v) => setDraft((d) => ({ ...d, audience: v as AnnouncementAudience }))}
              options={ANNOUNCEMENT_AUDIENCES.map((a) => ({ value: a, label: AUDIENCE_LABELS[a] }))}
            />

            <DateField
              id="ann-published"
              label="Publication (vide = maintenant)"
              value={draft.publishedAt}
              onChange={(v) => setDraft((d) => ({ ...d, publishedAt: v }))}
            />
            <DateField
              id="ann-expires"
              label="Expiration (vide = jamais)"
              value={draft.expiresAt}
              onChange={(v) => setDraft((d) => ({ ...d, expiresAt: v }))}
            />

            <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={draft.pinned}
                onChange={(e) => setDraft((d) => ({ ...d, pinned: e.target.checked }))}
                className="accent-gold"
              />
              <span className="font-sans text-[0.82rem] text-parch/85">Épingler en tête de fil</span>
            </label>

            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <AdminFormButton variant="primary" onClick={() => void submit("published")} disabled={busy === "form"}>
                {busy === "form" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {editingId ? "Enregistrer et publier" : "Publier"}
              </AdminFormButton>
              <AdminFormButton onClick={() => void submit("draft")} disabled={busy === "form"}>
                Garder en brouillon
              </AdminFormButton>
              <span className="font-sans text-[0.72rem] text-muted-2">
                Publier rend visible dans la cloche. La diffusion push/email se déclenche ensuite, ligne par ligne.
              </span>
            </div>
          </div>
        </AdminPanel>
      ) : null}

      {/* ------------------------------------------------------------ listes */}
      <AdminPanel label="Publiées" count={published.length}>
        {loading ? <AdminTableSkeleton rows={3} columns={6} /> : <AnnouncementTable items={published} {...rowProps} />}
      </AdminPanel>

      <AdminPanel label="Brouillons" count={drafts.length}>
        {loading ? <AdminTableSkeleton rows={2} columns={6} /> : <AnnouncementTable items={drafts} {...rowProps} />}
      </AdminPanel>
    </div>
  );
}

function AnnouncementTable({
  items,
  busy,
  channels,
  onEdit,
  onRemove,
  onDispatch,
}: {
  items: Announcement[];
  busy: string | null;
  channels: Channels | null;
  onEdit: (item: Announcement) => void;
  onRemove: (item: Announcement) => void;
  onDispatch: (item: Announcement, channels: Array<"push" | "email">) => void;
}) {
  if (items.length === 0) return <AdminEmpty icon={Megaphone} text="Aucune annonce." />;

  return (
    <AdminTable minWidth="54rem">
      <thead>
        <tr>
          <AdminTh>Annonce</AdminTh>
          <AdminTh width="7.5rem">Catégorie</AdminTh>
          <AdminTh width="8rem">Audience</AdminTh>
          <AdminTh width="9.5rem">Publication</AdminTh>
          <AdminTh width="10rem">Diffusion</AdminTh>
          <AdminTh width="12rem" align="right">
            Actions
          </AdminTh>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isDraft = item.status === "draft";
          return (
            <AdminTr key={item.id} dimmed={isDraft}>
              <AdminTd>
                <span className="flex min-w-0 items-start gap-1.5">
                  {item.pinned ? <Pin aria-label="Épinglée" className="mt-1 h-3 w-3 shrink-0 text-gold" /> : null}
                  <AdminIdentity primary={item.title} secondary={item.href ?? undefined} />
                </span>
              </AdminTd>
              <AdminTd>
                <AdminChip>{KIND_LABELS[item.kind]}</AdminChip>
              </AdminTd>
              <AdminTd>
                <AdminChip tone={item.audience === "everyone" ? "neutral" : "gold"}>
                  {AUDIENCE_LABELS[item.audience]}
                </AdminChip>
              </AdminTd>
              <AdminTd>
                <span className="flex flex-col">
                  <span className="font-mono text-[0.68rem] text-muted tabular-nums">
                    {isDraft ? "—" : formatDate(item.publishedAt)}
                  </span>
                  {item.expiresAt ? (
                    <span className="font-mono text-[0.62rem] text-muted-2 tabular-nums">
                      exp. {formatDate(item.expiresAt)}
                    </span>
                  ) : null}
                </span>
              </AdminTd>
              <AdminTd>
                <span className="flex flex-col gap-0.5">
                  {item.pushSentAt ? (
                    <AdminStatus tone="ok">push · {item.pushDeliveredCount}</AdminStatus>
                  ) : (
                    <AdminStatus tone="neutral">push non envoyé</AdminStatus>
                  )}
                  {item.emailSentAt ? (
                    <AdminStatus tone="ok">email · {item.emailDeliveredCount}</AdminStatus>
                  ) : (
                    <AdminStatus tone="neutral">email non envoyé</AdminStatus>
                  )}
                </span>
              </AdminTd>
              <AdminTd align="right">
                <AdminActions>
                  <AdminIconButton icon={Pencil} label="Modifier l'annonce" onClick={() => onEdit(item)} />
                  <AdminActionsDivider />
                  <AdminIconButton
                    icon={BellRing}
                    label={isDraft ? "Publier avant de diffuser" : "Diffuser en push navigateur"}
                    busy={busy === item.id}
                    disabled={isDraft || !channels?.push.configured}
                    onClick={() => onDispatch(item, ["push"])}
                  />
                  <AdminIconButton
                    icon={Mail}
                    label={isDraft ? "Publier avant de diffuser" : "Diffuser par email"}
                    busy={busy === item.id}
                    disabled={isDraft || !channels?.email.configured}
                    onClick={() => onDispatch(item, ["email"])}
                  />
                  <AdminIconButton
                    icon={Send}
                    label="Diffuser sur les deux canaux"
                    busy={busy === item.id}
                    disabled={isDraft || !channels?.push.configured || !channels?.email.configured}
                    onClick={() => onDispatch(item, ["push", "email"])}
                  />
                  <AdminActionsDivider />
                  <AdminIconButton
                    icon={Trash2}
                    label="Supprimer l'annonce"
                    tone="danger"
                    disabled={busy === item.id}
                    onClick={() => onRemove(item)}
                  />
                </AdminActions>
              </AdminTd>
            </AdminTr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}

function ChannelCell({
  icon: Icon,
  label,
  ready,
  detail,
}: {
  icon: typeof BellRing;
  label: string;
  ready: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-2.5 bg-admin-surface px-3.5 py-2.5">
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center border",
          ready ? "border-gold/40 bg-gold/10 text-gold-bright" : "border-white/12 bg-white/[0.02] text-muted-2",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-[0.8rem] text-parch">{label}</span>
        <span className="block truncate font-sans text-[0.7rem] text-muted-2">{detail}</span>
      </span>
      <span className="ml-auto shrink-0">
        {ready ? <AdminStatus tone="ok">prêt</AdminStatus> : <AdminStatus tone="neutral">inactif</AdminStatus>}
      </span>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  width = "medium",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  width?: FieldWidth;
}) {
  return (
    <div>
      <label className={adminLabelClass} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className={cn(adminInputClass, FIELD_WIDTH[width])}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  width = "short",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  width?: FieldWidth;
}) {
  return (
    <div>
      <label className={adminLabelClass} htmlFor={id}>
        {label}
      </label>
      <select id={id} className={cn(adminInputClass, FIELD_WIDTH[width])} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-admin-surface">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className={adminLabelClass} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="datetime-local"
        className={cn(adminInputClass, FIELD_WIDTH.datetime)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
