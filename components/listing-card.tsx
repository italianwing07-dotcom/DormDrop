import Image from "next/image";
import Link from "next/link";
import { formatPostedDate } from "@/lib/format-date";
import type { Listing } from "@/lib/listings";

const badgeStyles: Record<Listing["type"], string> = {
  Free: "bg-campus-green text-white",
  "For Sale": "bg-campus-gold text-campus-ink",
  Wanted: "bg-campus-coral text-white"
};

export function ListingCard({ listing }: { listing: Listing }) {
  const badgeClass = badgeStyles[listing.type] ?? badgeStyles["For Sale"];
  const postedDate = formatPostedDate(listing.createdAt);
  const coverImageUrl = listing.image;
  const isRemoteImage = coverImageUrl.startsWith("http");

  return (
    <article className="group overflow-hidden rounded-3xl border border-campus-ink/10 bg-white shadow-soft transition duration-200 hover:-translate-y-1 hover:border-campus-green/30 hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden bg-campus-mint">
        <Image
          alt={listing.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          height={480}
          unoptimized={isRemoteImage}
          src={coverImageUrl}
          width={640}
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold tracking-tight">{listing.title}</h3>
            <p className="mt-1 text-sm text-campus-ink/60">{listing.campus}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>
              {listing.type}
            </span>
            {listing.sold ? (
              <span className="rounded-full bg-campus-ink px-3 py-1 text-xs font-bold text-white">
                Sold
              </span>
            ) : null}
          </div>
        </div>
        <p className="text-sm leading-6 text-campus-ink/70">{listing.description}</p>
        <div className="flex items-end justify-between gap-3 border-t border-campus-ink/10 pt-3">
          <div>
            <p className="text-lg font-black text-campus-ink">{listing.price}</p>
            <p className="mt-1 text-xs font-semibold text-campus-ink/50">{postedDate}</p>
          </div>
          <Link
            className="shrink-0 rounded-full bg-campus-paper px-4 py-2 text-sm font-semibold text-campus-ink transition hover:bg-campus-mint"
            href={`/listings/${listing.id}`}
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
