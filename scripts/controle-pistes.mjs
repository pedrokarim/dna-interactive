#!/usr/bin/env node
/**
 * Confronte les pistes de TOUS les builds marqués vérifiés au tableau réel de
 * leur fiche, lu en HTML brut. Sert à repasser ce qui a été validé sur des
 * lectures approximatives.
 *
 *   node scripts/controle-pistes.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const state = rd("scripts/build-verification.json");
const chars = rd("src/data/characters/characters.json");
const mods = new Map(rd("src/data/items/mods.items.json").map((m) => [m.id, m]));
const SHAPE = { Triangle: 1, Crescent: 2, Diamond: 3, Ellipse: 4 };
const name = (c) => c.translations?.EN?.name ?? c.internalName;

async function tables(url) {
  const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const out = [];
  let from = 0;
  for (;;) {
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
    out.push(slots);
    from = i + 1;
  }
  return out;
}

let ko = 0, ok = 0;
for (const [id, v] of Object.entries(state.characters)) {
  const c = chars.find((x) => x.id === id);
  const builds = rd(`src/data/characters/builds/${id}.json`);
  const url = `https://game8.co/games/Duet-Night-Abyss/archives/${v.source}`;
  let ts;
  try { ts = await tables(url); } catch { console.log(`⚠ ${name(c)} : page injoignable`); continue; }
  if (!ts.length) { console.log(`⚠ ${name(c)} : aucun tableau trouvé`); continue; }

  const ours = builds.map((b) => [...b.demonWedges.slots].filter((s) => s.track != null).map((s) => s.position).sort((a, z) => a - z).join(","));
  const theirs = ts.map((m) => [...m.entries()].filter(([, p]) => p).map(([k]) => k).sort((a, z) => a - z).join(","));
  // L'ordre des builds dans notre fichier ne suit pas forcement celui de la page,
  // et un build sans tableau publie doit legitimement ne porter aucune piste.
  const rest = [...theirs];
  const unmatched = [];
  for (const o of ours) {
    const i = rest.indexOf(o);
    if (i !== -1) rest.splice(i, 1);
    else if (o === "") continue;          // build sans tableau : aucune piste attendue
    else unmatched.push(o);
  }
  const same = unmatched.length === 0 && rest.length === 0;
  if (same) { ok++; console.log(`✅ ${name(c).padEnd(20)} ${ours.map((o) => o || "aucune").join("  |  ")}`); }
  else {
    ko++;
    console.log(`❌ ${name(c).padEnd(20)} nous : ${ours.map((o) => o || "aucune").join("  |  ")}`);
    console.log(`   ${"".padEnd(20)} fiche: ${theirs.map((t) => t || "aucune").join("  |  ")}`);
  }
}
console.log(`\n${ok} conforme(s), ${ko} à corriger.`);
