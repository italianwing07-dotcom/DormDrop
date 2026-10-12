import Image from "next/image";
import Link from "next/link";
import { ListingImagePlaceholder, isPlaceholderImageUrl } from "@/components/listing-image-placeholder";
import { SaveListingButton } from "@/components/save-listing-button";
import { Badge } from "@/components/ui";
import { formatPostedDate } from "@/lib/format-date";
import type { Listing } from "@/lib/listings";

export function ListingCard({ listing }: { listing: Listing }) {
  const postedDate = formatPostedDate(listing.createdAt);
  const coverImageUrl = listing.image;
  const hasUploadedImage = !isPlaceholderImageUrl(coverImageUrl);
  const isRemoteImage = coverImageUrl.startsWith("http");

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-campus-border bg-campus-card shadow-card transition duration-200 hover:border-campus-borderStrong hover:shadow-pop">
      <div className="relative aspect-[4/3] overflow-hidden bg-campus-surface">
        {hasUploadedImage ? (
          <Image
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            height={620}
            unoptimized={isRemoteImage}
            src={coverImageUrl}
            width={760}
          />
        ) : (
          <ListingImagePlaceholder category={listing.type} title={listing.title} />
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-wrap gap-1.5">
            {listing.type === "Free" ? <Badge tone="brand">Free</Badge> : null}
            {listing.type === "Wanted" ? <Badge tone="neutral">Wanted</Badge> : null}
            {listing.sold ? <Badge tone="solid">Sold</Badge> : null}
          </div>
          <SaveListingButton listingId={listing.id} listingTitle={listing.title} variant="icon" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-campus-ink sm:text-[15px]">
            {/* The whole card is the link; the overlay keeps the save button clickable. */}
            <Link className="after:absolute after:inset-0" href={"/listings/" + listing.id}>
              {listing.title}
            </Link>
          </h3>
          {listing.price ? (
            <p className="tabular shrink-0 text-sm font-semibold text-campus-ink sm:text-base">{listing.price}</p>
          ) : null}
        </div>

        <p className="line-clamp-2 hidden text-sm leading-relaxed text-campus-muted sm:block">{listing.description}</p>

        <p className="mt-auto pt-1.5 text-[11px] text-campus-subtle sm:pt-2 sm:text-xs">
          {listing.campus} · {postedDate}
        </p>
      </div>
    </article>
  );
}
