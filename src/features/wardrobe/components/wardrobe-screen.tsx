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
          Koleksi demo bersama sebagai awal setiap kombinasi.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {items.length ? (
            items.map((item) => (
              <article
                key={item.id}
                className="border-border bg-card rounded-2xl border p-6"
              >
                <p className="text-secondary text-xs uppercase">
                  {item.category}
                </p>
                <h2 className="mt-4 font-serif text-2xl">{item.name}</h2>
                <p className="text-secondary mt-2 text-sm">{item.color}</p>
              </article>
            ))
          ) : (
            <div className="border-border rounded-2xl border border-dashed p-8 sm:col-span-2">
              <h2 className="font-serif text-2xl">Ruang untuk pilihan Anda.</h2>
              <p className="text-secondary mt-3 text-sm">
                {configured
                  ? "Belum ada item. Tambahkan item pertama untuk mulai menyusun look."
                  : "Database belum terhubung. Ini empty state boilerplate, belum ada item tersimpan."}
              </p>
            </div>
          )}
        </div>
        <WardrobeForm enabled={enabled} />
      </div>
    </section>
  );
}
