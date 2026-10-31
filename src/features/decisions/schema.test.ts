import { describe, expect, it } from "vitest";
import { savedLookQuerySchema, selectProductsSchema } from "./schema";

const optionId = "44000000-0000-4000-8000-000000000001";
const itemId = "46000000-0000-4000-8000-000000000001";
const productId = "45000000-0000-4000-8000-000000000001";
const payload = {
  option_id: optionId,
  expected_revision: 1,
  choices: [{ option_item_id: itemId, product_id: productId }],
};

describe("decision request boundary", () => {
  it("accepts a partial per-slot change without client ownership or prices", () => {
    expect(selectProductsSchema.parse(payload)).toEqual(payload);
  });

  it("rejects client workspace, ownership and price fields", () => {
    expect(
      selectProductsSchema.safeParse({ ...payload, workspace_id: optionId })
        .success,
    ).toBe(false);
    expect(
      selectProductsSchema.safeParse({
        ...payload,
        choices: [
          { ...payload.choices[0], price_minor: 0, ownership: "owned" },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects ambiguous duplicate slot choices", () => {
    expect(
      selectProductsSchema.safeParse({
        ...payload,
        choices: [payload.choices[0], payload.choices[0]],
      }).success,
    ).toBe(false);
  });

  it("bounds saved-look pagination", () => {
    expect(savedLookQuerySchema.parse({})).toEqual({ limit: 20, offset: 0 });
    expect(savedLookQuerySchema.safeParse({ limit: "1000" }).success).toBe(
      false,
    );
    expect(savedLookQuerySchema.safeParse({ offset: "-1" }).success).toBe(
      false,
    );
  });
});
