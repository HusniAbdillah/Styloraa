import { describe, expect, it } from "vitest";
import { estimateSpend, type SpendPiece } from "./spend";

describe("selected outfit spending", () => {
  it("does not turn owned pieces into new spending", () => {
    expect(estimateSpend([{ kind: "owned" }])).toMatchObject({
      estimated_spend_minor: 0,
      currency: null,
      incomplete: false,
    });
  });

  it("sums selected products in minor units and excludes shipping explicitly", () => {
    expect(
      estimateSpend([
        { kind: "owned" },
        { kind: "product", price_minor: 19900000, currency: "IDR" },
        { kind: "product", price_minor: 5000000, currency: "IDR" },
      ]),
    ).toMatchObject({
      estimated_spend_minor: 24900000,
      currency: "IDR",
      incomplete: false,
      includes_shipping: false,
    });
  });

  it.each<{ items: SpendPiece[]; reason: string }>([
    { items: [{ kind: "missing" }], reason: "missing_product" },
    {
      items: [{ kind: "product", price_minor: null, currency: "IDR" }],
      reason: "unknown_price",
    },
    {
      items: [
        { kind: "product", price_minor: 100, currency: "USD" },
        { kind: "product", price_minor: 100, currency: "IDR" },
      ],
      reason: "mixed_currencies",
    },
    {
      items: [
        {
          kind: "product",
          price_minor: Number.MAX_SAFE_INTEGER,
          currency: "USD",
        },
        { kind: "product", price_minor: 1, currency: "USD" },
      ],
      reason: "price_overflow",
    },
  ])(
    "keeps an unsupported complete total unavailable ($reason)",
    ({ items, reason }) => {
      const result = estimateSpend(items);
      expect(result.estimated_spend_minor).toBeNull();
      expect(result.incomplete).toBe(true);
      expect(result.reasons).toContain(reason);
    },
  );
});
