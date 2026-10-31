import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { normalizeShopping, safePublicUrl, searchSerpApi } from "./serpapi";
import { defaultValueWeights, scoreProducts } from "./value-score";
import { marketplaceSearchSchema } from "./schema";

const listing = {
  title: "Celana panjang hitam",
  product_id: "synthetic-1",
  source: "Synthetic shop",
  product_link: "https://shop.example.com/trousers",
  thumbnail: "https://images.example.com/trousers.png",
  price: "Rp 239.090",
  extracted_price: 239090,
  rating: 4.5,
  reviews: 12,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("bounded shopping evidence", () => {
  it("encodes spaces in provider shopping links while rejecting control characters", () => {
    const row = {
      ...listing,
      product_link:
        "https://www.google.com/search?q=Black chino trousers&udm=28",
    };
    expect(
      normalizeShopping({ shopping_results: [row] }, "bottom")[0].product_url,
    ).toBe("https://www.google.com/search?q=Black%20chino%20trousers&udm=28");
    expect(safePublicUrl("https://example.com/a\nb")).toBeNull();
  });
  it("rejects unsafe schemes, credentials, private addresses and secret-bearing URLs", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://127.0.0.1/a",
      "http://2130706433/a",
      "http://[::1]/a",
      "http://169.254.169.254/a",
      "https://private.local/a",
      "https://user:password@example.com/a",
      "https://shop.example.com/a?api_key=synthetic",
      "https://shop.example.com/a?access_token=synthetic",
    ]) {
      expect(safePublicUrl(url)).toBeNull();
    }
    expect(safePublicUrl("https://shop.example.com/product")).toBe(
      "https://shop.example.com/product",
    );
  });

  it("normalizes actual IDR evidence, provenance and stable deduplication without ownership", () => {
    const rows = normalizeShopping(
      { shopping_results: [listing, listing] },
      "bottom",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      price_minor: 23909000,
      currency: "IDR",
      rating: 4.5,
      review_count: 12,
      source_label: "Synthetic shop via SerpAPI",
      category: "bottom",
    });
    expect(rows[0]).not.toHaveProperty("ownership");
    expect(rows[0].provider_product_id).toBe(
      normalizeShopping({ shopping_results: [listing] }, "bottom")[0]
        .provider_product_id,
    );
  });

  it("keeps ambiguous prices unknown and rejects unrelated or malformed listings", () => {
    const rows = normalizeShopping(
      {
        shopping_results: [
          {
            ...listing,
            product_id: "bare-dollar",
            price: "$20",
            extracted_price: 20,
          },
          {
            ...listing,
            product_id: "installment",
            price: "Rp 50.000 / month",
            extracted_price: 50000,
          },
          { ...listing, title: "White sneakers", product_id: "wrong-category" },
          {
            ...listing,
            product_id: "unsafe",
            product_link: "javascript:alert(1)",
          },
        ],
      },
      "bottom",
    );
    expect(rows).toHaveLength(2);
    expect(
      rows.every((row) => row.price_minor === null && row.currency === null),
    ).toBe(true);
    expect(() => normalizeShopping({ unexpected: true }, "bottom")).toThrow(
      "invalid response",
    );
    expect(normalizeShopping({ shopping_results: [] }, "bottom")).toEqual([]);
  });

  it("never calls a provider for a missing or placeholder key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("SERPAPI_API_KEY", "replace-with-a-key");
    await expect(
      searchSerpApi("black trousers", "bottom"),
    ).rejects.toMatchObject({
      code: "marketplace_not_configured",
      status: 503,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses one bounded explicit request and sanitizes provider errors", async () => {
    vi.stubEnv("SERPAPI_API_KEY", "synthetic-test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("provider message with synthetic-test-key", {
        status: 403,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      searchSerpApi("black trousers", "bottom"),
    ).rejects.toMatchObject({
      code: "marketplace_authentication_failed",
      status: 503,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect((url as URL).origin).toBe("https://serpapi.com");
    expect((url as URL).searchParams.get("gl")).toBe("id");
    expect(options).toMatchObject({ redirect: "error", cache: "no-store" });
  });

  it("rejects oversized provider responses instead of inventing a catalog fallback", async () => {
    vi.stubEnv("SERPAPI_API_KEY", "synthetic-test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("x".repeat(2 * 1024 * 1024 + 1))),
    );
    await expect(
      searchSerpApi("black trousers", "bottom"),
    ).rejects.toMatchObject({
      code: "marketplace_invalid_response",
      status: 502,
    });
  });
});

describe("transparent Value Score", () => {
  it("excludes unknown factors without inventing ratings or prices", () => {
    const products = normalizeShopping(
      {
        shopping_results: [
          {
            ...listing,
            price: "unknown",
            extracted_price: undefined,
            rating: undefined,
          },
        ],
      },
      "bottom",
    );
    const [score] = scoreProducts(
      products,
      "celana panjang hitam",
      defaultValueWeights,
    );
    expect(score.factors).toEqual({
      price: null,
      rating: null,
      relevance: 1,
      available_weight: 0.5,
    });
    expect(score.value_score).toBe(1);
    expect(score.explanation).toContain("Missing factors are excluded");
    expect(score.explanation).toContain("not verified best buys");
  });

  it("does not compare nominal prices across currencies and obeys explicit weights", () => {
    const products = normalizeShopping(
      {
        shopping_results: [
          listing,
          {
            ...listing,
            product_id: "usd",
            currency: "USD",
            price: "US$20",
            extracted_price: 20,
            rating: 3,
          },
        ],
      },
      "bottom",
    );
    const scores = scoreProducts(products, "black trousers", {
      price: 0,
      rating: 1,
      relevance: 0,
    });
    expect(scores.every((score) => score.factors.price === null)).toBe(true);
    expect(scores.map((score) => score.value_score)).toEqual([0.9, 0.6]);
    expect(
      marketplaceSearchSchema.safeParse({
        option_id: "00000000-0000-4000-8000-000000000001",
        option_item_id: "00000000-0000-4000-8000-000000000002",
        weights: { price: 1, rating: 1, relevance: 1 },
      }).success,
    ).toBe(false);
  });
});
