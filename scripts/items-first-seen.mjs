/**
 * Date d'apparition des objets que le jeu ne date pas → `src/data/items/first-seen.json`.
 *
 * Demon Wedges et armes portent leur version de sortie (`stats.releaseVersion`,
 * datée par `mods.version-dates.json`). Ressources, poissons et Géniemons n'en
 * ont aucune dans les tables du jeu : pour eux, un objet est « nouveau » s'il
 * n'existait pas dans le site avant la mise à jour. Le script compare donc les
 * identifiants actuels à ceux d'un commit d'avant la version, et note la date de
 * sortie de chaque objet apparu.
 *
 * Ajout seulement : une date déjà notée n'est jamais réécrite, pour qu'un objet
 * ne redevienne pas « nouveau » à la version suivante.
 *
 *   node scripts/items-first-seen.mjs --since <commit d'avant la version> --date AAAA-MM-JJ
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = resolve(root, "src/data/items/first-seen.json");
const DATASETS = ["mods", "weapons", "resources", "fishing", "genimons"];

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const since = option("since");
const date = option("date");
if (!since || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("Usage : node scripts/items-first-seen.mjs --since <commit> --date AAAA-MM-JJ");
  process.exit(1);
}

const asArray = (json) => (Array.isArray(json) ? json : json.items ?? Object.values(json).find(Array.isArray) ?? []);
const readAt = (ref, path) => JSON.parse(execFileSync("git", ["show", `${ref}:${path}`], { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 }));

const firstSeen = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : { items: {} };
let added = 0;

for (const dataset of DATASETS) {
  const path = `src/data/items/${dataset}.items.json`;
  const before = new Set(asArray(readAt(since, path)).map((item) => item.id));
  const current = asArray(JSON.parse(readFileSync(resolve(root, path), "utf8")));
  // Un objet daté par le jeu n'a pas besoin d'entrée ici.
  const appeared = current.filter((item) => !before.has(item.id) && item.stats?.releaseVersion == null);
  for (const item of appeared) {
    if (firstSeen.items[item.id]) continue;
    firstSeen.items[item.id] = date;
    added += 1;
  }
  console.log(`${dataset.padEnd(10)} ${appeared.length} apparu(s) sans version de sortie`);
}

firstSeen.items = Object.fromEntries(Object.entries(firstSeen.items).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(outFile, JSON.stringify(firstSeen, null, 2) + "\n");
console.log(`${added} entrée(s) ajoutée(s) → ${outFile}`);
