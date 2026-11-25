import { describe, expect, it } from "vitest";
import { createRandom, shuffle } from "./random.ts";

describe("createRandom", () => {
  it("donne toujours la même suite pour une graine (tirages figés)", () => {
    // Si ce test casse, l'algorithme a changé : les tirages déjà stockés ne seraient plus reproductibles.
    const random = createRandom("epickem");
    expect([random(), random(), random()]).toEqual([
      0.9677902648691088, 0.6502098038326949, 0.03939038701355457,
    ]);
  });

  it("reste dans [0, 1)", () => {
    const random = createRandom(7);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("traite une graine numérique comme son texte", () => {
    expect(createRandom(42)()).toBe(createRandom("42")());
  });
});

describe("shuffle", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g", "h"];

  it("donne un mélange figé pour une graine", () => {
    expect(shuffle(items, "epickem")).toEqual(["c", "b", "d", "g", "f", "a", "e", "h"]);
    expect(shuffle(items, 42)).toEqual(["f", "g", "a", "e", "d", "h", "c", "b"]);
  });

  it("renvoie une permutation sans modifier l'entrée", () => {
    const copy = [...items];
    const result = shuffle(items, "graine");
    expect(items).toEqual(copy);
    expect([...result].sort()).toEqual(copy);
  });

  it("gère les listes vides et à un élément", () => {
    expect(shuffle([], 1)).toEqual([]);
    expect(shuffle(["seul"], 1)).toEqual(["seul"]);
  });
});
