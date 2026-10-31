import { SavedLookDetail } from "@/features/sharing/components/saved-looks-screen";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ savedLookId: string }>;
}) {
  const { savedLookId } = await params;
  return <SavedLookDetail savedLookId={savedLookId} />;
}
