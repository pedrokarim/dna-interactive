#!/usr/bin/env node
/**
 * Applique les pistes d'un personnage depuis le tableau réel de sa fiche.
 *
 *   node scripts/appliquer-pistes.mjs <char-id> <source> [--ecrire]
 *
 * Sans `--ecrire`, se contente d'afficher ce qui changerait.
 *
 * Sécurité : la forme de chaque icône encode la polarité de la pièce posée. Le
 * script compare cette polarité à celle de NOTRE pièce sur la même case. Si ça
 * diverge, c'est que la composition n'est pas la même que sur la fiche — il
 * refuse alors d'écrire plutôt que de poser des pistes sur un build différent.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const mods = new Map(rd("src/data/items/mods.items.json").map((m) => [m.id, m]));
const SHAPE = { Triangle: 1, Crescent: 2, Diamond: 3, Ellipse: 4 };

const [id, source, flag] = process.argv.slice(2);
if (!id || !source) { console.error("usage: node scripts/appliquer-pistes.mjs <char-id> <source> [--ecrire]"); process.exit(1); }
const write = flag === "--ecrire";

const html = await (await fetch(`https://game8.co/games/Duet-Night-Abyss/archives/${source}`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const tables = [];
for (let from = 0; ; ) {
  const i = html.indexOf("Track Adjustments", from);
  if (i === -1) break;
  const end = html.indexOf("</table>", i);
  const t = html.slice(i, end === -1 ? i + 4000 : end);
  const cells = [...t.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1]);
  const slots = new Map();
  let pending = [];
  for (const raw of cells) {
    const label = raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const heads = [...label.matchAll(/Slot\s*(\d+)/g)].map((m) => Number(m[1]));
    if (heads.length || /^Core$/i.test(label)) { pending.push(...(heads.length ? heads : [0])); continue; }
    const alt = /<img[^>]*\balt=['"]([^'"]+)['"]/.exec(raw)?.[1] ?? null;
    const pos = pending.shift();
    if (pos === undefined || pos === 0) continue;
    slots.set(pos, alt && SHAPE[alt] ? SHAPE[alt] : null);
  }
  tables.push(slots);
  from = i + 1;
}

const file = `src/data/characters/builds/${id}.json`;
const builds = rd(file);
console.log(`${tables.length} tableau(x) sur la fiche, ${builds.length} build(s) chez nous.\n`);

// L'ordre des builds sur la page ne suit pas forcement le notre : on apparie
// chaque build au tableau dont TOUTES les polarites d'icone collent a ses pieces.
function fits(b, t) {
  if (!t) return false;
  return b.demonWedges.slots.every((s) => {
    const want = t.get(s.position) ?? null;
    return !want || (mods.get(s.itemId)?.affinity?.id ?? null) === want;
  });
}
const pool = [...tables];
const paired = builds.map((b) => {
  const i = pool.findIndex((t) => fits(b, t));
  return i === -1 ? null : pool.splice(i, 1)[0];
});

let blocked = false;
const plans = builds.map((b, bi) => {
  const t = paired[bi];
  const label = b.buildName?.FR ?? b.buildName?.EN;
  if (!t) { console.log(`· ${label} : aucun tableau compatible → aucune piste`); return new Map(); }
  const plan = new Map();
  for (const s of b.demonWedges.slots) {
    const want = t.get(s.position) ?? null;
    const ours = mods.get(s.itemId)?.affinity?.id ?? null;
    if (want && ours !== want) {
      console.log(`  ⚠ ${label} case ${s.position} : le tableau montre la polarité ${want}, notre pièce est en ${ours} (${mods.get(s.itemId)?.translations?.EN?.modName})`);
      blocked = true;
    }
    plan.set(s.position, want ? ours : null);
  }
  const on = [...plan.entries()].filter(([, v]) => v).map(([k]) => k);
  const before = b.demonWedges.slots.filter((s) => s.track != null).map((s) => s.position);
  console.log(`· ${label} : ${before.join(",") || "aucune"} → ${on.join(",") || "aucune"}`);
  return plan;
});

if (blocked) { console.log("\n❌ Composition divergente : rien n'est écrit. Comparer les pièces d'abord."); process.exit(2); }
if (!write) { console.log("\n(essai à blanc — relancer avec --ecrire)"); process.exit(0); }

builds.forEach((b, i) => { for (const s of b.demonWedges.slots) s.track = plans[i].get(s.position) ?? null; });
fs.writeFileSync(path.join(ROOT, file), JSON.stringify(builds, null, 2) + "\n");
console.log("\n✅ écrit.");
