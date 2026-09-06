"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DnaPanel } from "@/components/dna/Panel";
import { typeConfig } from "@/lib/changelogConfig";
import type { ChangelogPublicEntry } from "@/lib/changelog/types";

/**
 * Rend les passages `**en gras**` d'une entrée.
 *
 * Les textes du changelog portent ce balisage depuis le début. On ne traite que
 * le gras : faire passer des textes de traduction par un moteur Markdown
 * complet ouvrirait la porte à de l'HTML arbitraire.
 */
export function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={index} className="font-medium text-parch">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

/**
 * Une entrée du journal.
 *
 * `id` porte le numéro de version : c'est l'ancre vers laquelle le sélecteur de
 * saut rapide fait défiler, et elle rend les versions partageables par URL.
 */
export function ChangelogEntryCard({ entry }: { entry: ChangelogPublicEntry }) {
  const t = useTranslations("changelog");
  const locale = useLocale();
  const config = typeConfig[entry.type];
  const Icon = config.icon;

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(
        new Date(`${entry.date}T12:00:00Z`),
      ),
    [locale, entry.date],
  );

  return (
    // L'ancre porte le numero de version : c'est la cible du saut rapide, et
    // elle rend chaque version partageable par URL (#v2.4.0).
    <section id={`v${entry.version}`} className="scroll-mt-24">
    <DnaPanel className={`p-6 transition-colors hover:border-gold/40 ${config.borderColor}`}>
      <div className="mb-4 flex items-start gap-4">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center border ${config.borderColor} ${config.bgColor} text-parch`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl text-parch">{entry.title}</h2>
            <span
              className={`rounded-sm border px-2.5 py-0.5 font-caps text-[0.56rem] uppercase tracking-[0.16em] ${config.borderColor} ${config.bgColor} text-parch`}
            >
              {t(`types.${entry.type}`)}
            </span>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="font-caps font-semibold text-gold">v{entry.version}</span>
            <span aria-hidden>•</span>
            <time dateTime={entry.date}>{dateLabel}</time>
            {/* Une entrée non traduite s'affiche dans sa langue d'origine plutôt
                que de disparaître : autant le dire au lecteur. */}
            {entry.locale !== locale ? (
              <span className="font-mono text-[0.66rem] uppercase text-muted-2">{entry.locale}</span>
            ) : null}
          </div>
          {entry.description ? <p className="leading-relaxed text-parch/85">{entry.description}</p> : null}
        </div>
      </div>

      {entry.items.length > 0 ? (
        <div className="ml-16 space-y-2">
          {entry.items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 text-parch/85">
              <span aria-hidden className="mt-1 shrink-0 text-gold">
                ◇
              </span>
              <span className="leading-relaxed">{renderBold(item)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </DnaPanel>
    </section>
  );
}
