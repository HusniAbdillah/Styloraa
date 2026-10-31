import "server-only";
import {
  BackendError,
  checkDatabase,
  getBackendContext,
} from "@/features/decisions/backend";
import type { Database } from "@/types/database";
import type { MarketplaceSearchInput } from "./schema";
import {
  assertMarketplaceConfigured,
  safePublicUrl,
  searchSerpApi,
} from "./serpapi";
import { defaultValueWeights, scoreProducts } from "./value-score";

type Context = ReturnType<typeof getBackendContext>;
type Item = Database["public"]["Tables"]["outfit_option_items"]["Row"] & {
  requested_brief?: string | null;
  requested_category?: string | null;
};
type Product = Database["public"]["Tables"]["products"]["Row"];

export function productResponse(row: Product) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    product_url: safePublicUrl(row.product_url),
    image_url: safePublicUrl(row.image_url),
    source_label: row.source_label,
    source_type: row.source_type,
    provider: row.provider,
    retrieved_at: row.retrieved_at,
    price_minor: row.price_minor,
    currency: row.currency,
    shipping_minor: row.shipping_minor,
    rating: row.rating,
    review_count: row.review_count,
    commercial_disclosure: row.commercial_disclosure,
  };
}

async function loadOption(context: Context, lookId: string, optionId: string) {
  const { db, workspaceId } = context;
  const look = await db
    .from("looks")
    .select("id,revision,selected_option_id")
    .eq("workspace_id", workspaceId)
    .eq("id", lookId)
    .maybeSingle();
  checkDatabase(look.error, "The inspiration could not be loaded.");
  const option = await db
    .from("outfit_options")
    .select(
      "id,look_id,title,option_type,source_revision,rationale,uncertainty,source_type",
    )
    .eq("workspace_id", workspaceId)
    .eq("look_id", lookId)
    .eq("id", optionId)
    .maybeSingle();
  checkDatabase(option.error, "The outfit could not be loaded.");
  if (!look.data || !option.data)
    throw new BackendError(
      404,
      "outfit_not_found",
      "The outfit is unavailable.",
    );
  if (look.data.revision !== option.data.source_revision) {
    throw new BackendError(
      409,
      "stale_revision",
      "The inspiration changed. Refresh outfit options.",
    );
  }
  const items = await db
    .from("outfit_option_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("look_id", lookId)
    .eq("option_id", optionId)
    .order("position")
    .order("slot_id")
    .limit(21);
  checkDatabase(items.error, "The outfit pieces could not be loaded.");
  if (!items.data?.length || items.data.length > 20) {
    throw new BackendError(
      409,
      "invalid_composition",
      "The outfit needs to be rebuilt.",
    );
  }
  return { look: look.data, option: option.data, items: items.data as Item[] };
}

export async function compareProducts(lookId: string, optionId: string) {
  const context = getBackendContext();
  const { db, workspaceId } = context;
  const current = await loadOption(context, lookId, optionId);
  const itemIds = current.items.map((row) => row.id);
  const ownedIds = current.items.flatMap((row) =>
    row.wardrobe_item_id ? [row.wardrobe_item_id] : [],
  );
  const wardrobe = ownedIds.length
    ? await db
        .from("wardrobe_items")
        .select("id,name,category,color,archived_at,image_path,asset_id")
        .eq("workspace_id", workspaceId)
        .in("id", ownedIds)
        .limit(20)
    : { data: [], error: null };
  checkDatabase(wardrobe.error, "Wardrobe pieces could not be loaded.");
  const assetIds =
    wardrobe.data?.flatMap((row) => (row.asset_id ? [row.asset_id] : [])) ?? [];
  const assets = assetIds.length
    ? await db
        .from("assets")
        .select("id,bucket,storage_path,deleted_at")
        .eq("workspace_id", workspaceId)
        .in("id", assetIds)
        .limit(20)
    : { data: [], error: null };
  checkDatabase(assets.error, "Wardrobe images could not be loaded.");
  const assetMap = new Map(assets.data?.map((row) => [row.id, row]));
  const owned = await Promise.all(
    (wardrobe.data ?? []).map(async (row) => {
      const asset = row.asset_id ? assetMap.get(row.asset_id) : null;
      const path = row.asset_id
        ? asset && asset.bucket === "wardrobe" && !asset.deleted_at
          ? asset.storage_path
          : null
        : row.image_path;
      let imageUrl: string | null = null;
      const safePath =
        path?.startsWith(workspaceId + "/") &&
        !/[\\%\u0000-\u001f]/.test(path) &&
        path.split("/").every((part) => part && part !== "." && part !== "..");
      if (!row.archived_at && path && safePath) {
        const signed = await db.storage
          .from("wardrobe")
          .createSignedUrl(path, 300);
        if (!signed.error) imageUrl = signed.data.signedUrl;
      }
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        color: row.color,
        available: !row.archived_at,
        image_url: imageUrl,
      };
    }),
  );
  const searches = await db
    .from("shopping_searches")
    .select(
      "id,option_item_id,status,provider,query,created_at,score_weights,score_version",
    )
    .eq("workspace_id", workspaceId)
    .in("option_item_id", itemIds)
    .order("created_at", { ascending: false })
    .limit(100);
  checkDatabase(searches.error, "Product searches could not be loaded.");
  const latest = new Map<string, NonNullable<typeof searches.data>[number]>();
  for (const row of searches.data ?? [])
    if (!latest.has(row.option_item_id)) latest.set(row.option_item_id, row);
  const searchIds = Array.from(latest.values())
    .filter((row) => row.status === "succeeded")
    .map((row) => row.id);
  const references = searchIds.length
    ? await db
        .from("shopping_results")
        .select("search_id,product_id,position,factors,value_score,explanation")
        .eq("workspace_id", workspaceId)
        .in("search_id", searchIds)
        .order("position")
        .limit(800)
    : { data: [], error: null };
  checkDatabase(references.error, "Product candidates could not be loaded.");
  const productIds = [
    ...new Set([
      ...(references.data?.map((row) => row.product_id) ?? []),
      ...current.items.flatMap((row) =>
        row.product_id ? [row.product_id] : [],
      ),
    ]),
  ];
  const products = productIds.length
    ? await db
        .from("products")
        .select("*")
        .eq("workspace_id", workspaceId)
        .in("id", productIds)
        .limit(820)
    : { data: [], error: null };
  checkDatabase(products.error, "Products could not be loaded.");
  const productMap = new Map(
    products.data?.map((row) => [row.id, productResponse(row)]),
  );
  const ownedMap = new Map(owned.map((row) => [row.id, row]));
  return {
    look_id: lookId,
    option_id: optionId,
    revision: current.look.revision,
    option_type: current.option.option_type,
    title: current.option.title,
    rationale: current.option.rationale,
    source_type: current.option.source_type,
    items: current.items.map((row) => {
      const search = latest.get(row.id);
      return {
        id: row.id,
        slot_id: row.slot_id,
        item_kind: row.item_kind,
        requested_brief: row.requested_brief ?? row.missing_brief,
        requested_category: row.requested_category ?? null,
        owned_item: row.wardrobe_item_id
          ? (ownedMap.get(row.wardrobe_item_id) ?? null)
          : null,
        selected_product: row.product_id
          ? (productMap.get(row.product_id) ?? null)
          : null,
        candidates: (references.data ?? [])
          .filter((ref) => ref.search_id === search?.id)
          .flatMap((ref) => {
            const product = productMap.get(ref.product_id);
            return product
              ? [
                  {
                    ...product,
                    value_score: ref.value_score,
                    factors: ref.factors,
                    explanation: ref.explanation,
                  },
                ]
              : [];
          }),
        search: search
          ? {
              id: search.id,
              status: search.status,
              query: search.query,
              provider: search.provider,
              created_at: search.created_at,
              weights: search.score_weights,
              score_version: search.score_version,
            }
          : null,
      };
    }),
    notice:
      "Products remain suggested until explicitly added to the wardrobe. Prices and availability may change.",
  };
}

export function marketplaceQuery(brief: string | null | undefined) {
  return brief?.replace(/\s+/g, " ").trim().slice(0, 240).trim() ?? null;
}

export async function searchMarketplace(
  lookId: string,
  input: MarketplaceSearchInput,
) {
  const context = getBackendContext(true);
  const { db, workspaceId } = context;
  const current = await loadOption(context, lookId, input.option_id);
  const item = current.items.find((row) => row.id === input.option_item_id);
  if (!item)
    throw new BackendError(
      404,
      "outfit_item_not_found",
      "The outfit piece is unavailable.",
    );
  if (
    current.option.option_type === "from_wardrobe" ||
    item.item_kind === "owned"
  ) {
    throw new BackendError(
      422,
      "owned_piece",
      "Marketplace search is only available for missing pieces.",
    );
  }
  const category = item.requested_category;
  const query =
    input.q ?? marketplaceQuery(item.requested_brief ?? item.missing_brief);
  if (!category || !query || query.length < 2 || query.length > 240) {
    throw new BackendError(
      422,
      "missing_item_brief",
      "Review the missing garment brief and category before searching.",
    );
  }
  assertMarketplaceConfigured(category);
  const weights = input.weights ?? defaultValueWeights;
  const search = await db
    .from("shopping_searches")
    .insert({
      workspace_id: workspaceId,
      option_item_id: item.id,
      query,
      provider: "serpapi",
      country: "id",
      status: "running",
      score_weights: { ...weights },
      score_version: "v1",
    })
    .select("id")
    .single();
  checkDatabase(search.error, "The search could not be recorded.");
  if (!search.data)
    throw new BackendError(
      503,
      "database_unavailable",
      "The search could not be recorded.",
    );
  const searchId = search.data.id;
  try {
    const result = await searchSerpApi(query, category);
    const after = await loadOption(context, lookId, input.option_id);
    const currentItem = after.items.find((row) => row.id === item.id);
    if (!currentItem || currentItem.item_kind === "owned") {
      throw new BackendError(
        409,
        "stale_revision",
        "The outfit piece changed. Refresh before searching again.",
      );
    }
    const retrievedAt = new Date().toISOString();
    const scores = scoreProducts(result, query, weights);
    const scoreMap = new Map(
      scores.map((score) => [score.provider_product_id, score]),
    );
    const stored = result.length
      ? await db
          .from("products")
          .upsert(
            result.map((product) => ({
              ...product,
              workspace_id: workspaceId,
              provider: "serpapi",
              source_type: "live",
              retrieved_at: retrievedAt,
              shipping_minor: null,
              commercial_disclosure: null,
            })),
            { onConflict: "workspace_id,provider,provider_product_id" },
          )
          .select("*")
      : { data: [], error: null };
    checkDatabase(stored.error, "The product results could not be stored.");
    const productMap = new Map(
      stored.data?.map((row) => [row.provider_product_id, row]),
    );
    const ordered = result.flatMap((product) => {
      const row = productMap.get(product.provider_product_id);
      return row ? [row] : [];
    });
    if (ordered.length) {
      const references = await db.from("shopping_results").insert(
        ordered.map((product, position) => {
          const score = scoreMap.get(product.provider_product_id)!;
          return {
            workspace_id: workspaceId,
            search_id: searchId,
            product_id: product.id,
            position,
            factors: score.factors,
            value_score: score.value_score,
            explanation: score.explanation,
          };
        }),
      );
      checkDatabase(
        references.error,
        "The product candidates could not be stored.",
      );
    }
    const completed = await db
      .from("shopping_searches")
      .update({ status: ordered.length ? "succeeded" : "empty" })
      .eq("workspace_id", workspaceId)
      .eq("id", searchId)
      .eq("option_item_id", item.id);
    checkDatabase(
      completed.error,
      "The product search could not be completed.",
    );
    return {
      search_id: searchId,
      look_id: lookId,
      option_id: input.option_id,
      option_item_id: item.id,
      query,
      provider: "serpapi",
      source_type: "live",
      weights: { ...weights },
      score_version: "v1",
      items: ordered.map((row) => ({
        ...productResponse(row),
        ...scoreMap.get(row.provider_product_id),
      })),
      total: ordered.length,
      notice:
        "One provider result batch. Search does not change the selected outfit or wardrobe ownership.",
    };
  } catch (error) {
    await db
      .from("shopping_searches")
      .update({
        status:
          error instanceof BackendError &&
          error.code === "marketplace_not_configured"
            ? "unavailable"
            : "failed",
        error_code:
          error instanceof BackendError ? error.code : "search_failed",
      })
      .eq("workspace_id", workspaceId)
      .eq("id", searchId)
      .eq("option_item_id", item.id);
    throw error;
  }
}
