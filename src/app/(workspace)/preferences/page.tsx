import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import { PreferencesForm } from "@/features/preferences/components/preferences-form";
import { getPreferences } from "@/features/preferences/repository";
import { preferencesSchema } from "@/features/preferences/schema";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const configured = isDatabaseConfigured();
  const stored = configured
    ? await getPreferences()
    : { style_dna: {}, fit_preferences: {}, body_profile: {} };
  const validated = preferencesSchema.safeParse(stored);
  const initialValue = validated.success
    ? validated.data
    : preferencesSchema.parse({});
  const enabled = configured && getServerEnv().DEMO_WRITES_ENABLED === "true";

  return (
    <section className="max-w-4xl space-y-8">
      <div>
        <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
          Shared demo preferences
        </p>
        <h1 className="font-serif text-4xl md:text-5xl">Style preferences</h1>
        <p className="text-secondary mt-4 max-w-2xl leading-7">
          These optional references are shared with everyone using the demo.
          Choose only what is useful, and clear any choice whenever you like.
          Body and skin references are self-selected and are never inferred from
          photos.
        </p>
      </div>
      <PreferencesForm initialValue={initialValue} enabled={enabled} />
    </section>
  );
}
