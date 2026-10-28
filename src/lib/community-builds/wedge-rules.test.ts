import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import modsJson from "@/data/items/mods.items.json";
import charactersJson from "@/data/characters/characters.json";
import type { ElementKey } from "@/components/dna/elements";
import type { ItemRecord } from "@/lib/items/types";
import { canEquipAsCenter, canEquipOnCharacter, checkCharacterWedges, describeWedge } from "./wedge-rules";

const mods = new Map((modsJson as unknown as ItemRecord[]).map((item) => [item.id, item]));
const resolve = (itemId: string) => {
  const item = mods.get(itemId);
  return item ? describeWedge(item) : null;
};
const info = (itemId: string) => resolve(itemId)!;

type Slot = { position: number; itemId: string; track: number | null };
const slots = (ids: string[], tracks: Array<number | null>): Slot[] =>
  ids.map((itemId, index) => ({ position: index + 1, itemId, track: tracks[index] }));

describe("describeWedge", () => {
  it("lit le pool, l'élément, le centre et le cumul depuis le catalogue", () => {
    expect(info("mods-51413")).toMatchObject({ pool: "character", element: "Dark", core: false, stackable: false });
    expect(info("mods-32301")).toMatchObject({ pool: "weapon", element: null });
    expect(info("mods-31502")).toMatchObject({ core: true, element: null });
    expect(info("mods-51756")).toMatchObject({ core: true, element: "Wind" });
    expect(info("mods-51754")).toMatchObject({ stackable: true, element: "Wind" });
  });
});

describe("règles de placement", () => {
  it("une case de personnage refuse les pièces d'arme, de centre et d'un autre élément", () => {
    expect(canEquipOnCharacter(info("mods-32301"), "Wind")).toBe(false);
    expect(canEquipOnCharacter(info("mods-31502"), "Wind")).toBe(false);
    expect(canEquipOnCharacter(info("mods-51413"), "Wind")).toBe(false);
    expect(canEquipOnCharacter(info("mods-51413"), "Dark")).toBe(true);
    // Sphinx's : sans élément, posable partout.
    expect(canEquipOnCharacter(info("mods-51313"), "Wind")).toBe(true);
  });

  it("le centre accepte un 3★ générique ou un élémentaire du bon élément", () => {
    expect(canEquipAsCenter(info("mods-31502"), "Dark")).toBe(true);
    expect(canEquipAsCenter(info("mods-51756"), "Wind")).toBe(true);
    expect(canEquipAsCenter(info("mods-51756"), "Dark")).toBe(false);
    expect(canEquipAsCenter(info("mods-51413"), "Dark")).toBe(false);
  });

  it("refuse un doublon hors Covenanter's et une piste qui n'est pas la polarité", () => {
    const errors = checkCharacterWedges(
      { element: "Dark", slots: slots(["mods-51413", "mods-51413", "mods-51311"], [null, null, 2]) },
      resolve,
    );
    expect(errors.some((error) => error.includes("ne se cumule pas"))).toBe(true);
    expect(errors.some((error) => error.includes("piste"))).toBe(true);

    const covenanter = checkCharacterWedges(
      { element: "Wind", slots: slots(["mods-51754", "mods-51754", "mods-51754"], [null, null, null]) },
      resolve,
    );
    expect(covenanter).toEqual([]);
  });
});

// Les trois builds publiés le 21/06/2026, signalés puis supprimés le 28/10 :
// ils doivent être refusés, quel que soit le chemin (builder, import, serveur).
const REJECTED_BUILDS: Array<{ title: string; element: ElementKey; center: string; slots: Slot[] }> = [
  {
    title: "Flora Umbro Marionette",
    element: "Dark",
    center: "mods-51756",
    slots: slots(
      ["mods-51311", "mods-51313", "mods-51314", "mods-51315", "mods-32301", "mods-33321", "mods-51413", "mods-51415"],
      [4, 4, 4, 4, null, null, 1, 1],
    ),
  },
  {
    title: "Daphne Anemo Sub-DPS Azoth",
    element: "Wind",
    center: "mods-51765",
    slots: slots(
      ["mods-51415", "mods-51413", "mods-31502", "mods-31532", "mods-33321", "mods-32301", "mods-51314", "mods-51315"],
      [1, 1, 1, 1, null, null, 4, 4],
    ),
  },
  {
    title: "Outsider Anemo Crossbow Crit",
    element: "Wind",
    center: "mods-51725",
    slots: slots(
      ["mods-51413", "mods-51415", "mods-31502", "mods-31513", "mods-32301", "mods-33321", "mods-51315", "mods-51313"],
      [1, 1, 1, 1, null, null, 4, 4],
    ),
  },
];

describe("builds signalés", () => {
  it.each(REJECTED_BUILDS)("$title est refusé", (build) => {
    const errors = checkCharacterWedges(
      { element: build.element, slots: build.slots, centerItemId: build.center },
      resolve,
    );
    expect(errors.some((error) => error.includes("Demon Wedge d'arme"))).toBe(true);
    expect(errors.some((error) => error.startsWith("Le centre"))).toBe(true);
  });
});

describe("builds vérifiés du site", () => {
  const characters = charactersJson as unknown as Array<{ id: string; element: { key: ElementKey } }>;
  const dir = path.join(process.cwd(), "src/data/characters/builds");
  const files = readdirSync(dir).filter((file) => file.endsWith(".json"));

  it.each(files)("%s respecte les règles de placement", (file) => {
    const builds = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as Array<{
      characterId: string;
      element?: ElementKey;
      demonWedges: { slots: Slot[]; centerItemId?: string | null };
    }>;
    for (const build of builds) {
      const element = build.element ?? characters.find((character) => character.id === build.characterId)?.element.key ?? null;
      expect(checkCharacterWedges({ element, ...build.demonWedges }, resolve)).toEqual([]);
    }
  });
});
