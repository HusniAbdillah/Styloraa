"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { compareProducts } from "@/features/products/repository";

type Comparison = Awaited<ReturnType<typeof compareProducts>>;
type Product = NonNullable<Comparison["items"][number]["selected_product"]>;

function price(product: Product) {
  if (product.price_minor == null || !product.currency)
    return "Price unavailable";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: product.currency,
    }).format(product.price_minor / 100);
  } catch {
    return "Price unavailable";
  }
}

function ProductCard({
  product,
  chosen,
  onChoose,
  busy,
}: {
  product: Product;
  chosen: boolean;
  onChoose: () => void;
  busy: boolean;
}) {
  return (
    <div
      className={`bg-card flex min-w-0 flex-col overflow-hidden rounded-2xl border ${chosen ? "border-primary" : "border-border"}`}
    >
      <div className="bg-background relative h-36 w-full">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 45vw, 180px"
            className="object-contain p-2"
            unoptimized
          />
        ) : (
          <span className="text-secondary flex h-full items-center justify-center text-xs">
            Image unavailable
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm leading-5 font-medium">
          {product.title}
        </p>
        <p className="mt-2 text-sm font-semibold">{price(product)}</p>
        <p className="text-secondary mt-1 text-xs">
          {product.source_label} ·{" "}
          {product.source_type === "live" ? "Live result" : product.source_type}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <button
            type="button"
            disabled={busy || chosen}
            onClick={onChoose}
            className={`min-h-9 rounded-full px-4 text-xs font-semibold disabled:opacity-60 ${chosen ? "bg-background text-primary" : "bg-primary text-primary-foreground hover:bg-primary-hover"}`}
          >
            {chosen ? "Selected" : "Select"}
          </button>
          {product.product_url && (
            <a
              href={product.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-xs font-semibold underline underline-offset-4"
            >
              Visit store ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ComparePanel({ comparison }: { comparison: Comparison }) {
  const router = useRouter();
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [error, setError] = useState("");
  const ownedCount = comparison.items.filter(
    (item) => item.item_kind === "owned",
  ).length;
  const missingCount = comparison.items.length - ownedCount;

  async function request(
    url: string,
    method: "POST" | "PUT",
    body: Record<string, unknown>,
    itemId: string,
  ) {
    setBusyItem(itemId);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: { error?: { message?: string } } = await response.json();
      if (!response.ok)
        throw new Error(
          result.error?.message ?? "The request could not be completed.",
        );
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The request could not be completed.",
      );
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-xs font-bold tracking-[0.18em] uppercase">
            Compare products
          </p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
            {comparison.title}
          </h1>
          <p className="text-secondary mt-3 max-w-2xl text-sm leading-6">
            {comparison.rationale}
          </p>
        </div>
        <Link
          href={`/looks/${comparison.look_id}?option_id=${comparison.option_id}`}
          className="border-border bg-card hover:border-primary rounded-full border px-5 py-3 text-sm font-semibold"
        >
          View outfit
        </Link>
      </div>
      <div className="border-border bg-card flex flex-wrap gap-3 rounded-2xl border p-4 text-sm">
        <span>{comparison.items.length} outfit pieces</span>
        <span className="text-secondary">·</span>
        <span>{ownedCount} owned</span>
        <span className="text-secondary">·</span>
        <span>{missingCount} to find</span>
      </div>
      {error && (
        <p
          role="alert"
          className="border-primary/30 bg-card text-primary rounded-xl border p-4 text-sm"
        >
          {error}
        </p>
      )}
      <div className="space-y-5">
        {comparison.items.map((item, index) => {
          const owned = item.item_kind === "owned";
          const products: Product[] = [...item.candidates];
          if (
            item.selected_product &&
            !products.some(
              (candidate) => candidate.id === item.selected_product?.id,
            )
          )
            products.unshift(item.selected_product);
          return (
            <section
              key={item.id}
              aria-labelledby={`slot-${item.id}`}
              className="border-border bg-card rounded-2xl border p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-primary text-xs font-bold tracking-[0.14em] uppercase">
                    Piece {index + 1} · {owned ? "Owned" : "To find"}
                  </p>
                  <h2
                    id={`slot-${item.id}`}
                    className="mt-2 font-serif text-2xl"
                  >
                    {owned
                      ? (item.owned_item?.name ?? "Unavailable wardrobe piece")
                      : (item.requested_brief ??
                        item.requested_category ??
                        "Missing piece")}
                  </h2>
                  {item.requested_category && !owned && (
                    <p className="text-secondary mt-1 text-xs">
                      {item.requested_category}
                    </p>
                  )}
                </div>
                {!owned && (
                  <button
                    type="button"
                    disabled={busyItem !== null}
                    onClick={() =>
                      request(
                        `/api/looks/${comparison.look_id}/products/search`,
                        "POST",
                        {
                          option_id: comparison.option_id,
                          option_item_id: item.id,
                        },
                        item.id,
                      )
                    }
                    className="border-primary text-primary hover:bg-background min-h-10 rounded-full border px-4 text-xs font-semibold disabled:opacity-50"
                  >
                    {busyItem === item.id
                      ? "Searching…"
                      : products.length
                        ? "Refresh results"
                        : "Search products"}
                  </button>
                )}
              </div>
              {owned ? (
                <p className="text-secondary mt-4 text-sm">
                  Already in your wardrobe
                  {item.owned_item?.available === false
                    ? " · currently unavailable"
                    : ""}
                  . No purchase needed.
                </p>
              ) : (
                <div className="mt-5">
                  {products.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          chosen={item.selected_product?.id === product.id}
                          busy={busyItem !== null}
                          onChoose={() =>
                            request(
                              `/api/looks/${comparison.look_id}/selection`,
                              "PUT",
                              {
                                option_id: comparison.option_id,
                                expected_revision: comparison.revision,
                                choices: [
                                  {
                                    option_item_id: item.id,
                                    product_id: product.id,
                                  },
                                ],
                              },
                              item.id,
                            )
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary border-border rounded-xl border border-dashed p-5 text-sm">
                      {item.search?.status === "empty"
                        ? "No products found for this piece. Try searching again."
                        : "Search to see available products for this piece."}
                    </p>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <p className="text-secondary text-xs">{comparison.notice}</p>
    </div>
  );
}
