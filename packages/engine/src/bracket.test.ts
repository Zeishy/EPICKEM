import { describe, expect, it } from "vitest";
import { bracketSize } from "./bracket.ts";

describe("bracketSize", () => {
  it.each([
    [2, 2, 0],
    [5, 8, 3],
    [8, 8, 0],
    [9, 16, 7],
  ])("%i participants → tableau de %i, %i exempts", (participants, size, byes) => {
    expect(bracketSize(participants)).toEqual({ ok: true, value: { size, byes } });
  });

  it.each([0, 1, 2.5, -4])("refuse %d participants", (participants) => {
    expect(bracketSize(participants)).toEqual({ ok: false, error: "NOT_ENOUGH_PARTICIPANTS" });
  });
});
