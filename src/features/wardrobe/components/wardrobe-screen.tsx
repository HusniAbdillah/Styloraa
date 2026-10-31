import Link from "next/link";
import Image from "next/image";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { categories, type WardrobeListFilters } from "../schema";
import {
  getWardrobeImageUrl,
  listMaterializedStaticWardrobeEntryIds,
  listWardrobePage,
} from "../repository";
import {
  demoWardrobeEntries,
  getLocalSeedWardrobeEntryId,
  getLocalSeedWardrobeImage,
} from "../demo-wardrobe";
import { wardrobeItemMatchesSearch } from "../search";
import { WardrobeForm } from "./wardrobe-form";
import { WardrobeItemControls } from "./wardrobe-item-controls";
import { StaticWardrobeControls } from "./static-wardrobe-controls";

function pageHref(filters: WardrobeListFilters, offset: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  params.set("offset", String(offset));
  return `/wardrobe?${params.toString()}`;
}

export async function WardrobeScreen({
  filters,
  sampleMode = false,
}: {
  filters: WardrobeListFilters;
  sampleMode?: boolean;
}) {
  const configured = isDatabaseConfigured();
  const firstSavedPage =
    configured && !sampleMode
      ? await listWardrobePage({ ...filters, offset: 0 })
      : { items: [], total: 0 };
  const enabled = configured && getServerEnv().DEMO_WRITES_ENABLED === "true";
  const visibleSampleItems = demoWardrobeEntries.filter(
    (item) =>
      (!filters.category || item.category === filters.category) &&
      wardrobeItemMatchesSearch(item, filters.search),
  );
  const savedStaticIds =
    configured && !sampleMode
      ? await listMaterializedStaticWardrobeEntryIds()
      : new Set<string>();
  const starterItems = !sampleMode
    ? visibleSampleItems.filter((item) => !savedStaticIds.has(item.id))
    : [];
  const visibleStarterItems = starterItems.slice(
    filters.offset,
    filters.offset + filters.limit,
  );
  const starterOffset = Math.max(0, filters.offset - starterItems.length);
  const savedItemsNeeded = filters.limit - visibleStarterItems.length;
  const savedPage =
    configured && !sampleMode && filters.offset > 0 && savedItemsNeeded > 0
      ? await listWardrobePage({
          ...filters,
          limit: savedItemsNeeded,
          offset: starterOffset,
        })
      : firstSavedPage;
  const items =
    !sampleMode && filters.offset === 0
      ? savedPage.items.slice(0, savedItemsNeeded)
      : savedItemsNeeded > 0
        ? savedPage.items
        : [];
  const total = firstSavedPage.total;
  const totalMatches = total + starterItems.length;
  const cards = await Promise.all(
    items.map(async (item) => ({
      item,
      previewHref: `/wardrobe/${getLocalSeedWardrobeEntryId(item.attribute_provenance) ?? item.id}/preview`,
      imageUrl: item.asset_id
        ? await getWardrobeImageUrl(item.asset_id).catch(() => null)
        : getLocalSeedWardrobeImage(item.attribute_provenance),
    })),
  );
  const previousOffset = Math.max(0, filters.offset - filters.limit);
  const nextOffset = filters.offset + filters.limit;
  const wardrobeCards = [
    ...visibleStarterItems.map((item) => ({
      item,
      imageUrl: item.image,
      previewHref: `/wardrobe/${item.id}/preview`,
      isStatic: true as const,
    })),
    ...cards.map((card) => ({ ...card, isStatic: false as const })),
  ];

  return (
    <section className="space-y-8">
      <div>
        <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
          The everyday collection
        </p>
        <h1 className="font-serif text-4xl md:text-5xl">
          Your wardrobe, considered.
        </h1>
        <p className="text-secondary mt-4">Your pieces, all in one place.</p>
        {configured && !sampleMode && (
          <p className="text-secondary mt-2 text-sm" aria-live="polite">
            {totalMatches} {totalMatches === 1 ? "item" : "items"} match these
            filters
          </p>
        )}
      </div>

      {!sampleMode && (
        <div className="flex justify-end">
          <WardrobeForm enabled={enabled} />
        </div>
      )}

      <div className="space-y-5">
        <form
          method="get"
          action="/wardrobe"
          className="border-border bg-card flex flex-wrap items-end gap-3 rounded-2xl border p-4"
        >
          <label className="min-w-48 flex-1 text-sm">
            Search any clothing detail
            <input
              name="search"
              maxLength={100}
              defaultValue={filters.search}
              className="border-border bg-background focus:border-primary mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 focus:outline-none"
            />
          </label>
          <label className="min-w-36 text-sm">
            Category
            <select
              name="category"
              defaultValue={filters.category ?? ""}
              className="border-border bg-background focus:border-primary mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 focus:outline-none"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary-hover min-h-11 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            Apply filters
          </button>
        </form>

        {sampleMode ? (
          <section aria-label="Sample wardrobe preview" className="space-y-4">
            <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
              <div>
                <h2 className="font-semibold">Sample wardrobe preview</h2>
                <p className="text-secondary mt-1 text-sm">
                  Example pieces only. These items are not saved to the shared
                  wardrobe.
                </p>
              </div>
              <Link
                href="/wardrobe"
                className="text-primary inline-flex min-h-11 items-center rounded-full px-4 text-sm underline underline-offset-4"
              >
                Back to wardrobe
              </Link>
            </div>
            {visibleSampleItems.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleSampleItems.map((item) => (
                  <article
                    key={item.id}
                    className="border-border bg-card overflow-hidden rounded-2xl border"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={960}
                      height={960}
                      className="bg-background h-64 w-full object-contain p-4"
                    />
                    <div className="p-5">
                      <p className="text-secondary text-xs tracking-wider uppercase">
                        {item.category} · {item.subcategory}
                      </p>
                      <h3 className="mt-2 font-serif text-2xl tracking-tight">
                        {item.name}
                      </h3>
                      <p className="text-secondary mt-1 text-sm">
                        {item.color}
                      </p>
                      <p className="text-secondary mt-3 text-sm">
                        {item.notes}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="border-border text-secondary rounded-2xl border border-dashed p-6 text-sm">
                No sample pieces match these filters. Clear the filters to see
                the sample wardrobe.
              </p>
            )}
          </section>
        ) : (
          <>
            {wardrobeCards.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {wardrobeCards.map(
                  ({ item, imageUrl, previewHref, isStatic }) => (
                    <article
                      key={item.id}
                      className="border-border bg-card hover:border-primary/40 overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-200 ease-out hover:shadow-xs"
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          width={960}
                          height={960}
                          unoptimized
                          className="bg-background h-64 w-full object-contain p-4"
                        />
                      ) : (
                        <div className="bg-muted text-secondary flex h-64 items-center justify-center text-sm">
                          No photo available
                        </div>
                      )}
                      <div className="p-5">
                        <p className="text-secondary text-xs tracking-wider uppercase">
                          {item.category}
                          {item.subcategory ? ` · ${item.subcategory}` : ""}
                        </p>
                        <h2 className="mt-2 font-serif text-2xl tracking-tight">
                          {item.name}
                        </h2>
                        <p className="text-secondary mt-1 text-sm">
                          {item.color}
                        </p>
                        {item.notes && (
                          <p className="text-secondary mt-3 text-sm whitespace-pre-wrap">
                            {item.notes}
                          </p>
                        )}
                        {isStatic ? (
                          <StaticWardrobeControls item={item} />
                        ) : (
                          <>
                            <Link
                              className="text-primary mt-2 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                              href={previewHref}
                            >
                              Preview this piece
                            </Link>
                            <WardrobeItemControls
                              item={item}
                              imageUrl={imageUrl}
                              enabled={enabled}
                            />
                          </>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}

            {wardrobeCards.length === 0 && (
              <div className="border-border rounded-2xl border border-dashed p-8">
                <h2 className="font-serif text-2xl">
                  {filters.search || filters.category
                    ? "No pieces match these filters."
                    : "Room for your picks."}
                </h2>
                <p className="text-secondary mt-3 text-sm">
                  {filters.search || filters.category
                    ? "Clear the filters or broaden your search."
                    : configured
                      ? "Your saved wardrobe is empty."
                      : "Database not connected. Static starter pieces are available when no filters are applied."}
                </p>
                {(filters.search || filters.category) && (
                  <Link
                    href="/wardrobe"
                    className="text-primary mt-3 inline-flex min-h-11 items-center rounded-full px-4 text-sm underline underline-offset-4"
                  >
                    Clear filters
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {!sampleMode && totalMatches > filters.limit && (
          <nav
            aria-label="Wardrobe pages"
            className="flex items-center justify-between"
          >
            {filters.offset === 0 ? (
              <span
                aria-disabled="true"
                className="text-secondary px-3 py-2 text-sm opacity-50"
              >
                Previous
              </span>
            ) : (
              <Link
                className="text-primary rounded-full px-3 py-2 text-sm underline underline-offset-4"
                href={pageHref(filters, previousOffset)}
              >
                Previous
              </Link>
            )}
            <span className="text-secondary text-sm">
              {filters.offset + 1}–
              {Math.min(filters.offset + filters.limit, totalMatches)} of{" "}
              {totalMatches}
            </span>
            {nextOffset >= totalMatches ? (
              <span
                aria-disabled="true"
                className="text-secondary px-3 py-2 text-sm opacity-50"
              >
                Next
              </span>
            ) : (
              <Link
                className="text-primary rounded-full px-3 py-2 text-sm underline underline-offset-4"
                href={pageHref(filters, nextOffset)}
              >
                Next
              </Link>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
