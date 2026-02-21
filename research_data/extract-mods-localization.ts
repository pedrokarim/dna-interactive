import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";

type LuaParsedValue = string | number | boolean | null | number[];

type ModEntry = {
  modId: number;
  fields: Record<string, LuaParsedValue>;
  rawBlock: string;
};

type ArchiveEntry = {
  archiveId: number;
  nameKey: string | null;
  modList: number[];
  fields: Record<string, LuaParsedValue>;
};

type LocalizedModFields = {
  modName: string | null;
  description: string | null;
  demonWedgeName: string | null;
  functionLabel: string | null;
  archiveName: string | null;
};

type ExtractedModRecord = {
  modId: number;
  archiveId: number | null;
  archiveNameKey: string | null;
  nameKey: string | null;
  descriptionKey: string | null;
  demonWedgeKey: string | null;
  functionKey: string | null;
  icon: {
    gamePath: string | null;
    candidates: string[];
    matchedAsset: string | null;
    allMatches: string[];
    imagePlaceholder: null;
  };
  fields: Record<string, LuaParsedValue>;
  translations: Record<string, LocalizedModFields>;
};

type LanguageFile = {
  code: string;
  filePath: string;
};

type CliOptions = {
  dataDir: string;
  outputDir: string;
  modDecompiledPath: string;
  assetDirs: string[];
  siteDataDir: string;
  siteAssetsDir: string;
  skipSiteOutput: boolean;
  verbose: boolean;
};

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".bmp",
  ".gif",
  ".tga",
  ".dds",
]);

function toPosixPath(p: string): string {
  return p.replaceAll("\\", "/");
}

function parseArgs(argv: string[]): CliOptions {
  const cwd = process.cwd();
  const defaultDataDir = resolve(cwd, "research_data");
  const defaultOutputDir = join(defaultDataDir, "exports", "mods-localization");

  const options: CliOptions = {
    dataDir: defaultDataDir,
    outputDir: defaultOutputDir,
    modDecompiledPath: join(defaultDataDir, "Datas", "Mod_decompiled.lua"),
    assetDirs: [
      join(defaultDataDir, "Mod"),
      join(defaultDataDir, "public", "assets", "icons"),
      join(cwd, "public", "assets", "icons"),
    ],
    siteDataDir: join(cwd, "src", "data", "items"),
    siteAssetsDir: join(cwd, "public", "assets", "items", "mods"),
    skipSiteOutput: false,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--data-dir") {
      options.dataDir = resolve(argv[++i] ?? "");
      continue;
    }
    if (arg === "--output-dir") {
      options.outputDir = resolve(argv[++i] ?? "");
      continue;
    }
    if (arg === "--mod-decompiled") {
      options.modDecompiledPath = resolve(argv[++i] ?? "");
      continue;
    }
    if (arg === "--asset-dir") {
      options.assetDirs.push(resolve(argv[++i] ?? ""));
      continue;
    }
    if (arg === "--site-data-dir") {
      options.siteDataDir = resolve(argv[++i] ?? "");
      continue;
    }
    if (arg === "--site-assets-dir") {
      options.siteAssetsDir = resolve(argv[++i] ?? "");
      continue;
    }
    if (arg === "--skip-site-output") {
      options.skipSiteOutput = true;
      continue;
    }
    if (arg === "--verbose") {
      options.verbose = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelpAndExit(0);
    }
    console.error(`Argument non reconnu: ${arg}`);
    printHelpAndExit(1);
  }

  return options;
}

function printHelpAndExit(code: number): never {
  console.log(`Usage:
  bun run research_data/extract-mods-localization.ts [options]

Options:
  --data-dir <path>     Dossier racine des données (par défaut: research_data)
  --output-dir <path>   Dossier de sortie JSON
  --mod-decompiled <path> Chemin vers Datas/Mod_decompiled.lua
  --asset-dir <path>    Dossier d'assets supplémentaire (option répétable)
  --site-data-dir <path> Dossier de sortie JSON pour le site (par défaut: src/data/items)
  --site-assets-dir <path> Dossier de copie des icônes pour le site (par défaut: public/assets/items/mods)
  --skip-site-output    N'écrit pas les fichiers JSON destinés au site
  --verbose             Logs détaillés
  --help                Affiche cette aide
`);
  process.exit(code);
}

function logVerbose(enabled: boolean, message: string): void {
  if (enabled) {
    console.log(`[verbose] ${message}`);
  }
}

function countBracesOutsideStrings(line: string): number {
  let inString = false;
  let escaped = false;
  let delta = 0;

  for (const ch of line) {
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") {
      delta += 1;
      continue;
    }
    if (ch === "}") {
      delta -= 1;
      continue;
    }
  }

  return delta;
}

function parseLuaString(raw: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch !== "\\") {
      bytes.push(raw.charCodeAt(i) & 0xff);
      continue;
    }

    i += 1;
    if (i >= raw.length) {
      break;
    }
    const esc = raw[i];

    if (/[0-9]/.test(esc)) {
      let numText = esc;
      if (i + 1 < raw.length && /[0-9]/.test(raw[i + 1])) {
        i += 1;
        numText += raw[i];
      }
      if (i + 1 < raw.length && /[0-9]/.test(raw[i + 1])) {
        i += 1;
        numText += raw[i];
      }
      const value = Number(numText);
      bytes.push(Number.isFinite(value) ? value & 0xff : 0);
      continue;
    }

    if (esc === "x" && i + 2 < raw.length) {
      const hex = raw.slice(i + 1, i + 3);
      if (/^[0-9a-fA-F]{2}$/.test(hex)) {
        bytes.push(Number.parseInt(hex, 16));
        i += 2;
        continue;
      }
    }

    const mapped =
      esc === "n"
        ? 10
        : esc === "r"
          ? 13
          : esc === "t"
            ? 9
            : esc === "a"
              ? 7
              : esc === "b"
                ? 8
                : esc === "f"
                  ? 12
                  : esc === "v"
                    ? 11
                    : esc === "\\"
                      ? 92
                      : esc === "\""
                        ? 34
                        : esc === "'"
                          ? 39
                          : esc.charCodeAt(0);
    bytes.push(mapped & 0xff);
  }

  return new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
}

function parseNumericList(raw: string): number[] | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null;
  }
  const inner = trimmed.slice(1, -1).trim();
  if (inner.length === 0) {
    return [];
  }
  if (inner.includes("=")) {
    return null;
  }

  const parts = inner
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const numbers: number[] = [];
  for (const part of parts) {
    if (!/^-?\d+(?:\.\d+)?$/.test(part)) {
      return null;
    }
    numbers.push(Number(part));
  }
  return numbers;
}

function parseLuaValue(raw: string): LuaParsedValue {
  const value = raw.trim();

  if (value.startsWith("\"") && value.endsWith("\"")) {
    return parseLuaString(value.slice(1, -1));
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === "nil") {
    return null;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }

  const list = parseNumericList(value);
  if (list) {
    return list;
  }

  return value;
}

function parseLuaAssignments(inner: string): Record<string, LuaParsedValue> {
  const fields: Record<string, LuaParsedValue> = {};
  let i = 0;

  while (i < inner.length) {
    while (i < inner.length && /[\s,]/.test(inner[i])) {
      i += 1;
    }
    if (i >= inner.length) {
      break;
    }

    const keyMatch = inner.slice(i).match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (!keyMatch) {
      while (i < inner.length && inner[i] !== "\n") {
        i += 1;
      }
      continue;
    }

    const key = keyMatch[1];
    i += key.length;

    while (i < inner.length && /\s/.test(inner[i])) {
      i += 1;
    }
    if (inner[i] !== "=") {
      while (i < inner.length && inner[i] !== "\n") {
        i += 1;
      }
      continue;
    }
    i += 1;

    while (i < inner.length && /\s/.test(inner[i])) {
      i += 1;
    }

    const start = i;
    let braceDepth = 0;
    let inString = false;
    let escaped = false;

    while (i < inner.length) {
      const ch = inner[i];
      if (inString) {
        if (escaped) {
          escaped = false;
          i += 1;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          i += 1;
          continue;
        }
        if (ch === "\"") {
          inString = false;
          i += 1;
          continue;
        }
        i += 1;
        continue;
      }

      if (ch === "\"") {
        inString = true;
        i += 1;
        continue;
      }
      if (ch === "{") {
        braceDepth += 1;
        i += 1;
        continue;
      }
      if (ch === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
        i += 1;
        continue;
      }
      if (ch === "," && braceDepth === 0) {
        break;
      }
      i += 1;
    }

    const rawValue = inner.slice(start, i).trim();
    fields[key] = parseLuaValue(rawValue);

    if (i < inner.length && inner[i] === ",") {
      i += 1;
    }
  }

  return fields;
}

function parseEntriesFromReadOnlyTable(
  luaSource: string,
  tableName: string,
): Array<{ key: number; fields: Record<string, LuaParsedValue>; rawBlock: string }> {
  const lines = luaSource.split(/\r?\n/);
  const marker = `return ReadOnly("${tableName}", {`;
  const startIdx = lines.findIndex((line) => line.includes(marker));
  if (startIdx === -1) {
    throw new Error(`Table ReadOnly("${tableName}", ...) introuvable.`);
  }

  const entries: Array<{ key: number; fields: Record<string, LuaParsedValue>; rawBlock: string }> =
    [];

  for (let i = startIdx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*\}\)\s*,?\s*$/.test(line)) {
      break;
    }

    const m = line.match(/^\s*\[(\d+)\]\s*=\s*\{\s*$/);
    if (!m) {
      continue;
    }

    const key = Number(m[1]);
    const blockLines: string[] = [line];
    let depth = countBracesOutsideStrings(line);
    while (i + 1 < lines.length && depth > 0) {
      i += 1;
      const nextLine = lines[i];
      blockLines.push(nextLine);
      depth += countBracesOutsideStrings(nextLine);
    }

    const inner = blockLines.slice(1, -1).join("\n");
    const fields = parseLuaAssignments(inner);
    entries.push({ key, fields, rawBlock: blockLines.join("\n") });
  }

  return entries;
}

function parseModEntries(luaSource: string): ModEntry[] {
  return parseEntriesFromReadOnlyTable(luaSource, "Mod").map((entry) => ({
    modId: entry.key,
    fields: entry.fields,
    rawBlock: entry.rawBlock,
  }));
}

function parseModId2ArchiveId(filePath: string): Map<number, number> {
  const content = readFileSync(filePath, "utf8");
  const out = new Map<number, number>();
  const regex = /\[(\d+)\]\s*=\s*(\d+),?/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    out.set(Number(match[1]), Number(match[2]));
  }
  return out;
}

function numbersFromValue(value: LuaParsedValue | undefined): number[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  }
  if (typeof value === "number") {
    return [value];
  }
  if (typeof value === "string") {
    return Array.from(value.matchAll(/\d+/g), (m) => Number(m[0]));
  }
  return [];
}

function parseGuideBookArchive(filePath: string): Map<number, ArchiveEntry> {
  const content = readFileSync(filePath, "utf8");
  const entries = parseEntriesFromReadOnlyTable(content, "ModGuideBookArchive");
  const out = new Map<number, ArchiveEntry>();

  for (const entry of entries) {
    const nameKey = typeof entry.fields.Name === "string" ? entry.fields.Name : null;
    const modList = numbersFromValue(entry.fields.ModList);
    out.set(entry.key, {
      archiveId: entry.key,
      nameKey,
      modList,
      fields: entry.fields,
    });
  }
  return out;
}

function discoverLanguageFiles(datasDir: string): LanguageFile[] {
  if (!existsSync(datasDir)) {
    throw new Error(`Dossier Datas introuvable: ${datasDir}`);
  }
  const files = readdirSync(datasDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => /^TextMap_Content([A-Z]+)_decompiled\.lua$/.test(name))
    .map((name) => {
      const match = name.match(/^TextMap_Content([A-Z]+)_decompiled\.lua$/);
      return {
        code: match![1],
        filePath: join(datasDir, name),
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
  return files;
}

function parseTextMapFileFiltered(
  filePath: string,
  langCode: string,
  wantedKeys: Set<string>,
): Map<string, string> {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const blockStartRegex = /^\s*([A-Za-z0-9_]+)\s*=\s*\{\s*$/;
  const contentRegex = new RegExp(
    `^\\s*Content${langCode}\\s*=\\s*"((?:\\\\.|[^"\\\\])*)"\\s*,?\\s*$`,
  );
  const blockEndRegex = /^\s*\},?\s*$/;

  const out = new Map<string, string>();
  let currentKey: string | null = null;
  let keepCurrent = false;

  for (const line of lines) {
    const startMatch = line.match(blockStartRegex);
    if (startMatch) {
      currentKey = startMatch[1];
      keepCurrent = wantedKeys.has(currentKey);
      continue;
    }
    if (!currentKey) {
      continue;
    }
    if (keepCurrent) {
      const contentMatch = line.match(contentRegex);
      if (contentMatch) {
        out.set(currentKey, parseLuaString(contentMatch[1]));
      }
    }
    if (blockEndRegex.test(line)) {
      currentKey = null;
      keepCurrent = false;
    }
  }
  return out;
}

function walkFiles(dir: string, out: string[]): void {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
      continue;
    }
    if (entry.isFile()) {
      out.push(fullPath);
    }
  }
}

function buildAssetIndex(assetDirs: string[], cwd: string): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const dir of assetDirs) {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      continue;
    }
    const files: string[] = [];
    walkFiles(dir, files);
    for (const filePath of files) {
      const ext = extname(filePath).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) {
        continue;
      }
      const name = basename(filePath, ext).toLowerCase();
      const rel = toPosixPath(relative(cwd, filePath));
      const arr = index.get(name);
      if (arr) {
        arr.push(rel);
      } else {
        index.set(name, [rel]);
      }
    }
  }
  return index;
}

function extractIconCandidates(iconPath: string): string[] {
  if (!iconPath) {
    return [];
  }
  const lastSegment = iconPath.split("/").pop() ?? iconPath;
  const parts = lastSegment.split(".").filter((p) => p.length > 0);
  const candidates = new Set<string>();

  for (const part of parts) {
    candidates.add(part);
    if (part.startsWith("Mod_")) {
      candidates.add(`T_${part}`);
    }
    if (part.startsWith("T_")) {
      candidates.add(part.slice(2));
    }
  }
  return Array.from(candidates);
}

function pickBestAsset(matches: string[]): string | null {
  if (matches.length === 0) {
    return null;
  }
  const sorted = [...matches].sort((a, b) => {
    const aScore = a.includes("/research_data/Mod/") ? 0 : 1;
    const bScore = b.includes("/research_data/Mod/") ? 0 : 1;
    if (aScore !== bScore) {
      return aScore - bScore;
    }
    return a.length - b.length;
  });
  return sorted[0] ?? null;
}

function looksLikeTextMapKey(value: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]+$/.test(value) && value.includes("_");
}

function asString(value: LuaParsedValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: LuaParsedValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildWantedTextKeys(
  mods: ModEntry[],
  archives: Map<number, ArchiveEntry>,
): Set<string> {
  const keys = new Set<string>();

  for (const mod of mods) {
    for (const value of Object.values(mod.fields)) {
      if (typeof value === "string" && looksLikeTextMapKey(value)) {
        keys.add(value);
      }
    }
  }

  for (const archive of archives.values()) {
    if (archive.nameKey) {
      keys.add(archive.nameKey);
    }
    for (const value of Object.values(archive.fields)) {
      if (typeof value === "string" && looksLikeTextMapKey(value)) {
        keys.add(value);
      }
    }
  }

  return keys;
}

function translateKey(
  key: string | null,
  langMap: Map<string, string>,
  fallbackEnMap: Map<string, string>,
): string | null {
  if (!key) {
    return null;
  }
  return langMap.get(key) ?? fallbackEnMap.get(key) ?? key;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function isPathInside(parentDir: string, absolutePath: string): boolean {
  const rel = relative(resolve(parentDir), resolve(absolutePath));
  return rel === "" || (!rel.startsWith("..") && !rel.includes(":"));
}

function toPublicAssetPath(cwd: string, absoluteFilePath: string): string | null {
  const publicDir = join(cwd, "public");
  if (!isPathInside(publicDir, absoluteFilePath)) {
    return null;
  }
  const rel = toPosixPath(relative(publicDir, absoluteFilePath));
  return rel.length > 0 ? `/${rel}` : "/";
}

function safeAssetFileName(fileName: string): string {
  return fileName.replace(/[^A-Za-z0-9._-]/g, "_");
}

function copyMatchedAssetsForSite(
  records: ExtractedModRecord[],
  cwd: string,
  siteAssetsDir: string,
  verbose: boolean,
): { sourceToPublicPath: Map<string, string>; copiedCount: number } {
  mkdirSync(siteAssetsDir, { recursive: true });

  const sourceToPublicPath = new Map<string, string>();
  const usedTargetNames = new Map<string, string>();
  let copiedCount = 0;

  for (const record of records) {
    const sourceRel = record.icon.matchedAsset;
    if (!sourceRel || sourceToPublicPath.has(sourceRel)) {
      continue;
    }

    const sourceAbs = resolve(cwd, sourceRel);
    if (!existsSync(sourceAbs) || !statSync(sourceAbs).isFile()) {
      continue;
    }

    const ext = extname(sourceAbs);
    const base = safeAssetFileName(basename(sourceAbs, ext));

    let targetName = `${base}${ext}`;
    let suffix = 2;
    while (true) {
      const current = usedTargetNames.get(targetName.toLowerCase());
      if (!current || current === sourceAbs) {
        break;
      }
      targetName = `${base}-${suffix}${ext}`;
      suffix += 1;
    }
    usedTargetNames.set(targetName.toLowerCase(), sourceAbs);

    const targetAbs = join(siteAssetsDir, targetName);
    if (!existsSync(targetAbs)) {
      copyFileSync(sourceAbs, targetAbs);
      copiedCount += 1;
      logVerbose(
        verbose,
        `Asset copié: ${toPosixPath(relative(cwd, sourceAbs))} -> ${toPosixPath(relative(cwd, targetAbs))}`,
      );
    }

    const publicPath = toPublicAssetPath(cwd, targetAbs);
    if (publicPath) {
      sourceToPublicPath.set(sourceRel, publicPath);
    }
  }

  return { sourceToPublicPath, copiedCount };
}

function buildSiteModItems(
  records: ExtractedModRecord[],
  languageCodes: string[],
  sourceToPublicPath: Map<string, string>,
): unknown[] {
  return records.map((record) => {
    const translations: Record<string, LocalizedModFields> = {};
    for (const langCode of languageCodes) {
      translations[langCode] = record.translations[langCode] ?? {
        modName: null,
        description: null,
        demonWedgeName: null,
        functionLabel: null,
        archiveName: null,
      };
    }

    const sourceAsset = record.icon.matchedAsset;
    const publicIconPath = sourceAsset ? sourceToPublicPath.get(sourceAsset) ?? null : null;

    return {
      id: `mods-${record.modId}`,
      categoryId: "mods",
      modId: record.modId,
      archiveId: record.archiveId,
      stats: {
        rarity: asNumber(record.fields.Rarity),
        polarity: asNumber(record.fields.Polarity),
        maxLevel: asNumber(record.fields.MaxLevel),
        cost: asNumber(record.fields.Cost),
        openVersion: asNumber(record.fields.OpenVersion),
        releaseVersion: asNumber(record.fields.ReleaseVersion),
      },
      textKeys: {
        modNameKey: record.nameKey,
        descriptionKey: record.descriptionKey,
        demonWedgeKey: record.demonWedgeKey,
        functionKey: record.functionKey,
        archiveNameKey: record.archiveNameKey,
      },
      icon: {
        gamePath: record.icon.gamePath,
        sourceAsset,
        publicPath: publicIconPath,
        placeholderPath: null as string | null,
        candidates: record.icon.candidates,
        allMatches: record.icon.allMatches,
      },
      translations,
      fields: record.fields,
    };
  });
}

function buildSiteCatalog(
  generatedAt: string,
  languageCodes: string[],
  itemCount: number,
  sampleIconPath: string | null,
): unknown {
  const defaultGridLanguages = ["FR", "EN"].filter((code) => languageCodes.includes(code));
  if (defaultGridLanguages.length === 0) {
    defaultGridLanguages.push(...languageCodes.slice(0, 2));
  }
  const defaultDetailLanguage = defaultGridLanguages[0] ?? languageCodes[0] ?? "EN";

  return {
    generatedAt,
    categories: [
      {
        id: "mods",
        slug: "mods",
        title: "MOD / Demon Wedge",
        technicalName: "MOD",
        displayName: "Demon Wedge",
        description:
          "Liste des MOD (Demon Wedges) avec noms multilingues, descriptions et informations d'archives.",
        itemCount,
        availableLanguages: languageCodes,
        defaultGridLanguages,
        defaultDetailLanguage,
        datasetFile: "mods.items.json",
        iconDirectory: "/assets/items/mods",
        sampleIconPath,
      },
    ],
  };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();

  if (!existsSync(options.dataDir)) {
    throw new Error(`Dossier data introuvable: ${options.dataDir}`);
  }

  const datasDir = join(options.dataDir, "Datas");
  if (!existsSync(options.modDecompiledPath)) {
    throw new Error(
      `Mod_decompiled.lua introuvable: ${options.modDecompiledPath}\nDécompile d'abord Mod.lua avec unluac, puis relance le script.`,
    );
  }

  logVerbose(options.verbose, `Mod_decompiled.lua: ${options.modDecompiledPath}`);
  const decompiledModLua = readFileSync(options.modDecompiledPath, "utf8");
  const mods = parseModEntries(decompiledModLua).sort((a, b) => a.modId - b.modId);
  if (mods.length === 0) {
    throw new Error("Aucune entrée MOD détectée dans Mod_decompiled.lua.");
  }

  const modId2ArchivePath = join(datasDir, "ModId2ArchiveId_decompiled.lua");
  const guideArchivePath = join(datasDir, "ModGuideBookArchive_decompiled.lua");
  if (!existsSync(modId2ArchivePath)) {
    throw new Error(`Fichier introuvable: ${modId2ArchivePath}`);
  }
  if (!existsSync(guideArchivePath)) {
    throw new Error(`Fichier introuvable: ${guideArchivePath}`);
  }

  const modIdToArchive = parseModId2ArchiveId(modId2ArchivePath);
  const archiveMap = parseGuideBookArchive(guideArchivePath);

  const archiveFromGuideByMod = new Map<number, number>();
  for (const archive of archiveMap.values()) {
    for (const modId of archive.modList) {
      archiveFromGuideByMod.set(modId, archive.archiveId);
    }
  }

  const wantedKeys = buildWantedTextKeys(mods, archiveMap);
  const languageFiles = discoverLanguageFiles(datasDir);
  if (languageFiles.length === 0) {
    throw new Error(`Aucun fichier TextMap_Content*_decompiled.lua trouvé dans ${datasDir}`);
  }

  const textByLang = new Map<string, Map<string, string>>();
  for (const lang of languageFiles) {
    logVerbose(options.verbose, `Parsing TextMap ${lang.code}...`);
    textByLang.set(lang.code, parseTextMapFileFiltered(lang.filePath, lang.code, wantedKeys));
  }
  const fallbackEnMap = textByLang.get("EN") ?? new Map<string, string>();

  const assetIndex = buildAssetIndex(options.assetDirs, cwd);

  const allRecords: ExtractedModRecord[] = mods.map((mod) => {
    const fields = mod.fields;
    const nameKey = asString(fields.Name);
    const descriptionKey = asString(fields.ModDescribe) ?? asString(fields.Desc);
    const demonWedgeKey = asString(fields.TypeName);
    const functionKey = asString(fields.FunctionDes);
    const iconGamePath = asString(fields.Icon);

    const archiveId =
      modIdToArchive.get(mod.modId) ??
      archiveFromGuideByMod.get(mod.modId) ??
      null;
    const archiveEntry = archiveId ? archiveMap.get(archiveId) ?? null : null;
    const archiveNameKey = archiveEntry?.nameKey ?? null;

    const iconCandidates = extractIconCandidates(iconGamePath ?? "");
    const iconMatches = iconCandidates.flatMap((candidate) => assetIndex.get(candidate.toLowerCase()) ?? []);
    const iconAsset = pickBestAsset(iconMatches);

    const translations: Record<string, LocalizedModFields> = {};

    for (const lang of languageFiles) {
      const langMap = textByLang.get(lang.code) ?? new Map<string, string>();
      translations[lang.code] = {
        modName: translateKey(nameKey, langMap, fallbackEnMap),
        description: translateKey(descriptionKey, langMap, fallbackEnMap),
        demonWedgeName: translateKey(demonWedgeKey, langMap, fallbackEnMap),
        functionLabel: translateKey(functionKey, langMap, fallbackEnMap),
        archiveName: translateKey(archiveNameKey, langMap, fallbackEnMap),
      };
    }

    return {
      modId: mod.modId,
      archiveId,
      archiveNameKey,
      nameKey,
      descriptionKey,
      demonWedgeKey,
      functionKey,
      icon: {
        gamePath: iconGamePath,
        candidates: iconCandidates,
        matchedAsset: iconAsset,
        allMatches: iconMatches,
        imagePlaceholder: null as null,
      },
      fields,
      translations,
    };
  });

  const perLanguageOutput: Record<string, unknown[]> = {};
  for (const lang of languageFiles) {
    perLanguageOutput[lang.code] = allRecords.map((record) => ({
      modId: record.modId,
      archiveId: record.archiveId,
      archiveNameKey: record.archiveNameKey,
      archiveName: record.translations[lang.code]?.archiveName ?? null,
      demonWedgeKey: record.demonWedgeKey,
      demonWedgeName: record.translations[lang.code]?.demonWedgeName ?? null,
      modNameKey: record.nameKey,
      modName: record.translations[lang.code]?.modName ?? null,
      descriptionKey: record.descriptionKey,
      description: record.translations[lang.code]?.description ?? null,
      functionKey: record.functionKey,
      functionLabel: record.translations[lang.code]?.functionLabel ?? null,
      icon: record.icon,
      fields: record.fields,
    }));
  }

  const generatedAt = new Date().toISOString();
  const summary = {
    generatedAt,
    source: {
      modDecompiledPath: toPosixPath(relative(cwd, options.modDecompiledPath)),
      datasDir: toPosixPath(relative(cwd, datasDir)),
      languages: languageFiles.map((l) => l.code),
    },
    counts: {
      totalMods: allRecords.length,
      modsWithIconAsset: allRecords.filter((m) => m.icon.matchedAsset).length,
      textKeysLoaded: wantedKeys.size,
      archives: archiveMap.size,
    },
  };

  mkdirSync(options.outputDir, { recursive: true });
  writeJson(join(options.outputDir, "mods.all-languages.json"), allRecords);
  writeJson(join(options.outputDir, "mods.summary.json"), summary);
  for (const lang of languageFiles) {
    writeJson(join(options.outputDir, `mods.${lang.code.toLowerCase()}.json`), perLanguageOutput[lang.code]);
  }

  let siteItemsCount = 0;
  let copiedSiteAssets = 0;
  if (!options.skipSiteOutput) {
    const { sourceToPublicPath, copiedCount } = copyMatchedAssetsForSite(
      allRecords,
      cwd,
      options.siteAssetsDir,
      options.verbose,
    );
    copiedSiteAssets = copiedCount;

    const languageCodes = languageFiles.map((lang) => lang.code);
    const siteItems = buildSiteModItems(allRecords, languageCodes, sourceToPublicPath);

    const resolvedSampleIconPath = (() => {
      for (const entry of siteItems) {
        if (!entry || typeof entry !== "object") {
          continue;
        }
        const item = entry as { icon?: { publicPath?: string | null } };
        if (typeof item.icon?.publicPath === "string" && item.icon.publicPath.length > 0) {
          return item.icon.publicPath;
        }
      }
      return null;
    })();

    const siteCatalog = buildSiteCatalog(
      generatedAt,
      languageCodes,
      siteItems.length,
      resolvedSampleIconPath,
    );

    mkdirSync(options.siteDataDir, { recursive: true });
    writeJson(join(options.siteDataDir, "mods.items.json"), siteItems);
    writeJson(join(options.siteDataDir, "catalog.json"), siteCatalog);
    siteItemsCount = siteItems.length;
  }

  console.log(`Source Mod_decompiled.lua: ${toPosixPath(relative(cwd, options.modDecompiledPath))}`);
  console.log(`Mods extraits: ${allRecords.length}`);
  console.log(`Langues: ${languageFiles.map((l) => l.code).join(", ")}`);
  console.log(`JSON générés dans: ${toPosixPath(relative(cwd, options.outputDir))}`);
  if (!options.skipSiteOutput) {
    console.log(`JSON site: ${toPosixPath(relative(cwd, options.siteDataDir))} (${siteItemsCount} items)`);
    console.log(
      `Assets site: ${toPosixPath(relative(cwd, options.siteAssetsDir))} (${copiedSiteAssets} icônes copiées)`,
    );
  }
}

main();
