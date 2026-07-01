import Link from "next/link";
import { ContactSellerActions } from "@/components/contact-seller-actions";
import { SaveListingButton } from "@/components/save-listing-button";
import { MessageSellerButton } from "@/components/message-seller-button";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import { formatPostedDate } from "@/lib/format-date";
import type { Listing } from "@/lib/listings";
import { getListing } from "@/lib/supabase/listings";

const badgeStyles: Record<Listing["type"], string> = {
  Free: "border border-campus-border bg-campus-card text-campus-ink",
  "For Sale": "bg-campus-gold text-campus-ink",
  Wanted: "bg-slate-50 text-campus-green"
};

export const dynamic = "force-dynamic";

type ListingDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ListingDetailsPage({ params }: ListingDetailsPageProps) {
  const { id } = await params;
  let listing: Listing | null = null;

  try {
    listing = await getListing(id);
  } catch {
    listing = null;
  }

  if (!listing) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[20px] border border-campus-border bg-campus-card p-6 shadow-soft">
          <p className="text-sm font-semibold text-campus-coral">Listing not found</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            This DormDrop listing is not available
          </h1>
          <p className="mt-3 text-sm leading-6 text-campus-muted">
            It may have been removed or the link may be incorrect.
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover"
            href="/browse"
          >
            Back to browse
          </Link>
        </section>
      </main>
    );
  }

  const badgeClass = badgeStyles[listing.type] ?? badgeStyles["For Sale"];
  const postedDate = formatPostedDate(listing.createdAt);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <Link className="text-sm font-semibold text-campus-green" href="/browse">
        Back to browse
      </Link>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <ListingImageGallery category={listing.type} images={listing.images} title={listing.title} />

        <div className="space-y-4 sm:space-y-5">
          <div className="rounded-[20px] border border-campus-border bg-campus-card p-4 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-[14px] px-3 py-1 text-xs font-bold ${badgeClass}`}>
                    {listing.type}
                  </span>
                  {listing.sold ? (
                    <span className="inline-flex rounded-[14px] bg-campus-successBg px-3 py-1 text-xs font-bold text-campus-success">
                      Sold
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl">
                  {listing.title}
                </h1>
              </div>
              <div className="sm:text-right">
                <p className="text-2xl font-black text-campus-ink sm:text-3xl">{listing.price}</p>
                <p className="mt-1 text-xs font-semibold text-campus-muted">
                  {postedDate}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-campus-green">
              {listing.campus}
            </p>
            <p className="mt-3 text-sm leading-7 text-campus-muted sm:text-base">
              {listing.description}
            </p>
            <SaveListingButton listingId={listing.id} />
            <MessageSellerButton
              listingId={listing.id}
              listingTitle={listing.title}
              sellerId={listing.ownerId}
            />
          </div>

          <div className="rounded-[20px] border border-campus-border bg-campus-card p-4 shadow-soft sm:p-6">
            <p className="text-sm font-semibold text-campus-green">Seller information</p>
            <div className="mt-4 flex items-start gap-3 sm:items-center sm:gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-slate-50 text-lg font-black text-campus-green sm:size-14">
                {listing.seller.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <div>
                <h2 className="font-bold tracking-tight">{listing.seller.name}</h2>
                <p className="mt-1 text-sm text-campus-muted">
                  {listing.seller.year} / {listing.seller.dorm}
                </p>
                {listing.seller.email ? (
                  <p className="mt-1 break-all text-sm font-semibold text-campus-ink">
                    {listing.seller.email}
                  </p>
                ) : null}
              </div>
            </div>
            <ContactSellerActions email={listing.seller.email} title={listing.title} />
          </div>
        </div>
      </section>
    </main>
  );
}
