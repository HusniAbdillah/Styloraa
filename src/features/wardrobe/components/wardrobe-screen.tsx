import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { listWardrobeItems } from "../repository";
import { WardrobeForm } from "./wardrobe-form";
export async function WardrobeScreen() {
  const configured = isDatabaseConfigured();
  const items = configured ? await listWardrobeItems() : [];
  const enabled = configured && getServerEnv().DEMO_WRITES_ENABLED === "true";
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
          The shared demo collection behind every combination.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {items.length ? (
            items.map((item) => (
              <article
                key={item.id}
                className="border-border bg-card rounded-2xl border p-6 transition-[border-color,box-shadow] duration-200 ease-out hover:border-primary/40 hover:shadow-xs"
              >
                <p className="text-secondary text-xs uppercase tracking-wider">
                  {item.category}
                </p>
                <h2 className="mt-4 font-serif text-2xl tracking-tight">{item.name}</h2>
                <p className="text-secondary mt-2 text-sm">{item.color}</p>
              </article>
            ))
          ) : (
            <div className="border-border rounded-2xl border border-dashed p-8 sm:col-span-2">
              <h2 className="font-serif text-2xl">Room for your picks.</h2>
              <p className="text-secondary mt-3 text-sm">
                {configured
                  ? "No items yet. Add the first item to start composing looks."
                  : "Database not connected. This is the boilerplate empty state; no items are stored yet."}
              </p>
            </div>
          )}
        </div>
        <WardrobeForm enabled={enabled} />
      </div>
    </section>
  );
}
