/**
 * Contrôle de la carte après une mise à jour boarhat (`update-app-maps.ts`).
 *
 *   bun run scripts/check-map-taxonomy.ts          (régénère l'index + rapport)
 *   bun run scripts/check-map-taxonomy.ts --dry    (rapport seul)
 *
 * 1. Régénère `src/data/maps/progress-index.json`. Indispensable : un point
 *    absent de l'index ne compte pas dans les pourcentages, et le serveur
 *    ÉCARTE sa coche à la synchronisation (validation par sets fermés).
 * 2. Liste ce que la taxonomie ne sait pas encore ranger :
 *    - types inconnus → affichés quand même, dans « Autres », en anglais ;
 *      à rattacher dans `BY_NAME` (`src/lib/map/taxonomy.ts`) ;
 *    - étiquettes de lieux sans nom officiel → `PLACE_KEYS` de
 *      `research_data/scripts/gen-map-world.mjs` ;
 *    - cartes absentes de `world.json` → accessibles dans « Nouvelles zones »,
 *      à ranger dans `SITE_MAP` du même script (+ slug dans `slugs.ts`).
 * 3. Compare l'ancien index au nouveau : des clés qui DISPARAISSENT en masse
 *    signalent un renommage de catégorie chez boarhat (la clé d'un point
 *    contient le nom de sa catégorie) — les coches des joueurs sur ces points
 *    seraient perdues. À traiter avant de publier.
 *
 * Code de sortie 1 s'il y a quelque chose à regarder.
 */
import fs from "node:fs";
import mapIndex from "../src/data/mapIndex.json";
import world from "../src/data/maps/world.json";
import { normalizeMap } from "../src/lib/map/taxonomy";
import type { GameMap } from "../src/types/map";

const INDEX_FILE = "src/data/maps/progress-index.json";
const dry = process.argv.includes("--dry");

const previous = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8")) as Record<string, Record<string, string[]>>;
const listed = new Set(world.nations.flatMap((n) => n.areas.flatMap((a) => a.maps.map((m) => m.id))));

const next: Record<string, Record<string, string[]>> = {};
const unknownTypes = new Map<string, string[]>();
const unnamedPlaces = new Map<string, string[]>();
const unlistedMaps: string[] = [];

for (const { id } of mapIndex) {
  const map = JSON.parse(fs.readFileSync(`src/data/maps/${id}.json`, "utf8")) as GameMap;
  const normalized = normalizeMap(map);
  if (!listed.has(id)) unlistedMaps.push(id);

  const byCategory: Record<string, string[]> = {};
  for (const t of normalized.types) {
    if (t.id.startsWith("raw:")) unknownTypes.set(t.rawName, [...(unknownTypes.get(t.rawName) ?? []), `${id}(${t.points.length})`]);
    if (t.tracked) (byCategory[t.category] ??= []).push(...t.points.map((p) => p.key));
  }
  for (const keys of Object.values(byCategory)) keys.sort();
  next[id] = byCategory;
  for (const p of normalized.places)
    if (!p.name) unnamedPlaces.set(p.title, [...(unnamedPlaces.get(p.title) ?? []), id]);
}

const flat = (idx: Record<string, Record<string, string[]>>) => new Set(Object.values(idx).flatMap((m) => Object.values(m).flat()));
const before = flat(previous);
const after = flat(next);
const removed = [...before].filter((k) => !after.has(k));
const added = [...after].filter((k) => !before.has(k));

if (!dry) fs.writeFileSync(INDEX_FILE, JSON.stringify(next) + "\n");

const section = (title: string, lines: string[]) => {
  console.log(`\n${title} (${lines.length})`);
  for (const l of lines.slice(0, 40)) console.log(`  - ${l}`);
  if (lines.length > 40) console.log(`  … ${lines.length - 40} de plus`);
};

console.log(`Index de progression : ${after.size} points suivis (${added.length} nouveaux, ${removed.length} disparus)${dry ? " — non écrit (--dry)" : " — écrit"}`);
section("Types inconnus (→ « Autres »)", [...unknownTypes].map(([n, where]) => `${n} : ${where.join(", ")}`));
section("Lieux sans nom officiel", [...unnamedPlaces].map(([n, where]) => `${n} : ${where.join(", ")}`));
section("Cartes hors de world.json (→ « Nouvelles zones »)", unlistedMaps);
if (removed.length) {
  const byMapCat = new Map<string, number>();
  for (const k of removed) {
    const [mapId, cat] = k.split("-", 2);
    byMapCat.set(`${mapId} / ${cat}`, (byMapCat.get(`${mapId} / ${cat}`) ?? 0) + 1);
  }
  section("Points suivis disparus (renommage de catégorie ? coches perdues)", [...byMapCat].map(([k, n]) => `${k} : ${n}`));
}

const issues = unknownTypes.size + unnamedPlaces.size + unlistedMaps.length + removed.length;
console.log(issues ? "\n⚠ À regarder avant de publier." : "\n✓ Rien à signaler.");
process.exit(issues ? 1 : 0);
