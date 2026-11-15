/**
 * Gabarit commun des images Open Graph des pages (1 200 × 630) : texte à
 * gauche, vrai contenu du site à droite (portraits, icônes, visuel large).
 *
 * Même fond, mêmes fontes et même marque que les images des fiches
 * personnage, build et objet (`shared.tsx`), sans le liseré du haut.
 */
import { INK, PARCH } from "./shared";

export type OgMedia =
  /** Portraits verticaux côte à côte (personnages, cosmétiques). */
  | { kind: "portraits"; urls: string[] }
  /** Grille d'icônes d'objets, 6 au plus. */
  | { kind: "icons"; urls: string[] }
  /** Un visuel large qui déborde à droite (carte d'une région, bannière). */
  | { kind: "wide"; url: string }
  /** Un seul portrait qui déborde à droite. */
  | { kind: "portrait"; url: string };

export type PageOgContent = {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  hex: string;
  media: OgMedia | null;
};

const MUTED = "#cfc7d6";
const FADE = "linear-gradient(90deg, #0b0a0f 0%, rgba(11,10,15,0.6) 26%, rgba(11,10,15,0) 60%)";

function Media({ media }: { media: OgMedia }) {
  if (media.kind === "wide" || media.kind === "portrait") {
    const width = media.kind === "wide" ? 640 : 560;
    return (
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width, display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} width={width} height={630} alt="" style={{ width, height: 630, objectFit: "cover", objectPosition: "center top" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", background: FADE }} />
      </div>
    );
  }
  if (media.kind === "portraits") {
    const urls = media.urls.slice(0, 3);
    const column = 190;
    return (
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, display: "flex" }}>
        {urls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} width={column} height={630} alt="" style={{ width: column, height: 630, objectFit: "cover", objectPosition: "50% 12%" }} />
        ))}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: FADE }} />
      </div>
    );
  }
  const urls = media.urls.slice(0, 6);
  // Une seule icône (fiche d'objet, de plan, tenue) : en grand.
  const tile = urls.length === 1 ? 320 : 132;
  return (
    <div
      style={{
        position: "absolute",
        top: urls.length === 1 ? 120 : 92,
        right: urls.length === 1 ? 110 : 64,
        width: urls.length === 1 ? tile : tile * 3 + 20 * 2,
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
      }}
    >
      {urls.map((url) => (
        <div
          key={url}
          style={{
            width: tile,
            height: tile,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 10,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} width={tile - 32} height={tile - 32} alt="" style={{ width: tile - 32, height: tile - 32, objectFit: "contain" }} />
        </div>
      ))}
    </div>
  );
}

/**
 * Coupe sur une espace, avec « ... » en ASCII : l'ellipse « … » n'est pas dans
 * les fontes embarquées.
 */
function truncateWords(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 3);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, "")}...`;
}

/** Taille du titre selon sa longueur : il doit tenir en trois lignes dans la colonne. */
function titleSize(length: number): number {
  if (length <= 16) return 76;
  if (length <= 28) return 62;
  if (length <= 42) return 50;
  return 42;
}

/** Marque du site, en bas de la colonne de texte : jamais posée sur une image. */
function Brand({ origin }: { origin: string }) {
  return (
    <div style={{ position: "absolute", bottom: 44, left: 72, display: "flex", alignItems: "center", gap: 14 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${origin}/assets/images/logo_optimized.png`} width={44} height={44} alt="" style={{ width: 44, height: 44 }} />
      <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: 26, fontWeight: 700, letterSpacing: 1, color: PARCH }}>
        DNA Interactive
      </div>
    </div>
  );
}

export function PageOg({ content, origin }: { content: PageOgContent; origin: string }) {
  const { hex } = content;
  const title = truncateWords(content.title, 64);
  const subtitle = content.subtitle ? truncateWords(content.subtitle, title.length > 28 ? 110 : 150) : null;
  const textWidth = content.media ? 600 : 1000;
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
          background: `radial-gradient(120% 120% at 78% 18%, ${hex}4d 0%, ${hex}1a 34%, ${INK} 70%)`,
        }}
      />
      {content.media ? <Media media={content.media} /> : null}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          padding: "56px 72px 120px",
          width: textWidth,
          height: "100%",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: hex }}>
          {truncateWords(content.eyebrow, 40)}
        </div>
        <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: titleSize(title.length), fontWeight: 700, lineHeight: 1.08, color: PARCH }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ display: "flex", fontSize: 26, lineHeight: 1.35, color: MUTED }}>{subtitle}</div>
        ) : null}
      </div>
      <Brand origin={origin} />
    </div>
  );
}
