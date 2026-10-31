import Link from "next/link";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import { notFound } from "next/navigation";
import { getLook } from "@/features/inspiration/repository";
import { getSelectedLook } from "@/features/decisions/repository";
import { SaveAsCapsule } from "@/features/capsules/components/save-as-capsule";
import { SaveLookButton } from "./save-look-button";

type Selection = Awaited<ReturnType<typeof getSelectedLook>>;
type Piece = Selection["items"][number];

function money(minor: number | null, currency: string | null) {
  if (minor == null || !currency) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(minor / 100);
  } catch {
    return null;
  }
}

function PieceCard({ item }: { item: Piece }) {
  const owned = item.ownership === "owned";
  const price = money(item.price_minor, item.currency);
  return (
    <li className="selected-piece-card bg-card border-border flex min-w-0 gap-4 rounded-2xl border p-4">
      <div className="piece-monogram" aria-hidden="true">{(item.category ?? "✦").slice(0, 1).toUpperCase()}</div>
      <div className="min-w-0 flex-1 py-1">
        <span className="text-secondary text-[11px] font-semibold tracking-[0.16em] uppercase">
          {item.category ?? "Outfit piece"}
        </span>
        <h3 className="mt-1 text-base leading-snug font-medium">
          {item.name ?? "Piece to find"}
        </h3>
        <p className="text-secondary mt-1 text-xs">
          {owned
            ? "Already in your wardrobe"
            : item.ownership === "suggested"
              ? "Suggested, not yet owned"
              : "Still missing"}
        </p>
        {price && <p className="mt-2 text-sm font-semibold">{price}</p>}
        {item.source_label && (
          <p className="text-secondary mt-1 text-xs">
            Source: {item.source_label}
          </p>
        )}
        {!item.available && owned && (
          <p className="text-primary mt-1 text-xs">
            This wardrobe item is unavailable.
          </p>
        )}
        {item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary mt-2 inline-block text-sm font-semibold underline underline-offset-4"
          >
            View product ↗
          </a>
        )}
      </div>
    </li>
  );
}

function whyPoints(value: string) {
  return value.replace(/^Why this\?\s*/i, "").replace(/\s*Profile signals used:.*$/i, "").split(/(?<=[.!?])\s+|;\s+/).map((part) => part.trim()).filter(Boolean).slice(0, 4);
}

export async function SelectedLookView({
  lookId,
  optionId,
}: {
  lookId: string;
  optionId?: string;
}) {
  const [selected, fullLook] = await Promise.all([
    getSelectedLook(lookId, optionId),
    getLook(lookId),
  ]);
  if (!fullLook) notFound();
  const options = fullLook.options;
  const index = options.findIndex(
    (option) => option.id === selected.selected_option?.id,
  );
  const owned = selected.items.filter((item) => item.ownership === "owned");
  const missing = selected.items.filter((item) => item.ownership !== "owned");
  const comparisonUrl = selected.selected_option
    ? `/looks/${lookId}/products?option_id=${selected.selected_option.id}`
    : null;
  const spend =
    selected.spend && !selected.spend.incomplete
      ? money(selected.spend.estimated_spend_minor, selected.spend.currency)
      : null;
  const why = whyPoints(selected.selected_option?.rationale ?? "This combination follows the selected wardrobe direction.");

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <nav
        aria-label="Breadcrumb"
        className="text-secondary text-xs sm:text-sm"
      >
        <Link href="/create" className="hover:text-primary">
          Create a look
        </Link>
        <span className="mx-2">/</span>
        <span>Selected outfit</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-primary text-xs font-bold tracking-[0.18em] uppercase">
            Your outfit
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">
            {selected.selected_option?.title ?? selected.look.title}
          </h1>
          <p className="text-secondary mt-3 max-w-2xl text-sm leading-6">A considered combination, with the pieces and reasoning laid out below.</p>
        </div>
        {index >= 0 && (
          <span className="border-border bg-card rounded-full border px-4 py-2 text-sm">
            Recommendation {index + 1} of {options.length}
          </span>
        )}
      </div>

      {options.length > 1 && (
        <nav
          aria-label="Outfit recommendations"
          className="flex flex-wrap gap-2"
        >
          {options.map((option, optionIndex) => (
            <Link
              key={option.id}
              href={`/looks/${lookId}?option_id=${option.id}`}
              aria-current={
                option.id === selected.selected_option?.id ? "page" : undefined
              }
              className={`rounded-full border px-4 py-2 text-sm ${option.id === selected.selected_option?.id ? "border-[#d7c5a4] bg-[#eee5d7] text-[#211f20]" : "border-border bg-card hover:border-primary"}`}
            >
              {optionIndex + 1}. {option.title}
            </Link>
          ))}
        </nav>
      )}

      {selected.stale && (
        <p
          role="alert"
          className="border-primary/25 bg-card text-primary rounded-xl border p-4 text-sm"
        >
          This recommendation needs to be refreshed after the inspiration
          changed.
        </p>
      )}
      {comparisonUrl && missing.length > 0 && <section className="marketplace-callout"><div className="marketplace-callout-icon"><ShoppingBag size={22}/></div><div className="marketplace-callout-copy"><p className="text-xs font-semibold tracking-[0.14em] uppercase">Complete the look</p><h2>You’re missing {missing.length} {missing.length === 1 ? "piece" : "pieces"} for this outfit.</h2><p>Explore matching marketplace options for {missing.slice(0, 3).map((item) => item.name ?? item.category ?? "a piece").join(", ")}{missing.length > 3 ? ` and ${missing.length - 3} more` : ""}.</p></div><Link href={comparisonUrl} className="marketplace-callout-button">Search marketplace <ArrowRight size={16}/></Link></section>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-8">
          <section className="why-list-panel"><h2 className="font-serif text-2xl">Why this works</h2><ul>{why.map((point, pointIndex) => <li key={`${pointIndex}-${point}`}><span><Check size={14}/></span>{point}</li>)}</ul></section>
          <section aria-labelledby="owned-title">
            <div className="mb-4 flex items-end justify-between">
              <h2 id="owned-title" className="font-serif text-2xl sm:text-3xl">
                Already yours
              </h2>
              <span className="text-secondary text-sm">
                {owned.length} {owned.length === 1 ? "item" : "items"}
              </span>
            </div>
            {owned.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {owned.map((item) => (
                  <PieceCard key={item.id} item={item} />
                ))}
              </ul>
            ) : (
              <p className="text-secondary border-border rounded-xl border border-dashed p-5 text-sm">
                No wardrobe pieces match this option yet.
              </p>
            )}
          </section>
          <section aria-labelledby="missing-title">
            <div className="mb-4 flex items-end justify-between">
              <h2
                id="missing-title"
                className="font-serif text-2xl sm:text-3xl"
              >
                Pieces to find
              </h2>
              <span className="text-secondary text-sm">
                {missing.length} {missing.length === 1 ? "item" : "items"}
              </span>
            </div>
            {missing.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {missing.map((item) => (
                  <PieceCard key={item.id} item={item} />
                ))}
              </ul>
            ) : (
              <p className="text-secondary border-border rounded-xl border border-dashed p-5 text-sm">
                Everything in this look is already in your wardrobe.
              </p>
            )}
          </section>
        </div>
        <aside className="bg-card border-border h-fit rounded-2xl border p-5 sm:p-6">
          <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
            At a glance
          </p>
          <p className="mt-4 font-serif text-3xl">
            {selected.items.length} pieces
          </p>
          <p className="text-secondary mt-2 text-sm">
            {owned.length} owned · {missing.length} to find
          </p>
          <div className="border-border mt-5 border-t pt-5">
            <p className="text-secondary text-xs">Estimated product spend</p>
            <p className="mt-1 text-xl font-semibold">
              {spend ?? "Not yet available"}
            </p>
            {selected.spend?.incomplete && (
              <p className="text-secondary mt-1 text-xs">
                Some pieces do not have a selected price.
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {!selected.stale &&
            selected.items.length > 0 &&
            missing.length === 0 &&
            owned.every((item) => item.available) &&
            selected.selected_option?.source_type !== "sample" ? (
              <>
                <Link
                  href={`/looks/${lookId}/preview${selected.selected_option ? `?option_id=${selected.selected_option.id}` : ""}`}
                  className="border-primary text-primary rounded-full border px-5 py-3 text-center text-sm font-semibold"
                >
                  Preview owned look
                </Link>
                <SaveAsCapsule
                  lookId={lookId}
                  sourceOptionId={selected.selected_option?.id}
                  selectedItemIds={owned.flatMap((item) =>
                    item.wardrobe_item_id ? [item.wardrobe_item_id] : [],
                  )}
                />
              </>
            ) : null}
            {selected.selected_option && !selected.stale && (
              <SaveLookButton
                lookId={lookId}
                optionId={selected.selected_option.id}
                revision={selected.look.revision}
              />
            )}
          </div>
        </aside>
      </div>
      <p className="text-secondary text-xs">
        Suggested products remain unowned until added to your wardrobe. Prices
        and availability may change.
      </p>
    </div>
  );
}
