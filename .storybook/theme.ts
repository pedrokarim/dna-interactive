import { create } from "storybook/theming";

/** Thème Storybook calé sur le design system DNA (sombre, or laiton). */
export const dnaTheme = create({
  base: "dark",
  brandTitle: "DNA UI · Design System",
  colorPrimary: "#c2a86a",
  colorSecondary: "#c2a86a",
  appBg: "#0a0a0b",
  appContentBg: "#0c0b08",
  appPreviewBg: "#0a0a0b",
  appBorderColor: "rgba(194,168,106,0.22)",
  barBg: "#0a0a0b",
  barSelectedColor: "#e3cd95",
  textColor: "#ece4d2",
  textMutedColor: "#9a907c",
  fontBase: '"Jost", system-ui, sans-serif',
});
