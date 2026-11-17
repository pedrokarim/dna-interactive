"use client";

import { useLocale, useTranslations } from "next-intl";
import { changelogData } from "@/lib/changelogData";
import { ChangelogEntryCard } from "./ChangelogEntryCard";
import type { ChangelogPublicEntry } from "@/lib/changelog/types";

/**
 * Repli : le journal d'avant le passage en base, lu dans les fichiers de messages.
 *
 * Ne sert que si la table `changelog_entries` n'existe pas (migration pas encore
 * passée sur l'environnement), sinon la page serait vide. Pas de défilement
 * infini ni de sélecteur : la liste est figée et ce chemin est temporaire.
 */
export function ChangelogLegacyFeed() {
  const tEntries = useTranslations("changelogEntries");
  const locale = useLocale();

  const entries: ChangelogPublicEntry[] = changelogData.map((entry) => ({
    version: entry.version,
    date: entry.date,
    type: entry.type,
    title: tEntries(`${entry.key}.title`),
    description: tEntries(`${entry.key}.description`),
    items: tEntries.raw(`${entry.key}.items`) as string[],
    locale,
  }));

  return (
    <div className="space-y-6">
      {entries.map((entry) => (
        <ChangelogEntryCard key={entry.version} entry={entry} />
      ))}
    </div>
  );
}
