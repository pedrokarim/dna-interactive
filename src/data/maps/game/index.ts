// Généré par research_data/src/map-game/export-site-points.cjs : ne pas éditer à la main.
// Points du jeu absents de boarhat, fusionnés au chargement (`normalizeMap`).
const gamePointLoaders: Record<string, () => Promise<{ default: unknown }>> = {
  "arcanorift": () => import("./arcanorift.json"),
  "arcanoruins": () => import("./arcanoruins.json"),
  "bloomfield-station": () => import("./bloomfield-station.json"),
  "glevum-pit": () => import("./glevum-pit.json"),
  "haojing": () => import("./haojing.json"),
  "huaxu": () => import("./huaxu.json"),
  "icelake-sewer": () => import("./icelake-sewer.json"),
  "icelake": () => import("./icelake.json"),
  "ironworks": () => import("./ironworks.json"),
  "lonza-fortress": () => import("./lonza-fortress.json"),
  "mountarcano": () => import("./mountarcano.json"),
  "outer-peaks": () => import("./outer-peaks.json"),
  "purgatorio-island": () => import("./purgatorio-island.json"),
  "youlai_alley": () => import("./youlai_alley.json"),
};
export default gamePointLoaders;
