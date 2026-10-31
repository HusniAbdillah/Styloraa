import { describe, expect, it } from "vitest";
import {
  combinationRequestSchema,
  createCapsuleSchema,
  updateCapsuleSchema,
} from "./schema";

const brief = { purpose: "Workdays", notes: "" };
const item = "00000000-0000-4000-8000-000000000001";

describe("capsule input boundaries", () => {
  it("accepts owned items or a saved look source", () => {
    expect(
      createCapsuleSchema.safeParse({
        title: "Everyday",
        description: "",
        brief,
        item_ids: [item],
      }).success,
    ).toBe(true);
    expect(
      createCapsuleSchema.safeParse({
        title: "Everyday",
        description: "",
        brief,
        from_saved_look_id: item,
      }).success,
    ).toBe(true);
  });
  it("rejects empty capsules and duplicate items", () => {
    expect(
      createCapsuleSchema.safeParse({
        title: "Everyday",
        description: "",
        brief,
        item_ids: [],
      }).success,
    ).toBe(false);
    expect(
      createCapsuleSchema.safeParse({
        title: "Everyday",
        description: "",
        brief,
        item_ids: [item, item],
      }).success,
    ).toBe(false);
  });
  it("requires at least one update field", () => {
    expect(updateCapsuleSchema.safeParse({}).success).toBe(false);
    expect(updateCapsuleSchema.safeParse({ title: "New" }).success).toBe(true);
  });
  it("bounds combination requests", () => {
    expect(
      combinationRequestSchema.safeParse({ count: 3, source: "ai" }).success,
    ).toBe(true);
    expect(combinationRequestSchema.safeParse({ count: 99 }).success).toBe(
      false,
    );
  });
});
