import type { ShoppingProduct } from "./serpapi";

export type ValueWeights = { price: number; rating: number; relevance: number };
export const defaultValueWeights: ValueWeights = {
  price: 0.3,
  rating: 0.2,
  relevance: 0.5,
};

function tokens(text: string) {
  return new Set(
    text
      .normalize("NFKD")
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? [],
  );
}

export function scoreProducts(
  products: ShoppingProduct[],
  query: string,
  weights: ValueWeights,
) {
  const currencies = new Set(
    products.flatMap((row) =>
      row.price_minor !== null && row.currency ? [row.currency] : [],
    ),
  );
  const priced = products.flatMap((row) =>
    row.price_minor !== null ? [row.price_minor] : [],
  );
  const minimum = priced.length ? Math.min(...priced) : 0;
  const maximum = priced.length ? Math.max(...priced) : 0;
  const queryWords = tokens(query);
  return products.map((product) => {
    const titleWords = tokens(product.title);
    const overlap = [...queryWords].filter((word) =>
      titleWords.has(word),
    ).length;
    const relevance = queryWords.size
      ? 0.5 + (0.5 * overlap) / queryWords.size
      : 0.5;
    const price =
      product.price_minor !== null && currencies.size === 1
        ? maximum === minimum
          ? 1
          : 1 - (product.price_minor - minimum) / (maximum - minimum)
        : null;
    const rating = product.rating === null ? null : product.rating / 5;
    const availableWeight =
      (price === null ? 0 : weights.price) +
      (rating === null ? 0 : weights.rating) +
      weights.relevance;
    const score =
      availableWeight > 0
        ? ((price ?? 0) * weights.price +
            (rating ?? 0) * weights.rating +
            relevance * weights.relevance) /
          availableWeight
        : null;
    const explanation = [
      "Relevance uses the verified garment category and overlap between the search and returned title.",
      price === null
        ? "Price comparison is unavailable because prices are missing or currencies differ."
        : "Price is compared only within this returned same-currency batch; shipping is not included.",
      rating === null
        ? "The provider did not return a rating."
        : "The provider rating is normalized against five stars.",
      "Missing factors are excluded and remaining weights are renormalized; incomplete listings are not verified best buys.",
    ].join(" ");
    return {
      provider_product_id: product.provider_product_id,
      value_score:
        score === null ? null : Math.round(score * 1_000_000) / 1_000_000,
      factors: { price, rating, relevance, available_weight: availableWeight },
      weights: { ...weights },
      score_version: "v1",
      explanation,
    };
  });
}
