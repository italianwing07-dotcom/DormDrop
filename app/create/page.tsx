import { CreateListingForm } from "@/components/create-listing-form";

export default function CreateListingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="space-y-6">
        <div className="rounded-[20px] border border-campus-border bg-campus-card p-5 shadow-soft sm:p-6">
          <p className="text-sm font-semibold text-campus-green">Create listing</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            Post a dorm item
          </h1>
          <p className="mt-2 text-sm leading-6 text-campus-muted">
            Add the item details. DormDrop will save this listing to Supabase.
          </p>
        </div>

        <CreateListingForm />
      </section>
    </main>
  );
}
