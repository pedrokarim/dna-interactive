"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, GitFork, Search, Users } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { DnaButton } from "@/components/dna/Button";
import { DnaCommunityBuildCard } from "@/components/dna/CommunityBuildCard";
import { DnaElementBadge } from "@/components/dna/ElementBadge";
import { DnaField } from "@/components/dna/Field";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaSegmented } from "@/components/dna/Segmented";
import { ELEMENTS, type ElementKey } from "@/components/dna/elements";
import { resolveBuildItemRef } from "@/lib/characters/builds";
import { NAVIGATION } from "@/lib/constants";
import type { BuilderCharacterOption, BuilderOptions } from "@/lib/community-builds/options";
import type { CommunityBuildPayload } from "@/lib/community-builds/validation";
import { cn } from "@/components/dna/cn";

const PAGE_SIZE = 12;

type SortMode = "top" | "recent";

type CommunityBuildListItem = {
  id: string;
  userId: string;
  characterId: string;
  element: string | null;
  title: string;
  note: string | null;
  voteCount: number;
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

function buildCharacterHref(character: BuilderCharacterOption | undefined, buildId: string): string {
  const slug = character?.slug;
  return slug ? `${NAVIGATION.characters}/${slug}?tab=build&communityBuildId=${buildId}` : NAVIGATION.characters;
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
  const lang = locale.toUpperCase();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [characterId, setCharacterId] = useState("all");
  const [element, setElement] = useState("all");
  const [sort, setSort] = useState<SortMode>("top");
  const [page, setPage] = useState(1);
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

    fetch(`/api/builds?${params.toString()}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Chargement impossible.");
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
        if (!cancelled) setMessage(error.message || "Impossible de charger les builds.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterId, element, page, sort]);

  function selectCharacter(nextCharacterId: string) {
    setLoading(true);
    setCharacterId(nextCharacterId);
    setElement("all");
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
      setMessage("Connexion Discord requise pour voter.");
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
            <p className="font-caps text-[0.62rem] uppercase tracking-[0.22em] text-gold">Bibliothèque communauté</p>
            <h2 className="mt-2 flex items-center gap-2 font-display text-2xl text-parch md:text-3xl">
              <Users className="h-5 w-5 text-gold/80" />
              Builds publiés par les joueurs
            </h2>
            <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-muted">
              Parcours les builds, filtre par personnage ou élément, puis ouvre la fiche pour voir la configuration complète.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <DnaSegmented
              value={sort}
              onChange={(value) => selectSort(value as SortMode)}
              options={[
                { value: "top", label: "Top" },
                { value: "recent", label: "Récent" },
              ]}
            />
            <Link
              href={NAVIGATION.builder}
              className="dna-shine inline-flex items-center justify-center border border-gold bg-gold/15 px-4 py-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-gold-bright transition-colors hover:border-gold-bright hover:text-[#fff6e6]"
            >
              Proposer un build
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(16rem,0.34fr)_minmax(0,1fr)]">
          <DnaField
            icon={<Search className="h-4 w-4" />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un personnage"
            wrapClassName="w-full min-w-0 self-start"
          />

          <div className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-color:rgba(194,168,106,0.7)_rgba(255,255,255,0.08)]">
            <button
              type="button"
              onClick={() => selectCharacter("all")}
              aria-pressed={characterId === "all"}
              className={cn(
                "grid h-28 w-36 shrink-0 snap-start place-items-center border bg-black/25 p-3 text-center transition-colors hover:border-gold/60",
                characterId === "all" ? "border-gold text-gold-bright" : "border-white/12 text-parch/80",
              )}
            >
              <span className="font-caps text-[0.62rem] uppercase tracking-[0.18em]">Tous les personnages</span>
            </button>
            {filteredCharacters.map((character) => (
              <button
                key={character.id}
                type="button"
                onClick={() => selectCharacter(character.id)}
                aria-pressed={character.id === characterId}
                className={cn(
                  "group relative h-28 w-36 shrink-0 snap-start overflow-hidden border bg-black/25 text-left transition-all hover:-translate-y-0.5 hover:border-gold/60",
                  character.id === characterId ? "border-gold shadow-[0_0_0_1px_rgba(194,168,106,0.35)]" : "border-white/12",
                )}
              >
                {character.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={character.portrait} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_14%] transition-transform duration-500 group-hover:scale-105" />
                ) : null}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
                <span className="absolute inset-x-2 bottom-2 z-[2]">
                  <span className="flex items-center gap-1">
                    {character.elements.slice(0, 2).map((characterElement) => (
                      <DnaElementBadge key={characterElement.key} element={characterElement.key} size={22} />
                    ))}
                  </span>
                  <span className="mt-1 block truncate font-display text-base text-parch">{character.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedCharacter && selectedCharacter.elements.length > 0 ? (
          <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-caps text-[0.58rem] uppercase tracking-[0.16em] text-muted">Élément</span>
            <DnaSegmented
              value={element}
              onChange={selectElement}
              options={[
                { value: "all", label: "Tous" },
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
      </DnaPanel>

      {message ? <p className="border border-gold/20 bg-gold/10 px-3 py-2 font-sans text-sm text-gold">{message}</p> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {loading ? (
          <DnaPanel className="p-5 font-sans text-sm text-muted">Chargement des builds...</DnaPanel>
        ) : builds.length === 0 ? (
          <DnaPanel className="p-5 text-center font-sans text-sm text-muted">Aucun build ne correspond à ces filtres.</DnaPanel>
        ) : (
          builds.map((build, index) => {
            const character = characterById.get(build.characterId);
            const preview = getPreviewItems(build, lang);
            const href = buildCharacterHref(character, build.id);
            return (
              <DnaCommunityBuildCard
                key={build.id}
                title={build.title}
                author={{ name: build.authorName ?? "Discord", avatar: build.authorImage }}
                date={new Date(build.updatedAt ?? build.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                element={build.element as ElementKey | null}
                rank={sort === "top" ? (pagination.page - 1) * pagination.pageSize + index + 1 : undefined}
                vote={{ count: build.voteCount, voted: build.votedByMe }}
                onVote={(next) => void toggleVote(build, next)}
                weapons={preview.weapons}
                genimons={preview.genimons}
                openLabel="Voir"
                onOpen={() => router.push(href)}
                actions={
                  <>
                    <span className="inline-flex items-center border border-white/10 bg-black/20 px-2.5 py-1.5 font-sans text-xs text-muted">
                      {character?.name ?? build.characterId}
                    </span>
                    <Link
                      href={`${NAVIGATION.builder}?importBuildId=${build.id}`}
                      className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.04] px-2.5 py-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-parch/80 transition-colors hover:border-gold/45 hover:text-gold-bright"
                    >
                      <GitFork className="h-3.5 w-3.5" />
                      Base
                    </Link>
                  </>
                }
              />
            );
          })
        )}
      </div>

      {!loading && pagination.totalPages > 1 ? (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs text-muted">
            Page {pagination.page}/{pagination.totalPages} · {pagination.total} builds
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
              Précédent
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
              Suivant
            </DnaButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
