"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQueryState, parseAsString, parseAsInteger, parseAsStringLiteral } from "nuqs";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, GitFork, Search, Users } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { DnaButton } from "@/components/dna/Button";
import { DnaChip } from "@/components/dna/Chip";
import { DnaCommunityBuildBannerCard } from "@/components/dna/CommunityBuildBannerCard";
import { DnaElementBadge } from "@/components/dna/ElementBadge";
import { DnaField } from "@/components/dna/Field";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSegmented } from "@/components/dna/Segmented";
import { ELEMENTS, type ElementKey } from "@/components/dna/elements";
import { resolveBuildItemRef } from "@/lib/characters/builds";
import { NAVIGATION } from "@/lib/constants";
import type { BuilderCharacterOption, BuilderOptions } from "@/lib/community-builds/options";
import type { CommunityBuildPayload } from "@/lib/community-builds/validation";
import { BUILD_TAGS } from "@/lib/community-builds/validation";
import { cn } from "@/components/dna/cn";

const PAGE_SIZE = 12;
const DATE_LOCALE: Record<string, string> = { en: "en", fr: "fr", de: "de", es: "es", jp: "ja", kr: "ko", tc: "zh-TW" };

type SortMode = "top" | "recent";

type CommunityBuildListItem = {
  id: string;
  userId: string;
  characterId: string;
  element: string | null;
  title: string;
  note: string | null;
  voteCount: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  authorName: string | null;
  authorImage: string | null;
  payload: CommunityBuildPayload;
  votedByMe: boolean;
  editableByMe: boolean;
};

type CommunityBuildPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type CommunityBuildsHubClientProps = {
  options: BuilderOptions;
  locale: string;
};

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

function buildCharacterHref(_character: BuilderCharacterOption | undefined, buildId: string): string {
  // Page dédiée par build (plus ergonomique qu'une modale sur la fiche perso).
  return `${NAVIGATION.builds}/${buildId}`;
}

function getPreviewItems(build: CommunityBuildListItem, lang: string) {
  const weapons = [...build.payload.weapons.melee, ...build.payload.weapons.ranged]
    .slice(0, 3)
    .map((entry) => resolveBuildItemRef(entry.itemId, "weapons", lang))
    .filter(isPresent);

  const genimons = build.payload.genimon
    .slice(0, 2)
    .map((entry) => resolveBuildItemRef(entry.itemId, "genimons", lang))
    .filter(isPresent);

  return { weapons, genimons };
}

export function CommunityBuildsHubClient({ options, locale }: CommunityBuildsHubClientProps) {
  const router = useRouter();
  const tcb = useTranslations("communityBuilds");
  const lang = locale.toUpperCase();
  // Filtres reflétés dans l'URL (partageables, navigables) via nuqs.
  const urlOpts = { history: "replace" as const };
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault("").withOptions(urlOpts));
  const deferredQuery = useDeferredValue(query);
  const [characterId, setCharacterId] = useQueryState("perso", parseAsString.withDefault("all").withOptions(urlOpts));
  const [element, setElement] = useQueryState("element", parseAsString.withDefault("all").withOptions(urlOpts));
  const [tag, setTag] = useQueryState("tag", parseAsString.withDefault("all").withOptions(urlOpts));
  const [sort, setSort] = useQueryState("tri", parseAsStringLiteral(["top", "recent"] as const).withDefault("top").withOptions(urlOpts));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1).withOptions(urlOpts));
  const [builds, setBuilds] = useState<CommunityBuildListItem[]>([]);
  const [pagination, setPagination] = useState<CommunityBuildPagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const characterById = useMemo(
    () => new Map(options.characters.map((character) => [character.id, character])),
    [options.characters],
  );
  const selectedCharacter = characterId === "all" ? null : characterById.get(characterId) ?? null;

  const filteredCharacters = useMemo(() => {
    const normalized = normalizeSearchText(deferredQuery);
    if (!normalized) return options.characters;
    return options.characters.filter((character) => character.searchText.includes(normalized));
  }, [deferredQuery, options.characters]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      sort,
      page: `${page}`,
      pageSize: `${PAGE_SIZE}`,
    });
    if (characterId !== "all") params.set("characterId", characterId);
    if (element !== "all") params.set("element", element);
    if (tag !== "all") params.set("tag", tag);

    fetch(`/api/builds?${params.toString()}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? tcb("loadGeneric"));
        return data as { builds?: CommunityBuildListItem[]; pagination?: CommunityBuildPagination };
      })
      .then((data) => {
        if (cancelled) return;
        const rows = data.builds ?? [];
        const nextPagination = data.pagination ?? {
          page,
          pageSize: PAGE_SIZE,
          total: rows.length,
          totalPages: 1,
        };
        setBuilds(rows);
        setPagination(nextPagination);
        if (nextPagination.page !== page) setPage(nextPagination.page);
        setMessage(null);
      })
      .catch((error: Error) => {
        if (!cancelled) setMessage(error.message || tcb("hubLoadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterId, element, tag, page, sort]);

  function selectCharacter(nextCharacterId: string) {
    setLoading(true);
    setCharacterId(nextCharacterId);
    setElement("all");
    setPage(1);
  }

  function selectTag(nextTag: string) {
    setLoading(true);
    setTag(nextTag);
    setPage(1);
  }

  function selectElement(nextElement: string) {
    setLoading(true);
    setElement(nextElement);
    setPage(1);
  }

  function selectSort(nextSort: SortMode) {
    setLoading(true);
    setSort(nextSort);
    setPage(1);
  }

  async function toggleVote(build: CommunityBuildListItem, next: boolean) {
    setBuilds((current) =>
      current.map((item) =>
        item.id === build.id
          ? {
              ...item,
              votedByMe: next,
              voteCount: Math.max(item.voteCount + (next ? 1 : -1), 0),
            }
          : item,
      ),
    );

    const response = await fetch(`/api/builds/${build.id}/vote`, { method: next ? "POST" : "DELETE" });
    if (!response.ok) {
      setBuilds((current) => current.map((item) => (item.id === build.id ? build : item)));
      setMessage(tcb("loginToVote"));
      return;
    }

    const data = await response.json();
    setBuilds((current) =>
      current.map((item) =>
        item.id === build.id
          ? { ...item, votedByMe: data.voted, voteCount: data.voteCount }
          : item,
      ),
    );
  }

  return (
    <div className="space-y-5">
      <DnaPanel className="overflow-hidden p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="font-caps text-[0.62rem] uppercase tracking-[0.22em] text-gold">{tcb("hubKicker")}</p>
            <h2 className="mt-2 flex items-center gap-2 font-display text-2xl text-parch md:text-3xl">
              <Users className="h-5 w-5 text-gold/80" />
              {tcb("hubTitle")}
            </h2>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-muted">
              {tcb("hubDescription")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DnaSegmented
              value={sort}
              onChange={(value) => selectSort(value as SortMode)}
              options={[
                { value: "top", label: tcb("sortTop") },
                { value: "recent", label: tcb("sortRecent") },
              ]}
            />
            <Link
              href={NAVIGATION.builder}
              className="dna-shine inline-flex items-center justify-center border border-gold bg-gold/15 px-4 py-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-gold-bright transition-colors hover:border-gold-bright hover:text-[#fff6e6]"
            >
              {tcb("proposeBuild")}
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-caps text-[0.58rem] uppercase tracking-[0.16em] text-muted">{tcb("categories")}</span>
              <DnaChip selected={tag === "all"} onClick={() => selectTag("all")}>
                {tcb("allTags")}
              </DnaChip>
              {BUILD_TAGS.map((buildTag) => (
                <DnaChip key={buildTag} selected={tag === buildTag} onClick={() => selectTag(buildTag)}>
                  {tcb(`tagLabels.${buildTag}`)}
                </DnaChip>
              ))}
            </div>

            <DnaField
              icon={<Search className="h-4 w-4" />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tcb("searchCharacter")}
              wrapClassName="w-full max-w-md"
            />

            <div className="flex min-w-0 snap-x snap-mandatory items-center gap-2 overflow-x-auto pb-2 [scrollbar-color:rgba(194,168,106,0.7)_rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => selectCharacter("all")}
                aria-pressed={characterId === "all"}
                className={cn(
                  "inline-flex shrink-0 snap-start items-center gap-1.5 border px-3 py-1.5 font-caps text-[0.6rem] uppercase tracking-[0.14em] transition-colors hover:border-gold/60",
                  characterId === "all" ? "border-gold bg-gold/10 text-gold-bright" : "border-white/12 text-parch/75",
                )}
              >
                {tcb("allCharacters")}
              </button>
              {filteredCharacters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  onClick={() => selectCharacter(character.id)}
                  aria-pressed={character.id === characterId}
                  className={cn(
                    "inline-flex shrink-0 snap-start items-center gap-1.5 border px-2.5 py-1.5 font-sans text-xs transition-colors hover:border-gold/60",
                    character.id === characterId ? "border-gold bg-gold/10 text-gold-bright" : "border-white/12 text-parch/80",
                  )}
                >
                  {character.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={character.portrait} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover object-[50%_15%]" />
                  ) : null}
                  <span className="max-w-[9rem] truncate">{character.name}</span>
                  {character.elements[0] ? <DnaElementBadge element={character.elements[0].key} size={14} /> : null}
                </button>
              ))}
            </div>

            {selectedCharacter && selectedCharacter.elements.length > 0 ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-caps text-[0.58rem] uppercase tracking-[0.16em] text-muted">{tcb("element")}</span>
                <DnaSegmented
                  value={element}
                  onChange={selectElement}
                  options={[
                    { value: "all", label: tcb("allElements") },
                    ...selectedCharacter.elements.map((characterElement) => ({
                      value: characterElement.key,
                      label: (
                        <span className="inline-flex items-center gap-1.5">
                          <DnaElementBadge element={characterElement.key} size={20} />
                          {ELEMENTS[characterElement.key as ElementKey]?.label ?? characterElement.label}
                        </span>
                      ),
                    })),
                  ]}
                />
              </div>
            ) : null}
          </div>
      </DnaPanel>

      {message ? <p className="border border-gold/20 bg-gold/10 px-3 py-2 font-sans text-sm text-gold">{message}</p> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <DnaPanel className="p-5 font-sans text-sm text-muted">{tcb("loadingBuilds")}</DnaPanel>
        ) : builds.length === 0 ? (
          <DnaPanel className="p-5 text-center font-sans text-sm text-muted">{tcb("noBuildsFilters")}</DnaPanel>
        ) : (
          builds.map((build, index) => {
            const character = characterById.get(build.characterId);
            const preview = getPreviewItems(build, lang);
            const href = buildCharacterHref(character, build.id);
            const lineup = [
              ...(character ? [{ avatar: character.avatar, name: character.name }] : []),
              ...build.payload.team.map((member) => {
                const teammate = characterById.get(member.characterId);
                return { avatar: teammate?.avatar ?? null, name: teammate?.name ?? member.characterId };
              }),
            ];
            return (
              <DnaCommunityBuildBannerCard
                key={build.id}
                title={build.title}
                author={{ name: build.authorName ?? "Discord", avatar: build.authorImage }}
                date={new Date(build.updatedAt ?? build.createdAt).toLocaleDateString(DATE_LOCALE[locale] ?? locale, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                element={build.element as ElementKey | null}
                rank={sort === "top" ? (pagination.page - 1) * pagination.pageSize + index + 1 : undefined}
                bannerImage={character?.art ?? character?.portrait}
                characterName={character?.name ?? build.characterId}
                lineup={lineup}
                mainWeapon={preview.weapons[0]}
                tags={(build.payload.tags ?? []).map((buildTag) => tcb(`tagLabels.${buildTag}`))}
                views={build.views}
                viewsLabel={tcb("views")}
                communityLabel={tcb("community")}
                officialLabel={tcb("officialTier")}
                vote={{ count: build.voteCount, voted: build.votedByMe }}
                onVote={(next) => void toggleVote(build, next)}
                voteLabels={{ vote: tcb("voteAction"), remove: tcb("removeVote"), login: tcb("loginVote") }}
                onOpen={() => router.push(href)}
                actions={
                  <Link
                    href={`${NAVIGATION.builder}?importBuildId=${build.id}`}
                    className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2.5 py-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-parch/80 transition-colors hover:border-gold/45 hover:text-gold-bright"
                  >
                    <GitFork className="h-3.5 w-3.5" />
                    {tcb("base")}
                  </Link>
                }
              />
            );
          })
        )}
      </div>

      {!loading && pagination.totalPages > 1 ? (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs text-muted">
            {tcb("pageInfo", { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
          </p>
          <div className="flex items-center gap-2">
            <DnaButton
              className="px-3 py-1.5 text-xs"
              disabled={pagination.page <= 1}
              icon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.max(1, current - 1));
              }}
            >
              {tcb("prev")}
            </DnaButton>
            <DnaButton
              className="px-3 py-1.5 text-xs"
              disabled={pagination.page >= pagination.totalPages}
              icon={<ChevronRight className="h-4 w-4" />}
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.min(pagination.totalPages, current + 1));
              }}
            >
              {tcb("next")}
            </DnaButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
