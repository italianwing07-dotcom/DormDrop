import Image from "next/image";
import Link from "next/link";
import { ListingImagePlaceholder, isPlaceholderImageUrl } from "@/components/listing-image-placeholder";
import { SaveListingButton } from "@/components/save-listing-button";
import { formatPostedDate } from "@/lib/format-date";
import type { Listing } from "@/lib/listings";

const badgeStyles: Record<Listing["type"], string> = {
  Free: "border border-campus-border bg-campus-card text-campus-ink",
  "For Sale": "bg-campus-gold text-campus-ink",
  Wanted: "bg-slate-50 text-campus-green"
};

export function ListingCard({ listing }: { listing: Listing }) {
  const badgeClass = badgeStyles[listing.type] ?? badgeStyles["For Sale"];
  const postedDate = formatPostedDate(listing.createdAt);
  const coverImageUrl = listing.image;
  const hasUploadedImage = !isPlaceholderImageUrl(coverImageUrl);
  const isRemoteImage = coverImageUrl.startsWith("http");

  return (
    <article className="group overflow-hidden rounded-[20px] border border-campus-border bg-campus-card shadow-sm ring-1 ring-campus-ink/5 transition duration-300 hover:-translate-y-1.5 hover:border-campus-green/30 hover:shadow-premium hover:ring-campus-green/10">
      <div className="relative aspect-[5/4] overflow-hidden bg-campus-surface sm:aspect-[4/3]">
        {hasUploadedImage ? (
          <Image
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
            height={620}
            unoptimized={isRemoteImage}
            src={coverImageUrl}
            width={760}
          />
        ) : (
          <ListingImagePlaceholder category={listing.type} title={listing.title} />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <div className="flex flex-wrap gap-2">
            <span className={"rounded-[14px] px-3 py-1 text-xs font-black shadow-sm " + badgeClass}>
              {listing.type}
            </span>
            {listing.sold ? (
              <span className="rounded-[14px] bg-campus-successBg px-3 py-1 text-xs font-black text-campus-success shadow-sm">
                Sold
              </span>
            ) : null}
          </div>
          <SaveListingButton listingId={listing.id} variant="icon" />
        </div>
        <div className="absolute bottom-3 left-3 rounded-[14px] bg-campus-card/95 px-3 py-1.5 text-xs font-black text-campus-ink shadow-sm backdrop-blur">
          {listing.campus}
        </div>
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-base font-black tracking-tight text-campus-ink sm:text-lg">
              {listing.title}
            </h3>
            <p className="shrink-0 text-xl font-black tracking-tight text-campus-ink sm:text-2xl">
              {listing.price}
            </p>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-campus-muted">
            {listing.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-campus-border pt-3">
          <p className="text-xs font-bold text-campus-muted">
            {postedDate === "Posted today" ? "Recently posted" : postedDate}
          </p>
          <Link
            className="flex min-h-10 shrink-0 items-center rounded-[14px] bg-campus-green px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-campus-hover hover:shadow-md active:scale-[0.98]"
            href={"/listings/" + listing.id}
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
