#!/usr/bin/env node
/**
 * Outil de vérification des builds de personnage contre leur fiche publique.
 *
 *   node scripts/verif-build.mjs                  → file d'attente, par date de sortie
 *   node scripts/verif-build.mjs char-zhiliu      → état complet, prêt à comparer
 *   node scripts/verif-build.mjs --mark char-zhiliu 567185 "note"
 *
 * Le script ne va PAS chercher la fiche : il prépare la comparaison et enregistre
 * le résultat. La lecture de la fiche reste manuelle, parce que le tableau des
 * ajustements de piste se lit case par case et qu'un résumé automatique s'est
 * déjà révélé faux.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const STATE = "scripts/build-verification.json";
const MD = "docs/suivi-verification-builds.md";

const chars = rd("src/data/characters/characters.json");
const mods = new Map(rd("src/data/items/mods.items.json").map((m) => [m.id, m]));
const weps = new Map(rd("src/data/items/weapons.items.json").map((w) => [w.id, w]));
const releases = rd("src/data/characters/release-dates.json");
const state = fs.existsSync(path.join(ROOT, STATE)) ? rd(STATE) : { characters: {} };

const displayName = (c) => c.translations?.EN?.name ?? c.internalName;
const buildFile = (id) => `src/data/characters/builds/${id}.json`;
// Les protagonistes ont un fichier mais un tableau vide : rien à vérifier tant
// qu'aucun build n'y est écrit.
const hasBuild = (id) => {
  const f = path.join(ROOT, buildFile(id));
  if (!fs.existsSync(f)) return false;
  try {
    return JSON.parse(fs.readFileSync(f, "utf8")).length > 0;
  } catch {
    return false;
  }
};

/** Ordre de sortie : date connue d'abord (récent → ancien), puis sortPriority. */
function ordered() {
  return chars
    .filter((c) => hasBuild(c.id))
    .map((c) => ({ c, date: releases[String(c.charId)] ?? null }))
    .sort((a, b) => {
      if (a.date && b.date && a.date !== b.date) return a.date < b.date ? 1 : -1;
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return (b.c.sortPriority ?? 0) - (a.c.sortPriority ?? 0);
    });
}

function queue() {
  const rows = ordered();
  const done = rows.filter((r) => state.characters[r.c.id]);
  console.log(`Vérification des builds — ${done.length}/${rows.length} faits\n`);
  rows.forEach((r, i) => {
    const v = state.characters[r.c.id];
    const tag = v ? `✅ ${v.verifiedAt}` : "⬜ à faire";
    console.log(
      `${String(i + 1).padStart(2)}. ${tag.padEnd(14)} ${displayName(r.c).padEnd(20)} ${r.c.id.padEnd(26)}${r.date ? " sortie " + r.date : ""}`,
    );
  });
  const next = rows.find((r) => !state.characters[r.c.id]);
  console.log(next ? `\n➡ Suivant : ${displayName(next.c)} (${next.c.id})` : "\n🎉 Tous vérifiés.");
}

function detail(id) {
  const c = chars.find((x) => x.id === id || displayName(x).toLowerCase() === id.toLowerCase());
  if (!c) return console.error(`Personnage introuvable : ${id}`), process.exit(1);
  if (!hasBuild(c.id)) return console.error(`Aucun build pour ${c.id}`), process.exit(1);

  const v = state.characters[c.id];
  console.log(`# ${displayName(c)} — ${c.id} — ${c.element?.label} — maîtrises ${(c.weaponTags ?? []).join("/")}`);
  console.log(v ? `Déjà vérifié le ${v.verifiedAt}${v.source ? ` (source ${v.source})` : ""}` : "Jamais vérifié");

  for (const b of rd(buildFile(c.id))) {
    const dw = b.demonWedges;
    const slots = [...dw.slots].sort((x, y) => x.position - y.position);
    console.log(`\n## ${b.buildName?.EN ?? b.buildName?.FR}`);
    for (const s of slots) {
      const m = mods.get(s.itemId);
      const nm = m ? `${m.translations.EN.demonWedgeName}・${m.translations.EN.modName}` : `?? ${s.itemId}`;
      console.log(
        `  case ${s.position} : ${nm.padEnd(40)} polarité ${m?.affinity?.id ?? "—"}   ${s.track != null ? `piste ${s.track}` : "aucun module"}`,
      );
    }
    const ctr = mods.get(dw.centerItemId);
    console.log(`  centre  : ${ctr ? ctr.translations.EN.modName : dw.centerItemId}`);
    console.log(`  Track-Shift requis : ${slots.filter((s) => s.track != null).length}`);
    const w = (arr) => arr.map((x) => `${weps.get(x.itemId)?.translations?.EN?.modName ?? x.itemId} (${x.rank})`).join(", ") || "—";
    console.log(`  mêlée   : ${w(b.weapons?.melee ?? [])}`);
    console.log(`  distance: ${w(b.weapons?.ranged ?? [])}`);
  }

  console.log(`\n--- à confronter à la fiche ---
  1. les 8 pièces ET leur ordre
  2. le centre
  3. le tableau « Track Adjustments », CASE PAR CASE (une croix = aucun module)
  4. les armes mêlée/distance et leur rang
  5. l'existence d'un 2e build (endgame / progression / rôle alternatif)`);
}

/** Régénère le suivi lisible. Le JSON est l'état machine, ce MD est la sortie. */
function writeMarkdown() {
  const rows = ordered();
  const done = rows.filter((r) => state.characters[r.c.id]);
  const dates = done.map((r) => state.characters[r.c.id].verifiedAt).sort();
  const L = [];
  L.push("# Suivi de vérification des builds");
  L.push("");
  L.push(`**Avancement : ${done.length} / ${rows.length} personnages vérifiés.**`);
  if (dates.length) L.push(`Première vérification : ${dates[0]} · dernière : ${dates[dates.length - 1]}.`);
  L.push("");
  L.push("Généré par `node scripts/verif-build.mjs --mark <id> <source>`. Ne pas éditer à la main.");
  L.push("");
  L.push("Une vérification couvre : les 8 pièces et leur ordre, le centre, le tableau des");
  L.push("ajustements de piste **case par case**, les armes et leur rang, et l'existence");
  L.push("d'un second build. L'ordre ci-dessous est celui des sorties, du plus récent au");
  L.push("plus ancien.");
  L.push("");
  L.push("| # | Personnage | Élément | Sortie | Vérifié le | Source | Note |");
  L.push("| --- | --- | --- | --- | --- | --- | --- |");
  rows.forEach((r, i) => {
    const v = state.characters[r.c.id];
    L.push(
      `| ${i + 1} | ${displayName(r.c)} | ${r.c.element?.label ?? ""} | ${r.date ?? "—"} | ${v ? "✅ " + v.verifiedAt : "⬜ à faire"} | ${v?.source ?? ""} | ${v?.note ?? ""} |`,
    );
  });
  const next = rows.find((r) => !state.characters[r.c.id]);
  L.push("");
  L.push(next ? `➡ **Suivant :** ${displayName(next.c)} (\`${next.c.id}\`)` : "🎉 **Tous les personnages sont vérifiés.**");
  L.push("");
  fs.writeFileSync(path.join(ROOT, MD), L.join("\n"));
  console.log(`   suivi régénéré : ${MD}`);
}

function mark(id, source, note) {
  const c = chars.find((x) => x.id === id);
  if (!c) return console.error(`Personnage introuvable : ${id}`), process.exit(1);
  const today = new Date().toISOString().slice(0, 10);
  state.characters[c.id] = { verifiedAt: today, ...(source ? { source } : {}), ...(note ? { note } : {}) };
  const sorted = Object.fromEntries(Object.entries(state.characters).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(
    path.join(ROOT, STATE),
    JSON.stringify({ _comment: state._comment ?? "Suivi de vérification des builds contre leur fiche publique. Écrit par scripts/verif-build.mjs.", characters: sorted }, null, 2) + "\n",
  );
  console.log(`✅ ${displayName(c)} marqué vérifié le ${today}${source ? ` (source ${source})` : ""}`);
  writeMarkdown();
}

const [a, b, c] = process.argv.slice(2);
if (a === "--md") writeMarkdown();
else if (a === "--mark") mark(b, c, process.argv[5]);
else if (a) detail(a);
else queue();
