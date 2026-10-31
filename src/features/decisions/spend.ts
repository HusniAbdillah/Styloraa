export type SpendPiece = {
  kind: string;
  price_minor?: number | null;
  currency?: string | null;
};

export function estimateSpend(items: readonly SpendPiece[]) {
  const reasons = new Set<string>();
  const currencies = new Set<string>();
  let amount = 0;

  for (const item of items) {
    if (item.kind === "owned") continue;
    if (item.kind !== "product") {
      reasons.add("missing_product");
      continue;
    }
    if (item.currency && /^[A-Z]{3}$/.test(item.currency))
      currencies.add(item.currency);
    if (
      item.price_minor == null ||
      !Number.isSafeInteger(item.price_minor) ||
      item.price_minor < 0 ||
      !item.currency ||
      !/^[A-Z]{3}$/.test(item.currency)
    ) {
      reasons.add("unknown_price");
      continue;
    }
    if (!Number.isSafeInteger(amount + item.price_minor))
      reasons.add("price_overflow");
    else amount += item.price_minor;
  }

  if (currencies.size > 1) reasons.add("mixed_currencies");
  return {
    estimated_spend_minor: reasons.size ? null : amount,
    currency: currencies.size === 1 ? [...currencies][0] : null,
    incomplete: reasons.size > 0,
    reasons: [...reasons],
    includes_shipping: false,
  };
}
