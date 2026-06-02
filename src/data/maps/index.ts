const mapLoaders: Record<string, () => Promise<{ default: any }>> = {
  "galea-theater": () => import("./galea-theater.json"),
  "glevum-pit": () => import("./glevum-pit.json"),
  "haojing": () => import("./haojing.json"),
  "huaxu": () => import("./huaxu.json"),
  "icelake-sewer": () => import("./icelake-sewer.json"),
  "icelake": () => import("./icelake.json"),
  "lonza-fortress": () => import("./lonza-fortress.json"),
  "purgatorio-island": () => import("./purgatorio-island.json"),
  "outer-peaks": () => import("./outer-peaks.json"),
  "taixu-mausoleum": () => import("./taixu-mausoleum.json"),
  "youlai_alley": () => import("./youlai_alley.json"),
  "bloomfield-station": () => import("./bloomfield-station.json"),
  "ironworks": () => import("./ironworks.json"),
};
export default mapLoaders;
