"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { Download, Upload } from "lucide-react";
import { BuilderCharacterPicker } from "@/components/builder/CharacterPicker";
import { DnaButton } from "@/components/dna/Button";
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
  parseBuildJsonText,
  parseBuildXmlText,
  serializeBuildJson,
  serializeBuildXml,
  validateCommunityBuildExport,
} from "@/lib/community-builds/build-io";
import { isCenterDemonWedgeItemId } from "@/lib/community-builds/center-wedges";
import type { BuilderOptions } from "@/lib/community-builds/options";
import type { CommunityBuildPayload } from "@/lib/community-builds/validation";

const STATS_POOL: PriorityItem[] = [
  { id: "ATK", label: "ATQ" },
  { id: "CritRate", label: "Taux Crit." },
  { id: "CritDmg", label: "Dégâts Crit." },
  { id: "SkillDmg", label: "Dégâts de compétence" },
  { id: "ElementDmg", label: "Dégâts élémentaires" },
  { id: "HP", label: "PV" },
  { id: "DEF", label: "DÉF" },
];

const SKILL_POOL: PriorityItem[] = [
  { id: "skill-1", label: "Compétence 1", sublabel: "Attaque normale" },
  { id: "skill-2", label: "Compétence 2", sublabel: "Esquive / outil" },
  { id: "skill-3", label: "Compétence 3", sublabel: "Ultime" },
];

function subscribeMounted() {
  return () => undefined;
}

type EditingTarget =
  | { kind: "demon"; position: number }
  | { kind: "center" }
  | { kind: "consonance"; position: number }
  | null;

type StoredDraft = {
  title: string;
  note: string;
  payload: CommunityBuildPayload;
  updatedAt: string;
};

function emptyWedgeSlots(max: number): WedgeSlotData[] {
  return Array.from({ length: max }, (_, index) => ({ position: index + 1, item: null, track: null }));
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

export function CommunityBuildBuilderClient({
  options,
  isAuthenticated,
}: {
  options: BuilderOptions;
  isAuthenticated: boolean;
}) {
  const firstCharacter = options.characters[0];
  const [characterId, setCharacterId] = useState(firstCharacter?.id ?? "");
  const selectedCharacter = useMemo(
    () => options.characters.find((character) => character.id === characterId) ?? firstCharacter,
    [characterId, firstCharacter, options.characters],
  );
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
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [status, setStatus] = useState<DraftState>("idle");
  const [savedAt, setSavedAt] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const canPortal = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const hydratedRef = useRef(false);
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
            track: slot.track ?? slot.item!.polarity ?? null,
          })),
        centerItemId: centerItem?.id ?? null,
        affinity: activeElement,
      },
      genimon: entriesToPayload(genimons),
      consonanceWeapon: consonanceWeapon
        ? { slots: consonanceSlots.filter((slot) => slot.item).map((slot) => slot.item!.id) }
        : null,
      statsPriority: statsPriority.map((item) => item.id),
      skillPriority: skillPriority.map((item, index) => ({
        skillName: item.label,
        skillIndex: Number(item.id.replace("skill-", "")) || undefined,
        priority: index + 1,
      })),
      team: [],
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
        return found && item ? { position: slot.position, item, track: found.track ?? item.polarity } : slot;
      }),
    );
    const nextCenterItem = itemById(options.mods, next.demonWedges.centerItemId);
    setCenterItem(nextCenterItem && isCenterDemonWedgeItemId(nextCenterItem.id) ? nextCenterItem : null);
    setConsonanceSlots(
      emptyWedgeSlots(4).map((slot) => {
        const id = next.consonanceWeapon?.slots[slot.position - 1];
        const item = itemById(options.mods, id);
        return item ? { position: slot.position, item, track: item.polarity } : slot;
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
    setStatus("idle");
    setSavedAt(undefined);
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

  function pickMod(item: DnaPickerItem) {
    if (!editing) return;
    if (editing.kind === "center") {
      if (!isCenterDemonWedgeItemId(item.id)) {
        setMessage("Ce Demon Wedge ne peut pas etre place au centre du build.");
        return;
      }
      setCenterItem(item);
    } else if (editing.kind === "demon") {
      setDemonSlots((slots) =>
        slots.map((slot) =>
          slot.position === editing.position ? { ...slot, item, track: item.polarity } : slot,
        ),
      );
    } else {
      setConsonanceSlots((slots) =>
        slots.map((slot) =>
          slot.position === editing.position ? { ...slot, item, track: item.polarity } : slot,
        ),
      );
    }
    setEditing(null);
  }

  async function loadServerDraft() {
    if (!selectedCharacter) return;
    const params = new URLSearchParams({ characterId: selectedCharacter.id });
    if (activeElement) params.set("element", activeElement);
    const response = await fetch(`/api/drafts?${params.toString()}`);
    if (!response.ok) {
      setMessage("Impossible de charger le brouillon serveur.");
      return;
    }
    const data = await response.json();
    if (!data.draft) {
      setMessage("Aucun brouillon serveur pour ce personnage.");
      return;
    }
    hydratedRef.current = false;
    setTitle(data.draft.title ?? "");
    setNote(data.draft.note ?? "");
    applyPayload(data.draft.payload);
    setStatus("saved");
    setSavedAt(new Date(data.draft.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    window.setTimeout(() => {
      hydratedRef.current = true;
    }, 0);
  }

  async function publishBuild() {
    if (!selectedCharacter) return;
    setPublishing(true);
    setMessage(null);
    const response = await fetch("/api/builds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: selectedCharacter.id,
        element: activeElement,
        title,
        note: note || null,
        payload,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setPublishing(false);

    if (!response.ok) {
      setMessage(data.error ?? "Publication impossible.");
      return;
    }

    window.localStorage.removeItem(key);
    if (isAuthenticated) {
      const params = new URLSearchParams({ characterId: selectedCharacter.id });
      if (activeElement) params.set("element", activeElement);
      void fetch(`/api/drafts?${params.toString()}`, { method: "DELETE" });
    }
    setStatus("saved");
    setMessage("Build publié. Il apparaîtra dans les alternatives communauté.");
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
      setMessage("Le build courant ne peut pas etre exporte.");
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
    setMessage(`Export ${format.toUpperCase()} pret.`);
  }

  function openImport(format: "json" | "xml") {
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
    return <DnaPanel className="p-5 text-parch">Aucun personnage disponible.</DnaPanel>;
  }

  return (
    <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <DnaPanel className="p-4">
          <DnaSectionLabel>Personnage</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-4">
            <BuilderCharacterPicker
              characters={options.characters}
              value={selectedCharacter.id}
              onChange={selectCharacter}
              statusNode={<DnaDraftStatus state={status} savedAt={savedAt} />}
            />

            {selectedCharacter.elements.length > 1 ? (
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="font-caps text-[0.62rem] uppercase tracking-[0.16em] text-gold">Élément</span>
                <DnaSegmented
                  value={activeElement ?? selectedCharacter.elements[0].key}
                  onChange={(value) => setElement(value as ElementKey)}
                  options={selectedCharacter.elements.map((item) => ({
                    value: item.key,
                    label: item.label,
                  }))}
                />
              </div>
            ) : null}
          </div>
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>Identité du build</DnaSectionLabel>
          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div>
              <DnaField
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={60}
                placeholder="Nom du build"
                wrapClassName="w-full"
              />
              <p className="mt-1 text-right font-sans text-[0.68rem] text-muted-2">{title.trim().length}/60</p>
            </div>
            <label className="flex flex-col gap-1">
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={200}
                placeholder="Note courte optionnelle"
                className="min-h-20 w-full min-w-0 resize-y border border-white/20 bg-ink/70 px-3 py-2 font-sans text-sm text-parch outline-none placeholder:text-muted-2 focus:border-gold"
              />
              <span className="self-end font-sans text-[0.68rem] text-muted-2">{note.trim().length}/200</span>
            </label>
          </div>
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>Armes</DnaSectionLabel>
          <div className="mt-3 grid gap-4 xl:grid-cols-2">
            <div>
              <p className="mb-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted">Melee</p>
              <DnaSlotRow entries={meleeWeapons} pool={options.weapons} label="Choisir une arme melee" onChange={setMeleeWeapons} />
            </div>
            <div>
              <p className="mb-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted">Ranged</p>
              <DnaSlotRow entries={rangedWeapons} pool={options.weapons} label="Choisir une arme ranged" onChange={setRangedWeapons} />
            </div>
          </div>
        </DnaPanel>

        <DnaPanel className="p-5 md:p-6">
          <DnaSectionLabel>Demon Wedges</DnaSectionLabel>
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
            <DnaSectionLabel>Consonance</DnaSectionLabel>
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
          <DnaSectionLabel>Génimons</DnaSectionLabel>
          <div className="mt-3">
            <DnaSlotRow
              entries={genimons}
              pool={options.genimons}
              label="Choisir un génimon"
              allowRanks={false}
              onChange={setGenimons}
            />
          </div>
        </DnaPanel>
      </div>

      <aside className="grid min-w-0 gap-4 md:grid-cols-2 2xl:flex 2xl:flex-col">
        <DnaPanel className="p-4">
          <DnaSectionLabel>Priorités</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-4">
            <div>
              <p className="mb-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted">Stats</p>
              <DnaPriorityList items={statsPriority} pool={STATS_POOL} max={6} onChange={setStatsPriority} />
            </div>
            <div>
              <p className="mb-2 font-caps text-[0.62rem] uppercase tracking-[0.16em] text-muted">Compétences</p>
              <DnaPriorityList items={skillPriority} pool={SKILL_POOL} max={3} onChange={setSkillPriority} />
            </div>
          </div>
        </DnaPanel>

        <DnaPanel className="p-4">
          <DnaSectionLabel>Import / Export</DnaSectionLabel>
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
          <DnaSectionLabel>Publication</DnaSectionLabel>
          <div className="mt-3 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <DnaButton variant="gold" disabled={publishing || title.trim().length < 3} onClick={publishBuild}>
                  {publishing ? "Publication..." : "Publier"}
                </DnaButton>
                <DnaButton variant="ghost" onClick={loadServerDraft}>
                  Charger brouillon serveur
                </DnaButton>
              </>
            ) : (
              <p className="font-sans text-sm text-muted">
                Connecte-toi avec Discord pour synchroniser et publier. Le brouillon local reste sauvegardé sur ce navigateur.
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
                {editing.kind === "center" ? "Choisir un MOD central" : "Choisir un MOD"}
              </h3>
              <DnaButton onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs">
                Fermer
              </DnaButton>
            </div>
            <DnaItemPicker
              items={editing.kind === "center" ? centerMods : options.mods}
              columns={6}
              minColumnWidth="8.25rem"
              onSelect={pickMod}
            />
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
