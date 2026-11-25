import { describe, expect, it } from "vitest";
import { seedParticipants, type SeededParticipant } from "./seeding.ts";

/** Ordre des participants, du seed 1 au dernier. */
const order = (seeded: readonly SeededParticipant[]) => seeded.map((s) => s.participantId);

const unwrap = <T>(result: { ok: true; value: T } | { ok: false; error: unknown }): T => {
  if (!result.ok) throw new Error(`échec inattendu : ${String(result.error)}`);
  return result.value;
};

describe("seedParticipants", () => {
  it("numérote les seeds de 1 à N", () => {
    const seeded = unwrap(
      seedParticipants(["a", "b", "c"], { type: "MANUAL", order: ["c", "a", "b"] }),
    );
    expect(seeded).toEqual([
      { participantId: "c", seed: 1 },
      { participantId: "a", seed: 2 },
      { participantId: "b", seed: 3 },
    ]);
  });

  it("refuse un participant en double", () => {
    expect(seedParticipants(["a", "a"], { type: "RANDOM", seed: 1 })).toEqual({
      ok: false,
      error: "DUPLICATE_PARTICIPANT",
    });
  });

  it("accepte une liste vide", () => {
    expect(seedParticipants([], { type: "RANDOM", seed: 1 })).toEqual({ ok: true, value: [] });
  });

  describe("manuel", () => {
    it.each([
      [["a", "b", "b"], "DUPLICATE_PARTICIPANT"],
      [["a", "b", "z"], "UNKNOWN_PARTICIPANT"],
      [["a", "b"], "MISSING_PARTICIPANT"],
    ])("ordre %j → %s", (manual, error) => {
      expect(seedParticipants(["a", "b", "c"], { type: "MANUAL", order: manual })).toEqual({
        ok: false,
        error,
      });
    });
  });

  describe("aléatoire reproductible", () => {
    const participants = ["d", "b", "a", "c"];

    it("donne un tirage figé pour une graine", () => {
      const seeded = unwrap(
        seedParticipants(participants, { type: "RANDOM", seed: "finale-2026" }),
      );
      expect(order(seeded)).toEqual(["a", "d", "b", "c"]);
    });

    it("ne dépend pas de l'ordre de réception des participants", () => {
      const method = { type: "RANDOM", seed: "finale-2026" } as const;
      expect(unwrap(seedParticipants(["c", "a", "b", "d"], method))).toEqual(
        unwrap(seedParticipants(participants, method)),
      );
    });

    it("change avec la graine", () => {
      const many = Array.from({ length: 16 }, (_, i) => `p${i}`);
      const first = order(unwrap(seedParticipants(many, { type: "RANDOM", seed: 1 })));
      const second = order(unwrap(seedParticipants(many, { type: "RANDOM", seed: 2 })));
      expect(first).not.toEqual(second);
      expect([...first].sort()).toEqual([...many].sort());
    });
  });

  describe("par classement", () => {
    const participants = ["a", "b", "c", "d"];

    it("ASC : la plus petite valeur prend le seed 1", () => {
      const seeded = seedParticipants(participants, {
        type: "RANKING",
        values: { a: 3, b: 1, c: 4, d: 2 },
        direction: "ASC",
      });
      expect(order(unwrap(seeded))).toEqual(["b", "d", "a", "c"]);
    });

    it("DESC : la plus grande valeur prend le seed 1", () => {
      const seeded = seedParticipants(participants, {
        type: "RANKING",
        values: { a: 1500, b: 1720, c: 1310, d: 1600 },
        direction: "DESC",
      });
      expect(order(unwrap(seeded))).toEqual(["b", "d", "a", "c"]);
    });

    it("place les participants sans valeur à la fin, dans l'ordre reçu", () => {
      const seeded = seedParticipants(["x", "a", "y", "b"], {
        type: "RANKING",
        values: { a: 2, b: 1 },
        direction: "ASC",
      });
      expect(order(unwrap(seeded))).toEqual(["b", "a", "x", "y"]);
    });

    it("garde l'ordre reçu en cas d'égalité", () => {
      const seeded = seedParticipants(["c", "a", "b"], {
        type: "RANKING",
        values: { a: 1, b: 1, c: 1 },
        direction: "ASC",
      });
      expect(order(unwrap(seeded))).toEqual(["c", "a", "b"]);
    });

    it("tire les égalités au sort si une graine est fournie", () => {
      const many = Array.from({ length: 12 }, (_, i) => `p${i}`);
      const values = Object.fromEntries(many.map((id, i) => [id, i < 6 ? 1 : 2]));
      const method = { type: "RANKING", values, direction: "ASC", tieSeed: "tirage" } as const;
      const seeded = order(unwrap(seedParticipants(many, method)));

      // Tirage figé : les six « 1 » restent avant les six « 2 », mélangés entre eux.
      expect(seeded).toEqual([
        "p2",
        "p0",
        "p3",
        "p5",
        "p4",
        "p1",
        "p11",
        "p6",
        "p7",
        "p10",
        "p8",
        "p9",
      ]);
      // Reproductible, quel que soit l'ordre reçu.
      expect(order(unwrap(seedParticipants([...many].reverse(), method)))).toEqual(seeded);
    });

    it.each([
      [{ z: 1 }, "UNKNOWN_PARTICIPANT"],
      [{ a: Number.NaN }, "INVALID_VALUE"],
      [{ a: Infinity }, "INVALID_VALUE"],
    ])("valeurs %j → %s", (values, error) => {
      expect(seedParticipants(participants, { type: "RANKING", values, direction: "ASC" })).toEqual(
        {
          ok: false,
          error,
        },
      );
    });
  });
});
