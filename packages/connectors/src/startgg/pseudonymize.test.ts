import { describe, expect, it } from "vitest";
import { createPseudonymizer, type Json } from "./pseudonymize.ts";

// Réponse fictive, dans la forme de EVENT_SETS. Les pseudos sont inventés.
const sets: Json = {
  data: {
    event: {
      id: 900,
      sets: {
        nodes: [
          {
            id: 1,
            winnerId: 7001,
            displayScore: "Alpha 3 - Bravo 1",
            vodUrl: "https://example.org/vod",
            slots: [
              { slotIndex: 0, entrant: { id: 7001, name: "Team | Alpha" } },
              { slotIndex: 1, entrant: { id: 7002, name: "Bravo" } },
            ],
            games: [
              {
                orderNum: 1,
                winnerId: 7002,
                stage: { id: 3, name: "Carte A" },
                selections: [
                  { entrant: { id: 7001 }, character: { id: 10, name: "Perso X" } },
                  { entrant: { id: 7002 }, character: { id: 11, name: "Perso Y" } },
                ],
              },
            ],
          },
        ],
      },
    },
  },
};

const standings: Json = {
  nodes: [
    {
      placement: 1,
      entrant: {
        id: 7002,
        name: "Bravo",
        participants: [{ gamerTag: "Bravo", prefix: "Team", user: { id: 55 } }],
      },
    },
    { placement: 2, entrant: { id: 7001, name: "Team | Alpha" } },
  ],
};

describe("createPseudonymizer", () => {
  it("ne laisse aucun pseudo ni identifiant de participant d'origine", () => {
    const { pseudonymize } = createPseudonymizer();
    const output = JSON.stringify([pseudonymize(sets), pseudonymize(standings)]);

    for (const leaked of ["Alpha", "Bravo", "7001", "7002", "gamerTag", "user", "vod"]) {
      expect(output).not.toContain(leaked);
    }
  });

  it("garde le même alias pour un participant, d'un fichier à l'autre", () => {
    const { pseudonymize } = createPseudonymizer();

    expect(pseudonymize(sets)).toMatchObject({
      data: {
        event: {
          sets: {
            nodes: [
              {
                winnerId: 1,
                slots: [
                  { entrant: { id: 1, name: "Participant 001" } },
                  { entrant: { id: 2, name: "Participant 002" } },
                ],
                games: [
                  { winnerId: 2, selections: [{ entrant: { id: 1 } }, { entrant: { id: 2 } }] },
                ],
              },
            ],
          },
        },
      },
    });
    expect(pseudonymize(standings)).toEqual({
      nodes: [
        { placement: 1, entrant: { id: 2, name: "Participant 002" } },
        { placement: 2, entrant: { id: 1, name: "Participant 001" } },
      ],
    });
  });

  it("conserve la structure, les scores, les personnages et les cartes", () => {
    const { pseudonymize } = createPseudonymizer();

    expect(pseudonymize(sets)).toMatchObject({
      data: {
        event: {
          id: 900,
          sets: {
            nodes: [
              {
                id: 1,
                games: [
                  {
                    orderNum: 1,
                    stage: { id: 3, name: "Carte A" },
                    selections: [
                      { character: { id: 10, name: "Perso X" } },
                      { character: { id: 11, name: "Perso Y" } },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    });
  });

  it("laisse un vainqueur absent à null", () => {
    const { pseudonymize } = createPseudonymizer();
    expect(pseudonymize({ winnerId: null, entrant: null })).toEqual({
      winnerId: null,
      entrant: null,
    });
  });

  it("compte les participants distincts", () => {
    const pseudonymizer = createPseudonymizer("Équipe");
    pseudonymizer.pseudonymize(sets);
    pseudonymizer.pseudonymize(standings);
    expect(pseudonymizer.size).toBe(2);
  });
});
