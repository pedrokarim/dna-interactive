import { describe, expect, it } from "vitest";
import {
  eventHistory,
  eventSeries,
  layoutBars,
  seriesFromTitle,
  versionAt,
  type CalendarEvent,
} from "./calendar";

describe("seriesFromTitle", () => {
  it.each([
    ["Bountiful Day – Partie 2 (1.7)", "Bountiful Day"],
    ["Bountiful Day — Partie 1 (1.5)", "Bountiful Day"],
    ["Starry Gleanings II – commissions (1.7)", "Starry Gleanings"],
    ["Starry Gleanings — commissions", "Starry Gleanings"],
    ["Phoxhunter Summit (1.6)", "Phoxhunter Summit"],
    ["Phoxhunter Summit", "Phoxhunter Summit"],
    ["Bard's Tome : Stellar Sonata", "Bard's Tome"],
    ["Secret Letter Shop : Zhiliu & Eternal Farewell", "Secret Letter Shop"],
    ["Immersive Theatre : Ensemble Act (1.7)", "Immersive Theatre : Ensemble Act"],
    ["Immersive Theatre : « Falsi »", "Immersive Theatre : personnage"],
    ["As Tomorrow Nears – connexion", "Récompense de connexion"],
    ["Where the Long Road Leads – skin de Falsi", "Where the Long Road Leads"],
  ])("%s → %s", (title, series) => {
    expect(seriesFromTitle(title)).toBe(series);
  });

  it("garde séparées les deux formes du théâtre immersif", () => {
    expect(seriesFromTitle("Immersive Theatre : Ensemble Act (1.6)")).not.toBe(
      seriesFromTitle("Immersive Theatre : « Rhythm: Flamewrought »"),
    );
  });
});

describe("eventSeries", () => {
  it("préfère la série saisie en admin au titre", () => {
    expect(eventSeries({ title: "Bountiful Day – Partie 2 (1.7)", series: "Jour faste" })).toBe("Jour faste");
    expect(eventSeries({ title: "Bountiful Day – Partie 2 (1.7)", series: "  " })).toBe("Bountiful Day");
  });
});

describe("versionAt", () => {
  it("rend la version sortie au plus tard ce jour-là", () => {
    expect(versionAt("2026-07-27")).toBeNull();
    expect(versionAt("2026-07-28")?.version).toBe("1.5");
    expect(versionAt("2026-10-19")?.version).toBe("1.6");
    expect(versionAt("2026-10-20")?.version).toBe("1.7");
  });
});

const ev = (id: string, title: string, start: string, end: string, category: CalendarEvent["category"] = "Épreuve"): CalendarEvent => ({
  id,
  title,
  category,
  start,
  end,
});

describe("eventHistory", () => {
  const phox15 = ev("p15", "Phoxhunter Summit", "2026-08-26", "2026-09-04");
  const phox16 = ev("p16", "Phoxhunter Summit (1.6)", "2026-10-07", "2026-10-16");
  const phox17 = ev("p17", "Phoxhunter Summit (1.7)", "2026-11-18", "2026-12-05");
  const luno = ev("luno", "Better Luno than Never", "2026-09-08", "2026-09-29");
  const treasure = ev("th16", "Treasure Hunt Trials (1.6)", "2026-09-08", "2026-10-20");
  const friendly = ev("friendly", "Friendly Games", "2026-11-12", "2026-11-23");
  const banner = ev("banner", "Crimson Mirage", "2026-08-18", "2026-09-29", "Bannière");
  const all = [phox17, luno, phox15, treasure, friendly, banner, phox16];

  it("range les éditions de la série de la plus ancienne à la plus récente", () => {
    expect(eventHistory(phox16, all).editions.map((e) => e.id)).toEqual(["p15", "p16", "p17"]);
  });

  it("liste les derniers événements de la catégorie finis avant le début, hors série", () => {
    const { previousInCategory } = eventHistory(phox17, all);
    // Friendly Games est encore en cours le 18/11 : exclu ; la bannière n'est pas une épreuve.
    expect(previousInCategory.map((e) => e.id)).toEqual(["th16", "luno"]);
  });

  it("garde l'événement dans ses éditions même absent des candidats", () => {
    expect(eventHistory(phox16, [phox15]).editions.map((e) => e.id)).toEqual(["p15", "p16"]);
  });
});

describe("layoutBars", () => {
  it("place deux événements qui se chevauchent sur deux voies", () => {
    const bars = layoutBars(
      [ev("a", "A", "2026-11-01", "2026-11-10"), ev("b", "B", "2026-11-05", "2026-11-12"), ev("c", "C", "2026-11-11", "2026-11-20")],
      "2026-10-01",
      "2026-11-17",
      1,
    );
    const lane = Object.fromEntries(bars.map((b) => [b.id, b.lane]));
    expect(lane).toEqual({ a: 0, b: 1, c: 0 });
  });
});
