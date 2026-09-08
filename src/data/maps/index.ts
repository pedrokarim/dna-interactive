const mapLoaders: Record<string, () => Promise<{ default: any }>> = {
  "arcanorift": () => import("./arcanorift.json"),
  "arcanoruins": () => import("./arcanoruins.json"),
  "bloomfield-station": () => import("./bloomfield-station.json"),
  "galea-theater": () => import("./galea-theater.json"),
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
  "taixu-mausoleum": () => import("./taixu-mausoleum.json"),
  "youlai_alley": () => import("./youlai_alley.json"),
};
export default mapLoaders;
