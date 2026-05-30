import { ListingCardSkeleton } from "@/components/listing-card-skeleton";

export default function BrowseLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="space-y-5">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-full bg-campus-mint" />
          <div className="h-10 w-72 max-w-full rounded-full bg-campus-mint" />
          <div className="h-4 w-full max-w-xl rounded-full bg-campus-mint" />
        </div>
        <div className="h-12 rounded-2xl bg-white shadow-soft" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-11 w-24 shrink-0 rounded-full bg-white shadow-sm" key={index} />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
