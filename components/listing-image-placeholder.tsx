import type { Listing } from "@/lib/listings";

export function isPlaceholderImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return true;
  }

  return imageUrl.startsWith("/listings/") || imageUrl.endsWith(".svg");
}

function getInitial(title: string) {
  return title.trim().charAt(0).toUpperCase() || "D";
}

function getCategoryIcon(category?: Listing["type"] | string) {
  if (category === "Free") {
    return "$0";
  }

  if (category === "Wanted") {
    return "?";
  }

  return "$";
}

export function ListingImagePlaceholder({
  title,
  category,
  className = ""
}: {
  title: string;
  category?: Listing["type"] | string;
  className?: string;
}) {
  return (
    <div
      className={
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(30,64,175,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(23,37,84,0.10),transparent_28%),linear-gradient(145deg,#FFFFFF_0%,#F8FAFC_44%,#E5E7EB_100%)] p-5 " +
        className
      }
    >
      <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(31,41,55,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(31,41,55,0.045)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -bottom-10 -right-10 size-36 rounded-full bg-campus-dark/10 blur-2xl" />
      <div className="absolute -left-8 top-10 size-28 rounded-full bg-campus-green/10 blur-2xl" />

      <div className="relative flex w-full max-w-64 flex-col items-center text-center">
        <div className="flex size-20 items-center justify-center rounded-full border border-white/90 bg-white/85 text-4xl font-black tracking-tight text-campus-dark shadow-[0_16px_42px_rgba(31,41,55,0.14)] backdrop-blur sm:size-24 sm:text-5xl">
          {getInitial(title)}
        </div>
        <div className="mt-3 flex size-9 items-center justify-center rounded-[14px] border border-white/90 bg-white/80 text-sm font-black text-campus-green shadow-sm backdrop-blur">
          {getCategoryIcon(category)}
        </div>
        <p className="mt-3 line-clamp-1 max-w-full rounded-[14px] bg-white/65 px-3 py-1.5 text-xs font-black text-campus-ink shadow-sm backdrop-blur">
          {title}
        </p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-campus-muted">
          {category ?? "DormDrop"}
        </p>
      </div>
    </div>
  );
}
