import Link from "next/link";
import { BackendError } from "@/features/decisions/backend";
import { getSavedLook, listSavedLooks } from "@/features/decisions/repository";

type SavedLook = Awaited<ReturnType<typeof getSavedLook>>;
const button =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 py-2 text-sm font-medium hover:border-primary";

export function formatSavedSpend(look: Pick<SavedLook, "spend">) {
  const { estimated_spend_minor, currency } = look.spend;
  if (estimated_spend_minor === null) return "Price unavailable";
  if (!currency)
    return estimated_spend_minor === 0
      ? "No additional spend"
      : "Price unavailable";
  return new Intl.NumberFormat("en-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(estimated_spend_minor / 100);
}

function loadError(error: unknown) {
  return error instanceof BackendError
    ? error.message
    : "Saved looks could not be loaded right now.";
}

function PieceTiles({ items }: { items: SavedLook["items"] }) {
  return (
    <div className="grid grid-cols-3 gap-2" aria-label="Outfit pieces">
      {items.slice(0, 3).map((item, index) => (
        <div
          key={`${item.slot_id ?? item.name}-${index}`}
          className="bg-background flex min-h-24 flex-col justify-between rounded-lg p-3"
        >
          <span className="text-xs leading-4 font-medium">{item.name}</span>
          <span className="text-secondary text-[11px]">
            {item.kind === "owned"
              ? "Owned"
              : item.kind === "missing"
                ? "Missing"
                : "Suggested"}
          </span>
        </div>
      ))}
    </div>
  );
}

export async function SavedLooksScreen({ page }: { page?: string }) {
  const currentPage = /^[1-9]\d{0,2}$/.test(page ?? "") ? Number(page) : 1;
  const limit = 12;
  let list: Awaited<ReturnType<typeof listSavedLooks>>;
  try {
    list = await listSavedLooks(limit, (currentPage - 1) * limit);
  } catch (error) {
    return (
      <section className="mx-auto max-w-5xl space-y-5">
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">
          Your collection
        </p>
        <h1 className="font-serif text-4xl md:text-5xl">Saved looks</h1>
        <p role="alert" className="border-border bg-card rounded-xl border p-6">
          {loadError(error)}
        </p>
        <Link className={button} href="/create">
          Create a look
        </Link>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-6xl space-y-7">
      <header>
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">
          Your collection
        </p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">
          Good decisions, kept close.
        </h1>
        <p className="text-secondary mt-3 max-w-2xl">
          Revisit the exact outfit decisions saved in this shared demo
          workspace.
        </p>
      </header>
      {list.items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.items.map((look) => (
            <article
              key={look.id}
              className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5"
            >
              <PieceTiles items={look.items} />
              <div>
                <h2 className="font-serif text-2xl">{look.title}</h2>
                <p className="text-secondary mt-2 text-sm">
                  {look.items.filter((item) => item.kind === "owned").length}{" "}
                  owned ·{" "}
                  {look.items.filter((item) => item.kind === "product").length}{" "}
                  suggested ·{" "}
                  {look.items.filter((item) => item.kind === "missing").length}{" "}
                  missing
                </p>
                <p className="text-secondary mt-1 text-xs">
                  Estimated additional spend: {formatSavedSpend(look)}
                </p>
              </div>
              <Link
                className={`${button} mt-auto w-full`}
                href={`/saved-looks/${look.id}`}
              >
                Open look
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="border-border bg-card rounded-xl border p-8">
          <h2 className="font-serif text-2xl">No saved looks yet.</h2>
          <p className="text-secondary mt-2">
            Choose an outfit recommendation and save it to see it here.
          </p>
          <Link className={`${button} mt-5`} href="/create">
            Create a look
          </Link>
        </div>
      )}
      {list.total > limit && (
        <nav aria-label="Saved looks pages" className="flex items-center gap-4">
          <span className="text-secondary text-sm">
            Page {currentPage} of {Math.ceil(list.total / limit)}
          </span>
          {currentPage > 1 && (
            <Link
              className={button}
              href={`/saved-looks?page=${currentPage - 1}`}
            >
              Previous
            </Link>
          )}
          {currentPage * limit < list.total && (
            <Link
              className={button}
              href={`/saved-looks?page=${currentPage + 1}`}
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}

export async function SavedLookDetail({
  savedLookId,
}: {
  savedLookId: string;
}) {
  let look: SavedLook;
  try {
    look = await getSavedLook(savedLookId);
  } catch (error) {
    return (
      <section className="mx-auto max-w-4xl space-y-5">
        <h1 className="font-serif text-4xl">Saved look unavailable</h1>
        <p role="alert" className="text-secondary">
          {loadError(error)}
        </p>
        <Link className={button} href="/saved-looks">
          Back to saved looks
        </Link>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-6xl space-y-7">
      <header>
        <Link
          href="/saved-looks"
          className="text-primary text-sm font-medium underline"
        >
          Saved looks
        </Link>
        <p className="text-primary mt-5 text-xs font-semibold tracking-wider uppercase">
          Saved decision
        </p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">{look.title}</h1>
        <p className="text-secondary mt-3">
          Saved{" "}
          {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
            new Date(look.created_at),
          )}
          . This snapshot keeps its original item choices.
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <div className="border-border bg-card rounded-xl border p-5">
          <PieceTiles items={look.items} />
          <h2 className="mt-6 font-serif text-2xl">Outfit pieces</h2>
          <ul className="divide-border mt-4 divide-y">
            {look.items.map((item, index) => (
              <li
                key={`${item.slot_id ?? item.name}-${index}`}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span>
                  <strong className="block text-sm">{item.name}</strong>
                  <small className="text-secondary">
                    {item.category}
                    {item.color ? ` / ${item.color}` : ""}
                  </small>
                </span>
                <span className="bg-background shrink-0 rounded-full px-3 py-1 text-xs">
                  {item.kind === "owned"
                    ? "Owned when saved"
                    : item.kind === "missing"
                      ? "Missing piece"
                      : "Suggested product"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="border-border bg-card space-y-4 rounded-xl border p-6">
          <h2 className="font-serif text-2xl">Your decision</h2>
          <p className="text-secondary text-sm leading-6">
            {look.rationale ||
              "The selected combination is saved with these exact pieces."}
          </p>
          <p className="text-sm">
            Estimated additional spend:{" "}
            <strong>{formatSavedSpend(look)}</strong>
          </p>
          <p className="text-secondary text-xs">
            Suggested products are not wardrobe items.
          </p>
          <Link
            className={`${button} w-full`}
            href={`/saved-looks/${look.id}/share`}
          >
            Share this look
          </Link>
          {look.source_type !== "sample" &&
          look.items.length > 0 &&
          look.items.every((item) => item.kind === "owned") ? (
            <Link
              className={`${button} w-full`}
              href={`/looks/${look.id}/preview`}
            >
              Preview owned look
            </Link>
          ) : null}
          {look.look_id && (
            <Link
              className={`${button} w-full`}
              href={`/looks/${look.look_id}`}
            >
              Open current look
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}
