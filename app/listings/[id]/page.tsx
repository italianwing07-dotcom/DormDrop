import Link from "next/link";
import { ArrowLeft, Student } from "@phosphor-icons/react/dist/ssr";
import { ContactSellerActions } from "@/components/contact-seller-actions";
import { SaveListingButton } from "@/components/save-listing-button";
import { MessageSellerButton } from "@/components/message-seller-button";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import { ReportListingButton } from "@/components/report-listing-button";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { formatPostedDate } from "@/lib/format-date";
import type { Listing } from "@/lib/listings";
import { getListing } from "@/lib/supabase/listings";

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
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          action={<ButtonLink href="/browse">Back to browse</ButtonLink>}
          body="This item was removed by its owner or the link is incorrect. Other items are still available."
          title="This listing is no longer available"
        />
      </main>
    );
  }

  const postedDate = formatPostedDate(listing.createdAt);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        className="inline-flex items-center gap-1.5 text-sm font-medium text-campus-muted transition hover:text-campus-ink"
        href="/browse"
      >
        <ArrowLeft size={16} />
        Back to browse
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <ListingImageGallery category={listing.type} images={listing.images} title={listing.title} />

        <div className="space-y-4 lg:sticky lg:top-24">
          <Card className="space-y-5 p-5 sm:p-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {listing.type === "Free" ? <Badge tone="brand">Free</Badge> : null}
                {listing.type === "Wanted" ? <Badge tone="neutral">Wanted</Badge> : null}
                {listing.sold ? <Badge tone="solid">Sold</Badge> : null}
                <span className="text-xs text-campus-subtle">
                  {listing.campus} · {postedDate}
                </span>
              </div>

              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-campus-ink sm:text-3xl">
                {listing.title}
              </h1>

              {listing.price ? (
                <p className="tabular text-3xl font-semibold text-campus-ink">{listing.price}</p>
              ) : null}
            </div>

            {listing.sold ? (
              <p className="rounded-ctl bg-campus-surface px-4 py-3 text-sm text-campus-muted">
                The owner marked this as sold. You can still message them to ask if it is available again.
              </p>
            ) : null}

            <p className="whitespace-pre-line text-[15px] leading-relaxed text-campus-muted">
              {listing.description}
            </p>

            <div className="space-y-3 border-t border-campus-border pt-5">
              <MessageSellerButton
                listingId={listing.id}
                listingTitle={listing.title}
                sellerId={listing.ownerId}
              />
              <SaveListingButton listingId={listing.id} listingTitle={listing.title} />
            </div>
          </Card>

          <Card className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-campus-soft text-campus-brand">
                <Student aria-hidden size={20} weight="duotone" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-campus-ink">Student at {listing.seller.dorm}</h2>
                <p className="text-xs text-campus-muted">Signed up with a verified school email</p>
              </div>
            </div>
            <ContactSellerActions listingId={listing.id} title={listing.title} />
            <ReportListingButton listingId={listing.id} />
          </Card>
        </div>
      </div>
    </main>
  );
}
