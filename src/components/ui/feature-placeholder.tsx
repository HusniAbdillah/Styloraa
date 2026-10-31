export function FeaturePlaceholder({
  title,
  description,
  owner,
}: {
  title: string;
  description: string;
  owner: string;
}) {
  return (
    <section className="max-w-3xl space-y-5">
      <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
        Stylora studio
      </p>
      <h1 className="font-serif text-4xl md:text-5xl">{title}</h1>
      <p className="text-secondary max-w-xl leading-7">{description}</p>
      <div className="border-border bg-card rounded-2xl border p-6">
        <span className="bg-background rounded-full px-3 py-1 text-xs">
          Belum diimplementasikan
        </span>
        <p className="text-secondary mt-4 text-sm">
          Area ini siap dikembangkan oleh {owner}. Data dan hasil AI belum
          tersedia.
        </p>
      </div>
    </section>
  );
}
