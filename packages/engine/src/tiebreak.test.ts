import { describe, expect, it } from "vitest";
import {
  rankParticipants,
  type MatchRecord,
  type RankingInput,
  type Standing,
} from "./tiebreak.ts";

const scoring = { win: 3, draw: 1, loss: 0 };

const match = (a: string, b: string, ga: number, gb: number): MatchRecord => ({
  participants: [a, b],
  games: [ga, gb],
});

const rank = (input: Partial<RankingInput> & Pick<RankingInput, "participants">): Standing[] => {
  const result = rankParticipants({
    points: {},
    matches: [],
    tiebreakers: [],
    scoring,
    ...input,
  });
  if (!result.ok) throw new Error(`échec inattendu : ${result.error}`);
  return result.value;
};

/** Ordre et rangs, sous la forme « id:rang ». */
const summary = (standings: readonly Standing[]) =>
  standings.map((s) => `${s.participantId}:${s.rank}`);

describe("rankParticipants", () => {
  it("classe par points décroissants", () => {
    const standings = rank({ participants: ["a", "b", "c"], points: { a: 3, b: 9, c: 6 } });
    expect(summary(standings)).toEqual(["b:1", "c:2", "a:3"]);
  });

  it("donne 0 point à un participant absent du barème", () => {
    const standings = rank({ participants: ["a", "b"], points: { b: 1 } });
    expect(standings.map((s) => [s.participantId, s.points])).toEqual([
      ["b", 1],
      ["a", 0],
    ]);
  });

  it("laisse ex aequo sans critère, avec rang partagé puis sauté", () => {
    const standings = rank({
      participants: ["a", "b", "c", "d"],
      points: { a: 6, b: 3, c: 3, d: 0 },
    });
    expect(summary(standings)).toEqual(["a:1", "b:2", "c:2", "d:4"]);
  });

  describe("égalité à deux", () => {
    const participants = ["a", "b", "c"];
    const points = { a: 6, b: 6, c: 0 };

    it("confrontation directe : le vainqueur du match passe devant", () => {
      const standings = rank({
        participants,
        points,
        matches: [match("a", "b", 0, 2), match("a", "c", 2, 0), match("b", "c", 2, 1)],
        tiebreakers: ["HEAD_TO_HEAD", "GAME_DIFFERENCE"],
      });
      expect(summary(standings)).toEqual(["b:1", "a:2", "c:3"]);
      expect(standings[0]?.tiebreaks.HEAD_TO_HEAD).toBe(3);
    });

    it("confrontation directe nulle : la différence de manches départage", () => {
      const standings = rank({
        participants,
        points,
        matches: [match("a", "b", 1, 1), match("a", "c", 3, 0), match("b", "c", 2, 1)],
        tiebreakers: ["HEAD_TO_HEAD", "GAME_DIFFERENCE"],
      });
      expect(summary(standings)).toEqual(["a:1", "b:2", "c:3"]);
      expect(standings[0]?.tiebreaks).toEqual({ HEAD_TO_HEAD: 1, GAME_DIFFERENCE: 3 });
      expect(standings[1]?.tiebreaks).toEqual({ HEAD_TO_HEAD: 1, GAME_DIFFERENCE: 1 });
    });

    it("sans match entre eux, la confrontation directe ne départage pas", () => {
      const standings = rank({
        participants,
        points,
        matches: [match("a", "c", 2, 0), match("b", "c", 2, 1)],
        tiebreakers: ["HEAD_TO_HEAD", "GAME_DIFFERENCE"],
      });
      expect(summary(standings)).toEqual(["a:1", "b:2", "c:3"]);
    });

    it("l'ordre des critères est respecté", () => {
      const matches = [match("a", "b", 2, 1), match("b", "c", 3, 0), match("a", "c", 1, 0)];
      // a gagne le face-à-face ; les différences de manches sont égales.
      const h2hFirst = rank({ participants, points, matches, tiebreakers: ["HEAD_TO_HEAD"] });
      const gdFirst = rank({ participants, points, matches, tiebreakers: ["GAME_DIFFERENCE"] });
      expect(summary(h2hFirst)).toEqual(["a:1", "b:2", "c:3"]);
      // a : +1 +1 = +2 ; b : -1 +3 = +2 → toujours à égalité, ex aequo.
      expect(summary(gdFirst)).toEqual(["a:1", "b:1", "c:3"]);
    });
  });

  describe("égalité à trois", () => {
    const participants = ["a", "b", "c", "d"];
    const points = { a: 6, b: 6, c: 6, d: 0 };

    it("cycle a > b > c > a : la différence de manches isole b, puis le face-à-face départage a et c", () => {
      const standings = rank({
        participants,
        points,
        matches: [
          match("a", "b", 2, 1),
          match("b", "c", 2, 0),
          match("c", "a", 2, 0),
          match("a", "d", 2, 0),
          match("b", "d", 2, 0),
          match("c", "d", 2, 1),
        ],
        tiebreakers: ["HEAD_TO_HEAD", "GAME_DIFFERENCE"],
      });
      // Mini-classement à trois : 3 points chacun. Différences : a +1, b +3, c +1.
      // Restent a et c : c a gagné leur match.
      expect(summary(standings)).toEqual(["b:1", "c:2", "a:3", "d:4"]);
      expect(standings.slice(0, 3).map((s) => s.tiebreaks.HEAD_TO_HEAD)).toEqual([3, 3, 0]);
    });

    it("le mini-classement à trois isole un participant", () => {
      const standings = rank({
        participants,
        points,
        matches: [match("a", "b", 2, 0), match("a", "c", 2, 0), match("b", "c", 2, 1)],
        tiebreakers: ["HEAD_TO_HEAD"],
      });
      expect(summary(standings)).toEqual(["a:1", "b:2", "c:3", "d:4"]);
    });

    it("égalité totale : les trois restent ex aequo dans l'ordre reçu", () => {
      const standings = rank({
        participants: ["c", "a", "b"],
        points: { a: 3, b: 3, c: 3 },
        matches: [match("a", "b", 1, 0), match("b", "c", 1, 0), match("c", "a", 1, 0)],
        tiebreakers: ["HEAD_TO_HEAD", "GAME_DIFFERENCE", "BUCHHOLZ"],
      });
      expect(summary(standings)).toEqual(["c:1", "a:1", "b:1"]);
    });
  });

  it("recalcule la confrontation directe entre les seuls participants encore à égalité", () => {
    // Quatre à égalité. Mini-classement à quatre : a 6, d 6, b 3, c 3.
    // Puis entre a et d seuls : a a gagné ; entre b et c seuls : b a gagné.
    const standings = rank({
      participants: ["a", "b", "c", "d"],
      points: { a: 9, b: 9, c: 9, d: 9 },
      matches: [
        match("a", "b", 2, 0),
        match("c", "a", 2, 0),
        match("d", "b", 2, 0),
        match("d", "c", 2, 0),
        match("a", "d", 2, 0),
        match("b", "c", 2, 0),
      ],
      tiebreakers: ["HEAD_TO_HEAD", "GAME_DIFFERENCE"],
    });
    expect(summary(standings)).toEqual(["a:1", "d:2", "b:3", "c:4"]);
    // La valeur gardée est celle du dernier mini-classement (à deux).
    expect(standings.map((s) => s.tiebreaks.HEAD_TO_HEAD)).toEqual([3, 0, 3, 0]);
  });

  it("Buchholz : le participant qui a affronté les adversaires les plus forts passe devant", () => {
    // Ronde suisse : a et b ont 3 points ; a a battu e (2 pts), b a battu f (0 pt).
    const standings = rank({
      participants: ["b", "a", "e", "f"],
      points: { a: 3, b: 3, e: 2, f: 0 },
      matches: [match("a", "e", 1, 0), match("b", "f", 1, 0), match("e", "f", 1, 1)],
      tiebreakers: ["BUCHHOLZ"],
    });
    expect(summary(standings)).toEqual(["a:1", "b:2", "e:3", "f:4"]);
    expect(standings.map((s) => s.tiebreaks.BUCHHOLZ)).toEqual([2, 0, undefined, undefined]);
  });

  it("seed : dernier recours, un participant sans seed passe après", () => {
    const standings = rank({
      participants: ["a", "b", "c"],
      points: { a: 1, b: 1, c: 1 },
      tiebreakers: ["SEED"],
      seeds: { a: 3, b: 1 },
    });
    expect(summary(standings)).toEqual(["b:1", "a:2", "c:3"]);
    expect(standings.map((s) => s.tiebreaks.SEED)).toEqual([1, 3, undefined]);
  });

  it("deux participants sans seed restent ex aequo", () => {
    const standings = rank({
      participants: ["a", "b", "c"],
      points: {},
      tiebreakers: ["SEED"],
      seeds: { c: 1 },
    });
    expect(summary(standings)).toEqual(["c:1", "a:2", "b:2"]);
  });

  describe("validation", () => {
    const base: RankingInput = {
      participants: ["a", "b"],
      points: {},
      matches: [],
      tiebreakers: [],
      scoring,
    };

    it.each<[string, Partial<RankingInput>, string]>([
      ["participant en double", { participants: ["a", "a"] }, "DUPLICATE_PARTICIPANT"],
      ["critère en double", { tiebreakers: ["SEED", "SEED"] }, "DUPLICATE_CRITERION"],
      ["points d'un inconnu", { points: { z: 1 } }, "UNKNOWN_PARTICIPANT"],
      ["seed d'un inconnu", { seeds: { z: 1 } }, "UNKNOWN_PARTICIPANT"],
      ["match avec un inconnu", { matches: [match("a", "z", 1, 0)] }, "UNKNOWN_PARTICIPANT"],
      ["match contre soi-même", { matches: [match("a", "a", 1, 0)] }, "INVALID_MATCH"],
      ["manches négatives", { matches: [match("a", "b", -1, 0)] }, "INVALID_MATCH"],
      ["manches non entières", { matches: [match("a", "b", 1.5, 0)] }, "INVALID_MATCH"],
      ["points invalides", { points: { a: Number.NaN } }, "INVALID_NUMBER"],
      ["barème invalide", { scoring: { win: Infinity, draw: 1, loss: 0 } }, "INVALID_NUMBER"],
    ])("%s → %s", (_, override, error) => {
      expect(rankParticipants({ ...base, ...override })).toEqual({ ok: false, error });
    });
  });
});
