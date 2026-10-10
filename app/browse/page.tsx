import { BrowseListings } from "@/components/browse-listings";
import { ButtonLink, PageHeader } from "@/components/ui";
import { getListings } from "@/lib/supabase/listings";

export const dynamic = "force-dynamic";

type BrowsePageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const listings = await getListings();
  const resolvedSearchParams = await searchParams;
  const initialSearchTerm = resolvedSearchParams?.q ?? "";
  const requestedCategory = resolvedSearchParams?.category ?? "";
  const initialCategory = (["Free", "For Sale", "Wanted"] as const).find(
    (category) => category === requestedCategory
  );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        actions={<ButtonLink href="/create">Post an item</ButtonLink>}
        lead="Items from students at Rose Hill and Lincoln Center. Sold items are hidden unless you ask for them."
        title="Browse"
      />
      <BrowseListings
        initialCategory={initialCategory ?? "All"}
        initialSearchTerm={initialSearchTerm}
        listings={listings}
      />
    </main>
  );
}
