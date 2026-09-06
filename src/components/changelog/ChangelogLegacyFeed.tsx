"use client";

import { useLocale, useTranslations } from "next-intl";
import { changelogData } from "@/lib/changelogData";
import { ChangelogEntryCard } from "./ChangelogEntryCard";
import type { ChangelogPublicEntry } from "@/lib/changelog/types";

/**
 * Secours : le journal tel qu'il existait avant la bascule en base.
 *
 * Ne sert que si la table `changelog_entries` est absente — sur un
 * environnement où la migration n'a pas encore été appliquée, par exemple. Sans
 * lui, la page afficherait un journal vide alors que le contenu existe dans les
 * fichiers de messages.
 *
 * Il n'y a ni défilement infini ni sélecteur ici : la liste est finie et figée,
 * et ce chemin n'a pas vocation à durer.
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
