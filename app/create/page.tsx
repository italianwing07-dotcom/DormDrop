import { CreateListingForm } from "@/components/create-listing-form";

export default function CreateListingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-campus-green">Create listing</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Post a dorm item
          </h1>
          <p className="text-sm leading-6 text-campus-ink/70">
            Add the item details. DormDrop will save this listing to Supabase.
          </p>
        </div>

        <CreateListingForm />
      </section>
    </main>
  );
}
