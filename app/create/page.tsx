import { CreateListingForm } from "@/components/create-listing-form";
import { PageHeader } from "@/components/ui";

export default function CreateListingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <PageHeader
        lead="Add photos and a few details. You can edit or remove the listing at any time."
        title="Post a dorm item"
      />
      <CreateListingForm />
    </main>
  );
}
