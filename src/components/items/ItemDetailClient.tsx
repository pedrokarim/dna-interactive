"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Database, Languages, Tag } from "lucide-react";
import {
  getItemTranslation,
  getLanguageLabel,
  normalizeLanguageCodes,
} from "@/lib/items/catalog";
import type { ItemCategory, ItemRawField, ItemRecord } from "@/lib/items/types";

type ItemDetailClientProps = {
  category: ItemCategory;
  item: ItemRecord;
};

function formatRawFieldValue(value: ItemRawField): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value === null) {
    return "null";
  }
  return `${value}`;
}

export default function ItemDetailClient({ category, item }: ItemDetailClientProps) {
  const preferredLanguage = normalizeLanguageCodes(
    [category.defaultDetailLanguage],
    category.availableLanguages,
    ["FR", "EN"],
  )[0];

  const [selectedLanguage, setSelectedLanguage] = useState<string>(preferredLanguage);

  const translation = useMemo(
    () => getItemTranslation(item, selectedLanguage, category.availableLanguages),
    [item, selectedLanguage, category.availableLanguages],
  );

  const iconSrc = item.icon.publicPath ?? item.icon.placeholderPath ?? "/marker-default.svg";
  const fieldEntries = Object.entries(item.fields).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-300/20 bg-slate-900/60 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/items/${category.slug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-amber-300/40 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Link>

          <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
            <Languages className="h-4 w-4 text-amber-300/80" />
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
              className="bg-transparent text-sm text-slate-100 outline-none"
            >
              {category.availableLanguages.map((code) => (
                <option key={code} value={code} className="bg-slate-900">
                  {getLanguageLabel(code)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl border border-amber-300/25 bg-slate-950/70 p-4">
            <img src={iconSrc} alt={`MOD ${item.modId}`} className="max-h-full max-w-full object-contain" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">
              {category.technicalName} #{item.modId}
            </p>
            <h1 className="text-3xl font-semibold text-white">
              {translation.modName ?? `Mod ${item.modId}`}
            </h1>
            <p className="text-sm text-slate-300">
              {translation.demonWedgeName
                ? `Demon Wedge ${translation.demonWedgeName}`
                : "No Demon Wedge translation for this language."}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                Rarity {item.stats.rarity ?? "?"}
              </span>
              <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                Polarity {item.stats.polarity ?? "?"}
              </span>
              <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                Max Level {item.stats.maxLevel ?? "?"}
              </span>
              <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
                Cost {item.stats.cost ?? "?"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {translation.description ?? "No description available in the selected language."}
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="text-lg font-semibold text-white">Localized Info</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Function label</dt>
              <dd className="text-slate-100">{translation.functionLabel ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Archive name</dt>
              <dd className="text-slate-100">{translation.archiveName ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Archive id</dt>
              <dd className="text-slate-100">{item.archiveId ?? "N/A"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Tag className="h-4 w-4 text-amber-300/80" />
            Text keys
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">modNameKey</dt>
              <dd className="text-slate-100">{item.textKeys.modNameKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">descriptionKey</dt>
              <dd className="text-slate-100">{item.textKeys.descriptionKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">demonWedgeKey</dt>
              <dd className="text-slate-100">{item.textKeys.demonWedgeKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">functionKey</dt>
              <dd className="text-slate-100">{item.textKeys.functionKey ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">archiveNameKey</dt>
              <dd className="text-slate-100">{item.textKeys.archiveNameKey ?? "N/A"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Database className="h-4 w-4 text-amber-300/80" />
            Technical
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">id</dt>
              <dd className="text-slate-100">{item.id}</dd>
            </div>
            <div>
              <dt className="text-slate-400">game icon path</dt>
              <dd className="break-all text-slate-100">{item.icon.gamePath ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">source asset</dt>
              <dd className="break-all text-slate-100">{item.icon.sourceAsset ?? "N/A"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">public icon path</dt>
              <dd className="break-all text-slate-100">{item.icon.publicPath ?? "N/A"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
        <h2 className="text-lg font-semibold text-white">Raw fields</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700 text-left text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="py-2 pr-4 font-medium">Field</th>
                <th className="py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {fieldEntries.map(([field, value]) => (
                <tr key={field}>
                  <td className="whitespace-nowrap py-2 pr-4 text-slate-300">{field}</td>
                  <td className="py-2 text-slate-100">{formatRawFieldValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
