"use client";

import { Check, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { DnaElementBadge } from "@/components/dna/ElementBadge";
import { ELEMENTS } from "@/components/dna/elements";
import { DnaField } from "@/components/dna/Field";
import { DnaStars } from "@/components/dna/RarityStars";
import { cn } from "@/components/dna/cn";
import type { BuilderCharacterOption } from "@/lib/community-builds/options";

type BuilderCharacterPickerProps = {
  characters: BuilderCharacterOption[];
  value: string;
  statusNode?: ReactNode;
  onChange: (characterId: string) => void;
};

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function BuilderCharacterPicker({
  characters,
  value,
  statusNode,
  onChange,
}: BuilderCharacterPickerProps) {
  const t = useTranslations("builder");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === value) ?? characters[0],
    [characters, value],
  );

  const filteredCharacters = useMemo(() => {
    const normalizedQuery = normalizeSearchText(deferredQuery);
    if (!normalizedQuery) return characters;
    return characters.filter((character) => character.searchText.includes(normalizedQuery));
  }, [characters, deferredQuery]);

  const isStale = query !== deferredQuery;

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(15rem,0.42fr)_minmax(0,1fr)]">
        {selectedCharacter ? <SelectedCharacterSummary character={selectedCharacter} /> : null}

        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <DnaField
              icon={<Search className="h-4 w-4" />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchCharacter")}
              wrapClassName="w-full min-w-0"
            />
            {statusNode ? <div className="shrink-0">{statusNode}</div> : null}
          </div>

          <p className="font-caps text-[0.58rem] uppercase tracking-[0.18em] text-muted">
            {t("characterCount", { count: filteredCharacters.length, total: characters.length })}
          </p>
        </div>
      </div>

      {filteredCharacters.length > 0 ? (
        <div
          className={cn(
            "flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 pr-1 transition-opacity [scrollbar-color:rgba(194,168,106,0.7)_rgba(255,255,255,0.08)]",
            isStale && "opacity-70",
          )}
        >
          {filteredCharacters.map((character) => (
            <CharacterChoiceCard
              key={character.id}
              character={character}
              selected={character.id === value}
              onSelect={() => onChange(character.id)}
            />
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-white/15 bg-black/20 px-3 py-4 text-center font-sans text-sm text-muted">
          {t("noCharacterFound")}
        </p>
      )}
    </div>
  );
}

function SelectedCharacterSummary({ character }: { character: BuilderCharacterOption }) {
  const t = useTranslations("builder");
  const elementList = character.elements.length > 0 ? character.elements : character.element ? [{ key: character.element, label: ELEMENTS[character.element].label }] : [];
  const accent = elementList[0]?.key ? ELEMENTS[elementList[0].key].hex : "#c2a86a";

  return (
    <div className="relative min-w-0 self-start overflow-hidden border border-gold/25 bg-gradient-to-br from-[rgba(29,24,18,0.82)] via-panel/80 to-ink p-3 shadow-[inset_0_1px_0_rgba(227,205,149,0.16)]">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      <div className="flex min-w-0 gap-3">
        <div className="relative h-28 w-20 shrink-0 overflow-hidden border border-white/10 bg-black/25">
          {character.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={character.portrait} alt="" className="h-full w-full object-cover object-[50%_12%]" />
          ) : (
            <span className="grid h-full place-items-center font-display text-3xl text-muted-2">{character.name.charAt(0)}</span>
          )}
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-caps text-[0.58rem] uppercase tracking-[0.18em] text-gold">{t("character")}</p>
          <h2 className="mt-1 truncate font-display text-2xl leading-tight text-parch">{character.name}</h2>
          {character.subtitle ? <p className="truncate font-sans text-xs text-muted">{character.subtitle}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {elementList.map((element) => (
              <DnaElementBadge key={element.key} element={element.key} size={24} />
            ))}
            {character.rarity ? <DnaStars value={character.rarity} className="ml-0.5" /> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {character.weapons.slice(0, 3).map((weapon) => (
              <span key={weapon} className="border border-white/10 bg-black/25 px-1.5 py-0.5 font-sans text-[0.62rem] text-muted">
                {weapon}
              </span>
            ))}
          </div>
        </div>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-15 blur-3xl"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}

function CharacterChoiceCard({
  character,
  selected,
  onSelect,
}: {
  character: BuilderCharacterOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const elementList = character.elements.length > 0 ? character.elements : character.element ? [{ key: character.element, label: ELEMENTS[character.element].label }] : [];
  const accentElement = elementList[0]?.key;
  const accent = accentElement ? ELEMENTS[accentElement].hex : "#c2a86a";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative block w-[8.75rem] min-w-0 shrink-0 snap-start overflow-hidden border bg-gradient-to-br from-[rgba(30,26,30,0.6)] to-[rgba(12,11,10,0.92)] text-left transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-[0_12px_26px_-10px_rgba(0,0,0,0.85)] focus:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold/70 sm:w-40 lg:w-44",
        selected ? "border-gold shadow-[0_0_0_1px_rgba(194,168,106,0.35),0_18px_40px_-18px_rgba(194,168,106,0.75)]" : "border-line/25",
      )}
    >
      <span aria-hidden className="block aspect-[3/4] w-full" />
      {character.portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={character.portrait}
          alt={character.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[50%_12%] transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center font-caps text-5xl text-[rgba(236,228,210,0.18)]">
          {character.name.charAt(0)}
        </span>
      )}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[45%] opacity-50" style={{ background: `linear-gradient(180deg, ${accent}, transparent 70%)` }} />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/42 to-transparent" />

      <span className="absolute inset-x-2 top-2 z-[3] flex items-start justify-between gap-2">
        <span className="flex min-w-0 flex-wrap items-center gap-1">
          {elementList.map((element) => (
            <DnaElementBadge key={element.key} element={element.key} size={26} />
          ))}
        </span>
        {selected ? (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold bg-gold/20 text-gold-bright shadow-[0_0_18px_-6px_rgba(227,205,149,0.9)]">
            <Check className="h-4 w-4" />
          </span>
        ) : null}
      </span>

      <span className="absolute inset-x-0 bottom-0 z-[2] block p-3">
        {character.rarity ? <DnaStars value={character.rarity} className="mb-0.5" /> : null}
        <span className="block truncate font-display text-[1.12rem] leading-tight text-parch transition-colors group-hover:text-gold-bright">
          {character.name}
        </span>
        {character.subtitle ? <span className="block truncate font-sans text-[0.64rem] text-muted">{character.subtitle}</span> : null}
        {character.weapons.length > 0 ? (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {character.weapons.slice(0, 2).map((weapon) => (
              <span key={weapon} className="rounded-[3px] border border-white/8 bg-black/30 px-1 py-0.5 font-sans text-[0.54rem] text-muted">
                {weapon}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  );
}
