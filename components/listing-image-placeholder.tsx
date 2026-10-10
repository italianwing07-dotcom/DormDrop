import { Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";
import type { Listing } from "@/lib/listings";

export function isPlaceholderImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return true;
  }

  return imageUrl.startsWith("/listings/") || imageUrl.endsWith(".svg");
}

// Deliberately plain: a listing with no photo should read as "no photo yet",
// never as a real seller image. Title and category already appear on the card.
export function ListingImagePlaceholder({
  className = ""
}: {
  title?: string;
  category?: Listing["type"] | string;
  className?: string;
}) {
  return (
    <div
      className={
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-campus-surface text-campus-subtle " +
        className
      }
    >
      <ImageIcon aria-hidden size={26} weight="light" />
      <p className="text-xs font-medium">No photo</p>
    </div>
  );
}
