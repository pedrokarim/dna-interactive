"use client";

import { useCallback, useEffect, useState } from "react";
import { Drama, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn, useConfirm } from "@/components/dna";
import { rotationStatus, theatreOverview, type TheatreFeaturedKind } from "@/lib/theatre/rotations";
import type { TheatreRotationView } from "@/lib/theatre/featured";
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

type RotationRow = TheatreRotationView & { hidden: boolean };

type FormState = {
  id?: string;
  featuredKind: TheatreFeaturedKind;
  featuredId: string;
  startsAt: string;
  endsAt: string;
  note: string;
  sourceUrl: string;
  hidden: boolean;
};

const EMPTY_FORM: FormState = {
  featuredKind: "character",
  featuredId: "",
  startsAt: "",
  endsAt: "",
  note: "",
  sourceUrl: "",
  hidden: false,
};

const KIND_LABEL: Record<TheatreFeaturedKind, string> = { character: "Personnage", weapon: "Arme de calamité" };

/*
 * Le jeu annonce toutes ses bascules en heure serveur (UTC+8). On saisit et on
 * lit donc dans ce fuseau, quel que soit celui du poste : recopier une annonce
 * ne doit demander aucun calcul.
 */
const SERVER_OFFSET_MS = 8 * 3_600_000;

function toServerInput(iso: string): string {
  return new Date(Date.parse(iso) + SERVER_OFFSET_MS).toISOString().slice(0, 16);
}

function fromServerInput(value: string): string {
  return new Date(`${value}:00+08:00`).toISOString();
}

function formatServerTime(iso: string): string {
  return toServerInput(iso).replace("T", " ");
}

/**
 * Administration des rotations du théâtre immersif.
 *
 * Même partage que le calendrier : une liste dense où chaque action tient dans
 * une icône, et un formulaire où les libellés restent écrits.
 */
export function TheatreAdminClient() {
  const { confirm } = useConfirm();
  const [rotations, setRotations] = useState<RotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Lu une fois au montage : assez pour dire laquelle est en cours.
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/theatre-rotations");
      const json = await res.json();
      setRotations(Array.isArray(json.rotations) ? json.rotations : []);
      setMigrationPending(Boolean(json.migrationPending));
    } catch {
      setRotations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => {
    setError(null);
    // Une nouvelle rotation commence le plus souvent où finit la dernière.
    const last = rotations[rotations.length - 1];
    setForm({ ...EMPTY_FORM, startsAt: last ? toServerInput(last.endsAt) : "" });
  };

  const startEdit = (rotation: RotationRow) => {
    setError(null);
    setForm({
      id: rotation.id,
      featuredKind: rotation.featured.kind,
      featuredId: rotation.featured.id,
      startsAt: toServerInput(rotation.startsAt),
      endsAt: toServerInput(rotation.endsAt),
      note: rotation.note ?? "",
      sourceUrl: rotation.sourceUrl ?? "",
      hidden: rotation.hidden,
    });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    const payload = {
      ...(form.id ? { id: form.id } : {}),
      featuredKind: form.featuredKind,
      featuredId: form.featuredId.trim(),
      startsAt: fromServerInput(form.startsAt),
      endsAt: fromServerInput(form.endsAt),
      note: form.note.trim() || null,
      sourceUrl: form.sourceUrl.trim() || null,
      hidden: form.hidden,
    };
    try {
      const res = await fetch("/api/admin/theatre-rotations", {
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

  const remove = async (rotation: RotationRow) => {
    const ok = await confirm({
      title: "Supprimer la rotation",
      message: `La rotation « ${rotation.featuredView.name} » sera définitivement supprimée du suivi du théâtre.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    await fetch("/api/admin/theatre-rotations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rotation.id }),
    });
    await load();
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  const visible = rotations.filter((r) => !r.hidden);
  const overview = theatreOverview(visible, now);
  // La plus récente en tête : c'est elle qu'on vient consulter ou corriger.
  const listed = [...rotations].reverse();

  return (
    <div className="flex flex-col gap-4">
      {migrationPending ? (
        <p className="border border-crimson-bright/40 bg-crimson/10 px-3 py-2 font-sans text-[0.8rem] text-crimson-soft">
          Table <code className="font-mono">theatre_rotations</code> absente. Crée-la avec{" "}
          <code className="font-mono">node scripts/migrate-theatre.mjs --env …</code>, puis recharge. En attendant, le
          suivi public affiche la liste livrée avec le site.
        </p>
      ) : null}

      {!loading && rotations.length > 0 ? (
        <AdminPanel label="Où en est le théâtre">
          <dl className="grid gap-3 p-3 sm:grid-cols-3">
            {(
              [
                ["Précédente", overview.previous],
                ["En cours", overview.current],
                ["Prochaine", overview.next],
              ] as const
            ).map(([label, rotation]) => (
              <div key={label}>
                <dt className={adminLabelClass}>{label}</dt>
                <dd className="font-sans text-[0.86rem] text-parch">
                  {rotation ? (
                    <>
                      {rotation.featuredView.name}
                      <span className="mt-0.5 block font-mono text-[0.68rem] text-muted tabular-nums">
                        {formatServerTime(rotation.startsAt)} → {formatServerTime(rotation.endsAt)}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-2">{label === "Prochaine" ? "Non annoncée" : "Aucune"}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </AdminPanel>
      ) : null}

      {form ? (
        <AdminPanel
          label={form.id ? "Modifier la rotation" : "Nouvelle rotation"}
          className={FORM_MAX_WIDTH}
          actions={<AdminIconButton icon={X} label="Fermer le formulaire" onClick={() => setForm(null)} />}
        >
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            <div>
              <label className={adminLabelClass} htmlFor="theatre-kind">
                En vedette
              </label>
              <select
                id="theatre-kind"
                className={cn(adminInputClass, FIELD_WIDTH.short)}
                value={form.featuredKind}
                onChange={(e) => set("featuredKind", e.target.value as TheatreFeaturedKind)}
              >
                {(Object.keys(KIND_LABEL) as TheatreFeaturedKind[]).map((kind) => (
                  <option key={kind} value={kind} className="bg-admin-surface">
                    {KIND_LABEL[kind]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={adminLabelClass} htmlFor="theatre-featured">
                Identifiant de la fiche
              </label>
              <input
                id="theatre-featured"
                className={cn(adminInputClass, FIELD_WIDTH.short)}
                value={form.featuredId}
                onChange={(e) => set("featuredId", e.target.value)}
                placeholder={form.featuredKind === "character" ? "falsi ou char-falu" : "weapons-20298"}
              />
            </div>

            <div>
              <label className={adminLabelClass} htmlFor="theatre-start">
                Début (heure serveur, UTC+8)
              </label>
              <input
                id="theatre-start"
                type="datetime-local"
                className={cn(adminInputClass, FIELD_WIDTH.datetime)}
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </div>

            <div>
              <label className={adminLabelClass} htmlFor="theatre-end">
                Bascule (heure serveur, UTC+8)
              </label>
              <input
                id="theatre-end"
                type="datetime-local"
                className={cn(adminInputClass, FIELD_WIDTH.datetime)}
                value={form.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={adminLabelClass} htmlFor="theatre-note">
                Note affichée sous la rotation
              </label>
              <textarea
                id="theatre-note"
                className={cn(adminInputClass, FIELD_WIDTH.text, "min-h-16 resize-y")}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={adminLabelClass} htmlFor="theatre-source">
                Annonce officielle
              </label>
              <input
                id="theatre-source"
                className={cn(adminInputClass, FIELD_WIDTH.long)}
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
              <span className="font-sans text-[0.82rem] text-parch/85">Masquée – retirée du suivi public</span>
            </label>

            {error ? <p className="sm:col-span-2 font-sans text-[0.8rem] text-crimson-soft">{error}</p> : null}

            <div className="flex items-center gap-2 sm:col-span-2">
              <AdminFormButton
                variant="primary"
                onClick={() => void save()}
                disabled={saving || !form.featuredId.trim() || !form.startsAt || !form.endsAt}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </AdminFormButton>
              <AdminFormButton onClick={() => setForm(null)}>Annuler</AdminFormButton>
            </div>
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel
        label="Rotations"
        count={rotations.length}
        actions={<AdminIconButton icon={Plus} label="Ajouter une rotation" tone="active" onClick={startCreate} />}
      >
        {loading ? (
          <AdminTableSkeleton rows={6} columns={5} />
        ) : rotations.length === 0 ? (
          <AdminEmpty icon={Drama} text="Aucune rotation en base – le suivi public utilise la liste livrée avec le site." />
        ) : (
          <AdminTable minWidth="46rem">
            <thead>
              <tr>
                <AdminTh width="3.5rem" />
                <AdminTh>En vedette</AdminTh>
                <AdminTh width="9.5rem">Nature</AdminTh>
                <AdminTh width="17rem">Période (UTC+8)</AdminTh>
                <AdminTh width="7rem">Statut</AdminTh>
                <AdminTh width="5.5rem" align="right">
                  Actions
                </AdminTh>
              </tr>
            </thead>
            <tbody>
              {listed.map((rotation) => {
                const status = rotationStatus(rotation, now);
                return (
                  <AdminTr key={rotation.id} dimmed={rotation.hidden}>
                    <AdminTd>
                      {rotation.featuredView.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rotation.featuredView.icon}
                          alt=""
                          className="h-8 w-8 shrink-0 border border-white/12 object-cover"
                        />
                      ) : (
                        <span aria-hidden className="block h-8 w-8 border border-white/8 bg-white/[0.02]" />
                      )}
                    </AdminTd>
                    <AdminTd>
                      <AdminIdentity
                        primary={rotation.featuredView.name}
                        secondary={
                          rotation.featuredView.known
                            ? rotation.seasonId
                              ? `Saison ${rotation.seasonId}`
                              : "Saisie à la main"
                            : "Identifiant inconnu : aucune fiche ne correspond"
                        }
                      />
                    </AdminTd>
                    <AdminTd>
                      <AdminChip tone={rotation.featured.kind === "weapon" ? "danger" : "neutral"}>
                        {KIND_LABEL[rotation.featured.kind]}
                      </AdminChip>
                    </AdminTd>
                    <AdminTd>
                      <span className="font-mono text-[0.7rem] text-muted tabular-nums">
                        {formatServerTime(rotation.startsAt)} → {formatServerTime(rotation.endsAt)}
                      </span>
                    </AdminTd>
                    <AdminTd>
                      {rotation.hidden ? (
                        <AdminStatus tone="neutral">Masquée</AdminStatus>
                      ) : status === "current" ? (
                        <AdminStatus tone="ok">En cours</AdminStatus>
                      ) : status === "upcoming" ? (
                        <AdminStatus tone="info">À venir</AdminStatus>
                      ) : (
                        <AdminStatus tone="neutral">Terminée</AdminStatus>
                      )}
                    </AdminTd>
                    <AdminTd align="right">
                      <AdminActions>
                        <AdminIconButton icon={Pencil} label="Modifier la rotation" onClick={() => startEdit(rotation)} />
                        <AdminActionsDivider />
                        <AdminIconButton
                          icon={Trash2}
                          label="Supprimer la rotation"
                          tone="danger"
                          onClick={() => void remove(rotation)}
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
