"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { campusOptions } from "@/lib/campuses";
import type { ListingCategory } from "@/lib/supabase/types";

const placeholderImages: Record<ListingCategory, string> = {
  Free: "/listings/dorm-chair.svg",
  "For Sale": "/listings/mini-fridge.svg",
  Wanted: "/listings/storage-bins.svg"
};

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

export function CreateListingForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }

        setUser(data.user);
      })
      .catch((caughtError) => {
        console.error("[DormDrop] Could not load browser auth user", caughtError);
        setUser(null);
      })
      .finally(() => {
        setIsCheckingUser(false);
      });
  }, []);

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
    const file = event.target.files?.[0] ?? null;
    setUploadError(null);
    setSelectedImage(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setUploadError(null);
    setIsSubmitting(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user: currentUser },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      const formData = new FormData(form);
      const category = formData.get("category") as ListingCategory;
      const imageFile = formData.get("image");
      let imageUrl = placeholderImages[category];

      if (imageFile instanceof File && imageFile.size > 0) {
        const filePath = `${currentUser.id}/${crypto.randomUUID()}-${getSafeFileName(imageFile)}`;
        setIsUploadingImage(true);
        try {
          const { error: uploadError } = await supabase.storage
            .from("listing-images")
            .upload(filePath, imageFile, {
              cacheControl: "3600",
              upsert: false
            });

          if (uploadError) {
            const uploadMessage = JSON.stringify(
              {
                message: uploadError.message,
                name: uploadError.name
              },
              null,
              2
            );

            console.error("[DormDrop] Supabase Storage upload failed", uploadError);
            setUploadError(uploadMessage);
            throw new Error(uploadMessage);
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
        user_id: currentUser.id,
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        price: String(formData.get("price") ?? "").trim(),
        category,
        campus: String(formData.get("campus") ?? "").trim(),
        image_url: imageUrl,
        seller_email: currentUser.email ?? null,
        sold: false
      };

      const { error: insertError } = await supabase.from("listings").insert(payload);

      if (insertError) {
        throw new Error(
          JSON.stringify(
            {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint
            },
            null,
            2
          )
        );
      }

      router.push("/browse");
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError);

      console.error("[DormDrop] Create listing failed", caughtError);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingUser) {
    return (
      <div className="space-y-5 rounded-3xl border border-campus-ink/10 bg-white p-5 shadow-soft sm:p-6">
        <div className="h-44 rounded-3xl bg-campus-mint" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="h-12 rounded-2xl bg-campus-mint" />
          <div className="h-12 rounded-2xl bg-campus-mint" />
        </div>
        <div className="h-32 rounded-2xl bg-campus-mint" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-campus-ink/10 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold text-campus-coral">Login required</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Sign in to create a listing</h2>
        <p className="mt-3 text-sm leading-6 text-campus-ink/70">
          DormDrop listings are connected to your account so they can appear on your profile.
        </p>
        <Link
          className="mt-5 inline-flex min-h-12 items-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
          href="/login"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-5 rounded-3xl border border-campus-ink/10 bg-white p-5 shadow-soft sm:p-6"
      onSubmit={handleSubmit}
    >
      <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-campus-ink/15 bg-campus-paper p-6 text-center transition hover:border-campus-green hover:bg-campus-mint/60">
        <span className="text-sm font-bold text-campus-ink">Image upload placeholder</span>
        <span className="mt-2 max-w-sm text-sm leading-6 text-campus-ink/60">
          Upload a dorm item photo, or leave this empty to use a category placeholder.
        </span>
        {selectedImage ? (
          <span className="mt-3 text-sm font-semibold text-campus-green">
            Selected: {selectedImage.name}
          </span>
        ) : null}
        {previewUrl ? (
          <img
            alt="Selected listing preview"
            className="mt-4 aspect-[4/3] w-full max-w-xs rounded-2xl object-cover"
            src={previewUrl}
          />
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
            name="title"
            placeholder="Mini fridge"
            required
            type="text"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Campus</span>
          <select
            className="min-h-12 w-full rounded-2xl border border-campus-ink/15 bg-white px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
            defaultValue=""
            name="campus"
            required
          >
            <option disabled value="">
              Choose campus
            </option>
            {campusOptions.map((campus) => (
              <option key={campus} value={campus}>
                {campus}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold">Category</span>
          <select
            className="min-h-12 w-full rounded-2xl border border-campus-ink/15 bg-white px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
            name="category"
            required
          >
            <option>Free</option>
            <option>For Sale</option>
            <option>Wanted</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Price</span>
          <input
            className="min-h-12 w-full rounded-2xl border border-campus-ink/15 px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
            name="price"
            placeholder="$0"
            required
            type="text"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold">Description</span>
        <textarea
          className="min-h-32 w-full rounded-2xl border border-campus-ink/15 px-4 py-3 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
          name="description"
          placeholder="Condition, pickup notes, and anything a student should know."
          required
        />
      </label>

      {error ? (
        <div className="rounded-2xl bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
          {error}
        </div>
      ) : null}

      {uploadError ? (
        <div className="rounded-2xl bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
          Image upload error: {uploadError}
        </div>
      ) : null}

      <button
        className="min-h-12 w-full rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving listing..." : "Save listing"}
      </button>
    </form>
  );
}
