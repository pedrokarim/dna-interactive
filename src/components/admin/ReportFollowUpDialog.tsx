"use client";

import { useState } from "react";
import { DnaDialog } from "@/components/dna/Dialog";
import { DnaSegmented } from "@/components/dna/Segmented";
import { locales, type Locale } from "@/i18n/config";
import { AdminFormButton } from "./ui";

export type ReportDecision = { status: "resolved" | "dismissed"; notifyLocale: Locale | null };

type Props = {
  report: { buildTitle: string; reporterName: string | null; reporterHasEmail: boolean } | null;
  status: "resolved" | "dismissed";
  /** Fermer sans choisir annule toute l'action : le signalement reste tel quel. */
  onCancel: () => void;
  onDecide: (decision: ReportDecision) => void;
};

const LOCALE_OPTIONS = locales.map((locale) => ({ value: locale, label: locale.toUpperCase() }));

/**
 * Avant de clore un signalement, demande s'il faut prévenir par mail la
 * personne qui l'a fait. Le mail reprend la suite donnée (modéré ou maintenu).
 */
export function ReportFollowUpDialog({ report, status, onCancel, onDecide }: Props) {
  // Les signalements arrivent de toutes les langues : l'anglais est le choix le plus sûr.
  const [locale, setLocale] = useState<Locale>("en");
  const reporter = report?.reporterName ?? "la personne qui a signalé";

  return (
    <DnaDialog
      open={report !== null}
      onClose={onCancel}
      title={status === "resolved" ? "Marquer le signalement comme résolu" : "Rejeter le signalement"}
      danger={status === "dismissed"}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <AdminFormButton onClick={() => onDecide({ status, notifyLocale: null })}>Ne pas envoyer le mail</AdminFormButton>
          <AdminFormButton
            variant="primary"
            disabled={!report?.reporterHasEmail}
            onClick={() => onDecide({ status, notifyLocale: locale })}
          >
            Envoyer le mail
          </AdminFormButton>
        </div>
      }
    >
      {report ? (
        <div className="min-w-0 space-y-4 break-words text-sm text-body">
          <p className="text-muted">
            Build « <span className="text-parch">{report.buildTitle}</span> », signalé par{" "}
            <span className="text-parch">{report.reporterName ?? "—"}</span>.
          </p>
          <p className="text-parch">
            Voulez-vous envoyer un mail à {reporter} pour l’informer du suivi du signalement&nbsp;?
          </p>
          <p className="text-muted">
            {status === "resolved"
              ? "Le mail remercie pour le signalement et indique que le build a été modéré."
              : "Le mail remercie pour le signalement et indique que le build a été examiné et reste en ligne."}
          </p>
          {report.reporterHasEmail ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-caps text-[0.68rem] uppercase tracking-[0.16em] text-gold">Langue du mail</span>
              <DnaSegmented options={LOCALE_OPTIONS} value={locale} onChange={setLocale} ariaLabel="Langue du mail" />
            </div>
          ) : (
            <p className="text-muted">Ce compte n’a pas d’adresse e-mail&nbsp;: aucun mail ne peut lui être envoyé.</p>
          )}
        </div>
      ) : null}
    </DnaDialog>
  );
}
