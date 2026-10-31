import Image from "next/image";
import Link from "next/link";
import type { DemoWardrobeEntry } from "../demo-wardrobe";
import { StaticWardrobeControls } from "./static-wardrobe-controls";

export function StaticWardrobePreview({
  item,
  savedItem,
}: {
  item: DemoWardrobeEntry;
  savedItem?: {
    name: string;
    category: DemoWardrobeEntry["category"];
    color: string;
    subcategory: string | null;
    notes: string;
  } | null;
}) {
  const displayItem = savedItem
    ? { ...item, ...savedItem, subcategory: savedItem.subcategory ?? "" }
    : item;
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/wardrobe"
        className="text-primary inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        Back to wardrobe
      </Link>
      <article className="border-border bg-card grid overflow-hidden rounded-2xl border md:grid-cols-2">
        <Image
          src={item.image}
          alt={displayItem.name}
          width={960}
          height={960}
          className="bg-background h-full max-h-[38rem] min-h-80 w-full object-contain p-6"
        />
        <div className="flex flex-col items-start justify-center p-6 sm:p-10">
          <p className="text-secondary text-xs tracking-wider uppercase">
            {displayItem.category}
            {displayItem.subcategory ? ` · ${displayItem.subcategory}` : ""}
          </p>
          <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
            {displayItem.name}
          </h1>
          <p className="text-secondary mt-2">{displayItem.color}</p>
          {displayItem.notes && (
            <p className="text-secondary mt-5 text-sm whitespace-pre-wrap">
              {displayItem.notes}
            </p>
          )}
          <StaticWardrobeControls item={displayItem} />
        </div>
      </article>
    </main>
  );
}
