import { describe, expect, it } from "vitest";
import { err, ok } from "./result.ts";

describe("Result", () => {
  it("ok porte une valeur", () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it("err porte une erreur", () => {
    expect(err("BOOM")).toEqual({ ok: false, error: "BOOM" });
  });
});
