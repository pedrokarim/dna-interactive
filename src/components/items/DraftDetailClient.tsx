"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ArrowLeft, Clock3, ExternalLink, Languages } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { getLanguageLabel, normalizeLanguageCodes } from "@/lib/items/catalog";
import type { DraftItemReference, DraftRecipeRecord } from "@/lib/items/drafts";
import { resolveDraftItemDescription, resolveDraftItemName } from "@/lib/items/drafts";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { ITEM_FALLBACK_ICON } from "@/components/dna/ItemIcon";

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

function sourceCategoryLabelKey(sourceCategory: DraftItemReference["sourceCategory"]): string {
  if (sourceCategory === "mods") {
    return "sourceDemonWedge";
  }
  if (sourceCategory === "resources") {
    return "sourceResource";
  }
  if (sourceCategory === "weapons") {
    return "sourceWeapon";
  }
  if (sourceCategory === "char-accessories") {
    return "sourceAccessory";
  }
  return "sourceUnknown";
}

function nodeAccentClasses(sourceCategory: DraftItemReference["sourceCategory"]): string {
  if (sourceCategory === "mods") {
    return "border-hydro/40 bg-hydro/10 text-hydro";
  }
  if (sourceCategory === "weapons") {
    return "border-crimson/40 bg-crimson/10 text-crimson-bright";
  }
  if (sourceCategory === "resources") {
    return "border-anemo/40 bg-anemo/10 text-anemo";
  }
  if (sourceCategory === "char-accessories") {
    return "border-electro/40 bg-electro/10 text-electro";
  }
  return "border-white/10 bg-white/10 text-parch";
}

type RecipeNodeProps = {
  item: DraftItemReference;
  selectedLanguage: string;
  fallbackLanguages: string[];
  primary?: boolean;
};

function RecipeNode({ item, selectedLanguage, fallbackLanguages, primary = false }: RecipeNodeProps) {
  const td = useTranslations('draftDetail');
  const tc = useTranslations('common');
  const iconSrc = item.icon.publicPath ?? item.icon.placeholderPath ?? ITEM_FALLBACK_ICON;
  const name = resolveDraftItemName(item, selectedLanguage, fallbackLanguages);
  const description = resolveDraftItemDescription(item, selectedLanguage, fallbackLanguages);
  const classLabel = metadataString(item, "classLabelEn");
  const subtypeLabel = metadataString(item, "subtypeLabelEn");
  const classIcon = metadataString(item, "classIconPublicPath");
  const subtypeIcon = metadataString(item, "subtypeIconPublicPath");

  const nodeBody = (
    <div
      className={`relative rounded-sm border ${
        primary ? "border-gold/55 bg-gold/10" : "border-white/10 bg-ink/80"
      } p-2 shadow-[0_6px_18px_rgba(2,6,23,0.35)] transition-colors group-hover:border-gold/65`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-white/10 bg-panel/80 p-2">
        <img src={iconSrc} alt={name} width={64} height={64} className="max-h-full max-w-full object-contain" />
      </div>
      <span className="absolute bottom-1 right-1 rounded-sm bg-panel/95 px-1.5 py-0.5 text-[11px] font-medium text-gold">
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
          aria-label={td('openItem', { name })}
        >
          {nodeBody}
        </Link>
      ) : (
        nodeBody
      )}

      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-72 -translate-x-1/2 rounded-sm border border-white/10 bg-ink/95 p-3 text-sm shadow-[0_20px_40px_rgba(2,6,23,0.65)] group-hover:block">
        <p className="font-medium text-parch">{name}</p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <span className={`rounded-sm border px-2 py-0.5 ${nodeAccentClasses(item.sourceCategory)}`}>
            {td(sourceCategoryLabelKey(item.sourceCategory))}
          </span>
          <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch">
            {item.type}
          </span>
          {typeof item.rarity === "number" ? (
            <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch">
              {td('rarityLabel', { rarity: item.rarity })}
            </span>
          ) : null}
        </div>

        {classLabel || subtypeLabel ? (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-parch/85">
            {classLabel ? (
              <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2 py-0.5">
                {classIcon ? <img src={classIcon} alt={classLabel} width={14} height={14} className="h-3.5 w-3.5 object-contain" /> : null}
                {classLabel}
              </span>
            ) : null}
            {subtypeLabel ? (
              <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-2 py-0.5">
                {subtypeIcon ? (
                  <img src={subtypeIcon} alt={subtypeLabel} width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                ) : null}
                {subtypeLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        {description ? (
          <p className="mt-2 text-xs leading-relaxed text-parch/85">{description}</p>
        ) : (
          <p className="mt-2 text-xs text-muted-2">{tc('descriptionUnavailable')}</p>
        )}

      </div>
    </div>
  );
}

export default function DraftDetailClient({ recipe, availableLanguages }: DraftDetailClientProps) {
  const t = useTranslations('draftDetail');
  const tc = useTranslations('common');
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
  const productIcon = recipe.product.icon.publicPath ?? recipe.product.icon.placeholderPath ?? ITEM_FALLBACK_ICON;
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
    <div className="space-y-4 md:space-y-8">
      <section className="border border-gold/30 bg-panel/60 p-4 md:p-6 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/items/drafts"
              className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-3 py-2 text-sm text-parch transition-colors hover:border-gold/40 hover:text-parch"
            >
              <ArrowLeft className="h-4 w-4" />
              {tc('backToPlans')}
            </Link>
          </div>

          <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-ink/60 px-3 py-2">
            <Languages className="h-4 w-4 text-gold/90" />
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
              aria-label="Langue"
              className="bg-transparent text-sm text-parch outline-none"
            >
              {availableLanguages.map((code) => (
                <option key={code} value={code} className="bg-panel">
                  {getLanguageLabel(code)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 md:mt-5 flex flex-wrap items-center gap-1.5 md:gap-2 text-xs">
          <span className="rounded-sm border border-white/10 px-3 py-1 text-parch/85">
            DRAFT #{recipe.draftId}
          </span>
          <span className="rounded-sm border border-white/10 px-3 py-1 text-parch/85">
            {t('productLabel', { type: recipe.product.type, quantity: recipe.productQuantity })}
          </span>
          {typeof recipe.product.rarity === "number" ? (
            <span className="rounded-sm border border-white/10 px-3 py-1 text-parch/85">
              {t('rarityLabel', { rarity: recipe.product.rarity })}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-sm border border-white/10 px-3 py-1 text-parch/85">
            <Clock3 className="h-3.5 w-3.5 text-gold/90" />
            {formatDuration(recipe.crafting.durationSec)}
          </span>
        </div>
      </section>

      <section className="grid gap-3 md:gap-5 lg:grid-cols-[1.35fr_0.95fr]">
        <article className="border border-gold/30 bg-[radial-gradient(circle_at_50%_22%,rgba(245,158,11,0.16),rgba(15,23,42,0.72)_52%,rgba(2,6,23,0.92)_100%)] p-4 md:p-6">
          <DnaSectionLabel>{t('forgeProcessTitle')}</DnaSectionLabel>
          <p className="mt-2 text-sm text-parch/85">{t('forgeProcessHint')}</p>

          <div className="mt-5 md:mt-8">
            <div className="flex justify-center">
              <RecipeNode
                item={recipe.product}
                selectedLanguage={selectedLanguage}
                fallbackLanguages={availableLanguages}
                primary
              />
            </div>

            <div className="mx-auto mt-2 h-7 w-px bg-gold/35" />

            <div className="relative mx-auto mt-1 max-w-4xl">
              <div className="absolute left-[12.5%] right-[12.5%] top-0 h-px bg-gold/35" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                {ingredientSlots.map((ingredient, index) => (
                  <div key={`slot-${index}`} className="relative flex justify-center">
                    <div className="absolute -top-3 h-3 w-px bg-gold/35" />
                    {ingredient ? (
                      <RecipeNode
                        item={ingredient}
                        selectedLanguage={selectedLanguage}
                        fallbackLanguages={availableLanguages}
                      />
                    ) : (
                      <div className="rounded-sm border border-panel/80 bg-ink/55 p-2">
                        <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-panel bg-panel/50 text-muted-2">
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

        <article className="border border-white/10 bg-panel/65 p-3 md:p-5">
          <div className="rounded-sm border border-gold/30 bg-ink/60 p-3 md:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-sm border border-gold/30 bg-ink/80 p-2">
                <img src={recipeIcon} alt={productName} width={64} height={64} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="font-caps text-[0.6rem] uppercase tracking-[0.22em] text-gold/90">{t('resultLabel')}</p>
                <h1 className="mt-1 font-display text-xl text-parch">{productName}</h1>
                <p className="text-xs text-muted">
                  {recipe.product.type} x{recipe.productQuantity}
                </p>
              </div>
            </div>

            {classLabel || subtypeLabel ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {classLabel ? (
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/10 px-2.5 py-1 text-parch">
                    {classIcon ? <img src={classIcon} alt={classLabel} width={14} height={14} className="h-3.5 w-3.5 object-contain" /> : null}
                    {classLabel}
                  </span>
                ) : null}
                {subtypeLabel ? (
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/10 px-2.5 py-1 text-parch">
                    {subtypeIcon ? (
                      <img src={subtypeIcon} alt={subtypeLabel} width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                    ) : null}
                    {subtypeLabel}
                  </span>
                ) : null}
              </div>
            ) : null}

            {productDescription ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-parch/85">{productDescription}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-2">{tc('descriptionUnavailable')}</p>
            )}
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-sm border border-white/10 bg-ink/60 p-3">
              <h2 className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-muted">{t('forgeSummaryTitle')}</h2>
              <dl className="mt-2 space-y-1.5 text-parch">
                <div className="flex items-center justify-between gap-3">
                  <dt>{t('timeLabel')}</dt>
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

            <div className="rounded-sm border border-white/10 bg-ink/60 p-3">
              <h2 className="font-caps text-[0.6rem] uppercase tracking-[0.2em] text-muted">Cout de forge</h2>
              {coinCostEntries.length > 0 ? (
                <dl className="mt-2 space-y-1.5 text-parch">
                  {coinCostEntries.map(([coinType, value]) => (
                    <div key={coinType} className="flex items-center justify-between gap-3">
                      <dt>CoinType {coinType}</dt>
                      <dd>{formatInteger(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-muted-2">Aucun cout explicite pour ce plan.</p>
              )}
            </div>
          </div>
        </article>
      </section>

      <DnaPanel className="p-4 md:p-5">
        <DnaSectionLabel>Composants requis</DnaSectionLabel>
        <div className="mt-3 md:mt-4 grid gap-2 md:gap-3 md:grid-cols-2">
          {recipe.ingredients.map((ingredient, index) => {
            const ingredientName = resolveDraftItemName(ingredient, selectedLanguage, availableLanguages);
            const ingredientDescription = resolveDraftItemDescription(
              ingredient,
              selectedLanguage,
              availableLanguages,
            );
            const ingredientIcon =
              ingredient.icon.publicPath ?? ingredient.icon.placeholderPath ?? ITEM_FALLBACK_ICON;

            return (
              <article
                key={`${ingredient.id}-${index}`}
                className="rounded-sm border border-white/10 bg-ink/60 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-sm border border-white/10 bg-panel/70 p-2">
                    <img src={ingredientIcon} alt={ingredientName} width={56} height={56} loading="lazy" className="max-h-full max-w-full object-contain" />
                    <span className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 rounded-sm bg-panel/95 px-1.5 py-0.5 text-[11px] font-medium text-gold">
                      x{ingredient.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-parch">{ingredientName}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                      <span
                        className={`rounded-sm border px-2 py-0.5 ${nodeAccentClasses(ingredient.sourceCategory)}`}
                      >
                        {t(sourceCategoryLabelKey(ingredient.sourceCategory))}
                      </span>
                      <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                        {ingredient.type}
                      </span>
                      {typeof ingredient.rarity === "number" ? (
                        <span className="rounded-sm border border-white/10 px-2 py-0.5 text-parch/85">
                          {t('rarityLabel', { rarity: ingredient.rarity })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {ingredientDescription ? (
                  <p className="mt-3 text-xs leading-relaxed text-parch/85">{ingredientDescription}</p>
                ) : (
                  <p className="mt-3 text-xs text-muted-2">{tc('descriptionUnavailable')}</p>
                )}

                {ingredient.href ? (
                  <Link
                    href={ingredient.href}
                    className="mt-3 inline-flex items-center gap-1 rounded-sm border border-gold/35 bg-gold/10 px-2 py-1 text-xs text-gold transition-colors hover:bg-gold/20"
                  >
                    {t('openItem', { name: resolveDraftItemName(ingredient, selectedLanguage, availableLanguages) })}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </DnaPanel>
    </div>
  );
}
