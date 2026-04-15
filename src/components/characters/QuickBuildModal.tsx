"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Sparkles, Swords, Target, X } from "lucide-react";
import {
  getTrackIcon,
  type BuildDemonWedgeSlot,
  type CharacterBuild,
  type ResolvedItemRef,
} from "@/lib/characters/builds";
import type { CharacterRecord } from "@/lib/characters/types";
import CursorTooltip from "@/components/CursorTooltip";

// ---------------------------------------------------------------------------
// Card visual constants — palette inspired by Enka.network
// ---------------------------------------------------------------------------
// Enka uses a muted, desaturated element color as the card's base (Hydro =
// rgb(132, 161, 198) for example) rather than a dark background with colored
// glow. The portrait is feathered (canvas-based in their case) and a single
// soft Shade.svg at 0.4 opacity gives depth. We replicate that with CSS.
//
// The "CARD" colors below are deliberately darker / more saturated than the
// pastel Enka palette so our nighttime backdrop still reads well.

const CARD_BG: Record<string, string> = {
  Fire: "rgb(110, 52, 52)",
  Water: "rgb(52, 83, 120)",
  Thunder: "rgb(78, 63, 120)",
  Wind: "rgb(52, 102, 82)",
  Light: "rgb(120, 97, 52)",
  Dark: "rgb(66, 66, 110)",
};

const CARD_ACCENT: Record<string, string> = {
  Fire: "#fca5a5",
  Water: "#93c5fd",
  Thunder: "#c4b5fd",
  Wind: "#6ee7b7",
  Light: "#fde68a",
  Dark: "#a5b4fc",
};

const ELEMENT_RGB: Record<string, string> = {
  Fire: "239, 68, 68",
  Water: "96, 165, 250",
  Thunder: "167, 139, 250",
  Wind: "52, 211, 153",
  Light: "251, 191, 36",
  Dark: "129, 140, 248",
};

const ELEMENT_ICONS: Record<string, string> = {
  Fire: "/assets/items/mods/T_Armory_Fire.png",
  Water: "/assets/items/mods/T_Armory_Water.png",
  Thunder: "/assets/items/mods/T_Armory_Thunder.png",
  Wind: "/assets/items/mods/T_Armory_Wind.png",
  Light: "/assets/items/mods/T_Armory_Light.png",
  Dark: "/assets/items/mods/T_Armory_Dark.png",
};

const STAT_LABELS: Record<string, string> = {
  ATK: "ATQ",
  DEF: "DEF",
  HP: "PV",
  MaxHp: "PV Max",
  MaxES: "Bouclier",
  MaxSp: "Lucidité",
  SkillDmg: "DGT comp.",
  SkillIntensity: "Intensité",
  SkillEfficiency: "Efficacité",
  SkillSustain: "Endurance",
  SkillRange: "Portée",
  SkillSpeed: "Vitesse",
  CritRate: "Taux CRIT",
  CritDmg: "DGT CRIT",
  StrongValue: "Vigueur",
  EnmityValue: "Ténacité",
};

// Parallelogram clips — slots lean toward the center (mirror the detail page).
const CLIP_LEFT = "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)";
const CLIP_RIGHT = "polygon(0% 0%, 80% 0%, 100% 100%, 20% 100%)";

const CARD_W = 1280;
const CARD_H = 560;
const LEFT_W = 460; // portrait section logical width — the bust image extends beyond this and fades.

function localized(texts: Record<string, string> | undefined, lang: string): string | null {
  if (!texts) return null;
  return (
    texts[lang.toUpperCase()] ??
    texts.FR ??
    texts.EN ??
    Object.values(texts)[0] ??
    null
  );
}

// ---------------------------------------------------------------------------
// Presentational pieces
// ---------------------------------------------------------------------------

function RarityStars({ rarity }: { rarity: number | null }) {
  if (!rarity) return null;
  return (
    <span className="inline-flex items-center text-[10px] leading-none tracking-tighter text-amber-300">
      {"★".repeat(rarity)}
    </span>
  );
}

function ItemTooltipBody({
  item,
  rank,
  kindLabel,
}: {
  item: ResolvedItemRef;
  rank?: "best" | "alternative";
  kindLabel?: string;
}) {
  return (
    <div className="pointer-events-none">
      <div className="flex items-start gap-3">
        <img
          src={item.icon}
          alt=""
          className="h-12 w-12 shrink-0 object-contain drop-shadow-md"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{item.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
            {item.rarity !== null && (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-amber-200">
                {"★".repeat(item.rarity)}
              </span>
            )}
            <span className="rounded-full border border-slate-600/70 px-2 py-0.5 font-mono text-slate-300">
              #{item.modId}
            </span>
            {item.element && (
              <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-200">
                {item.element}
              </span>
            )}
            {rank === "best" && (
              <span className="rounded-full border border-amber-300/50 bg-amber-400/20 px-2 py-0.5 font-semibold text-amber-200">
                S-tier
              </span>
            )}
            {kindLabel && (
              <span className="rounded-full border border-slate-700/70 px-2 py-0.5 text-slate-300">
                {kindLabel}
              </span>
            )}
          </div>
        </div>
      </div>
      {item.description && (
        <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-slate-300">
          {item.description}
        </p>
      )}
    </div>
  );
}

function WeaponCell({
  weapon,
  size = "md",
  kindLabel,
}: {
  weapon: { item: ResolvedItemRef | null; rank: "best" | "alternative" };
  size?: "lg" | "md" | "sm";
  kindLabel?: string;
}) {
  if (!weapon.item) return null;
  const item = weapon.item;
  const isBest = weapon.rank === "best";
  const iconSize = size === "lg" ? "h-16 w-16" : size === "md" ? "h-13 w-13" : "h-11 w-11";
  const sizeStyle = size === "lg" ? { height: 64, width: 64 } : size === "md" ? { height: 52, width: 52 } : { height: 44, width: 44 };
  const textSize = size === "lg" ? "text-sm" : size === "md" ? "text-xs" : "text-[11px]";
  return (
    <CursorTooltip
      width={300}
      content={<ItemTooltipBody item={item} rank={weapon.rank} kindLabel={kindLabel} />}
    >
      <div className="flex cursor-default items-center gap-2">
        {/* Icon only — no frame, no background. The image itself IS the visual. */}
        <div
          className={`relative ${iconSize} shrink-0`}
          style={sizeStyle}
        >
          <img
            src={item.icon}
            alt=""
            className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          />
          {isBest && (
            <span className="absolute -right-1 -top-1 rounded-full bg-amber-300/95 px-1.5 text-[9px] font-bold leading-tight text-slate-950 shadow">
              S
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p
            className={`truncate font-medium text-white ${textSize}`}
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
          >
            {item.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/80">
            <RarityStars rarity={item.rarity} />
            <span className="rounded border border-white/25 px-1 font-mono">
              #{item.modId}
            </span>
          </div>
        </div>
      </div>
    </CursorTooltip>
  );
}

// Pick an appropriate cell size based on how many weapons we need to show
// (best + alternatives). 1-2 → large, 3 → medium, 4+ → small (capped at 3 shown).
function weaponSize(count: number): "lg" | "md" | "sm" {
  if (count <= 2) return "lg";
  if (count === 3) return "md";
  return "sm";
}

type WedgeScale = "lg" | "md" | "sm";

const WEDGE_DIMS: Record<WedgeScale, {
  slotH: number; slotW: number; iconSize: string;
  centerH: number; centerIcon: string;
  badgeSize: string; badgePos: string;
  trackBoxSize: string; trackIconSize: string;
  gapSlots: string; gapRows: string; gapCols: string;
}> = {
  lg: {
    slotH: 108, slotW: 82, iconSize: "h-14 w-14",
    centerH: 100, centerIcon: "h-14 w-14",
    badgeSize: "h-4 w-4", badgePos: "top-1",
    trackBoxSize: "h-5 w-5", trackIconSize: "h-3.5 w-3.5",
    gapSlots: "gap-2", gapRows: "gap-3", gapCols: "gap-4",
  },
  md: {
    slotH: 88, slotW: 66, iconSize: "h-11 w-11",
    centerH: 84, centerIcon: "h-12 w-12",
    badgeSize: "h-3.5 w-3.5", badgePos: "top-0.5",
    trackBoxSize: "h-4 w-4", trackIconSize: "h-3 w-3",
    gapSlots: "gap-1.5", gapRows: "gap-2.5", gapCols: "gap-3",
  },
  sm: {
    slotH: 72, slotW: 56, iconSize: "h-9 w-9",
    centerH: 72, centerIcon: "h-10 w-10",
    badgeSize: "h-3 w-3", badgePos: "top-0.5",
    trackBoxSize: "h-4 w-4", trackIconSize: "h-3 w-3",
    gapSlots: "gap-1.5", gapRows: "gap-2", gapCols: "gap-3",
  },
};

function WedgeSlot({
  slot,
  side,
  rgb,
  scale,
}: {
  slot: BuildDemonWedgeSlot;
  side: "left" | "right";
  rgb: string;
  scale: WedgeScale;
}) {
  const clip = side === "left" ? CLIP_LEFT : CLIP_RIGHT;
  const icon = slot.item?.icon;
  const polarityIcon = getTrackIcon(slot.item?.polarity ?? null);
  const trackAdjustIcon = slot.track !== null ? getTrackIcon(slot.track) : null;
  const topSide = side === "left" ? "right-1" : "left-1";
  const bottomSide = side === "left" ? "left-1" : "right-1";
  const d = WEDGE_DIMS[scale];
  const inner = (
    <div
      className="relative shrink-0 cursor-default"
      style={{
        height: d.slotH,
        width: d.slotW,
        clipPath: clip,
        background: `linear-gradient(135deg, rgba(${rgb}, 0.35) 0%, rgba(8, 14, 30, 0.9) 100%)`,
        border: `1.5px solid rgba(255, 255, 255, 0.5)`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {icon ? (
          <img src={icon} alt="" className={`${d.iconSize} object-contain drop-shadow-md`} />
        ) : (
          <span className="text-xs text-white/40">—</span>
        )}
      </div>
      {polarityIcon && (
        <img
          src={polarityIcon}
          alt=""
          className={`absolute ${d.badgePos} ${topSide} ${d.badgeSize} object-contain opacity-90`}
        />
      )}
      {trackAdjustIcon && (
        <div
          className={`absolute bottom-0.5 ${bottomSide} flex ${d.trackBoxSize} items-center justify-center rounded border border-amber-300/70 bg-black/70`}
        >
          <img src={trackAdjustIcon} alt="" className={`${d.trackIconSize} object-contain`} />
        </div>
      )}
    </div>
  );
  if (!slot.item) return inner;
  return (
    <CursorTooltip
      width={280}
      content={<ItemTooltipBody item={slot.item} kindLabel={`Slot ${slot.position}`} />}
    >
      {inner}
    </CursorTooltip>
  );
}

function WedgeCenter({
  item,
  rgb,
  scale,
}: {
  item: ResolvedItemRef | null;
  rgb: string;
  scale: WedgeScale;
}) {
  const d = WEDGE_DIMS[scale];
  const icon = item?.icon;
  const circle = (
    <div
      className="relative flex cursor-default items-center justify-center rounded-full"
      style={{
        height: d.centerH,
        width: d.centerH,
        background: `radial-gradient(circle at center, rgba(${rgb}, 0.7), rgba(8, 14, 30, 0.95))`,
        border: "2px solid rgba(255, 255, 255, 0.55)",
        boxShadow: `0 0 24px rgba(${rgb}, 0.5), inset 0 0 12px rgba(255, 255, 255, 0.15)`,
      }}
    >
      {icon && <img src={icon} alt="" className={`${d.centerIcon} object-contain drop-shadow-lg`} />}
    </div>
  );
  if (!item) return circle;
  return (
    <CursorTooltip
      width={280}
      content={<ItemTooltipBody item={item} kindLabel="Demon Wedge central" />}
    >
      {circle}
    </CursorTooltip>
  );
}

function WedgeLayout({
  slots,
  centerItem,
  rgb,
  scale,
}: {
  slots: BuildDemonWedgeSlot[];
  centerItem: ResolvedItemRef | null;
  rgb: string;
  scale: WedgeScale;
}) {
  const at = (pos: number): BuildDemonWedgeSlot =>
    slots.find((s) => s.position === pos) ?? { position: pos, item: null, track: null };
  const d = WEDGE_DIMS[scale];
  return (
    <div className={`flex items-center justify-center ${d.gapCols}`}>
      <div className={`flex flex-col ${d.gapRows}`}>
        <div className={`flex ${d.gapSlots}`}>
          <WedgeSlot slot={at(1)} side="left" rgb={rgb} scale={scale} />
          <WedgeSlot slot={at(2)} side="left" rgb={rgb} scale={scale} />
        </div>
        <div className={`flex ${d.gapSlots}`}>
          <WedgeSlot slot={at(5)} side="left" rgb={rgb} scale={scale} />
          <WedgeSlot slot={at(6)} side="left" rgb={rgb} scale={scale} />
        </div>
      </div>

      <WedgeCenter item={centerItem} rgb={rgb} scale={scale} />

      <div className={`flex flex-col ${d.gapRows}`}>
        <div className={`flex ${d.gapSlots}`}>
          <WedgeSlot slot={at(3)} side="right" rgb={rgb} scale={scale} />
          <WedgeSlot slot={at(4)} side="right" rgb={rgb} scale={scale} />
        </div>
        <div className={`flex ${d.gapSlots}`}>
          <WedgeSlot slot={at(7)} side="right" rgb={rgb} scale={scale} />
          <WedgeSlot slot={at(8)} side="right" rgb={rgb} scale={scale} />
        </div>
      </div>
    </div>
  );
}

// Pick wedge scale based on how much vertical room the weapon section consumes.
// Fewer weapons overall → more free space → bigger wedge.
function wedgeScale(totalWeapons: number): WedgeScale {
  if (totalWeapons <= 2) return "lg"; // 1+1 at most → big wedge
  if (totalWeapons <= 4) return "md"; // 2+2 or 3+1
  return "sm";                         // 3+3 etc.
}

// ---------------------------------------------------------------------------
// The card itself — follows the Enka technique:
//   1. SOLID element color as the card base (not dark-with-glow).
//   2. Bust image in a wide absolutely-positioned layer, with an aggressive
//      feather mask fading to transparent on the right. The element color
//      below shows through so there's no hard edge.
//   3. Shade.svg overlay (soft dark vignette) on the left to add depth.
//   4. Text / stats / wedge content sits on top, using translucent dark
//      backgrounds so it reads over both the feathered portrait and the bg.
// ---------------------------------------------------------------------------

export function QuickBuildCard({
  character,
  build,
  lang,
  cardRef,
}: {
  character: CharacterRecord;
  build: CharacterBuild;
  lang: string;
  cardRef?: React.Ref<HTMLDivElement> | null;
}) {
  const elementKey = character.element.key;
  const rgb = ELEMENT_RGB[elementKey] ?? ELEMENT_RGB.Water;
  const cardBg = CARD_BG[elementKey] ?? CARD_BG.Water;
  const accent = CARD_ACCENT[elementKey] ?? CARD_ACCENT.Water;
  const elementIcon = ELEMENT_ICONS[elementKey];

  const name = character.translations?.[lang.toUpperCase()]?.name ?? character.internalName;
  const subtitle = character.translations?.[lang.toUpperCase()]?.subtitle ?? "";
  const bust =
    character.portraits.bust?.publicPath ??
    character.portraits.gacha?.publicPath ??
    character.portraits.head?.publicPath ??
    null;

  const meleeBest = build.weapons.melee.filter((w) => w.rank === "best");
  const meleeAlt = build.weapons.melee.filter((w) => w.rank === "alternative");
  const rangedBest = build.weapons.ranged.filter((w) => w.rank === "best");
  const rangedAlt = build.weapons.ranged.filter((w) => w.rank === "alternative");

  const buildName = localized(build.buildName, lang) ?? "";

  return (
    <div
      ref={cardRef ?? undefined}
      className="relative overflow-hidden rounded-2xl"
      style={{ width: CARD_W, height: CARD_H, background: cardBg }}
    >
      {/* Layer 1 — subtle darker band across the right side so text reads.
          Soft, covers the right 60% with a very gentle darkening. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, transparent 0%, transparent 30%, rgba(5, 9, 20, 0.55) 70%, rgba(5, 9, 20, 0.7) 100%)`,
        }}
      />

      {/* Layer 2 — BUST PORTRAIT. Sits in a wide rectangle, feathered on the
          right so its tail fades into the element-colored base. */}
      {bust && (
        <div className="pointer-events-none absolute inset-y-0 w-[780px]" style={{ left: -220 }}>
          <img
            src={bust}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full select-none object-cover"
            style={{
              objectPosition: "center 18%",
              maskImage:
                "linear-gradient(to right, black 0%, black 50%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0.2) 90%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, black 0%, black 50%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0.2) 90%, transparent 100%)",
            }}
          />
        </div>
      )}

      {/* Layer 3 — Shade.svg overlay. Extended wide and masked on the right
          edge so it dissolves into the element base instead of ending with a
          visible vertical line where the SVG stops. */}
      <img
        src="/assets/ui/card/shade.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-[820px] object-cover"
        style={{
          opacity: 0.45,
          maskImage:
            "linear-gradient(to right, black 0%, black 55%, rgba(0,0,0,0.55) 75%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black 55%, rgba(0,0,0,0.55) 75%, transparent 100%)",
        }}
      />

      {/* Layer 4 — bottom vignette for name/subtitle readability.
          Extends past the portrait zone and fades out on its right edge so
          there's no hard vertical seam where the dark band meets the element
          color. Vertical fade goes dark → transparent toward the top. */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-[2] h-60"
        style={{
          width: LEFT_W + 120,
          background:
            "linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.3) 60%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, black 0%, black 70%, rgba(0,0,0,0.5) 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black 70%, rgba(0,0,0,0.5) 88%, transparent 100%)",
        }}
      />

      {/* Layer 5 — element icon (top-left), subtle */}
      {elementIcon && (
        <img
          src={elementIcon}
          alt=""
          aria-hidden
          crossOrigin="anonymous"
          className="pointer-events-none absolute left-5 top-5 z-[3] h-9 w-9 object-contain opacity-95"
          style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.7))" }}
        />
      )}

      {/* Layer 6 — character title overlay.
          Intentionally OVERLAPS the portrait's fading tail — no column break. */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-[3] p-7"
        style={{ width: LEFT_W }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: accent, textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}
        >
          {character.element.label}
        </p>
        <h2
          className="mt-1 text-[54px] font-bold leading-[0.95] text-white"
          style={{ textShadow: "0 4px 18px rgba(0,0,0,0.85)" }}
        >
          {name}
        </h2>
        {subtitle && (
          <p
            className="mt-1.5 text-sm text-white/90"
            style={{ textShadow: "0 2px 6px rgba(0,0,0,0.7)" }}
          >
            {subtitle}
          </p>
        )}
        {buildName && (
          <span
            className="mt-4 inline-block rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm"
            style={{
              borderColor: "rgba(255, 255, 255, 0.35)",
              background: `rgba(0, 0, 0, 0.35)`,
              color: accent,
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            {buildName}
          </span>
        )}
      </div>

      {/* Layer 7 — middle + right content panel.
          Positioned starting at LEFT_W so it sits fully to the right of the
          bust's bright zone (but still overlaps the fading tail). */}
      <div
        className="absolute inset-y-0 right-0 z-[4] flex"
        style={{ left: LEFT_W }}
      >
        {/* Middle — weapons (top) + demon wedge (rest) */}
        <div className="relative flex min-w-0 flex-1 flex-col gap-4 px-5 py-5">
          <div className="grid grid-cols-2 gap-5">
            {(() => {
              // Cap at 3 total per column (best + alternatives), size adapts.
              const meleeList = [...meleeBest, ...meleeAlt].slice(0, 3);
              const rangedList = [...rangedBest, ...rangedAlt].slice(0, 3);
              const meleeCellSize = weaponSize(meleeList.length);
              const rangedCellSize = weaponSize(rangedList.length);
              return (
                <>
                  <div>
                    <p
                      className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: accent, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
                    >
                      <Swords className="h-3.5 w-3.5" />
                      Mêlée
                    </p>
                    <div className="space-y-1.5">
                      {meleeList.map((w, i) => (
                        <WeaponCell key={`m-${i}`} weapon={w} size={meleeCellSize} kindLabel="Mêlée" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p
                      className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: accent, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
                    >
                      <Target className="h-3.5 w-3.5" />
                      Distance
                    </p>
                    <div className="space-y-1.5">
                      {rangedList.map((w, i) => (
                        <WeaponCell key={`r-${i}`} weapon={w} size={rangedCellSize} kindLabel="Distance" />
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {build.demonWedges.slots.length > 0 && (
            <div className="flex min-h-0 flex-1 flex-col px-2">
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: accent, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
              >
                Demon Wedge
              </p>
              <div className="flex flex-1 items-center justify-center">
                <WedgeLayout
                  slots={build.demonWedges.slots}
                  centerItem={build.demonWedges.centerItem}
                  rgb={rgb}
                  scale="lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right — genimons + stats + brand */}
        <div className="relative flex w-[280px] shrink-0 flex-col gap-4 px-5 pb-0 pt-5">
          {build.genimon.length > 0 && (
            <div>
              <p
                className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: accent, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Génimons
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {build.genimon.slice(0, 3).map((g, i) => {
                  if (!g.item) return null;
                  const item = g.item;
                  const isBest = g.rank === "best";
                  return (
                    <CursorTooltip
                      key={`g-${i}`}
                      width={280}
                      content={<ItemTooltipBody item={item} rank={g.rank} kindLabel="Génimon" />}
                    >
                      <div
                        className="relative flex aspect-square cursor-default items-center justify-center overflow-hidden rounded-lg border bg-black/40"
                        style={{
                          borderColor: isBest ? "rgba(252, 211, 77, 0.9)" : "rgba(255, 255, 255, 0.3)",
                        }}
                      >
                        <img src={item.icon} alt="" className="h-full w-full object-contain" />
                        {isBest && (
                          <span className="absolute right-0.5 top-0.5 rounded bg-amber-300/95 px-1 text-[9px] font-bold leading-tight text-slate-950">
                            S
                          </span>
                        )}
                      </div>
                    </CursorTooltip>
                  );
                })}
              </div>
            </div>
          )}

          {build.statsPriority.length > 0 && (
            <div>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: accent, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
              >
                Priorité stats
              </p>
              <ol className="space-y-1 text-xs">
                {build.statsPriority.slice(0, 5).map((stat, i) => (
                  <li
                    key={stat}
                    className="flex items-center gap-2 rounded-md border border-white/15 bg-black/30 px-2 py-1"
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        color: accent,
                        border: "1px solid rgba(255,255,255,0.3)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-white/95" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                      {STAT_LABELS[stat] ?? stat}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {build.skillPriority.length > 0 && (() => {
            // Sort priorities desc, match each entry to a skill icon by skillIndex (1/2/3).
            const orderedPrios = [...build.skillPriority].sort((a, b) => b.priority - a.priority);
            const skillIcons = character.skillIcons;
            const iconFor = (idx: number | undefined): string | null => {
              if (!idx) return null;
              if (idx === 1) return skillIcons.skill1.publicPath;
              if (idx === 2) return skillIcons.skill2.publicPath;
              if (idx === 3) return skillIcons.skill3.publicPath;
              return null;
            };
            // If skillIndex isn't set in data, fall back to priority order mapping to skill 1/2/3.
            const items = orderedPrios.slice(0, 3).map((sk, i) => ({
              sk,
              iconSrc: iconFor(sk.skillIndex) ??
                (i === 0 ? skillIcons.skill1.publicPath :
                 i === 1 ? skillIcons.skill2.publicPath :
                 skillIcons.skill3.publicPath),
            }));
            return (
              <div>
                <p
                  className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: accent, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
                >
                  Priorité compétences
                </p>
                <div className="flex items-center gap-2">
                  {items.map(({ iconSrc }, i) => (
                    <div key={`sk-${i}`} className="flex items-center">
                      {iconSrc && (
                        <div
                          className="relative flex h-11 w-11 items-center justify-center rounded-full"
                          style={{
                            background: "rgba(0,0,0,0.5)",
                            border: `1.5px solid rgba(255, 255, 255, 0.35)`,
                            boxShadow: `0 0 10px rgba(${rgb}, 0.35)`,
                          }}
                        >
                          <img src={iconSrc} alt="" className="h-7 w-7 object-contain" />
                          <span
                            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                            style={{
                              background: "rgba(0,0,0,0.85)",
                              color: accent,
                              border: "1px solid rgba(255,255,255,0.4)",
                            }}
                          >
                            {i + 1}
                          </span>
                        </div>
                      )}
                      {i < items.length - 1 && (
                        <span className="mx-1 text-white/40">›</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {build.team.length > 0 && (
            <div>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: accent, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
              >
                Équipe recommandée
              </p>
              <div className="flex gap-2">
                {build.team.slice(0, 3).map((t, i) => {
                  if (!t.character) return null;
                  const portrait = t.character.portrait;
                  return (
                    <div
                      key={`team-${i}`}
                      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-white/15 bg-black/30 px-1.5 py-1"
                    >
                      {portrait && (
                        <div
                          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full"
                          style={{ border: `1.5px solid rgba(${rgb}, 0.6)` }}
                        >
                          <img src={portrait} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <p
                        className="truncate text-[11px] font-medium text-white"
                        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                      >
                        {t.character.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-auto flex items-center gap-2.5 border-t border-white/15 py-1">
            <img
              src="/assets/images/logo_optimized.png"
              alt=""
              crossOrigin="anonymous"
              className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            />
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: accent, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              >
                DNA Interactive
              </p>
              <p
                className="mt-0.5 truncate text-[10px] text-white/60"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              >
                dna-interactive · Duet Night Abyss
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResponsiveQuickBuildCard — scales the fixed-size card down to fit tablet /
// mobile viewports via CSS transform. The inner card keeps its intrinsic
// 1280×560 dimensions (so `cardRef` + html-to-image exports still capture at
// full resolution); only the visual footprint shrinks.
// ---------------------------------------------------------------------------

export function ResponsiveQuickBuildCard({
  character,
  build,
  lang,
  cardRef,
}: {
  character: CharacterRecord;
  build: CharacterBuild;
  lang: string;
  cardRef?: React.Ref<HTMLDivElement> | null;
}) {
  return (
    <div className="relative mx-auto w-[320px] h-[140px] sm:w-[576px] sm:h-[252px] md:w-[704px] md:h-[308px] lg:w-[960px] lg:h-[420px] xl:w-[1280px] xl:h-[560px]">
      <div className="absolute left-0 top-0 origin-top-left scale-[0.25] sm:scale-[0.45] md:scale-[0.55] lg:scale-[0.75] xl:scale-100">
        <QuickBuildCard character={character} build={build} lang={lang} cardRef={cardRef} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal wrapper
// ---------------------------------------------------------------------------

export default function QuickBuildModal({
  character,
  builds,
  lang,
  open,
  onClose,
}: {
  character: CharacterRecord;
  builds: CharacterBuild[];
  lang: string;
  open: boolean;
  onClose: () => void;
}) {
  const [activeBuildIndex, setActiveBuildIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0b1225",
      });
      const link = document.createElement("a");
      const safeName = character.internalName.toLowerCase().replace(/[^a-z0-9]/g, "");
      link.download = `build-${safeName}-${activeBuildIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export build card", err);
    } finally {
      setDownloading(false);
    }
  }, [character.internalName, activeBuildIndex]);

  if (!open) return null;
  if (builds.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/95 p-6 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Sparkles className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-3 text-sm text-slate-300">
            Aucun build disponible pour ce personnage.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-lg border border-slate-600/70 bg-slate-800/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/80"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const build = builds[Math.min(activeBuildIndex, builds.length - 1)];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Build rapide"
    >
      <div
        className="flex max-h-[95vh] w-full max-w-[1360px] flex-col overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900/95 shadow-[0_40px_80px_rgba(2,6,23,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-700/60 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <h3 className="truncate text-base font-semibold text-white">
              Build rapide — {character.translations?.[lang.toUpperCase()]?.name ?? character.internalName}
            </h3>
            {builds.length > 1 && (
              <div className="flex gap-1">
                {builds.map((b, i) => {
                  const bname = localized(b.buildName, lang) ?? `Build ${i + 1}`;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveBuildIndex(i)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        i === activeBuildIndex
                          ? "border border-indigo-400/50 bg-indigo-500/20 text-indigo-100"
                          : "border border-slate-700/70 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {bname}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-100 transition-colors hover:bg-indigo-500/30 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? "Export..." : "Telecharger PNG"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-auto bg-slate-950/60 p-4 md:p-6">
          <ResponsiveQuickBuildCard
            character={character}
            build={build}
            lang={lang}
            cardRef={cardRef}
          />
        </div>
      </div>
    </div>
  );
}
