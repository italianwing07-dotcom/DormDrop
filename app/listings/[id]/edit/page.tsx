"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { ListingCategory, ListingRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

const campusOptions = [
  "North Quad",
  "West Hall",
  "East Campus",
  "South Village",
  "Baker House",
  "Main Library"
];

const categoryOptions: ListingCategory[] = ["Free", "For Sale", "Wanted"];

function getSafeFileName(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const baseName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

  return `${baseName || "listing-image"}.${extension}`;
}

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = params.id;
  const [user, setUser] = useState<User | null>(null);
  const [listing, setListing] = useState<ListingRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadListing() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user: currentUser },
          error: userError
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        setUser(currentUser);

        if (!currentUser) {
          return;
        }

        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("id", listingId)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setListing(data);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load this listing."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadListing();
  }, [listingId]);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSelectedImage(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !listing) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const category = formData.get("category") as ListingCategory;
    let imageUrl = listing.image_url;

    setError(null);
    setIsSaving(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const imageFile = formData.get("image");

      if (imageFile instanceof File && imageFile.size > 0) {
        const filePath = `${user.id}/${crypto.randomUUID()}-${getSafeFileName(imageFile)}`;
        setIsUploadingImage(true);

        try {
          const { error: uploadError } = await supabase.storage
            .from("listing-images")
            .upload(filePath, imageFile, {
              cacheControl: "3600",
              upsert: false
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data } = supabase.storage
            .from("listing-images")
            .getPublicUrl(filePath);

          imageUrl = data.publicUrl;
        } finally {
          setIsUploadingImage(false);
        }
      }

      const payload = {
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        price: String(formData.get("price") ?? "").trim(),
        category,
        campus: String(formData.get("campus") ?? ""),
        image_url: imageUrl,
        seller_email: user.email ?? listing.seller_email
      };

      const { error: updateError } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", listing.id)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      router.push(`/listings/${listing.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save this listing."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-5 rounded-3xl border border-campus-ink/10 bg-white p-5 shadow-soft sm:p-6">
          <div className="h-8 w-48 rounded-full bg-campus-mint" />
          <div className="h-44 rounded-3xl bg-campus-mint" />
          <div className="h-12 rounded-2xl bg-campus-mint" />
          <div className="h-32 rounded-2xl bg-campus-mint" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-campus-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-campus-coral">Login required</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Sign in to edit this listing</h1>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
            href="/login"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-campus-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-campus-coral">Listing unavailable</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">You cannot edit this listing</h1>
          <p className="mt-3 text-sm leading-6 text-campus-ink/70">
            {error ?? "Only the owner can access this edit page."}
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
            href="/profile"
          >
            Back to profile
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-campus-green">Edit listing</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Update your dorm item
          </h1>
          <p className="text-sm leading-6 text-campus-ink/70">
            Changes will be saved to your DormDrop listing.
          </p>
        </div>

        <form
          className="space-y-5 rounded-3xl border border-campus-ink/10 bg-white p-5 shadow-soft sm:p-6"
          onSubmit={handleSubmit}
        >
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-campus-ink/15 bg-campus-paper p-6 text-center transition hover:border-campus-green hover:bg-campus-mint/60">
            <span className="text-sm font-bold text-campus-ink">Listing image</span>
            <span className="mt-2 max-w-sm text-sm leading-6 text-campus-ink/60">
              Upload a new photo, or keep the current image.
            </span>
            <img
              alt="Current listing preview"
              className="mt-4 aspect-[4/3] w-full max-w-xs rounded-2xl object-cover"
              src={previewUrl ?? listing.image_url}
            />
            {selectedImage ? (
              <span className="mt-3 text-sm font-semibold text-campus-green">
                Selected: {selectedImage.name}
              </span>
            ) : null}
            {isUploadingImage ? (
              <span className="mt-3 text-sm font-semibold text-campus-green">
                Uploading image...
              </span>
            ) : null}
            <input
              accept="image/*"
              className="sr-only"
              name="image"
              onChange={handleImageChange}
              type="file"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Listing title</span>
              <input
                className="min-h-12 w-full rounded-2xl border border-campus-ink/15 px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
                defaultValue={listing.title}
                name="title"
                required
                type="text"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Campus</span>
              <select
                className="min-h-12 w-full rounded-2xl border border-campus-ink/15 bg-white px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
                defaultValue={listing.campus}
                name="campus"
                required
              >
                {campusOptions.map((campus) => (
                  <option key={campus}>{campus}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Category</span>
              <select
                className="min-h-12 w-full rounded-2xl border border-campus-ink/15 bg-white px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
                defaultValue={listing.category}
                name="category"
                required
              >
                {categoryOptions.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Price</span>
              <input
                className="min-h-12 w-full rounded-2xl border border-campus-ink/15 px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
                defaultValue={listing.price}
                name="price"
                required
                type="text"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Description</span>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-campus-ink/15 px-4 py-3 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
              defaultValue={listing.description}
              name="description"
              required
            />
          </label>

          {error ? (
            <div className="rounded-2xl bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="min-h-12 rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving changes..." : "Save changes"}
            </button>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-campus-paper px-6 text-sm font-semibold text-campus-ink transition hover:bg-campus-mint"
              href={`/listings/${listing.id}`}
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
