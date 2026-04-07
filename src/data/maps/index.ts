const mapLoaders: Record<string, () => Promise<{ default: any }>> = {
  "purgatorio-island": () => import("./purgatorio-island.json"),
  "icelake": () => import("./icelake.json"),
  "icelake-sewer": () => import("./icelake-sewer.json"),
  "glevum-pit": () => import("./glevum-pit.json"),
  "galea-theater": () => import("./galea-theater.json"),
  "lonza-fortress": () => import("./lonza-fortress.json"),
  "huaxu": () => import("./huaxu.json"),
  "haojing": () => import("./haojing.json"),
};
export default mapLoaders;
