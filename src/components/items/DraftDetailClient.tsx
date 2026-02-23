"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Clock3, ExternalLink, Languages } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { getLanguageLabel, normalizeLanguageCodes } from "@/lib/items/catalog";
import type { DraftItemReference, DraftRecipeRecord } from "@/lib/items/drafts";
import { resolveDraftItemDescription, resolveDraftItemName } from "@/lib/items/drafts";

type DraftDetailClientProps = {
  recipe: DraftRecipeRecord;
  availableLanguages: string[];
};

function formatDuration(seconds: number | null): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return "N/A";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatInteger(value: number): string {
  return Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function slotPositionsForIngredients(count: number): number[] {
  if (count <= 1) {
    return [1];
  }
  if (count === 2) {
    return [1, 2];
  }
  if (count === 3) {
    return [0, 1, 2];
  }
  return [0, 1, 2, 3];
}

function metadataString(item: DraftItemReference, key: string): string | null {
  const value = item.metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function metadataNumber(item: DraftItemReference, key: string): number | null {
  const value = item.metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sourceCategoryLabel(sourceCategory: DraftItemReference["sourceCategory"]): string {
  if (sourceCategory === "mods") {
    return "Demon Wedge";
  }
  if (sourceCategory === "resources") {
    return "Ressource";
  }
  if (sourceCategory === "weapons") {
    return "Arme";
  }
  if (sourceCategory === "char-accessories") {
    return "Accessoire";
  }
  return "Inconnu";
}

function nodeAccentClasses(sourceCategory: DraftItemReference["sourceCategory"]): string {
  if (sourceCategory === "mods") {
    return "border-cyan-500/40 bg-cyan-500/10 text-cyan-100";
  }
  if (sourceCategory === "weapons") {
    return "border-rose-500/40 bg-rose-500/10 text-rose-100";
  }
  if (sourceCategory === "resources") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
  }
  if (sourceCategory === "char-accessories") {
    return "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-100";
  }
  return "border-slate-600/80 bg-slate-700/20 text-slate-100";
}

type RecipeNodeProps = {
  item: DraftItemReference;
  selectedLanguage: string;
  fallbackLanguages: string[];
  primary?: boolean;
};

function RecipeNode({ item, selectedLanguage, fallbackLanguages, primary = false }: RecipeNodeProps) {
  const iconSrc = item.icon.publicPath ?? item.icon.placeholderPath ?? "/marker-default.svg";
  const name = resolveDraftItemName(item, selectedLanguage, fallbackLanguages);
  const description = resolveDraftItemDescription(item, selectedLanguage, fallbackLanguages);
  const classLabel = metadataString(item, "classLabelEn");
  const subtypeLabel = metadataString(item, "subtypeLabelEn");
  const classIcon = metadataString(item, "classIconPublicPath");
  const subtypeIcon = metadataString(item, "subtypeIconPublicPath");

  const nodeBody = (
    <div
      className={`relative rounded-lg border ${
        primary ? "border-amber-400/55 bg-amber-500/10" : "border-slate-700/80 bg-slate-950/80"
      } p-2 shadow-[0_6px_18px_rgba(2,6,23,0.35)] transition-colors group-hover:border-amber-400/65`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-700/80 bg-slate-900/80 p-2">
        <img src={iconSrc} alt={name} className="max-h-full max-w-full object-contain" />
      </div>
      <span className="absolute bottom-1 right-1 rounded bg-slate-900/95 px-1.5 py-0.5 text-[11px] font-medium text-amber-100">
        x{item.quantity}
      </span>
    </div>
  );

  return (
    <div className="group relative">
      {item.href ? (
        <Link
          href={item.href}
          className="block"
          onClick={(event) => event.stopPropagation()}
          aria-label={`Ouvrir la fiche ${name}`}
        >
          {nodeBody}
        </Link>
      ) : (
        nodeBody
      )}

      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-72 -translate-x-1/2 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-sm shadow-[0_20px_40px_rgba(2,6,23,0.65)] group-hover:block">
        <p className="font-medium text-slate-100">{name}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <span className={`rounded-full border px-2 py-0.5 ${nodeAccentClasses(item.sourceCategory)}`}>
            {sourceCategoryLabel(item.sourceCategory)}
          </span>
          <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-200">
            {item.type}
          </span>
          {typeof item.rarity === "number" ? (
            <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-200">
              Rarete {item.rarity}
            </span>
          ) : null}
        </div>

        {classLabel || subtypeLabel ? (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
            {classLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5">
                {classIcon ? <img src={classIcon} alt={classLabel} className="h-3.5 w-3.5 object-contain" /> : null}
                {classLabel}
              </span>
            ) : null}
            {subtypeLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5">
                {subtypeIcon ? (
                  <img src={subtypeIcon} alt={subtypeLabel} className="h-3.5 w-3.5 object-contain" />
                ) : null}
                {subtypeLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        {description ? (
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{description}</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">Description indisponible.</p>
        )}

      </div>
    </div>
  );
}

export default function DraftDetailClient({ recipe, availableLanguages }: DraftDetailClientProps) {
  const preferredLanguage = normalizeLanguageCodes(["FR"], availableLanguages, ["FR", "EN"])[0];
  const selectedLanguageParser = useMemo(
    () =>
      parseAsStringLiteral(availableLanguages)
        .withDefault(preferredLanguage)
        .withOptions({ clearOnDefault: false }),
    [availableLanguages, preferredLanguage],
  );
  const [selectedLanguage, setSelectedLanguage] = useQueryState("lang", selectedLanguageParser);

  const productName = resolveDraftItemName(recipe.product, selectedLanguage, availableLanguages);
  const productDescription = resolveDraftItemDescription(recipe.product, selectedLanguage, availableLanguages);
  const productIcon = recipe.product.icon.publicPath ?? recipe.product.icon.placeholderPath ?? "/marker-default.svg";
  const recipeIcon = recipe.icon.publicPath ?? recipe.icon.placeholderPath ?? productIcon;
  const classLabel = metadataString(recipe.product, "classLabelEn");
  const subtypeLabel = metadataString(recipe.product, "subtypeLabelEn");
  const classIcon = metadataString(recipe.product, "classIconPublicPath");
  const subtypeIcon = metadataString(recipe.product, "subtypeIconPublicPath");
  const weaponMaxLevel = metadataNumber(recipe.product, "weaponMaxLevel");
  const weaponValue = metadataNumber(recipe.product, "weaponValue");
  const collectRewardExp = metadataNumber(recipe.product, "collectRewardExp");

  const ingredientSlots = Array.from({ length: 4 }, () => null as DraftItemReference | null);
  const positions = slotPositionsForIngredients(recipe.ingredients.length);
  recipe.ingredients.slice(0, 4).forEach((ingredient, index) => {
    const slot = positions[index] ?? index;
    ingredientSlots[slot] = ingredient;
  });

  const coinCostEntries = Object.entries(recipe.crafting.foundryCostByCoinType).sort(
    ([a], [b]) => Number(a) - Number(b),
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/items/drafts"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600/80 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-amber-400/40 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux plans
            </Link>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2">
            <Languages className="h-4 w-4 text-amber-300/90" />
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
              className="bg-transparent text-sm text-slate-100 outline-none"
            >
              {availableLanguages.map((code) => (
                <option key={code} value={code} className="bg-slate-900">
                  {getLanguageLabel(code)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
            DRAFT #{recipe.draftId}
          </span>
          <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
            Produit {recipe.product.type} x{recipe.productQuantity}
          </span>
          {typeof recipe.product.rarity === "number" ? (
            <span className="rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
              Rarete {recipe.product.rarity}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/80 px-3 py-1 text-slate-300">
            <Clock3 className="h-3.5 w-3.5 text-amber-300/90" />
            {formatDuration(recipe.crafting.durationSec)}
          </span>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-2xl border border-amber-500/30 bg-[radial-gradient(circle_at_50%_22%,rgba(245,158,11,0.16),rgba(15,23,42,0.72)_52%,rgba(2,6,23,0.92)_100%)] p-6">
          <h2 className="text-lg font-semibold text-white">Procede de forge</h2>
          <p className="mt-1 text-sm text-slate-300">Survole un node pour voir nom, description et lien vers la fiche.</p>

          <div className="mt-8">
            <div className="flex justify-center">
              <RecipeNode
                item={recipe.product}
                selectedLanguage={selectedLanguage}
                fallbackLanguages={availableLanguages}
                primary
              />
            </div>

            <div className="mx-auto mt-2 h-7 w-px bg-amber-200/35" />

            <div className="relative mx-auto mt-1 max-w-4xl">
              <div className="absolute left-[12.5%] right-[12.5%] top-0 h-px bg-amber-200/35" />
              <div className="grid grid-cols-4 gap-3 pt-3">
                {ingredientSlots.map((ingredient, index) => (
                  <div key={`slot-${index}`} className="relative flex justify-center">
                    <div className="absolute -top-3 h-3 w-px bg-amber-200/35" />
                    {ingredient ? (
                      <RecipeNode
                        item={ingredient}
                        selectedLanguage={selectedLanguage}
                        fallbackLanguages={availableLanguages}
                      />
                    ) : (
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/55 p-2">
                        <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-800 bg-slate-900/50 text-slate-600">
                          -
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-700/70 bg-slate-900/65 p-5">
          <div className="rounded-xl border border-amber-500/30 bg-slate-950/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-amber-500/30 bg-slate-950/80 p-2">
                <img src={recipeIcon} alt={productName} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-300/90">Resultat</p>
                <h1 className="mt-1 text-xl font-semibold text-white">{productName}</h1>
                <p className="text-xs text-slate-400">
                  {recipe.product.type} x{recipe.productQuantity}
                </p>
              </div>
            </div>

            {classLabel || subtypeLabel ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {classLabel ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-2.5 py-1 text-slate-200">
                    {classIcon ? <img src={classIcon} alt={classLabel} className="h-3.5 w-3.5 object-contain" /> : null}
                    {classLabel}
                  </span>
                ) : null}
                {subtypeLabel ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-2.5 py-1 text-slate-200">
                    {subtypeIcon ? (
                      <img src={subtypeIcon} alt={subtypeLabel} className="h-3.5 w-3.5 object-contain" />
                    ) : null}
                    {subtypeLabel}
                  </span>
                ) : null}
              </div>
            ) : null}

            {productDescription ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{productDescription}</p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Description indisponible.</p>
            )}
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">Synthese forge</h2>
              <dl className="mt-2 space-y-1.5 text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <dt>Temps</dt>
                  <dd>{formatDuration(recipe.crafting.durationSec)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Type produit</dt>
                  <dd>{recipe.productType}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Ingredients</dt>
                  <dd>{recipe.ingredients.length}</dd>
                </div>
                {typeof recipe.product.rarity === "number" ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt>Rarete</dt>
                    <dd>{recipe.product.rarity}</dd>
                  </div>
                ) : null}
                {typeof weaponMaxLevel === "number" ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt>Niveau max arme</dt>
                    <dd>{weaponMaxLevel}</dd>
                  </div>
                ) : null}
                {typeof weaponValue === "number" ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt>Valeur arme</dt>
                    <dd>{formatInteger(weaponValue)}</dd>
                  </div>
                ) : null}
                {typeof collectRewardExp === "number" ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt>EXP recompense</dt>
                    <dd>{formatInteger(collectRewardExp)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="rounded-lg border border-slate-700/70 bg-slate-950/60 p-3">
              <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">Cout de forge</h2>
              {coinCostEntries.length > 0 ? (
                <dl className="mt-2 space-y-1.5 text-slate-200">
                  {coinCostEntries.map(([coinType, value]) => (
                    <div key={coinType} className="flex items-center justify-between gap-3">
                      <dt>CoinType {coinType}</dt>
                      <dd>{formatInteger(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Aucun cout explicite pour ce plan.</p>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/55 p-5">
        <h2 className="text-lg font-semibold text-white">Composants requis</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recipe.ingredients.map((ingredient, index) => {
            const ingredientName = resolveDraftItemName(ingredient, selectedLanguage, availableLanguages);
            const ingredientDescription = resolveDraftItemDescription(
              ingredient,
              selectedLanguage,
              availableLanguages,
            );
            const ingredientIcon =
              ingredient.icon.publicPath ?? ingredient.icon.placeholderPath ?? "/marker-default.svg";

            return (
              <article
                key={`${ingredient.id}-${index}`}
                className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/70 p-2">
                    <img src={ingredientIcon} alt={ingredientName} className="max-h-full max-w-full object-contain" />
                    <span className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 rounded bg-slate-900/95 px-1.5 py-0.5 text-[11px] font-medium text-amber-100">
                      x{ingredient.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100">{ingredientName}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                      <span
                        className={`rounded-full border px-2 py-0.5 ${nodeAccentClasses(ingredient.sourceCategory)}`}
                      >
                        {sourceCategoryLabel(ingredient.sourceCategory)}
                      </span>
                      <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                        {ingredient.type}
                      </span>
                      {typeof ingredient.rarity === "number" ? (
                        <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-slate-300">
                          Rarete {ingredient.rarity}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {ingredientDescription ? (
                  <p className="mt-3 text-xs leading-relaxed text-slate-300">{ingredientDescription}</p>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">Description indisponible.</p>
                )}

                {ingredient.href ? (
                  <Link
                    href={ingredient.href}
                    className="mt-3 inline-flex items-center gap-1 rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-xs text-amber-100 transition-colors hover:bg-amber-500/20"
                  >
                    Ouvrir la fiche
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
