import { LookStudio } from "@/features/inspiration/components/look-studio";

export default async function LookPage({
  params,
  searchParams,
}: {
  params: Promise<{ lookId: string }>;
  searchParams: Promise<{ option_id?: string }>;
}) {
  const [{ lookId }, query] = await Promise.all([params, searchParams]);
  return <LookStudio lookId={lookId} selectedOptionId={query.option_id ?? null} />;
}
