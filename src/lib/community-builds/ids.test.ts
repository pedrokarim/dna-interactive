import { describe, expect, it } from "vitest";
import { isBuildId } from "./ids";

describe("isBuildId", () => {
  it("accepte un uuid, en minuscules comme en majuscules", () => {
    expect(isBuildId("19001ce7-cf78-45fe-9a29-b0f4b353577a")).toBe(true);
    expect(isBuildId("19001CE7-CF78-45FE-9A29-B0F4B353577A")).toBe(true);
  });

  it("refuse ce que Postgres refuserait, au lieu de laisser la route planter", () => {
    for (const value of ["986594468", "pas-un-id", "", "19001ce7-cf78-45fe-9a29-b0f4b353577", "19001ce7cf7845fe9a29b0f4b353577a", "' OR 1=1 --"]) {
      expect(isBuildId(value)).toBe(false);
    }
  });
});
