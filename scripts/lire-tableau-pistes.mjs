#!/usr/bin/env node
/**
 * Lit les tableaux « Track Adjustments for Demon Wedge Slots » d'une fiche.
 *
 *   node scripts/lire-tableau-pistes.mjs <url>
 *
 * Parse le HTML brut au lieu de passer par un résumé automatique : cette étape
 * perdait des icônes (sur Fushu elle en ratait deux, et le build passait de 6
 * modules à 4). Le compteur « Track-Shift Module Required » de la page est faux
 * et n'est repris qu'à titre indicatif — seul le tableau fait foi.
 */
const SHAPE_TO_POLARITY = { Triangle: 1, Crescent: 2, Diamond: 3, Ellipse: 4 };

const url = process.argv[2];
if (!url) {
  console.error("usage: node scripts/lire-tableau-pistes.mjs <url>");
  process.exit(1);
}

const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();

const tables = [];
let from = 0;
for (;;) {
  const i = html.indexOf("Track Adjustments", from);
  if (i === -1) break;
  const end = html.indexOf("</table>", i);
  tables.push(html.slice(i, end === -1 ? i + 4000 : end));
  from = i + 1;
}

if (!tables.length) {
  console.log("Aucun tableau « Track Adjustments » trouvé sur cette page.");
  process.exit(0);
}

console.log(`${tables.length} tableau(x) trouvé(s) — un par build.\n`);

tables.forEach((t, n) => {
  // Les cellules alternent : une ligne d'en-têtes (Slot N / Core), puis une
  // ligne de valeurs (icône ou croix).
  const cells = [...t.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1]);
  const slots = new Map();
  let pending = [];
  for (const raw of cells) {
    const label = raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const headers = [...label.matchAll(/Slot\s*(\d+)/g)].map((m) => Number(m[1]));
    if (headers.length || /^Core$/i.test(label)) {
      pending.push(...(headers.length ? headers : [0]));
      continue;
    }
    const alt = /<img[^>]*\balt=['"]([^'"]+)['"]/.exec(raw)?.[1] ?? null;
    const cross = /[✗✖×]|\bcross\b/i.test(label) || /alt=['"](cross|x)['"]/i.test(raw);
    const pos = pending.shift();
    if (pos === undefined) continue;
    if (pos === 0) continue; // la case centrale n'a pas de piste
    slots.set(pos, alt && SHAPE_TO_POLARITY[alt] ? { shape: alt, polarity: SHAPE_TO_POLARITY[alt] } : cross || !alt ? null : { shape: alt, polarity: null });
  }

  const counter = /Track-Shift Module Required[^0-9]*([0-9]+)/.exec(t)?.[1];
  const adjusted = [...slots.entries()].filter(([, v]) => v).map(([k]) => k).sort((a, b) => a - b);

  console.log(`## Build ${n + 1}`);
  for (const pos of [...slots.keys()].sort((a, b) => a - b)) {
    const v = slots.get(pos);
    console.log(`  case ${pos} : ${v ? `${v.shape} → piste ${v.polarity}` : "croix (aucun module)"}`);
  }
  console.log(`  → ${adjusted.length} module(s), cases ${adjusted.join(", ") || "aucune"}`);
  if (counter) console.log(`  (le compteur de la page annonce ${counter} — non fiable, ignoré)`);
  console.log();
});
