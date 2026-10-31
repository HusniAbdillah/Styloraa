import Link from "next/link";
import { getSavedLook } from "@/features/decisions/repository";
import { ShareControls } from "@/features/sharing/components/share-controls";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ savedLookId: string }>;
}) {
  const { savedLookId } = await params;
  let look: Awaited<ReturnType<typeof getSavedLook>>;
  try {
    look = await getSavedLook(savedLookId);
  } catch {
    return (
      <section className="mx-auto max-w-3xl space-y-5">
        <h1 className="font-serif text-4xl">This saved look is unavailable.</h1>
        <Link className="text-primary underline" href="/saved-looks">
          Back to saved looks
        </Link>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-6xl space-y-7">
      <header>
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">
          Saved look / share
        </p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">
          Share the outfit, keep it personal.
        </h1>
        <p className="text-secondary mt-3 max-w-2xl">
          Review the public snapshot before making a revocable link. This shared
          demo is editable by every visitor.
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
        <article className="border-border bg-card rounded-xl border p-6">
          <h2 className="font-serif text-2xl">{look.title}</h2>
          <p className="text-secondary mt-2 text-sm">
            Public snapshot includes only the outfit title, piece names,
            categories, colors, kinds and your catchphrase.
          </p>
          <ul className="divide-border mt-5 divide-y">
            {look.items.map((item, index) => (
              <li
                key={`${item.slot_id ?? item.name}-${index}`}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span>
                  {item.name} · {item.category}
                </span>
                <span className="text-secondary shrink-0">
                  {item.kind === "owned"
                    ? "Owned"
                    : item.kind === "missing"
                      ? "Missing"
                      : "Suggested"}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-secondary mt-4 text-xs">
            No private images, product URLs, profile details or full wardrobe
            are included.
          </p>
        </article>
        <ShareControls savedLookId={look.id} />
      </div>
    </section>
  );
}
