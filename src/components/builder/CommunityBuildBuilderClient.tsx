"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Download, Upload, Link2, Share2 } from "lucide-react";
import { BuilderCharacterPicker } from "@/components/builder/CharacterPicker";
import { DnaButton } from "@/components/dna/Button";
import { DnaChip } from "@/components/dna/Chip";
import { DnaConsonanceEditor } from "@/components/dna/ConsonanceEditor";
import { DnaDemonWedgeEditor } from "@/components/dna/DemonWedgeEditor";
import { DnaDraftStatus, type DraftState } from "@/components/dna/DraftStatus";
import { DnaField } from "@/components/dna/Field";
import { DnaItemPicker, type DnaPickerItem } from "@/components/dna/ItemPicker";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaPriorityList, type PriorityItem } from "@/components/dna/PriorityList";
import { DnaSectionLabel } from "@/components/dna/SectionLabel";
import { DnaSegmented } from "@/components/dna/Segmented";
import { DnaSlotRow, type SlotEntry } from "@/components/dna/SlotRow";
import { ELEMENTS, type ElementKey } from "@/components/dna/elements";
import type { WedgeSlotData } from "@/components/dna/_wedge";
import {
  createCommunityBuildExport,
  decodeBuildParam,
  encodeBuildParam,
  parseBuildJsonText,
  parseBuildXmlText,
  serializeBuildJson,
  serializeBuildXml,
  validateCommunityBuildExport,
} from "@/lib/community-builds/build-io";
import { isCenterDemonWedgeItemId } from "@/lib/community-builds/center-wedges";
import type { BuilderOptions } from "@/lib/community-builds/options";
import type { CommunityBuildPayload } from "@/lib/community-builds/validation";
import { BUILD_TAGS, type BuildTag } from "@/lib/community-builds/validation";

const STAT_IDS = ["ATK", "CritRate", "CritDmg", "SkillDmg", "ElementDmg", "HP", "DEF"] as const;

function subscribeMounted() {
  return () => undefined;
}

type EditingTarget =
  | { kind: "demon"; position: number }
  | { kind: "center" }
  | { kind: "consonance"; position: number }
  | { kind: "team" }
  | null;

const TEAM_ROLES = ["DPS", "Sub-DPS", "Support", "Heal", "Tank"] as const;
type TeamRole = (typeof TEAM_ROLES)[number];
const DEFAULT_ROLE: TeamRole = "DPS";
type TeamMember = { character: DnaPickerItem; role: TeamRole };

type StoredDraft = {
  title: string;
  note: string;
  payload: CommunityBuildPayload;
  updatedAt: string;
};

type ServerDraft = {
  title: string | null;
  note: string | null;
  payload: CommunityBuildPayload;
  updatedAt: string;
};

// État de réconciliation brouillon local ↔ serveur (§3.5 du cadrage).
type ReconcileState =
  | { kind: "conflict"; local: StoredDraft; server: ServerDraft }
  | { kind: "import"; local: StoredDraft }
  | null;

// Sérialisation déterministe (clés triées) — nécessaire car jsonb ne préserve
// pas l'ordre des clés, donc une comparaison brute donnerait de faux conflits.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

function sameDraftContent(
  a: { title?: string | null; note?: string | null; payload: CommunityBuildPayload },
  b: { title?: string | null; note?: string | null; payload: CommunityBuildPayload },
): boolean {
  return (
    stableStringify({ title: a.title ?? "", note: a.note ?? "", payload: a.payload }) ===
    stableStringify({ title: b.title ?? "", note: b.note ?? "", payload: b.payload })
  );
}

function fmtDraftTime(value: string): string {
  return new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

type LoadedCommunityBuild = {
  id: string;
  characterId: string;
  element: string | null;
  title: string;
  note: string | null;
  payload: CommunityBuildPayload;
  editableByMe: boolean;
};

function emptyWedgeSlots(max: number): WedgeSlotData[] {
  return Array.from({ length: max }, (_, index) => ({ position: index + 1, item: null, track: null }));
}

// La polarité d'un mod peut être universelle (-1) : ce n'est pas une track
// valide (1-4). On la normalise en null pour ne jamais stocker/publier un
// track hors bornes (sinon la validation rejette « number >= 1 »).
function normalizeTrack(value: number | null | undefined): number | null {
  return typeof value === "number" && value >= 1 && value <= 4 ? value : null;
}

function draftKey(characterId: string, element: string | null): string {
  return `dna:builder:draft:${characterId}:${element ?? "default"}`;
}

function entriesToPayload(entries: SlotEntry[]) {
  return entries.map((entry) => ({ itemId: entry.item.id, rank: entry.rank }));
}

function itemById(pool: DnaPickerItem[], id: string | null | undefined): DnaPickerItem | null {
  if (!id) return null;
  return pool.find((item) => item.id === id) ?? null;
}

function asElementKey(value: string | null | undefined): ElementKey | null {
  return value && value in ELEMENTS ? (value as ElementKey) : null;
}

export function CommunityBuildBuilderClient({
  options,
  isAuthenticated,
}: {
  options: BuilderOptions;
  isAuthenticated: boolean;
}) {
  const searchParams = useSearchParams();
  const t = useTranslations("builder");
  const STATS_POOL = useMemo<PriorityItem[]>(
    () => STAT_IDS.map((id) => ({ id, label: t(`statLabels.${id}`) })),
    [t],
  );
  const teamPool = useMemo<DnaPickerItem[]>(
    () =>
      options.characters.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.portrait ?? null,
        rarity: c.rarity ?? null,
        element: c.elements[0]?.key ?? c.element ?? null,
      })),
    [options.characters],
  );
  const roleLabel = (role: string) =>
    role === "Support" ? t("roleSupport") : role === "Heal" ? t("roleHeal") : role === "Tank" ? t("roleTank") : role;
  const firstCharacter = options.characters[0];
  const [characterId, setCharacterId] = useState(firstCharacter?.id ?? "");
  const selectedCharacter = useMemo(
    () => options.characters.find((character) => character.id === characterId) ?? firstCharacter,
    [characterId, firstCharacter, options.characters],
  );
  // Le picker ne propose que les VRAIES compétences du perso (la référence) ;
  // fallback générique borné 1-3 si le kit n'est pas résolu.
  const SKILL_POOL = useMemo<PriorityItem[]>(() => {
    const skills = selectedCharacter?.skills ?? [];
    if (skills.length > 0) return skills.map((s) => ({ id: `skill-${s.index}`, label: s.name }));
    return [1, 2, 3].map((i) => ({ id: `skill-${i}`, label: t(`skillLabels.skill-${i}`) }));
  }, [selectedCharacter, t]);
  const [element, setElement] = useState<ElementKey | null>(selectedCharacter?.elements[0]?.key ?? null);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [meleeWeapons, setMeleeWeapons] = useState<SlotEntry[]>([]);
  const [rangedWeapons, setRangedWeapons] = useState<SlotEntry[]>([]);
  const [genimons, setGenimons] = useState<SlotEntry[]>([]);
  const [demonSlots, setDemonSlots] = useState<WedgeSlotData[]>(() => emptyWedgeSlots(8));
  const [centerItem, setCenterItem] = useState<DnaPickerItem | null>(null);
  const [consonanceSlots, setConsonanceSlots] = useState<WedgeSlotData[]>(() => emptyWedgeSlots(4));
  const [statsPriority, setStatsPriority] = useState<PriorityItem[]>(STATS_POOL.slice(0, 3));
  const [skillPriority, setSkillPriority] = useState<PriorityItem[]>([SKILL_POOL[2], SKILL_POOL[0]]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tags, setTags] = useState<BuildTag[]>([]);
  const [canShareNative, setCanShareNative] = useState(false);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [status, setStatus] = useState<DraftState>("idle");
  const [savedAt, setSavedAt] = useState<string | undefined>();
  const [reconcile, setReconcile] = useState<ReconcileState>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [editingBuildId, setEditingBuildId] = useState<string | null>(null);
  const canPortal = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const hydratedRef = useRef(false);
  const loadedSharedBuildRef = useRef<string | null>(null);
  const loadedShareParamRef = useRef(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const importFormatRef = useRef<"json" | "xml">("json");

  const activeElement = element ?? selectedCharacter?.elements[0]?.key ?? null;
  const accentHex = activeElement ? ELEMENTS[activeElement].hex : "#c2a86a";
  const consonanceWeapon = activeElement ? selectedCharacter?.consonanceByElement[activeElement] ?? null : null;
  const key = selectedCharacter ? draftKey(selectedCharacter.id, activeElement) : "";
  const centerMods = useMemo(
    () => options.mods.filter((item) => isCenterDemonWedgeItemId(item.id)),
    [options.mods],
  );

  useEffect(() => {
    if (!editing) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEditing(null);
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [editing]);

  function selectCharacter(nextCharacterId: string) {
    const nextCharacter = options.characters.find((character) => character.id === nextCharacterId);
    setEditingBuildId(null);
    setCharacterId(nextCharacterId);
    setElement(nextCharacter?.elements[0]?.key ?? null);
  }

  useEffect(() => {
    if (!selectedCharacter) return;
    const allowed = selectedCharacter.elements.map((item) => item.key);
    if (!activeElement || !allowed.includes(activeElement)) {
      setElement(allowed[0] ?? null);
    }
  }, [activeElement, selectedCharacter]);

  const payload = useMemo<CommunityBuildPayload>(
    () => ({
      weapons: {
        melee: entriesToPayload(meleeWeapons),
        ranged: entriesToPayload(rangedWeapons),
      },
      demonWedges: {
        slots: demonSlots
          .filter((slot) => slot.item)
          .map((slot) => ({
            position: slot.position,
            itemId: slot.item!.id,
            track: normalizeTrack(slot.track ?? slot.item!.polarity),
          })),
        centerItemId: centerItem?.id ?? null,
        affinity: activeElement,
      },
      genimon: entriesToPayload(genimons),
      consonanceWeapon: consonanceWeapon
        ? { slots: consonanceSlots.filter((slot) => slot.item).map((slot) => slot.item!.id) }
        : null,
      statsPriority: statsPriority.map((item) => item.id) as CommunityBuildPayload["statsPriority"],
      skillPriority: skillPriority.map((item, index) => ({
        skillName: item.label,
        skillIndex: Number(item.id.replace("skill-", "")),
        priority: index + 1,
      })),
      team: team.map((member) => ({ characterId: member.character.id, role: member.role })),
      tags,
    }),
    [
      activeElement,
      centerItem,
      consonanceSlots,
      consonanceWeapon,
      demonSlots,
      genimons,
      meleeWeapons,
      rangedWeapons,
      skillPriority,
      statsPriority,
      team,
      tags,
    ],
  );

  function applyPayload(next: CommunityBuildPayload) {
    setMeleeWeapons(
      next.weapons.melee
        .map((entry) => {
          const item = itemById(options.weapons, entry.itemId);
          return item ? { item, rank: entry.rank } : null;
        })
        .filter((entry): entry is SlotEntry => entry !== null),
    );
    setRangedWeapons(
      next.weapons.ranged
        .map((entry) => {
          const item = itemById(options.weapons, entry.itemId);
          return item ? { item, rank: entry.rank } : null;
        })
        .filter((entry): entry is SlotEntry => entry !== null),
    );
    setGenimons(
      next.genimon
        .map((entry) => {
          const item = itemById(options.genimons, entry.itemId);
          return item ? { item, rank: entry.rank } : null;
        })
        .filter((entry): entry is SlotEntry => entry !== null),
    );
    setDemonSlots(
      emptyWedgeSlots(8).map((slot) => {
        const found = next.demonWedges.slots.find((entry) => entry.position === slot.position);
        const item = itemById(options.mods, found?.itemId);
        return found && item ? { position: slot.position, item, track: normalizeTrack(found.track ?? item.polarity) } : slot;
      }),
    );
    const nextCenterItem = itemById(options.mods, next.demonWedges.centerItemId);
    setCenterItem(nextCenterItem && isCenterDemonWedgeItemId(nextCenterItem.id) ? nextCenterItem : null);
    setConsonanceSlots(
      emptyWedgeSlots(4).map((slot) => {
        const id = next.consonanceWeapon?.slots[slot.position - 1];
        const item = itemById(options.mods, id);
        return item ? { position: slot.position, item, track: normalizeTrack(item.polarity) } : slot;
      }),
    );
    setStatsPriority(
      next.statsPriority
        .map((id) => STATS_POOL.find((item) => item.id === id))
        .filter((item): item is PriorityItem => item !== undefined),
    );
    setSkillPriority(
      next.skillPriority
        .sort((a, b) => a.priority - b.priority)
        .map((entry) => SKILL_POOL.find((item) => item.label === entry.skillName || item.id === `skill-${entry.skillIndex}`))
        .filter((item): item is PriorityItem => item !== undefined),
    );
    setTeam(
      next.team
        .map((entry) => {
          const character = teamPool.find((c) => c.id === entry.characterId);
          return character ? { character, role: entry.role } : null;
        })
        .filter((member): member is TeamMember => member !== null),
    );
    setTags(next.tags ?? []);
  }

  useEffect(() => {
    hydratedRef.current = false;
    setTitle("");
    setNote("");
    setMeleeWeapons([]);
    setRangedWeapons([]);
    setGenimons([]);
    setDemonSlots(emptyWedgeSlots(8));
    setCenterItem(null);
    setConsonanceSlots(emptyWedgeSlots(4));
    setStatsPriority(STATS_POOL.slice(0, 3));
    setSkillPriority([SKILL_POOL[2], SKILL_POOL[0]]);
    setTeam([]);
    setTags([]);
    setStatus("idle");
    setSavedAt(undefined);
    setReconcile(null);
    setMessage(null);

    if (key) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        try {
          const stored = JSON.parse(raw) as StoredDraft;
          setTitle(stored.title ?? "");
          setNote(stored.note ?? "");
          applyPayload(stored.payload);
          setStatus("saved");
          setSavedAt(new Date(stored.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
        } catch {
          setStatus("error");
        }
      }
    }

    window.setTimeout(() => {
      hydratedRef.current = true;
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Réconciliation local ↔ serveur (§3.5) : à l'ouverture (et à la connexion),
  // compare le brouillon local et le brouillon serveur. Si seul le serveur
  // existe on le charge ; si seul le local existe on propose de le synchroniser ;
  // si les deux diffèrent vraiment (comparaison de contenu, pas d'horodatage),
  // on demande lequel reprendre.
  useEffect(() => {
    if (!selectedCharacter || !key || !isAuthenticated) return;
    if (searchParams.get("editBuildId") || searchParams.get("importBuildId")) return;

    let localDraft: StoredDraft | null = null;
    try {
      const raw = window.localStorage.getItem(key);
      localDraft = raw ? (JSON.parse(raw) as StoredDraft) : null;
    } catch {
      localDraft = null;
    }

    let cancelled = false;
    const params = new URLSearchParams({ characterId: selectedCharacter.id });
    if (activeElement) params.set("element", activeElement);
    fetch(`/api/drafts?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const server: ServerDraft | null = data?.draft ?? null;
        if (!server) {
          if (localDraft) setReconcile({ kind: "import", local: localDraft });
          return;
        }
        if (!localDraft) {
          applyStoredDraft(server);
          return;
        }
        if (!sameDraftContent(localDraft, server)) {
          setReconcile({ kind: "conflict", local: localDraft, server });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isAuthenticated, selectedCharacter, activeElement]);

  useEffect(() => {
    const editBuildId = searchParams.get("editBuildId");
    const importBuildId = searchParams.get("importBuildId");
    const mode = editBuildId ? "edit" : importBuildId ? "import" : null;
    const buildId = editBuildId ?? importBuildId;
    if (!mode || !buildId) return;

    const loadKey = `${mode}:${buildId}`;
    if (loadedSharedBuildRef.current === loadKey) return;
    loadedSharedBuildRef.current = loadKey;

    let cancelled = false;
    setMessage(mode === "edit" ? t("editLoading") : t("baseLoadingMsg"));

    fetch(`/api/builds/${buildId}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "Build introuvable.");
        return data.build as LoadedCommunityBuild;
      })
      .then((build) => {
        if (cancelled) return;
        if (mode === "edit" && !build.editableByMe) {
          setMessage(t("cannotEdit"));
          return;
        }

        const targetCharacter = options.characters.find((character) => character.id === build.characterId);
        if (!targetCharacter) {
          setMessage(t("characterMissing"));
          return;
        }

        const nextElement = asElementKey(build.element) ?? targetCharacter.elements[0]?.key ?? null;
        const nextTitle = mode === "import" ? `Copie - ${build.title}`.slice(0, 60) : build.title;
        const updatedAt = new Date().toISOString();
        const importedDraft: StoredDraft = {
          title: nextTitle,
          note: build.note ?? "",
          payload: build.payload,
          updatedAt,
        };

        window.localStorage.setItem(draftKey(build.characterId, nextElement), JSON.stringify(importedDraft));
        hydratedRef.current = false;
        setEditingBuildId(mode === "edit" ? build.id : null);
        setCharacterId(build.characterId);
        setElement(nextElement);
        setTitle(nextTitle);
        setNote(build.note ?? "");
        applyPayload(build.payload);
        setStatus("saved");
        setSavedAt(new Date(updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
        window.setTimeout(() => {
          if (cancelled) return;
          hydratedRef.current = true;
          setMessage(mode === "edit" ? t("editModeActive") : t("baseLoaded"));
        }, 0);
      })
      .catch((error: Error) => {
        if (!cancelled) setMessage(error.message || t("loadFailed"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, options.characters]);

  useEffect(() => {
    if (!hydratedRef.current || !selectedCharacter || !key) return;
    setStatus("dirty");
    const handle = window.setTimeout(async () => {
      const updatedAt = new Date().toISOString();
      const stored: StoredDraft = { title, note, payload, updatedAt };
      window.localStorage.setItem(key, JSON.stringify(stored));

      if (!isAuthenticated) {
        setStatus("saved");
        setSavedAt(new Date(updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
        return;
      }

      setStatus("saving");
      const response = await fetch("/api/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          element: activeElement,
          title: title || null,
          note: note || null,
          payload,
        }),
      });

      setStatus(response.ok ? "saved" : "error");
      if (response.ok) {
        setSavedAt(new Date(updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      }
    }, 850);

    return () => window.clearTimeout(handle);
  }, [activeElement, isAuthenticated, key, note, payload, selectedCharacter, title]);

  useEffect(() => {
    setCanShareNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // Lien auto-portant : si l'URL contient ?b=<build>, on pré-remplit le builder.
  useEffect(() => {
    if (loadedShareParamRef.current) return;
    const param = searchParams.get("b");
    if (!param) return;
    loadedShareParamRef.current = true;
    const result = decodeBuildParam(param, options);
    if (!result.ok) {
      setMessage(result.errors[0] ?? t("loadFailed"));
      return;
    }
    const data = result.data;
    const targetCharacter = options.characters.find((c) => c.id === data.characterId);
    if (!targetCharacter) {
      setMessage(t("characterMissing"));
      return;
    }
    const nextElement = asElementKey(data.element) ?? targetCharacter.elements[0]?.key ?? null;
    const updatedAt = new Date().toISOString();
    const importedDraft: StoredDraft = { title: data.title, note: data.note ?? "", payload: data.payload, updatedAt };
    window.localStorage.setItem(draftKey(data.characterId, nextElement), JSON.stringify(importedDraft));
    hydratedRef.current = false;
    setEditingBuildId(null);
    setCharacterId(data.characterId);
    setElement(nextElement);
    setTitle(data.title);
    setNote(data.note ?? "");
    applyPayload(data.payload);
    setStatus("saved");
    window.setTimeout(() => {
      hydratedRef.current = true;
      setMessage(t("baseLoaded"));
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, options]);

  function shareUrlValue(): string | null {
    const exported = currentExport();
    if (!exported) return null;
    return `${window.location.origin}${window.location.pathname}?b=${encodeBuildParam(exported)}`;
  }

  function shareMessage(): string {
    return t("shareText", { character: selectedCharacter?.name ?? "" });
  }

  async function copyShareLink() {
    const url = shareUrlValue();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setMessage(t("shareLinkCopied"));
    } catch {
      setMessage(url);
    }
  }

  function openShare(href: string) {
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function shareToX() {
    const url = shareUrlValue();
    if (url) openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage())}&url=${encodeURIComponent(url)}`);
  }

  function shareToFacebook() {
    const url = shareUrlValue();
    if (url) openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  }

  function shareToReddit() {
    const url = shareUrlValue();
    if (url) openShare(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareMessage())}`);
  }

  async function shareNative() {
    const url = shareUrlValue();
    if (!url) return;
    try {
      await navigator.share({ title: shareMessage(), text: shareMessage(), url });
    } catch {
      /* annulé par l'utilisateur */
    }
  }

  function pickTeammate(item: DnaPickerItem) {
    setTeam((current) =>
      current.length >= 3 || current.some((member) => member.character.id === item.id)
        ? current
        : [...current, { character: item, role: DEFAULT_ROLE }],
    );
    setEditing(null);
  }

  function pickMod(item: DnaPickerItem) {
    if (!editing) return;
    if (editing.kind === "center") {
      if (!isCenterDemonWedgeItemId(item.id)) {
        setMessage(t("centerModError"));
        return;
      }
      setCenterItem(item);
    } else if (editing.kind === "demon") {
      setDemonSlots((slots) =>
        slots.map((slot) =>
          slot.position === editing.position ? { ...slot, item, track: normalizeTrack(item.polarity) } : slot,
        ),
      );
    } else if (editing.kind === "consonance") {
      setConsonanceSlots((slots) =>
        slots.map((slot) =>
          slot.position === editing.position ? { ...slot, item, track: normalizeTrack(item.polarity) } : slot,
        ),
      );
    }
    setEditing(null);
  }

  function applyStoredDraft(draft: { title?: string | null; note?: string | null; payload: CommunityBuildPayload; updatedAt: string }) {
    hydratedRef.current = false;
    setTitle(draft.title ?? "");
    setNote(draft.note ?? "");
    applyPayload(draft.payload);
    setStatus("saved");
    setSavedAt(fmtDraftTime(draft.updatedAt));
    window.setTimeout(() => {
      hydratedRef.current = true;
    }, 0);
  }

  async function pushLocalToServer(draft: StoredDraft) {
    if (!selectedCharacter) return;
    setStatus("saving");
    const response = await fetch("/api/drafts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: selectedCharacter.id,
        element: activeElement,
        title: draft.title || null,
        note: draft.note || null,
        payload: draft.payload,
      }),
    });
    setStatus(response.ok ? "saved" : "error");
  }

  async function loadServerDraft() {
    if (!selectedCharacter) return;
    setEditingBuildId(null);
    const params = new URLSearchParams({ characterId: selectedCharacter.id });
    if (activeElement) params.set("element", activeElement);
    const response = await fetch(`/api/drafts?${params.toString()}`);
    if (!response.ok) {
      setMessage(t("serverDraftLoadError"));
      return;
    }
    const data = await response.json();
    if (!data.draft) {
      setMessage(t("noServerDraft"));
      return;
    }
    applyStoredDraft(data.draft as ServerDraft);
  }

  async function publishBuild() {
    if (!selectedCharacter) return;
    setPublishing(true);
    setMessage(null);
    const isUpdating = Boolean(editingBuildId);
    const response = await fetch(isUpdating ? `/api/builds/${editingBuildId}` : "/api/builds", {
      method: isUpdating ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isUpdating
          ? {
              title,
              note: note || null,
              payload,
            }
          : {
              characterId: selectedCharacter.id,
              element: activeElement,
              title,
              note: note || null,
              payload,
            },
      ),
    });
    const data = await response.json().catch(() => ({}));
    setPublishing(false);

    if (!response.ok) {
      setMessage(data.error ?? t("publishFailed"));
      return;
    }

    if (!isUpdating) window.localStorage.removeItem(key);
    if (!isUpdating && isAuthenticated) {
      const params = new URLSearchParams({ characterId: selectedCharacter.id });
      if (activeElement) params.set("element", activeElement);
      void fetch(`/api/drafts?${params.toString()}`, { method: "DELETE" });
    }
    setStatus("saved");
    setMessage(isUpdating ? t("buildUpdated") : t("buildPublished"));
  }

  function currentExport() {
    if (!selectedCharacter) return null;

    try {
      const exported = createCommunityBuildExport({
        characterId: selectedCharacter.id,
        element: activeElement,
        title: title || `${selectedCharacter.name} build`,
        note,
        payload,
      });
      const validated = validateCommunityBuildExport(exported, options);
      if (!validated.ok) {
        setMessage(validated.errors.slice(0, 3).join(" "));
        return null;
      }

      return validated.data;
    } catch {
      setMessage(t("exportFailed"));
      return null;
    }
  }

  function downloadBuild(format: "json" | "xml") {
    const exported = currentExport();
    if (!exported) return;

    const text = format === "json" ? serializeBuildJson(exported) : serializeBuildXml(exported);
    const blob = new Blob([text], {
      type: format === "json" ? "application/json;charset=utf-8" : "application/xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exported.characterId}-${exported.element ?? "build"}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(t("exportReady", { format: format.toUpperCase() }));
  }

  function openImport(format: "json" | "xml") {
    setEditingBuildId(null);
    importFormatRef.current = format;
    importInputRef.current?.click();
  }

  async function importBuild(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;

    const format = importFormatRef.current;
    const text = await file.text();
    const parsed =
      format === "json" ? parseBuildJsonText(text, options) : parseBuildXmlText(text, options);

    if (!parsed.ok) {
      setMessage(parsed.errors.slice(0, 3).join(" "));
      return;
    }

    const imported = parsed.data;
    const updatedAt = new Date().toISOString();
    const importedDraft: StoredDraft = {
      title: imported.title,
      note: imported.note ?? "",
      payload: imported.payload,
      updatedAt,
    };

    window.localStorage.setItem(draftKey(imported.characterId, imported.element), JSON.stringify(importedDraft));
    hydratedRef.current = false;
    setEditingBuildId(null);
    setCharacterId(imported.characterId);
    setElement(imported.element);
    setTitle(imported.title);
    setNote(imported.note ?? "");
    applyPayload(imported.payload);
    setStatus("saved");
    setSavedAt(new Date(updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    setMessage("Build importe.");
    window.setTimeout(() => {
      hydratedRef.current = true;
    }, 0);
  }

  if (!selectedCharacter) {
    return <DnaPanel className="p-5 text-parch">{t("noCharacters")}</DnaPanel>;
  }

  return (
    <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("character")}</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-4">
            <BuilderCharacterPicker
              characters={options.characters}
              value={selectedCharacter.id}
              onChange={selectCharacter}
              statusNode={<DnaDraftStatus state={status} savedAt={savedAt} />}
            />

            {selectedCharacter.elements.length > 1 ? (
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="font-caps text-[0.62rem] uppercase tracking-[0.16em] text-gold">{t("element")}</span>
                <DnaSegmented
                  value={activeElement ?? selectedCharacter.elements[0].key}
                  onChange={(value) => {
                    setEditingBuildId(null);
                    setElement(value as ElementKey);
                  }}
                  options={selectedCharacter.elements.map((item) => ({
                    value: item.key,
                    label: item.label,
                  }))}
                />
              </div>
            ) : null}
          </div>
        </DnaPanel>

        {reconcile ? (
          <DnaPanel className="border-gold/40 p-4">
            {reconcile.kind === "conflict" ? (
              <div className="flex flex-col gap-2">
                <p className="font-sans text-sm text-parch">{t("conflictPrompt")}</p>
                <div className="flex flex-wrap gap-2">
                  <DnaButton
                    variant="gold"
                    onClick={() => {
                      applyStoredDraft(reconcile.server);
                      setReconcile(null);
                    }}
                  >
                    {t("accountVersion", { time: fmtDraftTime(reconcile.server.updatedAt) })}
                  </DnaButton>
                  <DnaButton
                    variant="ghost"
                    onClick={() => {
                      void pushLocalToServer(reconcile.local);
                      setReconcile(null);
                    }}
                  >
                    {t("thisDevice", { time: fmtDraftTime(reconcile.local.updatedAt) })}
                  </DnaButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-sans text-sm text-parch">{t("localDraftUnsynced")}</p>
                <div className="flex gap-2">
                  <DnaButton
                    variant="gold"
                    onClick={() => {
                      void pushLocalToServer(reconcile.local);
                      setReconcile(null);
                    }}
                  >
                    {t("syncDraft")}
                  </DnaButton>
                  <DnaButton variant="ghost" onClick={() => setReconcile(null)}>
                    {t("ignore")}
                  </DnaButton>
                </div>
              </div>
            )}
          </DnaPanel>
        ) : null}

        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("identity")}</DnaSectionLabel>
          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div>
              <DnaField
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={60}
                placeholder={t("namePlaceholder")}
                wrapClassName="w-full"
              />
              <p className="mt-1 text-right font-sans text-[0.68rem] text-muted-2">{title.trim().length}/60</p>
            </div>
            <label className="flex flex-col gap-1">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={200}
                placeholder={t("notePlaceholder")}
                className="min-h-20 w-full min-w-0 resize-y border border-white/20 bg-ink/70 px-3 py-2 font-sans text-sm text-parch outline-none placeholder:text-muted-2 focus:border-gold"
              />
              <span className="self-end font-sans text-[0.68rem] text-muted-2">{note.trim().length}/200</span>
            </label>
          </div>
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("categories")}</DnaSectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {BUILD_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <DnaChip
                  key={tag}
                  selected={active}
                  onClick={() => setTags((current) => (active ? current.filter((value) => value !== tag) : [...current, tag]))}
                >
                  {t(`tagLabels.${tag}`)}
                </DnaChip>
              );
            })}
          </div>
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("weapons")}</DnaSectionLabel>
          <div className="mt-3 grid gap-4 xl:grid-cols-2">
            <div>
              <p className="mb-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted">{t("melee")}</p>
              <DnaSlotRow entries={meleeWeapons} pool={options.weapons} max={3} label={t("pickMeleeWeapon")} onChange={setMeleeWeapons} />
            </div>
            <div>
              <p className="mb-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted">{t("ranged")}</p>
              <DnaSlotRow entries={rangedWeapons} pool={options.weapons} max={3} label={t("pickRangedWeapon")} onChange={setRangedWeapons} />
            </div>
          </div>
        </DnaPanel>

        <DnaPanel className="p-5 md:p-6">
          <DnaSectionLabel>{t("demonWedges")}</DnaSectionLabel>
          <div className="mt-5 overflow-x-auto pb-3 pt-1">
            <DnaDemonWedgeEditor
              slots={demonSlots}
              centerItem={centerItem}
              accentHex={accentHex}
              scale="xl"
              className="min-w-[34rem]"
              onChange={setDemonSlots}
              onSlotClick={(position) => setEditing({ kind: "demon", position })}
              onCenterClick={() => setEditing({ kind: "center" })}
            />
          </div>
        </DnaPanel>

        {consonanceWeapon ? (
          <DnaPanel className="p-4">
            <DnaSectionLabel>{t("consonance")}</DnaSectionLabel>
            <div className="mt-4 overflow-x-auto pb-2">
              <DnaConsonanceEditor
                slots={consonanceSlots}
                weapon={consonanceWeapon}
                accentHex={accentHex}
                scale="lg"
                onChange={setConsonanceSlots}
                onSlotClick={(position) => setEditing({ kind: "consonance", position })}
              />
            </div>
          </DnaPanel>
        ) : null}

        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("genimons")}</DnaSectionLabel>
          <div className="mt-3">
            <DnaSlotRow
              entries={genimons}
              pool={options.genimons}
              max={3}
              label={t("pickGenimon")}
              allowRanks={false}
              onChange={setGenimons}
            />
          </div>
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("team")}</DnaSectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {team.map((member, index) => (
              <div
                key={member.character.id}
                className="relative flex w-32 flex-col items-center gap-1.5 border border-white/8 bg-gradient-to-b from-[rgba(34,29,21,0.55)] to-[rgba(14,12,9,0.8)] p-2.5 text-center"
              >
                <button
                  type="button"
                  onClick={() => setTeam((current) => current.filter((_, i) => i !== index))}
                  aria-label={t("close")}
                  className="absolute right-1 top-1 z-[3] flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-ink/80 text-[0.7rem] leading-none text-muted hover:border-crimson-bright hover:text-[#ffb3a6]"
                >
                  ×
                </button>
                <span className="grid aspect-square w-full place-items-center overflow-hidden bg-black/25">
                  {member.character.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.character.icon} alt={member.character.name} className="h-full w-full object-cover object-[50%_14%]" />
                  ) : (
                    <span className="font-display text-2xl text-muted-2">◇</span>
                  )}
                </span>
                <span className="line-clamp-2 min-h-[2.1em] font-sans text-[0.72rem] leading-tight text-parch">
                  {member.character.name}
                </span>
                <select
                  value={member.role}
                  onChange={(event) => {
                    const role = event.target.value as TeamRole;
                    setTeam((current) => current.map((m, i) => (i === index ? { ...m, role } : m)));
                  }}
                  aria-label={t("roleLabel")}
                  className="w-full border border-white/15 bg-ink/70 px-1.5 py-1 font-sans text-[0.7rem] text-parch outline-none focus:border-gold"
                >
                  {TEAM_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {team.length < 3 ? (
              <button
                type="button"
                onClick={() => setEditing({ kind: "team" })}
                className="flex w-32 flex-col items-center justify-center gap-1 border border-dashed border-white/20 bg-white/2 p-2 text-muted-2 transition-colors hover:border-gold hover:text-gold"
              >
                <span className="text-2xl leading-none">＋</span>
                <span className="font-caps text-[0.55rem] uppercase tracking-[0.16em]">{t("addTeammate")}</span>
              </button>
            ) : null}
          </div>
        </DnaPanel>
      </div>

      <aside className="grid min-w-0 gap-4 md:grid-cols-2 2xl:flex 2xl:flex-col">
        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("priorities")}</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-4">
            <div>
              <p className="mb-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted">{t("stats")}</p>
              <DnaPriorityList items={statsPriority} pool={STATS_POOL} max={6} onChange={setStatsPriority} />
            </div>
            <div>
              <p className="mb-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted">{t("skills")}</p>
              <DnaPriorityList items={skillPriority} pool={SKILL_POOL} max={3} onChange={setSkillPriority} />
            </div>
          </div>
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("importExport")}</DnaSectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <DnaButton
              variant="ghost"
              className="px-3"
              icon={<Download className="h-4 w-4" />}
              onClick={() => downloadBuild("json")}
            >
              JSON
            </DnaButton>
            <DnaButton
              variant="ghost"
              className="px-3"
              icon={<Download className="h-4 w-4" />}
              onClick={() => downloadBuild("xml")}
            >
              XML
            </DnaButton>
            <DnaButton
              variant="ghost"
              className="px-3"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => openImport("json")}
            >
              JSON
            </DnaButton>
            <DnaButton
              variant="ghost"
              className="px-3"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => openImport("xml")}
            >
              XML
            </DnaButton>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,.xml,application/json,text/xml,application/xml"
            className="hidden"
            onChange={importBuild}
          />
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("share")}</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-2">
            <DnaButton variant="ghost" className="px-3" icon={<Link2 className="h-4 w-4" />} onClick={copyShareLink}>
              {t("shareCopyLink")}
            </DnaButton>
            <div className="grid grid-cols-3 gap-2">
              <DnaButton variant="ghost" className="px-2 text-xs" onClick={shareToX}>X</DnaButton>
              <DnaButton variant="ghost" className="px-2 text-xs" onClick={shareToFacebook}>Facebook</DnaButton>
              <DnaButton variant="ghost" className="px-2 text-xs" onClick={shareToReddit}>Reddit</DnaButton>
            </div>
            {canShareNative ? (
              <DnaButton variant="ghost" className="px-3" icon={<Share2 className="h-4 w-4" />} onClick={shareNative}>
                {t("shareNative")}
              </DnaButton>
            ) : null}
          </div>
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>{t("publication")}</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                {editingBuildId ? (
                  <p className="border border-gold/25 bg-gold/10 px-3 py-2 font-sans text-xs leading-relaxed text-gold">
                    {t("editModeHint")}
                  </p>
                ) : null}
                <DnaButton variant="gold" disabled={publishing || title.trim().length < 3} onClick={publishBuild}>
                  {publishing ? (editingBuildId ? t("updating") : t("publishing")) : editingBuildId ? t("update") : t("publish")}
                </DnaButton>
                <DnaButton variant="ghost" onClick={loadServerDraft}>
                  {t("loadServerDraft")}
                </DnaButton>
              </>
            ) : (
              <p className="font-sans text-sm text-muted">
                {t("loginToPublish")}
              </p>
            )}
            {message ? <p className="mt-2 font-sans text-sm text-gold">{message}</p> : null}
          </div>
        </DnaPanel>
      </aside>

      {editing && canPortal ? createPortal(
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditing(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-5xl overflow-y-auto border border-line/25 bg-panel/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.7)] md:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-caps text-xs uppercase tracking-[0.18em] text-gold">
                {editing.kind === "team" ? t("pickTeammate") : editing.kind === "center" ? t("pickCenterMod") : t("pickMod")}
              </h3>
              <DnaButton onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs">
                {t("close")}
              </DnaButton>
            </div>
            <DnaItemPicker
              items={editing.kind === "team" ? teamPool : editing.kind === "center" ? centerMods : options.mods}
              usedIds={editing.kind === "team" ? team.map((member) => member.character.id) : undefined}
              columns={6}
              minColumnWidth="8.25rem"
              onSelect={editing.kind === "team" ? pickTeammate : pickMod}
            />
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
