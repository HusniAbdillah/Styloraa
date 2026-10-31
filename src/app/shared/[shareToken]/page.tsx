import { notFound } from "next/navigation";
import { BackendError } from "@/features/decisions/backend";
import { readPublicShare } from "@/features/sharing/repository";

export const dynamic = "force-dynamic";

export default async function SharedPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  let share: Awaited<ReturnType<typeof readPublicShare>>;
  try {
    share = await readPublicShare(shareToken);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="bg-background text-foreground min-h-screen px-5 py-12 sm:px-8 md:py-20">
      <article className="mx-auto max-w-3xl">
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">
          A shared Stylora look
        </p>
        <h1 className="mt-4 font-serif text-4xl md:text-6xl">
          {share.public_snapshot.title}
        </h1>
        {share.public_snapshot.source_type === "sample" && (
          <p className="text-secondary mt-2 text-xs">Demo sample</p>
        )}
        {share.catchphrase && (
          <p className="text-secondary mt-5 max-w-2xl text-lg leading-relaxed">
            {share.catchphrase}
          </p>
        )}
        <section
          className="border-border bg-card mt-10 rounded-xl border p-5 sm:p-8"
          aria-label="Outfit pieces"
        >
          <h2 className="font-serif text-2xl">The outfit</h2>
          <ul className="divide-border mt-5 divide-y">
            {share.public_snapshot.items.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <strong className="block text-sm font-medium">
                    {item.name}
                  </strong>
                  <span className="text-secondary text-xs">
                    {item.category}
                    {item.color ? ` / ${item.color}` : ""}
                  </span>
                </div>
                <span className="bg-background rounded-full px-3 py-1 text-xs">
                  {item.kind === "owned"
                    ? "Owned when saved"
                    : item.kind === "missing"
                      ? "Missing piece"
                      : "Suggested product"}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-secondary mt-6 text-xs">
          A limited outfit snapshot. Product suggestions do not imply ownership.
        </p>
      </article>
    </main>
  );
}
