import { describe, expect, it } from "vitest";
import { supports, type Connector } from "./connector.ts";

const readOnly: Connector = {
  id: "fake",
  name: "Plateforme fictive",
  capabilities: {
    importTournament: true,
    importParticipants: true,
    importResults: true,
    liveResults: false,
  },
};

describe("supports", () => {
  it("lit les capacités déclarées", () => {
    expect(supports(readOnly, "importResults")).toBe(true);
    expect(supports(readOnly, "liveResults")).toBe(false);
  });
});
