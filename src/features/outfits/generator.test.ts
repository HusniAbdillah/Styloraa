import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { verifyCombinations } from "./generator";

describe("verifyCombinations", () => {
  it("accepts combinations fully inside the owned capsule", () => {
    const result = verifyCombinations(
      [{ item_ids: ["a", "b"] }],
      new Set(["a", "b", "c"]),
      new Set(["a"]),
      new Set(),
    );
    expect(result.valid).toEqual([0]);
    expect(result.problems).toEqual([]);
  });
  it("rejects outside items, missing required, excluded, and duplicates", () => {
    const result = verifyCombinations(
      [
        { item_ids: ["a", "foreign"] },
        { item_ids: ["b"] },
        { item_ids: ["a", "c"] },
        { item_ids: ["a", "a"] },
      ],
      new Set(["a", "b", "c"]),
      new Set(["a"]),
      new Set(["c"]),
    );
    expect(result.valid).toEqual([]);
    expect(result.problems).toHaveLength(4);
    expect(result.problems[0].reasons.join(" ")).toMatch(
      /not in the owned capsule/,
    );
    expect(result.problems[1].reasons.join(" ")).toMatch(/Required item/);
    expect(result.problems[2].reasons.join(" ")).toMatch(/excluded/);
    expect(result.problems[3].reasons.join(" ")).toMatch(/Duplicate/);
  });
});
