
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";

type LuaParsedValue = string | number | boolean | null | number[];

type RuntimeTableValue =
  | string
  | number
  | boolean
  | null
  | RuntimeTableValue[]
  | { [key: string]: RuntimeTableValue };

type LangFile = {
  code: string;
  filePath: string;
};

type SiteTranslation = {
  modName: string | null;
  description: string | null;
  demonWedgeName: string | null;
  functionLabel: string | null;
  passiveEffectsDescription: string | null;
  affinityName: string | null;
  archiveName: string | null;
  typeCompatibilityNames?: string[];
};

type SiteItemRecord = {
  id: string;
  modId: number;
  stats?: {
    rarity?: number | null;
  };
  icon?: {
    gamePath?: string | null;
    publicPath?: string | null;
    placeholderPath?: string | null;
  };
  translations?: Record<string, SiteTranslation | undefined>;
  fields?: Record<string, LuaParsedValue | undefined>;
};

type ExportItemLocalizedContent = {
  modName: string | null;
  description: string | null;
  demonWedgeName: string | null;
  functionLabel: string | null;
  passiveEffectsDescription: string | null;
  affinityName: string | null;
  archiveName: string | null;
  typeCompatibilityNames: string[];
};

type ExportItemIcon = {
  gamePath: string | null;
  publicPath: string | null;
  placeholderPath: string | null;
  candidates: string[];
  allMatches: string[];
};

type ExportItemRecord = {
  id: string;
  categoryId: string;
  modId: number;
  archiveId: number | null;
  stats: {
    rarity: number | null;
    polarity: number | null;
    maxLevel: number | null;
    cost: number | null;
    openVersion: number | null;
    releaseVersion: number | null;
  };
  textKeys: {
    modNameKey: string | null;
    descriptionKey: string | null;
    demonWedgeKey: string | null;
    functionKey: string | null;
    passiveEffectsDescKey: string | null;
    affinityNameKey: string | null;
    archiveNameKey: string | null;
  };
  affinity: {
    id: number | null;
    nameKey: string | null;
    char: string | null;
    icon: ExportItemIcon;
  };
  typeCompatibility: {
    applicationType: number | null;
    textKeys: string[];
    tags: Array<{
      key: string;
      icon: ExportItemIcon;
    }>;
  };
  tolerance: {
    baseCost: number | null;
    costChange: number | null;
    maxLevel: number;
    valuesByLevel: Record<string, number | null>;
  };
  icon: ExportItemIcon;
  scaling: {
    defaultLevel: number;
    maxLevel: number;
    availableLevels: number[];
    valuesByLevel: Record<string, Record<string, number>>;
    attributesByLevel: Record<
      string,
      Array<{
        attrName: string | null;
        allowModMultiplier: string | null;
        rate: number | null;
        value: number | null;
        rawRate: string | number | null;
        rawValue: string | number | null;
      }>
    >;
  };
  translations: Record<string, ExportItemLocalizedContent>;
  fields: Record<string, LuaParsedValue>;
};

type WeaponClass = "Melee" | "Ranged" | "Unknown";

type WeaponEntry = {
  id: number;
  nameKey: string | null;
  descriptionKey: string | null;
  iconGamePath: string | null;
  bigIconGamePath: string | null;
  gachaIconGamePath: string | null;
  guiPathVariableName: string | null;
  guiPathVariableType: string | null;
  subtypeNormalized: string | null;
  classType: WeaponClass;
  classTextKey: string | null;
  classIconGamePath: string | null;
  subtypeTextKey: string | null;
  subtypeIconGamePath: string | null;
  weaponMaxLevel: number | null;
  weaponToCoinType: number | null;
  weaponValue: number | null;
  collectRewardExp: number | null;
  decomposeReward: number | null;
  sortPriority: number | null;
  skinApplicationTypes: number[];
  rarity: number | null;
  releaseVersion: number | null;
  openVersion: number | null;
  fields: Record<string, LuaParsedValue>;
};

type CharAccessoryEntry = {
  id: number;
  nameKey: string | null;
  descriptionKey: string | null;
  iconGamePath: string | null;
  rarity: number | null;
  accessoryType: string | null;
  releaseVersion: number | null;
  openVersion: number | null;
};

type DraftRequirement = {
  type: string;
  id: number;
  quantity: number;
};

type DraftItemRef = {
  type: string;
  id: number;
  quantity: number;
  sourceCategory: "mods" | "resources" | "weapons" | "char-accessories" | "unknown";
  href: string | null;
  rarity: number | null;
  names: Record<string, string | null>;
  descriptions: Record<string, string | null>;
  icon: {
    gamePath: string | null;
    publicPath: string | null;
    placeholderPath: string | null;
  };
  metadata: Record<string, string | number | boolean | null | number[]>;
};

type DraftRecipeRecord = {
  id: string;
  draftId: number;
  productType: string;
  productId: number;
  productQuantity: number;
  icon: {
    gamePath: string | null;
    publicPath: string | null;
    placeholderPath: string | null;
  };
  product: DraftItemRef;
  ingredients: DraftItemRef[];
  crafting: {
    durationSec: number | null;
    batch: boolean;
    rarity: number | null;
    foundryCostByCoinType: Record<string, number>;
    resourceToCoinType: number | null;
    resourceValue: number | null;
    accessKeys: string[];
    releaseVersion: number | null;
    openVersion: number | null;
    showInBag: number | null;
    showInDraftArchive: boolean;
  };
  fields: Record<string, LuaParsedValue>;
};

type IconResolution = {
  gamePath: string | null;
  candidates: string[];
  matches: string[];
  sourceRel: string | null;
};

const CWD = process.cwd();
const DATA_DIR = join(CWD, "research_data");
const DATAS_DIR = join(DATA_DIR, "Datas");
const OUTPUT_EXPORTS_DIR = join(DATA_DIR, "Output", "Exports");
const DRAFT_DECOMPILED = join(DATAS_DIR, "Draft_decompiled.lua");
const WEAPON_DECOMPILED = join(DATAS_DIR, "Weapon_decompiled.lua");
const CHAR_ACCESSORY_DECOMPILED = join(DATAS_DIR, "CharAccessory_decompiled.lua");

const SITE_DATA_DIR = join(CWD, "src", "data", "items");
const SITE_DRAFT_RECIPES_JSON = join(SITE_DATA_DIR, "drafts.recipes.json");
const SITE_WEAPONS_ITEMS_JSON = join(SITE_DATA_DIR, "weapons.items.json");

const SITE_PUBLIC_ROOT = join(CWD, "public");
const SITE_DRAFT_ICON_DIR = join(SITE_PUBLIC_ROOT, "assets", "items", "drafts");
const SITE_WEAPON_ICON_DIR = join(SITE_PUBLIC_ROOT, "assets", "items", "weapons");
const SITE_WEAPON_TYPE_ICON_DIR = join(SITE_PUBLIC_ROOT, "assets", "items", "weapon-types");
const SITE_CHAR_ACCESSORY_ICON_DIR = join(
  SITE_PUBLIC_ROOT,
  "assets",
  "items",
  "char-accessories",
);

const MODS_ITEMS_JSON = join(SITE_DATA_DIR, "mods.items.json");
const RESOURCES_ITEMS_JSON = join(SITE_DATA_DIR, "resources.items.json");

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

const DEFAULT_LANGUAGE_FALLBACK = "EN";

const WEAPON_SUBTYPE_ALIASES: Record<string, string> = {
  Broadsword: "Claymore",
  Scythe: "Polearm",
};

function toPosixPath(p: string): string {
  return p.replaceAll("\\", "/");
}

function asString(value: LuaParsedValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: LuaParsedValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: LuaParsedValue | undefined): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeGameAssetPath(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const quoted = trimmed.match(/^[A-Za-z0-9_]+['"](.+?)['"]$/);
  if (quoted) {
    return quoted[1];
  }
  return trimmed;
}

function sanitizeFieldValue(value: LuaParsedValue | undefined): LuaParsedValue | null {
  if (value === undefined) {
    return null;
  }
  return value;
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
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
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
class LuaExpressionParser {
  private readonly source: string;

  private cursor = 0;

  constructor(source: string) {
    this.source = source;
  }

  parse(): RuntimeTableValue | undefined {
    this.skipWhitespaceAndComments();
    const value = this.parseValue();
    if (value === undefined) {
      return undefined;
    }
    this.skipWhitespaceAndComments();
    return value;
  }

  private peek(offset = 0): string | undefined {
    return this.source[this.cursor + offset];
  }

  private next(): string | undefined {
    const ch = this.source[this.cursor];
    this.cursor += 1;
    return ch;
  }

  private skipWhitespaceAndComments(): void {
    while (this.cursor < this.source.length) {
      const ch = this.source[this.cursor];
      if (/\s/.test(ch)) {
        this.cursor += 1;
        continue;
      }
      if (ch === "-" && this.source[this.cursor + 1] === "-") {
        this.cursor += 2;
        while (this.cursor < this.source.length && this.source[this.cursor] !== "\n") {
          this.cursor += 1;
        }
        continue;
      }
      break;
    }
  }

  private parseValue(): RuntimeTableValue | undefined {
    this.skipWhitespaceAndComments();
    const ch = this.peek();
    if (!ch) {
      return undefined;
    }

    if (ch === "{") {
      return this.parseTable();
    }
    if (ch === "\"") {
      return this.parseString();
    }
    if (ch === "-" ? /[0-9]/.test(this.peek(1) ?? "") : /[0-9]/.test(ch)) {
      return this.parseNumber();
    }

    const token = this.parseIdentifierToken();
    if (!token) {
      return undefined;
    }
    if (token === "true") {
      return true;
    }
    if (token === "false") {
      return false;
    }
    if (token === "nil") {
      return null;
    }
    return token;
  }

  private parseString(): string | undefined {
    if (this.peek() !== "\"") {
      return undefined;
    }
    this.next();
    let raw = "";
    let escaped = false;
    while (this.cursor < this.source.length) {
      const ch = this.next();
      if (ch === undefined) {
        break;
      }
      if (escaped) {
        raw += `\\${ch}`;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === "\"") {
        return parseLuaString(raw);
      }
      raw += ch;
    }
    return parseLuaString(raw);
  }

  private parseNumber(): number | undefined {
    const remaining = this.source.slice(this.cursor);
    const match = remaining.match(/^-?\d+(?:\.\d+)?/);
    if (!match) {
      return undefined;
    }
    this.cursor += match[0].length;
    return Number(match[0]);
  }

  private parseIdentifierToken(): string | undefined {
    const remaining = this.source.slice(this.cursor);
    const match = remaining.match(/^[A-Za-z_][A-Za-z0-9_.]*/);
    if (!match) {
      return undefined;
    }
    this.cursor += match[0].length;
    return match[0];
  }

  private parseTable(): RuntimeTableValue | undefined {
    if (this.next() !== "{") {
      return undefined;
    }

    const numericEntries = new Map<number, RuntimeTableValue>();
    const objectEntries: Record<string, RuntimeTableValue> = {};
    let implicitIndex = 1;

    while (this.cursor < this.source.length) {
      this.skipWhitespaceAndComments();
      const ch = this.peek();
      if (!ch) {
        break;
      }

      if (ch === "}") {
        this.next();
        break;
      }
      if (ch === ",") {
        this.next();
        continue;
      }

      let fieldParsed = false;

      if (ch === "[") {
        this.next();
        const keyValue = this.parseValue();
        this.skipWhitespaceAndComments();
        if (this.peek() === "]") {
          this.next();
          this.skipWhitespaceAndComments();
          if (this.peek() === "=") {
            this.next();
            const value = this.parseValue();
            if (value !== undefined && keyValue !== undefined) {
              const normalizedKey =
                typeof keyValue === "string" && /^\d+$/.test(keyValue)
                  ? Number(keyValue)
                  : keyValue;
              if (
                typeof normalizedKey === "number" &&
                Number.isInteger(normalizedKey) &&
                normalizedKey >= 1
              ) {
                numericEntries.set(normalizedKey, value);
                implicitIndex = Math.max(implicitIndex, normalizedKey + 1);
              } else {
                objectEntries[String(normalizedKey)] = value;
              }
            }
            fieldParsed = true;
          }
        }
      } else {
        const start = this.cursor;
        const maybeKey = this.parseIdentifierToken();
        if (maybeKey) {
          this.skipWhitespaceAndComments();
          if (this.peek() === "=") {
            this.next();
            const value = this.parseValue();
            if (value !== undefined) {
              objectEntries[maybeKey] = value;
            }
            fieldParsed = true;
          } else {
            this.cursor = start;
          }
        }
      }

      if (!fieldParsed) {
        const value = this.parseValue();
        if (value !== undefined) {
          while (numericEntries.has(implicitIndex)) {
            implicitIndex += 1;
          }
          numericEntries.set(implicitIndex, value);
          implicitIndex += 1;
        } else {
          this.next();
        }
      }

      this.skipWhitespaceAndComments();
      if (this.peek() === ",") {
        this.next();
      }
    }

    const sortedNumericKeys = Array.from(numericEntries.keys()).sort((a, b) => a - b);
    const hasObjectEntries = Object.keys(objectEntries).length > 0;
    const isContiguousArray =
      sortedNumericKeys.length > 0 &&
      sortedNumericKeys.every((key, index) => key === index + 1);

    if (!hasObjectEntries && isContiguousArray) {
      return sortedNumericKeys.map((key) => numericEntries.get(key)!);
    }
    if (!hasObjectEntries && sortedNumericKeys.length === 0) {
      return [];
    }

    const out: Record<string, RuntimeTableValue> = { ...objectEntries };
    for (const key of sortedNumericKeys) {
      out[String(key)] = numericEntries.get(key)!;
    }
    return out;
  }
}

function parseRuntimeTableDefinitions(luaSource: string): Map<string, RuntimeTableValue> {
  const lines = luaSource.split(/\r?\n/);
  const out = new Map<string, RuntimeTableValue>();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^\s*T\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    let expression = match[2];
    let depth = countBracesOutsideStrings(expression);
    while (depth > 0 && i + 1 < lines.length) {
      i += 1;
      expression += `\n${lines[i]}`;
      depth += countBracesOutsideStrings(lines[i]);
    }

    const parsed = new LuaExpressionParser(expression).parse();
    if (parsed !== undefined) {
      out.set(key, parsed);
    }
  }

  return out;
}

function resolveRuntimeTableValue(
  value: RuntimeTableValue,
  runtimeTables: Map<string, RuntimeTableValue>,
  resolutionStack: Set<string>,
): RuntimeTableValue {
  if (typeof value === "string") {
    const referenceMatch = value.match(/^T\.([A-Za-z_][A-Za-z0-9_]*)$/);
    if (!referenceMatch) {
      return value;
    }

    const key = referenceMatch[1];
    const referencedValue = runtimeTables.get(key);
    if (referencedValue === undefined || resolutionStack.has(key)) {
      return value;
    }

    resolutionStack.add(key);
    const resolved = resolveRuntimeTableValue(referencedValue, runtimeTables, resolutionStack);
    resolutionStack.delete(key);
    return resolved;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => resolveRuntimeTableValue(entry, runtimeTables, resolutionStack));
  }

  if (value && typeof value === "object") {
    const out: Record<string, RuntimeTableValue> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = resolveRuntimeTableValue(v, runtimeTables, resolutionStack);
    }
    return out;
  }

  return value;
}

function parseEntriesFromReadOnlyTable(
  luaSource: string,
  tableName: string,
): Array<{ key: number; fields: Record<string, LuaParsedValue>; rawBlock: string }> {
  const lines = luaSource.split(/\r?\n/);
  const marker = `return ReadOnly("${tableName}", {`;
  const startIdx = lines.findIndex((line) => line.includes(marker));
  if (startIdx === -1) {
    throw new Error(`ReadOnly table "${tableName}" not found.`);
  }

  const entries: Array<{ key: number; fields: Record<string, LuaParsedValue>; rawBlock: string }> =
    [];

  for (let i = startIdx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*\}\)\s*,?\s*$/.test(line)) {
      break;
    }

    const inline = line.match(/^\s*\[(-?\d+)\]\s*=\s*\{(.*)\}\s*,?\s*$/);
    if (inline) {
      const key = Number(inline[1]);
      const fields = parseLuaAssignments(inline[2].trim());
      entries.push({ key, fields, rawBlock: line });
      continue;
    }

    const m = line.match(/^\s*\[(-?\d+)\]\s*=\s*\{\s*$/);
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

function discoverLanguageFiles(): LangFile[] {
  return readdirSync(DATAS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^TextMap_Content([A-Z]+)_decompiled\.lua$/.test(name))
    .map((name) => {
      const m = name.match(/^TextMap_Content([A-Z]+)_decompiled\.lua$/);
      return {
        code: m![1],
        filePath: join(DATAS_DIR, name),
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

function parseTextMapFileFiltered(
  filePath: string,
  langCode: string,
  wantedKeys: Set<string>,
): Map<string, string> {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  const out = new Map<string, string>();
  const startRegex = /^\s*([A-Za-z0-9_]+)\s*=\s*\{\s*$/;
  const contentRegex = new RegExp(`^\\s*Content${langCode}\\s*=\\s*"((?:\\\\.|[^"\\\\])*)"`);
  const endRegex = /^\s*\},?\s*$/;
  let currentKey: string | null = null;
  let keep = false;

  for (const line of lines) {
    const startMatch = line.match(startRegex);
    if (startMatch) {
      currentKey = startMatch[1];
      keep = wantedKeys.has(currentKey);
      continue;
    }
    if (!currentKey) {
      continue;
    }

    if (keep) {
      const contentMatch = line.match(contentRegex);
      if (contentMatch) {
        out.set(currentKey, parseLuaString(contentMatch[1]));
      }
    }

    if (endRegex.test(line)) {
      currentKey = null;
      keep = false;
    }
  }

  return out;
}
function buildAssetIndex(): Map<string, string[]> {
  const files: string[] = [];
  const walk = (dir: string): void => {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      return;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (entry.isFile()) {
        files.push(abs);
      }
    }
  };

  walk(OUTPUT_EXPORTS_DIR);

  const index = new Map<string, string[]>();
  for (const filePath of files) {
    const ext = extname(filePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) {
      continue;
    }
    const key = basename(filePath, ext).toLowerCase();
    const rel = toPosixPath(relative(CWD, filePath));
    index.set(key, [...(index.get(key) ?? []), rel]);
  }
  return index;
}

function extractIconCandidates(iconPath: string): string[] {
  const normalized = normalizeGameAssetPath(iconPath) ?? iconPath;
  const segment = normalized.split("/").pop() ?? normalized;
  const sanitized = segment.replaceAll("'", "");
  const parts = sanitized.split(".").filter(Boolean);
  const out = new Set<string>();

  const addCandidate = (value: string): void => {
    if (!value) {
      return;
    }
    out.add(value);
    if (value.startsWith("T_")) {
      out.add(value.slice(2));
    }
    const withoutVariantSuffix = value.replace(/_0\d+$/i, "");
    if (withoutVariantSuffix !== value) {
      out.add(withoutVariantSuffix);
      if (withoutVariantSuffix.startsWith("T_")) {
        out.add(withoutVariantSuffix.slice(2));
      }
    }
  };

  for (const part of parts) {
    addCandidate(part);
  }

  return Array.from(out);
}

function scoreAssetMatch(sourceRel: string, gamePath: string | null): number {
  if (!gamePath) {
    return -sourceRel.length * 0.001;
  }
  const sourceLower = sourceRel.toLowerCase();
  const gameLower = gamePath.toLowerCase();
  const gameBase =
    (normalizeGameAssetPath(gamePath)?.split("/").pop() ?? "").split(".")[0].toLowerCase();
  const sourceBase = basename(sourceLower, extname(sourceLower)).toLowerCase();

  let score = 0;
  if (gameBase.length > 0 && sourceBase === gameBase) {
    score += 100;
  }
  if (gameLower.includes("/prop/draft/") && sourceLower.includes("/prop/draft/")) {
    score += 20;
  }
  if (gameLower.includes("/image/head/weapon/") && sourceLower.includes("/image/head/weapon/")) {
    score += 20;
  }
  if (gameLower.includes("/prop/fashion/") && sourceLower.includes("/prop/fashion/")) {
    score += 20;
  }
  if (gameLower.includes("/atlas/prop/item/") && sourceLower.includes("/atlas/prop/item/")) {
    score += 20;
  }

  const gameTokens = gameLower
    .split("/")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .slice(-6);
  for (const token of gameTokens) {
    if (sourceLower.includes(token)) {
      score += 2;
    }
  }

  return score - sourceRel.length * 0.001;
}

function pickBestAsset(matches: string[], gamePath: string | null): string | null {
  if (matches.length === 0) {
    return null;
  }
  let best: string | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const match of matches) {
    const score = scoreAssetMatch(match, gamePath);
    if (score > bestScore) {
      best = match;
      bestScore = score;
    }
  }
  return best;
}

function resolveIcon(iconGamePath: string | null, assetIndex: Map<string, string[]>): IconResolution {
  if (!iconGamePath) {
    return {
      gamePath: null,
      candidates: [],
      matches: [],
      sourceRel: null,
    };
  }

  const normalized = normalizeGameAssetPath(iconGamePath);
  const candidates = extractIconCandidates(normalized ?? iconGamePath);
  const matches = Array.from(
    new Set(candidates.flatMap((candidate) => assetIndex.get(candidate.toLowerCase()) ?? [])),
  );
  const sourceRel = pickBestAsset(matches, normalized);
  return {
    gamePath: normalized,
    candidates,
    matches,
    sourceRel,
  };
}

function ensureDirectory(path: string): void {
  mkdirSync(path, { recursive: true });
}

function ensureCleanDirectory(path: string): void {
  rmSync(path, { recursive: true, force: true });
  ensureDirectory(path);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_");
}

function copyAssetToPublic(
  sourceRel: string | null,
  targetDir: string,
  cache: Map<string, string>,
): string | null {
  if (!sourceRel) {
    return null;
  }
  const cacheKey = `${sourceRel}|${targetDir}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const sourceAbs = resolve(CWD, sourceRel);
  if (!existsSync(sourceAbs) || !statSync(sourceAbs).isFile()) {
    return null;
  }

  ensureDirectory(targetDir);

  const ext = extname(sourceAbs).toLowerCase() || ".png";
  const rawBase = sanitizeFileName(basename(sourceAbs, ext));
  let targetAbs = join(targetDir, `${rawBase}${ext}`);
  let suffix = 1;
  while (existsSync(targetAbs)) {
    targetAbs = join(targetDir, `${rawBase}_${suffix}${ext}`);
    suffix += 1;
  }

  copyFileSync(sourceAbs, targetAbs);
  const publicRel = toPosixPath(relative(SITE_PUBLIC_ROOT, targetAbs));
  const publicPath = `/${publicRel}`;
  cache.set(cacheKey, publicPath);
  return publicPath;
}

function writeJson(path: string, data: unknown): void {
  ensureDirectory(dirname(path));
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function copyResolvedIconToPublic(
  iconGamePath: string | null,
  assetIndex: Map<string, string[]>,
  targetDir: string,
  cache: Map<string, string>,
): { resolution: IconResolution; publicPath: string | null } {
  const resolution = resolveIcon(iconGamePath, assetIndex);
  const publicPath = copyAssetToPublic(resolution.sourceRel, targetDir, cache);
  return {
    resolution,
    publicPath,
  };
}

function toExportItemIcon(resolution: IconResolution, publicPath: string | null): ExportItemIcon {
  return {
    gamePath: resolution.gamePath,
    publicPath,
    placeholderPath: publicPath ? null : "/marker-default.svg",
    candidates: resolution.candidates,
    allMatches: resolution.matches,
  };
}

function emptyExportItemIcon(): ExportItemIcon {
  return {
    gamePath: null,
    publicPath: null,
    placeholderPath: null,
    candidates: [],
    allMatches: [],
  };
}

function parseRuntimeFromField(
  value: LuaParsedValue | undefined,
  runtimeTables: Map<string, RuntimeTableValue>,
): RuntimeTableValue | null {
  if (value === undefined || value === null) {
    return null;
  }

  let runtimeValue: RuntimeTableValue | null = null;
  if (typeof value === "string") {
    const parsed = new LuaExpressionParser(value).parse();
    runtimeValue = parsed ?? value;
  } else if (Array.isArray(value)) {
    runtimeValue = value as RuntimeTableValue;
  } else if (typeof value === "number" || typeof value === "boolean") {
    runtimeValue = value;
  }

  if (runtimeValue === null) {
    return null;
  }

  return resolveRuntimeTableValue(runtimeValue, runtimeTables, new Set<string>());
}

function asRuntimeNumber(value: RuntimeTableValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asRuntimeString(value: RuntimeTableValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function parseRequirements(value: RuntimeTableValue | null): DraftRequirement[] {
  const out: DraftRequirement[] = [];

  const visit = (node: RuntimeTableValue | undefined): void => {
    if (node === undefined || node === null) {
      return;
    }
    if (Array.isArray(node)) {
      for (const entry of node) {
        visit(entry);
      }
      return;
    }
    if (typeof node === "object") {
      const typed = node as Record<string, RuntimeTableValue>;
      const type = asRuntimeString(typed.Type);
      const id = asRuntimeNumber(typed.Id);
      const num = asRuntimeNumber(typed.Num);
      if (type && id !== null) {
        out.push({
          type,
          id,
          quantity: num ?? 1,
        });
        return;
      }

      const numericKeys = Object.keys(typed)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b));
      if (numericKeys.length > 0) {
        for (const key of numericKeys) {
          visit(typed[key]);
        }
      }
      return;
    }
  };

  visit(value ?? undefined);
  return out;
}

function parseCoinCostMap(value: RuntimeTableValue | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return out;
  }
  for (const [key, entryValue] of Object.entries(value)) {
    if (!/^-?\d+$/.test(key)) {
      continue;
    }
    const numericValue = asRuntimeNumber(entryValue);
    if (numericValue === null) {
      continue;
    }
    out[key] = numericValue;
  }
  return out;
}

function parseAccessKeys(value: RuntimeTableValue | null): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "object") {
    const typed = value as Record<string, RuntimeTableValue>;
    const numericKeys = Object.keys(typed)
      .filter((key) => /^\d+$/.test(key))
      .sort((a, b) => Number(a) - Number(b));
    return numericKeys
      .map((key) => typed[key])
      .filter((entry): entry is string => typeof entry === "string");
  }
  return typeof value === "string" ? [value] : [];
}

function getLanguageCodesFromSiteItems(
  mods: SiteItemRecord[],
  resources: SiteItemRecord[],
  textMapLanguages: string[],
): string[] {
  const out = new Set<string>();
  const addFromItem = (item: SiteItemRecord): void => {
    const translations = item.translations ?? {};
    for (const code of Object.keys(translations)) {
      out.add(code.toUpperCase());
    }
  };
  for (const item of mods) {
    addFromItem(item);
  }
  for (const item of resources) {
    addFromItem(item);
  }
  for (const code of textMapLanguages) {
    out.add(code.toUpperCase());
  }
  return Array.from(out).sort((a, b) => a.localeCompare(b));
}

function loadJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function parseRuntimeNumberArray(value: RuntimeTableValue | null): number[] {
  if (value === null) {
    return [];
  }

  const out: number[] = [];
  const visit = (node: RuntimeTableValue | undefined): void => {
    if (node === undefined || node === null) {
      return;
    }
    if (typeof node === "number" && Number.isFinite(node)) {
      out.push(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const entry of node) {
        visit(entry);
      }
      return;
    }
    if (typeof node === "object") {
      const typed = node as Record<string, RuntimeTableValue>;
      const numericKeys = Object.keys(typed)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b));
      for (const key of numericKeys) {
        visit(typed[key]);
      }
    }
  };

  visit(value);
  return Array.from(new Set(out));
}

function normalizeWeaponSubtype(rawSubtype: string | null): string | null {
  if (!rawSubtype) {
    return null;
  }
  const trimmed = rawSubtype.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return WEAPON_SUBTYPE_ALIASES[trimmed] ?? trimmed;
}

function inferWeaponClassType(weaponId: number): WeaponClass {
  const family = Math.floor(Math.abs(weaponId) / 10000);
  if (family === 1) {
    return "Melee";
  }
  if (family === 2) {
    return "Ranged";
  }
  return "Unknown";
}

function getWeaponClassTextKey(classType: WeaponClass): string | null {
  if (classType === "Melee") {
    return "UI_Armory_Meleeweapon";
  }
  if (classType === "Ranged") {
    return "UI_Armory_Longrange";
  }
  return null;
}

function getWeaponClassIconGamePath(classType: WeaponClass): string | null {
  if (classType === "Melee") {
    return "/Game/UI/Texture/Dynamic/Atlas/Armory/T_Armory_WeaponTypeClose_Combat.T_Armory_WeaponTypeClose_Combat";
  }
  if (classType === "Ranged") {
    return "/Game/UI/Texture/Dynamic/Atlas/Armory/T_Armory_WeaponTypeLongRange.T_Armory_WeaponTypeLongRange";
  }
  return null;
}

function getWeaponSubtypeTextKey(subtype: string | null): string | null {
  if (!subtype) {
    return null;
  }
  return `WeaponType_${subtype}`;
}

function getWeaponSubtypeIconGamePath(subtype: string | null): string | null {
  if (!subtype) {
    return null;
  }
  return `/Game/UI/Texture/Dynamic/Atlas/Armory/T_Armory_WeaponType_${subtype}.T_Armory_WeaponType_${subtype}`;
}

function sanitizeFlatFields(fields: Record<string, LuaParsedValue>): Record<string, LuaParsedValue> {
  const out: Record<string, LuaParsedValue> = {};
  for (const [key, value] of Object.entries(fields)) {
    const sanitized = sanitizeFieldValue(value);
    if (sanitized !== null) {
      out[key] = sanitized;
    }
  }
  return out;
}

function parseWeaponEntries(
  luaSource: string,
  runtimeTables: Map<string, RuntimeTableValue>,
): Map<number, WeaponEntry> {
  const entries = parseEntriesFromReadOnlyTable(luaSource, "Weapon");
  const out = new Map<number, WeaponEntry>();
  for (const entry of entries) {
    const id = asNumber(entry.fields.WeaponId) ?? entry.key;
    const guiPathVariableType = asString(entry.fields.GUIPathVariableType);
    const subtypeNormalized = normalizeWeaponSubtype(guiPathVariableType);
    const classType = inferWeaponClassType(id);
    const skinApplicationTypes = parseRuntimeNumberArray(
      parseRuntimeFromField(entry.fields.SkinApplicationType, runtimeTables),
    );

    out.set(id, {
      id,
      nameKey: asString(entry.fields.WeaponName),
      descriptionKey: asString(entry.fields.WeaponDescribe),
      iconGamePath: asString(entry.fields.Icon),
      bigIconGamePath: asString(entry.fields.BigIcon),
      gachaIconGamePath: asString(entry.fields.GachaIcon),
      guiPathVariableName: asString(entry.fields.GUIPathVariableName),
      guiPathVariableType,
      subtypeNormalized,
      classType,
      classTextKey: getWeaponClassTextKey(classType),
      classIconGamePath: getWeaponClassIconGamePath(classType),
      subtypeTextKey: getWeaponSubtypeTextKey(subtypeNormalized),
      subtypeIconGamePath: getWeaponSubtypeIconGamePath(subtypeNormalized),
      weaponMaxLevel: asNumber(entry.fields.WeaponMaxLevel),
      weaponToCoinType: asNumber(entry.fields.WeaponToCoinType),
      weaponValue: asNumber(entry.fields.WeaponValue),
      collectRewardExp: asNumber(entry.fields.CollectRewardExp),
      decomposeReward: asNumber(entry.fields.DecomposeReward),
      sortPriority: asNumber(entry.fields.SortPriority),
      skinApplicationTypes,
      rarity: asNumber(entry.fields.WeaponRarity),
      releaseVersion: asNumber(entry.fields.ReleaseVersion),
      openVersion: asNumber(entry.fields.OpenVersion),
      fields: sanitizeFlatFields(entry.fields),
    });
  }
  return out;
}

function parseCharAccessoryEntries(luaSource: string): Map<number, CharAccessoryEntry> {
  const entries = parseEntriesFromReadOnlyTable(luaSource, "CharAccessory");
  const out = new Map<number, CharAccessoryEntry>();
  for (const entry of entries) {
    const id = asNumber(entry.fields.AccessoryId) ?? entry.key;
    out.set(id, {
      id,
      nameKey: asString(entry.fields.Name),
      descriptionKey: asString(entry.fields.Des),
      iconGamePath: asString(entry.fields.Icon),
      rarity: asNumber(entry.fields.Rarity),
      accessoryType: asString(entry.fields.AccessoryType),
      releaseVersion: asNumber(entry.fields.ReleaseVersion),
      openVersion: asNumber(entry.fields.OpenVersion),
    });
  }
  return out;
}
function buildNameDescriptionByLanguageFromKeys(
  nameKey: string | null,
  descriptionKey: string | null,
  languageCodes: string[],
  textByLanguage: Map<string, Map<string, string>>,
): {
  names: Record<string, string | null>;
  descriptions: Record<string, string | null>;
} {
  const fallbackMap = textByLanguage.get(DEFAULT_LANGUAGE_FALLBACK) ?? new Map<string, string>();
  const names: Record<string, string | null> = {};
  const descriptions: Record<string, string | null> = {};

  for (const code of languageCodes) {
    const map = textByLanguage.get(code) ?? new Map<string, string>();
    names[code] = nameKey ? map.get(nameKey) ?? fallbackMap.get(nameKey) ?? nameKey : null;
    descriptions[code] = descriptionKey
      ? map.get(descriptionKey) ?? fallbackMap.get(descriptionKey) ?? descriptionKey
      : null;
  }

  return { names, descriptions };
}

function buildNameDescriptionByLanguageFromSiteItem(
  item: SiteItemRecord,
  languageCodes: string[],
): {
  names: Record<string, string | null>;
  descriptions: Record<string, string | null>;
} {
  const names: Record<string, string | null> = {};
  const descriptions: Record<string, string | null> = {};
  for (const code of languageCodes) {
    const translation = item.translations?.[code];
    names[code] =
      translation?.modName ??
      translation?.functionLabel ??
      translation?.demonWedgeName ??
      null;
    descriptions[code] = translation?.description ?? null;
  }
  return { names, descriptions };
}

function withFallbackValues(
  values: Record<string, string | null>,
  fallbackText: string,
  languageCodes: string[],
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const code of languageCodes) {
    out[code] = values[code] ?? fallbackText;
  }
  return out;
}

function buildTextByLanguageFromKey(
  key: string | null,
  languageCodes: string[],
  textByLanguage: Map<string, Map<string, string>>,
): Record<string, string | null> {
  const fallbackMap = textByLanguage.get(DEFAULT_LANGUAGE_FALLBACK) ?? new Map<string, string>();
  const out: Record<string, string | null> = {};
  for (const code of languageCodes) {
    const map = textByLanguage.get(code) ?? new Map<string, string>();
    out[code] = key ? map.get(key) ?? fallbackMap.get(key) ?? key : null;
  }
  return out;
}

function sanitizeDraftFields(fields: Record<string, LuaParsedValue>): Record<string, LuaParsedValue> {
  const out: Record<string, LuaParsedValue> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key === "Resource" || key === "FoundryCost" || key === "AccessKey") {
      continue;
    }
    if (key === "Icon") {
      continue;
    }
    const sanitized = sanitizeFieldValue(value);
    if (sanitized !== null) {
      out[key] = sanitized;
    }
  }
  return out;
}

function buildUnknownReference(
  type: string,
  id: number,
  quantity: number,
  languageCodes: string[],
): DraftItemRef {
  const label = `${type} #${id}`;
  const names = Object.fromEntries(languageCodes.map((code) => [code, label])) as Record<
    string,
    string | null
  >;
  const descriptions = Object.fromEntries(languageCodes.map((code) => [code, null])) as Record<
    string,
    string | null
  >;
  return {
    type,
    id,
    quantity,
    sourceCategory: "unknown",
    href: null,
    rarity: null,
    names,
    descriptions,
    icon: {
      gamePath: null,
      publicPath: null,
      placeholderPath: "/marker-default.svg",
    },
    metadata: {},
  };
}

function main(): void {
  const requiredFiles = [
    DRAFT_DECOMPILED,
    WEAPON_DECOMPILED,
    CHAR_ACCESSORY_DECOMPILED,
    MODS_ITEMS_JSON,
    RESOURCES_ITEMS_JSON,
  ];
  for (const filePath of requiredFiles) {
    if (!existsSync(filePath)) {
      throw new Error(`Missing required file: ${filePath}`);
    }
  }

  const mods = loadJsonFile<SiteItemRecord[]>(MODS_ITEMS_JSON);
  const resources = loadJsonFile<SiteItemRecord[]>(RESOURCES_ITEMS_JSON);
  const modsById = new Map<number, SiteItemRecord>();
  const resourcesById = new Map<number, SiteItemRecord>();
  for (const item of mods) {
    modsById.set(item.modId, item);
  }
  for (const item of resources) {
    resourcesById.set(item.modId, item);
  }

  const draftSource = readFileSync(DRAFT_DECOMPILED, "utf8");
  const weaponSource = readFileSync(WEAPON_DECOMPILED, "utf8");
  const charAccessorySource = readFileSync(CHAR_ACCESSORY_DECOMPILED, "utf8");

  const runtimeTables = parseRuntimeTableDefinitions(draftSource);
  const weaponRuntimeTables = parseRuntimeTableDefinitions(weaponSource);
  const draftEntries = parseEntriesFromReadOnlyTable(draftSource, "Draft");
  const weaponsById = parseWeaponEntries(weaponSource, weaponRuntimeTables);
  const charAccessoriesById = parseCharAccessoryEntries(charAccessorySource);

  const neededWeaponIds = new Set<number>();
  const neededCharAccessoryIds = new Set<number>();
  for (const entry of draftEntries) {
    const productType = asString(entry.fields.ProductType);
    const productId = asNumber(entry.fields.ProductId);
    if (productId !== null && productType === "Weapon") {
      neededWeaponIds.add(productId);
    }
    if (productId !== null && productType === "CharAccessory") {
      neededCharAccessoryIds.add(productId);
    }

    const resourceRuntime = parseRuntimeFromField(entry.fields.Resource, runtimeTables);
    for (const requirement of parseRequirements(resourceRuntime)) {
      if (requirement.type === "Weapon") {
        neededWeaponIds.add(requirement.id);
      }
      if (requirement.type === "CharAccessory") {
        neededCharAccessoryIds.add(requirement.id);
      }
    }
  }

  const wantedTextKeys = new Set<string>();
  for (const weapon of weaponsById.values()) {
    if (weapon.nameKey) {
      wantedTextKeys.add(weapon.nameKey);
    }
    if (weapon.descriptionKey) {
      wantedTextKeys.add(weapon.descriptionKey);
    }
    if (weapon.classTextKey) {
      wantedTextKeys.add(weapon.classTextKey);
    }
    if (weapon.subtypeTextKey) {
      wantedTextKeys.add(weapon.subtypeTextKey);
    }
  }
  for (const accessory of charAccessoriesById.values()) {
    if (accessory.nameKey) {
      wantedTextKeys.add(accessory.nameKey);
    }
    if (accessory.descriptionKey) {
      wantedTextKeys.add(accessory.descriptionKey);
    }
  }

  const languageFiles = discoverLanguageFiles();
  const textByLanguage = new Map<string, Map<string, string>>();
  for (const language of languageFiles) {
    textByLanguage.set(
      language.code,
      parseTextMapFileFiltered(language.filePath, language.code, wantedTextKeys),
    );
  }
  const languageCodes = getLanguageCodesFromSiteItems(
    mods,
    resources,
    languageFiles.map((file) => file.code),
  );

  const assetIndex = buildAssetIndex();
  ensureCleanDirectory(SITE_DRAFT_ICON_DIR);
  ensureCleanDirectory(SITE_WEAPON_ICON_DIR);
  ensureCleanDirectory(SITE_WEAPON_TYPE_ICON_DIR);
  ensureCleanDirectory(SITE_CHAR_ACCESSORY_ICON_DIR);
  const copiedAssetCache = new Map<string, string>();

  const weaponRefsById = new Map<number, DraftItemRef>();
  for (const weapon of weaponsById.values()) {
    const icon = copyResolvedIconToPublic(
      weapon.iconGamePath,
      assetIndex,
      SITE_WEAPON_ICON_DIR,
      copiedAssetCache,
    );
    const bigIcon = copyResolvedIconToPublic(
      weapon.bigIconGamePath,
      assetIndex,
      SITE_WEAPON_ICON_DIR,
      copiedAssetCache,
    );
    const gachaIcon = copyResolvedIconToPublic(
      weapon.gachaIconGamePath,
      assetIndex,
      SITE_WEAPON_ICON_DIR,
      copiedAssetCache,
    );
    const classIcon = copyResolvedIconToPublic(
      weapon.classIconGamePath,
      assetIndex,
      SITE_WEAPON_TYPE_ICON_DIR,
      copiedAssetCache,
    );
    const subtypeIcon = copyResolvedIconToPublic(
      weapon.subtypeIconGamePath,
      assetIndex,
      SITE_WEAPON_TYPE_ICON_DIR,
      copiedAssetCache,
    );
    const classLabels = buildTextByLanguageFromKey(weapon.classTextKey, languageCodes, textByLanguage);
    const subtypeLabels = buildTextByLanguageFromKey(weapon.subtypeTextKey, languageCodes, textByLanguage);

    const localized = buildNameDescriptionByLanguageFromKeys(
      weapon.nameKey,
      weapon.descriptionKey,
      languageCodes,
      textByLanguage,
    );
    const names = withFallbackValues(localized.names, `Weapon #${weapon.id}`, languageCodes);
    const descriptions = localized.descriptions;
    weaponRefsById.set(weapon.id, {
      type: "Weapon",
      id: weapon.id,
      quantity: 1,
      sourceCategory: "weapons",
      href: `/items/weapons/weapons-${weapon.id}`,
      rarity: weapon.rarity,
      names,
      descriptions,
      icon: {
        gamePath: icon.resolution.gamePath,
        publicPath: icon.publicPath,
        placeholderPath: icon.publicPath ? null : "/marker-default.svg",
      },
      metadata: {
        classType: weapon.classType,
        classTextKey: weapon.classTextKey,
        classIconGamePath: classIcon.resolution.gamePath,
        classIconPublicPath: classIcon.publicPath,
        classLabelEn: classLabels.EN ?? null,
        subtype: weapon.guiPathVariableType,
        subtypeNormalized: weapon.subtypeNormalized,
        subtypeTextKey: weapon.subtypeTextKey,
        subtypeIconGamePath: subtypeIcon.resolution.gamePath,
        subtypeIconPublicPath: subtypeIcon.publicPath,
        subtypeLabelEn: subtypeLabels.EN ?? null,
        guiPathVariableName: weapon.guiPathVariableName,
        weaponMaxLevel: weapon.weaponMaxLevel,
        weaponToCoinType: weapon.weaponToCoinType,
        weaponValue: weapon.weaponValue,
        collectRewardExp: weapon.collectRewardExp,
        decomposeReward: weapon.decomposeReward,
        sortPriority: weapon.sortPriority,
        skinApplicationTypes: weapon.skinApplicationTypes,
        bigIconGamePath: bigIcon.resolution.gamePath,
        bigIconPublicPath: bigIcon.publicPath,
        gachaIconGamePath: gachaIcon.resolution.gamePath,
        gachaIconPublicPath: gachaIcon.publicPath,
        releaseVersion: weapon.releaseVersion,
        openVersion: weapon.openVersion,
      },
    });
  }

  const charAccessoryRefsById = new Map<number, DraftItemRef>();
  for (const accessory of charAccessoriesById.values()) {
    if (!neededCharAccessoryIds.has(accessory.id)) {
      continue;
    }
    const iconResolution = resolveIcon(accessory.iconGamePath, assetIndex);
    const publicPath = copyAssetToPublic(
      iconResolution.sourceRel,
      SITE_CHAR_ACCESSORY_ICON_DIR,
      copiedAssetCache,
    );
    const localized = buildNameDescriptionByLanguageFromKeys(
      accessory.nameKey,
      accessory.descriptionKey,
      languageCodes,
      textByLanguage,
    );
    const names = withFallbackValues(
      localized.names,
      `CharAccessory #${accessory.id}`,
      languageCodes,
    );
    const descriptions = localized.descriptions;
    charAccessoryRefsById.set(accessory.id, {
      type: "CharAccessory",
      id: accessory.id,
      quantity: 1,
      sourceCategory: "char-accessories",
      href: null,
      rarity: accessory.rarity,
      names,
      descriptions,
      icon: {
        gamePath: iconResolution.gamePath,
        publicPath,
        placeholderPath: publicPath ? null : "/marker-default.svg",
      },
      metadata: {
        accessoryType: accessory.accessoryType,
        releaseVersion: accessory.releaseVersion,
        openVersion: accessory.openVersion,
      },
    });
  }

  const weaponItems: ExportItemRecord[] = Array.from(weaponsById.values())
    .map((weapon) => {
      const weaponIcon = copyResolvedIconToPublic(
        weapon.iconGamePath,
        assetIndex,
        SITE_WEAPON_ICON_DIR,
        copiedAssetCache,
      );
      const classIcon = copyResolvedIconToPublic(
        weapon.classIconGamePath,
        assetIndex,
        SITE_WEAPON_TYPE_ICON_DIR,
        copiedAssetCache,
      );
      const subtypeIcon = copyResolvedIconToPublic(
        weapon.subtypeIconGamePath,
        assetIndex,
        SITE_WEAPON_TYPE_ICON_DIR,
        copiedAssetCache,
      );
      const localized = buildNameDescriptionByLanguageFromKeys(
        weapon.nameKey,
        weapon.descriptionKey,
        languageCodes,
        textByLanguage,
      );
      const names = withFallbackValues(localized.names, `Weapon #${weapon.id}`, languageCodes);
      const descriptions = localized.descriptions;
      const classLabels = buildTextByLanguageFromKey(weapon.classTextKey, languageCodes, textByLanguage);
      const subtypeLabels = buildTextByLanguageFromKey(
        weapon.subtypeTextKey,
        languageCodes,
        textByLanguage,
      );

      const typeCompatibilityKeys: string[] = [];
      const typeCompatibilityTags: Array<{ key: string; icon: ExportItemIcon }> = [];
      if (weapon.classTextKey) {
        typeCompatibilityKeys.push(weapon.classTextKey);
        typeCompatibilityTags.push({
          key: weapon.classTextKey,
          icon: toExportItemIcon(classIcon.resolution, classIcon.publicPath),
        });
      }
      if (weapon.subtypeTextKey) {
        typeCompatibilityKeys.push(weapon.subtypeTextKey);
        typeCompatibilityTags.push({
          key: weapon.subtypeTextKey,
          icon: toExportItemIcon(subtypeIcon.resolution, subtypeIcon.publicPath),
        });
      }

      const classFallbackLabel =
        weapon.classType === "Melee"
          ? "Melee Weapons"
          : weapon.classType === "Ranged"
            ? "Ranged Weapons"
            : "Weapon";

      const translations: Record<string, ExportItemLocalizedContent> = {};
      for (const code of languageCodes) {
        const classLabel = classLabels[code] ?? classFallbackLabel;
        const subtypeLabel = subtypeLabels[code];
        const typeCompatibilityNames = [classLabel, subtypeLabel].filter(
          (value): value is string => typeof value === "string" && value.trim().length > 0,
        );

        translations[code] = {
          modName: names[code] ?? `Weapon #${weapon.id}`,
          description: descriptions[code] ?? null,
          demonWedgeName: null,
          functionLabel: classLabel,
          passiveEffectsDescription: null,
          affinityName: null,
          archiveName: null,
          typeCompatibilityNames,
        };
      }

      const fields: Record<string, LuaParsedValue> = sanitizeFlatFields(weapon.fields);
      fields.Type = weapon.classType;
      if (weapon.guiPathVariableType) {
        fields.ResourceSType = weapon.guiPathVariableType;
      }
      if (weapon.classTextKey) {
        fields.WeaponClassKey = weapon.classTextKey;
      }
      if (weapon.subtypeTextKey) {
        fields.WeaponTypeKey = weapon.subtypeTextKey;
      }
      if (weapon.skinApplicationTypes.length > 0) {
        fields.SkinApplicationTypeCodes = weapon.skinApplicationTypes;
      }
      if (weapon.classType !== "Unknown") {
        fields.WeaponClass = weapon.classType;
      }
      if (weapon.subtypeNormalized) {
        fields.WeaponSubtype = weapon.subtypeNormalized;
      }

      return {
        id: `weapons-${weapon.id}`,
        categoryId: "weapons",
        modId: weapon.id,
        archiveId: null,
        stats: {
          rarity: weapon.rarity,
          polarity: null,
          maxLevel: weapon.weaponMaxLevel,
          cost: null,
          openVersion: weapon.openVersion,
          releaseVersion: weapon.releaseVersion,
        },
        textKeys: {
          modNameKey: weapon.nameKey,
          descriptionKey: weapon.descriptionKey,
          demonWedgeKey: null,
          functionKey: weapon.classTextKey,
          passiveEffectsDescKey: null,
          affinityNameKey: null,
          archiveNameKey: null,
        },
        affinity: {
          id: null,
          nameKey: null,
          char: null,
          icon: emptyExportItemIcon(),
        },
        typeCompatibility: {
          applicationType: weapon.skinApplicationTypes[0] ?? null,
          textKeys: typeCompatibilityKeys,
          tags: typeCompatibilityTags,
        },
        tolerance: {
          baseCost: null,
          costChange: null,
          maxLevel: 0,
          valuesByLevel: {
            "0": null,
          },
        },
        icon: toExportItemIcon(weaponIcon.resolution, weaponIcon.publicPath),
        scaling: {
          defaultLevel: 0,
          maxLevel: 0,
          availableLevels: [0],
          valuesByLevel: {
            "0": {},
          },
          attributesByLevel: {
            "0": [],
          },
        },
        translations,
        fields,
      };
    })
    .sort((a, b) => a.modId - b.modId);

  const resolveReference = (typeRaw: string, id: number, quantity: number): DraftItemRef => {
    const type = typeRaw.trim();
    if (type === "Mod") {
      const modItem = modsById.get(id);
      if (modItem) {
        const localized = buildNameDescriptionByLanguageFromSiteItem(modItem, languageCodes);
        const names = withFallbackValues(localized.names, `MOD #${id}`, languageCodes);
        return {
          type: "Mod",
          id,
          quantity,
          sourceCategory: "mods",
          href: `/items/mods/${modItem.id}`,
          rarity: modItem.stats?.rarity ?? null,
          names,
          descriptions: localized.descriptions,
          icon: {
            gamePath: modItem.icon?.gamePath ?? null,
            publicPath: modItem.icon?.publicPath ?? null,
            placeholderPath: modItem.icon?.placeholderPath ?? "/marker-default.svg",
          },
          metadata: {},
        };
      }

      const asResource = resourcesById.get(id);
      if (asResource) {
        const localized = buildNameDescriptionByLanguageFromSiteItem(asResource, languageCodes);
        const names = withFallbackValues(localized.names, `ModResource #${id}`, languageCodes);
        return {
          type: "Mod",
          id,
          quantity,
          sourceCategory: "resources",
          href: `/items/resources/${asResource.id}`,
          rarity: asResource.stats?.rarity ?? null,
          names,
          descriptions: localized.descriptions,
          icon: {
            gamePath: asResource.icon?.gamePath ?? null,
            publicPath: asResource.icon?.publicPath ?? null,
            placeholderPath: asResource.icon?.placeholderPath ?? "/marker-default.svg",
          },
          metadata: {},
        };
      }
    }

    if (type === "Resource") {
      const resourceItem = resourcesById.get(id);
      if (resourceItem) {
        const localized = buildNameDescriptionByLanguageFromSiteItem(resourceItem, languageCodes);
        const names = withFallbackValues(localized.names, `Resource #${id}`, languageCodes);
        return {
          type: "Resource",
          id,
          quantity,
          sourceCategory: "resources",
          href: `/items/resources/${resourceItem.id}`,
          rarity: resourceItem.stats?.rarity ?? null,
          names,
          descriptions: localized.descriptions,
          icon: {
            gamePath: resourceItem.icon?.gamePath ?? null,
            publicPath: resourceItem.icon?.publicPath ?? null,
            placeholderPath: resourceItem.icon?.placeholderPath ?? "/marker-default.svg",
          },
          metadata: {
            resourceSType:
              typeof resourceItem.fields?.ResourceSType === "string"
                ? resourceItem.fields.ResourceSType
                : null,
          },
        };
      }
    }

    if (type === "Weapon") {
      const weapon = weaponRefsById.get(id);
      if (weapon) {
        return {
          ...weapon,
          quantity,
        };
      }
    }

    if (type === "CharAccessory") {
      const accessory = charAccessoryRefsById.get(id);
      if (accessory) {
        return {
          ...accessory,
          quantity,
        };
      }

      const resourceItem = resourcesById.get(id);
      if (resourceItem) {
        const localized = buildNameDescriptionByLanguageFromSiteItem(resourceItem, languageCodes);
        const names = withFallbackValues(localized.names, `CharAccessory #${id}`, languageCodes);
        return {
          type: "CharAccessory",
          id,
          quantity,
          sourceCategory: "resources",
          href: `/items/resources/${resourceItem.id}`,
          rarity: resourceItem.stats?.rarity ?? null,
          names,
          descriptions: localized.descriptions,
          icon: {
            gamePath: resourceItem.icon?.gamePath ?? null,
            publicPath: resourceItem.icon?.publicPath ?? null,
            placeholderPath: resourceItem.icon?.placeholderPath ?? "/marker-default.svg",
          },
          metadata: {
            resourceSType:
              typeof resourceItem.fields?.ResourceSType === "string"
                ? resourceItem.fields.ResourceSType
                : null,
          },
        };
      }
    }

    return buildUnknownReference(type, id, quantity, languageCodes);
  };

  let unresolvedProducts = 0;
  let unresolvedIngredients = 0;

  const recipes: DraftRecipeRecord[] = draftEntries
    .map((entry) => {
      const draftId = asNumber(entry.fields.DraftId) ?? entry.key;
      const productType = asString(entry.fields.ProductType) ?? "Unknown";
      const productId = asNumber(entry.fields.ProductId) ?? -1;
      const productQuantity = asNumber(entry.fields.ProductNum) ?? 1;

      const draftIconResolution = resolveIcon(asString(entry.fields.Icon), assetIndex);
      const draftIconPublicPath = copyAssetToPublic(
        draftIconResolution.sourceRel,
        SITE_DRAFT_ICON_DIR,
        copiedAssetCache,
      );

      const resourceRuntime = parseRuntimeFromField(entry.fields.Resource, runtimeTables);
      const ingredientRequirements = parseRequirements(resourceRuntime);
      const ingredients = ingredientRequirements.map((requirement) =>
        resolveReference(requirement.type, requirement.id, requirement.quantity),
      );

      const productReference = resolveReference(productType, productId, productQuantity);

      if (productReference.sourceCategory === "unknown") {
        unresolvedProducts += 1;
      }
      unresolvedIngredients += ingredients.filter(
        (ingredient) => ingredient.sourceCategory === "unknown",
      ).length;

      const foundryCostRuntime = parseRuntimeFromField(entry.fields.FoundryCost, runtimeTables);
      const accessKeyRuntime = parseRuntimeFromField(entry.fields.AccessKey, runtimeTables);

      return {
        id: `draft-${draftId}`,
        draftId,
        productType,
        productId,
        productQuantity,
        icon: {
          gamePath: draftIconResolution.gamePath,
          publicPath: draftIconPublicPath,
          placeholderPath: draftIconPublicPath ? null : "/marker-default.svg",
        },
        product: productReference,
        ingredients,
        crafting: {
          durationSec: asNumber(entry.fields.Time),
          batch: asBoolean(entry.fields.Batch) ?? false,
          rarity: asNumber(entry.fields.Rarity),
          foundryCostByCoinType: parseCoinCostMap(foundryCostRuntime),
          resourceToCoinType: asNumber(entry.fields.ResourceToCoinType),
          resourceValue: asNumber(entry.fields.ResourceValue),
          accessKeys: parseAccessKeys(accessKeyRuntime),
          releaseVersion: asNumber(entry.fields.ReleaseVersion),
          openVersion: asNumber(entry.fields.OpenVersion),
          showInBag: asNumber(entry.fields.ShowInBag),
          showInDraftArchive: asBoolean(entry.fields.ShowInDraftArchive) ?? false,
        },
        fields: sanitizeDraftFields(entry.fields),
      };
    })
    .sort((a, b) => a.draftId - b.draftId);

  writeJson(SITE_WEAPONS_ITEMS_JSON, weaponItems);
  writeJson(SITE_DRAFT_RECIPES_JSON, recipes);

  const byProductType = recipes.reduce<Record<string, number>>((acc, recipe) => {
    acc[recipe.productType] = (acc[recipe.productType] ?? 0) + 1;
    return acc;
  }, {});
  const ingredientTypeCounts = recipes.reduce<Record<string, number>>((acc, recipe) => {
    for (const ingredient of recipe.ingredients) {
      acc[ingredient.type] = (acc[ingredient.type] ?? 0) + 1;
    }
    return acc;
  }, {});

  console.log(`[drafts] Recipes exported: ${recipes.length}`);
  console.log(
    `[weapons] Items exported: ${weaponItems.length} (referenced in drafts: ${neededWeaponIds.size})`,
  );
  console.log(`[weapons] Output: ${toPosixPath(relative(CWD, SITE_WEAPONS_ITEMS_JSON))}`);
  console.log(`[drafts] Product types: ${JSON.stringify(byProductType)}`);
  console.log(`[drafts] Ingredient types: ${JSON.stringify(ingredientTypeCounts)}`);
  console.log(
    `[drafts] Unresolved products: ${unresolvedProducts}, unresolved ingredients: ${unresolvedIngredients}`,
  );
  console.log(`[drafts] Output: ${toPosixPath(relative(CWD, SITE_DRAFT_RECIPES_JSON))}`);
}

main();
