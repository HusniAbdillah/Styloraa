import { describe, expect, it } from "vitest";
import { wardrobeItemSchema } from "./schema";
describe("wardrobe input boundary", () => {
  it("normalizes whitespace and strips caller supplied workspace IDs", () => {
    expect(
      wardrobeItemSchema.parse({
        name: "  Linen shirt  ",
        category: "top",
        color: " ivory ",
        workspace_id: "attacker",
      }),
    ).toEqual({ name: "Linen shirt", category: "top", color: "ivory" });
  });
  it.each([
    { name: "x", category: "top", color: "cream" },
    { name: "Shirt", category: "unknown", color: "cream" },
    { name: "Shirt", category: "top", color: " " },
  ])("rejects invalid records %j", (input) => {
    expect(wardrobeItemSchema.safeParse(input).success).toBe(false);
  });
});
