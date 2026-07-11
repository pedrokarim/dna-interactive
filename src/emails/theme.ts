// Tokens du design system DNA, en hex inline (les emails ne chargent pas le CSS
// du site). Miroir de src/app/globals.css.
export const dna = {
  ink: "#0a0a0b",
  ink2: "#161513",
  panel: "#141310",
  gold: "#c2a86a",
  goldBright: "#e3cd95",
  goldDeep: "#897240",
  crimson: "#8e1813",
  crimsonBright: "#b5302a",
  parch: "#ece4d2",
  body: "#d8cfbd",
  muted: "#9a907c",
  muted2: "#6a6150",
  line: "rgba(194, 168, 106, 0.25)",
} as const;

export const fonts = {
  display: "Georgia, 'Times New Roman', 'Noto Serif', serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;
