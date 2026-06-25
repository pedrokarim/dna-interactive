import type { ReactNode } from "react";
import { headers } from "next/headers";
import { ELEMENTS, type ElementKey } from "@/components/dna/elements";

/* Briques partagées pour les images Open Graph (`next/og` / Satori).
 * Règles Satori : tout conteneur multi-enfants est en display:flex ; pas de
 * glyphes hors des fontes embarquées (sinon fetch de police dynamique). */

export const FALLBACK_HEX = "#a48ed0";
export const INK = "#0b0a0f";
export const PARCH = "#f4efe6";

/** Couleur d'accent par rareté (5★ or → 1★ gris). */
const RARITY_HEX: Record<number, string> = {
  5: "#e3b341",
  4: "#b389ff",
  3: "#5fa8ff",
  2: "#57d6a6",
  1: "#9aa0aa",
};

export function rarityHex(rarity: number | null | undefined): string | null {
  return rarity ? RARITY_HEX[rarity] ?? null : null;
}

export function getElement(key?: string | null) {
  const k = (key ?? "") as ElementKey;
  const e = ELEMENTS[k];
  return {
    key: k,
    hex: e?.hex ?? FALLBACK_HEX,
    label: e?.label ?? null,
    icon: e?.icon ?? null,
  };
}

/** Origine absolue (les images Satori doivent être fetchables par URL). */
export async function resolveOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    /* headers() indisponible → fallback prod */
  }
  return "https://dna.ascencia.re";
}

export function truncate(value: string, max: number): string {
  const clean = value.trim();
  // "..." ASCII : l'ellipsis "…" n'est pas dans les fontes embarquées.
  return clean.length > max ? `${clean.slice(0, max - 3).trimEnd()}...` : clean;
}

/** Coquille commune : fond teinté + liseré + marque DNA en bas à droite. */
export function OgRoot({
  hex,
  origin,
  children,
}: {
  hex: string;
  origin: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: INK,
        fontFamily: "Jost",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: `radial-gradient(120% 120% at 78% 18%, ${hex}59 0%, ${hex}1f 34%, ${INK} 70%)`,
        }}
      />
      {children}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          display: "flex",
          background: `linear-gradient(90deg, ${hex} 0%, ${hex}00 70%)`,
        }}
      />
      <BrandMark origin={origin} />
    </div>
  );
}

export function BrandMark({ origin }: { origin: string }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        right: 56,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${origin}/assets/images/logo_optimized.png`} width={48} height={48} alt="" style={{ width: 48, height: 48 }} />
      <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: 28, fontWeight: 700, letterSpacing: 1, color: PARCH }}>
        DNA Interactive
      </div>
    </div>
  );
}

/** Illustration carrée (bust 2048²) débordant à droite avec fondu vers le texte. */
export function PortraitBleed({ url, width = 560 }: { url: string; width?: number }) {
  return (
    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width, display: "flex", justifyContent: "flex-end" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} width={width} height={630} alt="" style={{ width, height: 630, objectFit: "cover", objectPosition: "center" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: `linear-gradient(90deg, ${INK} 0%, rgba(11,10,15,0.55) 28%, rgba(11,10,15,0) 62%)`,
        }}
      />
    </div>
  );
}

/** Surtitre : icône d'élément (optionnelle) + label + sous-texte pointillé. */
export function Eyebrow({
  hex,
  iconUrl,
  label,
  sub,
}: {
  hex: string;
  iconUrl?: string | null;
  label: string;
  sub?: string | null;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} width={44} height={44} alt="" style={{ width: 44, height: 44 }} />
      ) : null}
      <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: hex }}>
        {label}
      </div>
      {sub ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 6, height: 6, borderRadius: 6, background: "#6b6477" }} />
          <div style={{ display: "flex", fontSize: 26, color: "#9b94a8" }}>{sub}</div>
        </div>
      ) : null}
    </div>
  );
}

/** Titre + filet d'accent. */
export function Title({ text, hex, size }: { text: string; hex: string; size: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: size, fontWeight: 700, lineHeight: 1.05, color: PARCH }}>
        {text}
      </div>
      <div style={{ display: "flex", width: 120, height: 4, background: `linear-gradient(90deg, ${hex}, ${hex}00)` }} />
    </div>
  );
}

/** Rangée d'étoiles de rareté (losanges dessinés, pas de glyphe ★). */
export function RarityRow({ rarity, hex }: { rarity: number | null | undefined; hex: string }) {
  if (!rarity) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {Array.from({ length: rarity }).map((_, i) => (
        <div key={i} style={{ display: "flex", width: 18, height: 18, background: hex, transform: "rotate(45deg)", borderRadius: 3 }} />
      ))}
    </div>
  );
}
