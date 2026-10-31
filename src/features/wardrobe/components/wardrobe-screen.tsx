import Link from "next/link";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { categories, type WardrobeListFilters } from "../schema";
import { getWardrobeImageUrl, listWardrobePage } from "../repository";
import { WardrobeForm } from "./wardrobe-form";
import { WardrobeItemControls } from "./wardrobe-item-controls";

function pageHref(filters: WardrobeListFilters, offset: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  params.set("offset", String(offset));
  return `/wardrobe?${params.toString()}`;
}

export async function WardrobeScreen({
  filters,
}: {
  filters: WardrobeListFilters;
}) {
  const configured = isDatabaseConfigured();
  const { items, total } = configured
    ? await listWardrobePage(filters)
    : { items: [], total: 0 };
  const enabled = configured && getServerEnv().DEMO_WRITES_ENABLED === "true";
  const cards = await Promise.all(
    items.map(async (item) => ({
      item,
      imageUrl: item.asset_id
        ? await getWardrobeImageUrl(item.asset_id).catch(() => null)
        : null,
    })),
  );
  const previousOffset = Math.max(0, filters.offset - filters.limit);
  const nextOffset = filters.offset + filters.limit;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
          The everyday collection
        </p>
        <h1 className="font-serif text-4xl md:text-5xl">
          Your wardrobe, considered.
        </h1>
        <p className="text-secondary mt-4">
          The owned pieces behind every combination.
        </p>
        {configured && (
          <p className="text-secondary mt-2 text-sm" aria-live="polite">
            {total} {total === 1 ? "item" : "items"} match these filters
          </p>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <form
            method="get"
            action="/wardrobe"
            className="border-border bg-card flex flex-wrap items-end gap-3 rounded-2xl border p-4"
          >
            <label className="min-w-48 flex-1 text-sm">
              Search item name
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

          {cards.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map(({ item, imageUrl }) => (
                <article
                  key={item.id}
                  className="border-border bg-card hover:border-primary/40 rounded-2xl border p-6 transition-[border-color,box-shadow] duration-200 ease-out hover:shadow-xs"
                >
                  <p className="text-secondary text-xs tracking-wider uppercase">
                    {item.category}
                    {item.subcategory ? ` · ${item.subcategory}` : ""}
                  </p>
                  <h2 className="mt-3 font-serif text-2xl tracking-tight">
                    {item.name}
                  </h2>
                  <p className="text-secondary mt-2 text-sm">{item.color}</p>
                  {item.notes && (
                    <p className="text-secondary mt-2 text-sm whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  )}
                  <Link
                    className="text-primary mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                    href={`/wardrobe/${item.id}/preview`}
                  >
                    Preview this piece
                  </Link>
                  <WardrobeItemControls
                    item={item}
                    imageUrl={imageUrl}
                    enabled={enabled}
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="border-border rounded-2xl border border-dashed p-8">
              <h2 className="font-serif text-2xl">Room for your picks.</h2>
              <p className="text-secondary mt-3 text-sm">
                {configured
                  ? "No items match these filters. Add the first item or adjust your search."
                  : "Database not connected. No wardrobe items are stored yet."}
              </p>
            </div>
          )}

          {total > filters.limit && (
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
                {Math.min(filters.offset + filters.limit, total)} of {total}
              </span>
              {nextOffset >= total ? (
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

        <WardrobeForm enabled={enabled} />
      </div>
    </section>
  );
}
