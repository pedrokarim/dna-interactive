/**
 * Image Open Graph de la rotation des Covert Commissions (1 200 × 630) :
 * un tableau régions × catégories, chaque objectif avec l'illustration du jeu
 * et son nom, comme les cartes du tableau de la page.
 */
import { INK, PARCH } from "./shared";

export type CommissionsOgContent = {
  eyebrow: string;
  title: string;
  categories: string[];
  rows: Array<{ region: string; cells: Array<Array<{ label: string; art: string | null }>> }>;
};

const GOLD = "#c2a86a";
const MUTED = "#9b94a8";
const LINE = "rgba(255,255,255,0.10)";

export function CommissionsOg({ content, origin }: { content: CommissionsOgContent; origin: string }) {
  const rows = content.rows.slice(0, 5);
  // Hauteur disponible pour le tableau, répartie entre les régions.
  const rowHeight = Math.floor(420 / Math.max(rows.length, 3));
  const lineHeight = Math.floor((rowHeight - 12) / 3);
  const icon = Math.min(40, lineHeight - 4);
  const fontSize = Math.min(24, Math.max(16, lineHeight - 12));
  const regionWidth = 150;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: INK,
        fontFamily: "Jost",
        padding: "40px 56px 0",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: `radial-gradient(120% 120% at 80% 0%, ${GOLD}33 0%, ${GOLD}10 34%, ${INK} 70%)`,
        }}
      />
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, position: "relative" }}>
        <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: GOLD }}>
          {content.eyebrow}
        </div>
        <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: 40, fontWeight: 700, color: PARCH }}>{content.title}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 22, position: "relative" }}>
        <div style={{ display: "flex", paddingBottom: 8, borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: "flex", width: regionWidth }} />
          {content.categories.map((category) => (
            <div key={category} style={{ display: "flex", flex: 1, fontSize: 20, letterSpacing: 2, textTransform: "uppercase", color: MUTED }}>
              {category}
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row.region} style={{ display: "flex", alignItems: "center", height: rowHeight, borderBottom: `1px solid ${LINE}` }}>
            <div style={{ display: "flex", width: regionWidth, fontFamily: "Cinzel", fontSize: 26, fontWeight: 700, color: PARCH }}>
              {row.region}
            </div>
            {row.cells.map((objectives, index) => (
              <div key={index} style={{ display: "flex", flexDirection: "column", flex: 1, gap: 4 }}>
                {objectives.slice(0, 3).map((objective) => (
                  <div key={objective.label} style={{ display: "flex", alignItems: "center", gap: 12, height: lineHeight - 4 }}>
                    {objective.art ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={objective.art}
                        width={icon}
                        height={icon}
                        alt=""
                        style={{ width: icon, height: icon, objectFit: "cover", borderRadius: 6 }}
                      />
                    ) : null}
                    <div style={{ display: "flex", fontSize, color: PARCH }}>{objective.label}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: 26, right: 56, display: "flex", alignItems: "center", gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${origin}/assets/images/logo_optimized.png`} width={36} height={36} alt="" style={{ width: 36, height: 36 }} />
        <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: 22, fontWeight: 700, color: PARCH }}>DNA Interactive</div>
      </div>
    </div>
  );
}
