import { describe, expect, it } from "vitest";
import {
  requireOwnedPreviewItems,
  validatePreviewSelection,
} from "./ownership";
const pieces = [
  {
    id: "owned-a",
    name: "Shirt",
    category: "top",
    color: "white",
    available: true,
  },
  {
    id: "owned-b",
    name: "Trousers",
    category: "bottom",
    color: "black",
    available: true,
  },
];
describe("preview ownership boundary", () => {
  it("rejects empty and archived compositions before provider submission", () => {
    expect(() => requireOwnedPreviewItems([])).toThrow(/owned/);
    expect(() =>
      requireOwnedPreviewItems([{ ...pieces[0], available: false }]),
    ).toThrow(/owned/);
  });
  it("rejects suggested, foreign and repeated IDs", () => {
    expect(() =>
      validatePreviewSelection(pieces, ["suggested"], "single"),
    ).toThrow(/owned/);
    expect(() =>
      validatePreviewSelection(pieces, ["owned-a", "owned-a"], "combo"),
    ).toThrow(/owned/);
  });
  it("enforces single and combination modes", () => {
    expect(() =>
      validatePreviewSelection(pieces, ["owned-a", "owned-b"], "single"),
    ).toThrow(/one piece/);
    expect(() =>
      validatePreviewSelection(pieces, ["owned-a"], "combo"),
    ).toThrow(/at least two/);
    expect(() =>
      validatePreviewSelection(pieces, ["owned-a", "owned-b"], "combo"),
    ).not.toThrow();
  });
});
