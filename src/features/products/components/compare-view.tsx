import Link from "next/link";
import { notFound } from "next/navigation";
import { compareProducts } from "@/features/products/repository";
import { ComparePanel } from "./compare-panel";

export async function CompareView({
  lookId,
  optionId,
}: {
  lookId: string;
  optionId?: string;
}) {
  if (!optionId) notFound();
  const comparison = await compareProducts(lookId, optionId);
  return (
    <div className="mx-auto max-w-6xl pb-12">
      <nav aria-label="Breadcrumb" className="text-secondary mb-7 text-sm">
        <Link
          href={`/looks/${lookId}?option_id=${optionId}`}
          className="hover:text-primary"
        >
          Selected outfit
        </Link>
        <span className="mx-2">/</span>Compare products
      </nav>
      <ComparePanel comparison={comparison} />
    </div>
  );
}
