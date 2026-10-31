import { isDatabaseConfigured, getServerEnv } from "@/lib/env";
import { getProfile } from "@/features/profile/repository";
import { ProfileNameForm } from "@/features/profile/components/profile-name-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const configured = isDatabaseConfigured();
  const profile = configured ? await getProfile() : { display_name: null };
  const enabled = configured && getServerEnv().DEMO_WRITES_ENABLED === "true";

  return (
    <section className="max-w-3xl space-y-8">
      <div>
        <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
          Shared demo workspace
        </p>
        <h1 className="font-serif text-4xl md:text-5xl">Profile</h1>
        <p className="text-secondary mt-4">
          Set the display name used for this shared Stylora workspace. It is not
          a personal account or a private profile.
        </p>
      </div>
      <ProfileNameForm initialName={profile.display_name} enabled={enabled} />
    </section>
  );
}
