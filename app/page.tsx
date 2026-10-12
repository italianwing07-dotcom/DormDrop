import Image from "next/image";
import { ChatCircle, ShieldCheck, Tag } from "@phosphor-icons/react/dist/ssr";
import { CategoryButtons } from "@/components/category-buttons";
import { ListingCard } from "@/components/listing-card";
import { isPlaceholderImageUrl } from "@/components/listing-image-placeholder";
import { ButtonLink, EmptyState } from "@/components/ui";
import { getListings } from "@/lib/supabase/listings";

export const dynamic = "force-dynamic";

const howItWorks = [
  {
    icon: Tag,
    title: "Post what you are done with",
    body: "Add a few photos, set a price or mark it free, and pick your campus."
  },
  {
    icon: ChatCircle,
    title: "Message without sharing your number",
    body: "Buyers reach you in DormLoot. You arrange pickup when it suits you."
  },
  {
    icon: ShieldCheck,
    title: "Meet somewhere public",
    body: "Trade in a lobby or lounge, check the item, and mark it sold when it goes."
  }
];

export default async function HomePage() {
  const listings = await getListings();
  const availableListings = listings.filter((listing) => !listing.sold);
  const newestListings = availableListings.slice(0, 6);
  const heroListing = availableListings.find((listing) => !isPlaceholderImageUrl(listing.image));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-campus-ink sm:text-5xl">
            Dorm stuff, passed
            <br />
            to the next student.
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-campus-muted">
            Buy, sell and give away dorm items with other students at Rose Hill and Lincoln Center.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/browse" size="lg">
              Browse items
            </ButtonLink>
            <ButtonLink href="/create" size="lg" variant="secondary">
              Post an item
            </ButtonLink>
          </div>
        </div>

        {heroListing ? (
          <div className="relative overflow-hidden rounded-card border border-campus-border bg-campus-surface shadow-card">
            <div className="aspect-[4/3]">
              <Image
                alt={heroListing.title}
                className="h-full w-full object-cover"
                height={900}
                src={heroListing.image}
                unoptimized={heroListing.image.startsWith("http")}
                width={1200}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-campus-ink/85 to-transparent p-4 pt-12">
              <p className="text-sm font-semibold text-white">{heroListing.title}</p>
              <p className="text-xs text-white/80">
                {heroListing.price ? `${heroListing.price} · ` : ""}
                {heroListing.campus}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-campus-ink">Start with what you need</h2>
        <CategoryButtons />
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-campus-ink">Recently posted</h2>
          <ButtonLink href="/browse" size="sm" variant="ghost">
            View all
          </ButtonLink>
        </div>

        {newestListings.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {newestListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            action={<ButtonLink href="/create">Post the first item</ButtonLink>}
            body="DormLoot is brand new on campus. The first few listings make it useful for everyone else."
            title="Nothing posted yet"
          />
        )}
      </section>

      <section className="border-t border-campus-border pt-8">
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-10">
          {howItWorks.map((step) => {
            const Icon = step.icon;
            return (
              <div className="flex gap-3" key={step.title}>
                <Icon aria-hidden className="mt-0.5 shrink-0 text-campus-brand" size={20} weight="duotone" />
                <div className="space-y-1">
                  <h3 className="text-[15px] font-semibold text-campus-ink">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-campus-muted">{step.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
