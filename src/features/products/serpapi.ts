import "server-only";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { BackendError } from "@/features/decisions/backend";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_RESULTS = 40;
const MAX_PRICE = Number.MAX_SAFE_INTEGER;
const words: Record<string, string[]> = {
  top: [
    "shirt",
    "shirts",
    "tshirt",
    "kaos",
    "kemeja",
    "blouse",
    "sweater",
    "sweatshirt",
    "polo",
    "tunic",
    "tank",
  ],
  bottom: [
    "pants",
    "trousers",
    "jeans",
    "shorts",
    "skirt",
    "skirts",
    "rok",
    "celana",
    "leggings",
    "jogger",
    "chino",
    "palazzo",
  ],
  dress: ["dress", "dresses", "gaun", "jumpsuit", "gamis"],
  outerwear: [
    "jacket",
    "jackets",
    "jaket",
    "coat",
    "cardigan",
    "blazer",
    "outer",
    "outerwear",
    "parka",
  ],
  shoes: [
    "shoe",
    "shoes",
    "sneaker",
    "sneakers",
    "sepatu",
    "sandal",
    "sandals",
    "heel",
    "heels",
    "loafer",
    "boots",
    "flats",
  ],
  bag: ["bag", "bags", "tas", "tote", "handbag", "backpack", "purse", "ransel"],
  accessory: [
    "belt",
    "ikat",
    "scarf",
    "syal",
    "hat",
    "cap",
    "topi",
    "necklace",
    "kalung",
    "bracelet",
    "gelang",
    "watch",
    "earring",
  ],
};

export type ShoppingProduct = {
  provider_product_id: string;
  title: string;
  category: string;
  source_label: string;
  product_url: string;
  image_url: string | null;
  price_minor: number | null;
  currency: string | null;
  rating: number | null;
  review_count: number | null;
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function safePublicUrl(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    return null;
  try {
    const url = new URL(value);
    const host = url.hostname
      .toLowerCase()
      .replace(/\.$/, "")
      .replace(/^\[|\]$/g, "");
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !host ||
      (url.port && !["80", "443"].includes(url.port)) ||
      host === "localhost" ||
      /\.(localhost|local|internal|invalid)$/.test(host)
    )
      return null;
    for (const key of url.searchParams.keys()) {
      if (
        ["api_key", "apikey", "access_token", "token", "secret"].includes(
          key.toLowerCase(),
        )
      )
        return null;
    }
    if (isIP(host) === 4) {
      const [a, b] = host.split(".").map(Number);
      if (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        a >= 224 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && [0, 168].includes(b)) ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 198 && [18, 19, 51].includes(b)) ||
        (a === 203 && b === 0)
      )
        return null;
    } else if (isIP(host) === 6) {
      return null;
    } else if (!host.includes(".") || !/^[a-z0-9.-]+$/.test(host)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function matchesCategory(title: string, category: string) {
  const tokens = new Set(
    title
      .normalize("NFKD")
      .toLowerCase()
      .match(/[a-z0-9]+/g),
  );
  if (
    ["doll", "boneka", "kostum", "miniature", "pattern", "pola"].some((word) =>
      tokens.has(word),
    )
  )
    return false;
  const matches = Object.entries(words)
    .filter(([, terms]) => terms.some((word) => tokens.has(word)))
    .map(([kind]) => kind);
  return matches.length === 1 && matches[0] === category;
}

function price(row: Record<string, unknown>): [number | null, string | null] {
  const text = typeof row.price === "string" ? row.price : "";
  if (
    row.installment ||
    /\b(monthly|month|bulan|cicilan|angsuran|down payment|downpayment|deposit|dp|starting|from)\b|\/mo\b/i.test(
      text,
    )
  )
    return [null, null];
  const supplied =
    typeof row.currency === "string" ? row.currency.toUpperCase() : "";
  const currencies: [RegExp, string, number][] = [
    [/\bIDR\b|\bRp\.?\s*\d/i, "IDR", 2],
    [/\bUSD\b|US\$/i, "USD", 2],
    [/\bEUR\b|€/i, "EUR", 2],
    [/\bGBP\b|£/i, "GBP", 2],
    [/\bSGD\b|S\$/i, "SGD", 2],
    [/\bAUD\b|A\$/i, "AUD", 2],
    [/\bCAD\b|C\$/i, "CAD", 2],
    [/\bJPY\b/i, "JPY", 0],
    [/\bKRW\b/i, "KRW", 0],
    [/\bVND\b/i, "VND", 0],
  ];
  const currency = supplied
    ? currencies.find(([, code]) => code === supplied)
    : currencies.find(([pattern]) => pattern.test(text));
  const visibleCurrency = currencies.find(([pattern]) => pattern.test(text));
  if (supplied && visibleCurrency && visibleCurrency[1] !== supplied)
    return [null, null];
  const amount = row.extracted_price;
  if (
    !currency ||
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount < 0
  )
    return [null, null];
  const minor = Math.round(amount * 10 ** currency[2]);
  return Number.isSafeInteger(minor) && minor <= MAX_PRICE
    ? [minor, currency[1]]
    : [null, null];
}

export function normalizeShopping(
  payload: unknown,
  category: string,
): ShoppingProduct[] {
  const data = record(payload);
  if (!data)
    throw new BackendError(
      502,
      "marketplace_invalid_response",
      "Marketplace returned an invalid response.",
    );
  if (
    ![
      "shopping_results",
      "inline_shopping_results",
      "categorized_shopping_results",
    ].some((field) => Array.isArray(data[field]))
  ) {
    throw new BackendError(
      502,
      "marketplace_invalid_response",
      "Marketplace returned an invalid response.",
    );
  }
  const rows: { row: unknown; ad: boolean }[] = [];
  for (const field of ["shopping_results", "inline_shopping_results"]) {
    if (Array.isArray(data[field]))
      rows.push(
        ...data[field]
          .slice(0, 100)
          .map((row) => ({ row, ad: field === "inline_shopping_results" })),
      );
  }
  if (Array.isArray(data.categorized_shopping_results)) {
    for (const group of data.categorized_shopping_results.slice(0, 10)) {
      const list = record(group)?.shopping_results;
      if (Array.isArray(list))
        rows.push(...list.slice(0, 100).map((row) => ({ row, ad: false })));
    }
  }
  const seen = new Set<string>();
  const products: ShoppingProduct[] = [];
  for (const entry of rows) {
    const row = record(entry.row);
    if (
      !row ||
      typeof row.title !== "string" ||
      !row.title.trim() ||
      row.title.length > 200
    )
      continue;
    const title = row.title.trim();
    if (!matchesCategory(title, category)) continue;
    const link = safePublicUrl(row.product_link) ?? safePublicUrl(row.link);
    if (!link) continue;
    const merchant =
      typeof row.source === "string" && row.source.trim()
        ? row.source.trim()
        : typeof row.seller === "string" && row.seller.trim()
          ? row.seller.trim()
          : "Google Shopping";
    const reference =
      typeof row.product_id === "string" || typeof row.product_id === "number"
        ? String(row.product_id)
        : link;
    const id = `id:${category}:${createHash("sha256")
      .update(reference + "|" + merchant.toLowerCase())
      .digest("hex")}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const [price_minor, currency] = price(row);
    products.push({
      provider_product_id: id,
      title,
      category,
      source_label:
        merchant.slice(0, 120) +
        (entry.ad ? " via SerpAPI / ad" : " via SerpAPI"),
      product_url: link,
      image_url: safePublicUrl(row.thumbnail) ?? safePublicUrl(row.image),
      price_minor,
      currency,
      rating:
        typeof row.rating === "number" &&
        Number.isFinite(row.rating) &&
        row.rating >= 0 &&
        row.rating <= 5
          ? row.rating
          : null,
      review_count:
        typeof row.reviews === "number" &&
        Number.isInteger(row.reviews) &&
        row.reviews >= 0 &&
        row.reviews <= 2147483647
          ? row.reviews
          : null,
    });
    if (products.length === MAX_RESULTS) break;
  }
  return products;
}

export function assertMarketplaceConfigured(category: string) {
  const key = process.env.SERPAPI_API_KEY?.trim() ?? "";
  if (!key || /^(replace|your[_-]|placeholder|change|<|isi_)/i.test(key)) {
    throw new BackendError(
      503,
      "marketplace_not_configured",
      "Marketplace search is not configured.",
    );
  }
  if (!words[category])
    throw new BackendError(
      422,
      "unsupported_category",
      "Review the missing garment category before searching.",
    );
}

export async function searchSerpApi(
  query: string,
  category: string,
): Promise<ShoppingProduct[]> {
  assertMarketplaceConfigured(category);
  const key = process.env.SERPAPI_API_KEY!.trim();
  const url = new URL("https://serpapi.com/search.json");
  url.search = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    gl: "id",
    hl: "en",
    safe: "active",
    api_key: key,
    no_cache: "false",
  }).toString();
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(25000),
      redirect: "error",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new BackendError(
      503,
      "marketplace_unavailable",
      "Marketplace search is temporarily unavailable.",
    );
  }
  if (response.status === 401 || response.status === 403)
    throw new BackendError(
      503,
      "marketplace_authentication_failed",
      "The marketplace provider rejected the server key.",
    );
  if (response.status === 429)
    throw new BackendError(
      429,
      "marketplace_rate_limited",
      "Marketplace search quota is exhausted.",
    );
  if (!response.ok)
    throw new BackendError(
      503,
      "marketplace_unavailable",
      "Marketplace search is temporarily unavailable.",
    );
  const reader = response.body?.getReader();
  if (!reader)
    throw new BackendError(
      502,
      "marketplace_invalid_response",
      "Marketplace returned an invalid response.",
    );
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error("Response limit");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    const error = record(data)?.error;
    if (error)
      throw new BackendError(
        503,
        "marketplace_unavailable",
        "The marketplace provider could not complete this search.",
      );
    return normalizeShopping(data, category);
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError(
      502,
      "marketplace_invalid_response",
      "Marketplace returned an invalid response.",
    );
  }
}
