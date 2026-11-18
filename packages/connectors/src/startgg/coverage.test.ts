import { describe, expect, it } from "vitest";
import { measureCoverage, percent, type StartggSet } from "./coverage.ts";

const duel = (entrants: number) =>
  Array.from({ length: entrants }, (_, index) => ({ entrant: { id: index + 1 } }));

describe("measureCoverage", () => {
  it("compte les manches, les personnages et les cartes réellement saisis", () => {
    const sets: StartggSet[] = [
      {
        completedAt: 1,
        slots: duel(2),
        games: [
          {
            stage: { name: "Carte A" },
            selections: [{ character: { name: "Perso X" } }, { character: { name: "Perso Y" } }],
          },
          { stage: null, selections: [{ character: { name: "Perso X" } }] },
          { stage: { name: "Carte B" }, selections: [] },
        ],
      },
      // Terminé sans détail des manches : seul le score du set est connu.
      { completedAt: 2, slots: duel(2), games: null },
      // Exempt : un emplacement vide.
      { completedAt: null, slots: [{ entrant: { id: 1 } }, { entrant: null }] },
      // FFA : quatre participants.
      { completedAt: null, slots: duel(4) },
    ];

    expect(measureCoverage(sets)).toEqual({
      sets: 4,
      completedSets: 2,
      setsWithBye: 1,
      ffaSets: 1,
      completedSetsWithGames: 1,
      games: 3,
      gamesWithCharacters: 2,
      gamesWithStage: 2,
      distinctCharacters: 2,
      distinctStages: 2,
    });
  });

  it("renvoie des zéros pour un événement vide", () => {
    expect(measureCoverage([]).games).toBe(0);
  });
});

describe("percent", () => {
  it("arrondit et évite la division par zéro", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBe(0);
  });
});
