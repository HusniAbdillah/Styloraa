import { SavedLooksScreen } from "@/features/sharing/components/saved-looks-screen";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return <SavedLooksScreen page={page} />;
}
