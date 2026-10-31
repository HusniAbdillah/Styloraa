import { describe, expect, it } from "vitest";
import { createPreviewJobSchema } from "./schema";

const item = "00000000-0000-4000-8000-000000000001";

describe("preview job input boundary", () => {
  it("requires consent and limitations acknowledgment", () => {
    expect(
      createPreviewJobSchema.safeParse({
        subject_type: "capsule_outfit",
        subject_id: item,
        capsule_id: item,
        mode: "combo",
        consent_acknowledged: true,
        limitations_acknowledged: true,
      }).success,
    ).toBe(true);
    expect(
      createPreviewJobSchema.safeParse({
        subject_type: "capsule_outfit",
        subject_id: item,
        capsule_id: item,
        mode: "combo",
        consent_acknowledged: false,
        limitations_acknowledged: true,
      }).success,
    ).toBe(false);
  });
});
