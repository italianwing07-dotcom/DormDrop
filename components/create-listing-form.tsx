"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { campusOptions } from "@/lib/campuses";
import type { ListingCategory } from "@/lib/supabase/types";

const placeholderImages: Record<ListingCategory, string> = {
  Free: "",
  "For Sale": "",
  Wanted: ""
};

const supportedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];
const supportedImageExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
const unsupportedHeicMessage =
  "HEIC photos are not supported yet. Please upload JPG, PNG, WEBP, or GIF.";

type PhotoItem =
  | { id: string; type: "existing"; url: string }
  | { id: string; type: "new"; file: File; previewUrl: string };

function isSupportedImageFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const hasSupportedExtension = supportedImageExtensions.includes(extension);
  const hasSupportedType = !file.type || supportedImageTypes.includes(file.type);

  return hasSupportedExtension && hasSupportedType;
}

function hasUnsupportedHeicFile(files: File[]) {
  return files.some((file) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

    return (
      extension === "heic" ||
      extension === "heif" ||
      file.type === "image/heic" ||
      file.type === "image/heif"
    );
  });
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const reorderedItems = [...items];
  const [movedItem] = reorderedItems.splice(fromIndex, 1);

  if (!movedItem) {
    return items;
  }

  reorderedItems.splice(toIndex, 0, movedItem);

  return reorderedItems;
}

function getSafeFileName(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const baseName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

  return (baseName || "listing-image") + "." + extension;
}

function makeNewPhoto(file: File): PhotoItem {
  return {
    id: crypto.randomUUID(),
    type: "new",
    file,
    previewUrl: URL.createObjectURL(file)
  };
}

function revokePhotoPreview(photo: PhotoItem) {
  if (photo.type === "new") {
    URL.revokeObjectURL(photo.previewUrl);
  }
}

export function CreateListingForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const photosRef = useRef<PhotoItem[]>([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach(revokePhotoPreview);
    };
  }, []);

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

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setUploadError(null);

    if (hasUnsupportedHeicFile(files)) {
      event.target.value = "";
      setUploadError(unsupportedHeicMessage);
      return;
    }

    const unsupportedFile = files.find((file) => !isSupportedImageFile(file));

    if (unsupportedFile) {
      event.target.value = "";
      setUploadError("Please upload JPG, PNG, WEBP, or GIF images only.");
      return;
    }

    setPhotos((currentPhotos) => {
      const availableSlots = Math.max(0, 5 - currentPhotos.length);

      if (availableSlots === 0) {
        setUploadError("You can upload up to 5 photos. Remove a photo before adding another.");
        return currentPhotos;
      }

      const filesToAdd = files.slice(0, availableSlots);

      if (filesToAdd.length < files.length) {
        setUploadError("You can upload up to 5 photos. Only the first available slots were added.");
      }

      return [...currentPhotos, ...filesToAdd.map(makeNewPhoto)];
    });
    event.target.value = "";
  }

  function handleRemovePhoto(photoId: string) {
    setPhotos((currentPhotos) => {
      const photoToRemove = currentPhotos.find((photo) => photo.id === photoId);

      if (photoToRemove) {
        revokePhotoPreview(photoToRemove);
      }

      return currentPhotos.filter((photo) => photo.id !== photoId);
    });
    setUploadError(null);
  }

  function handleMovePhoto(photoId: string, direction: -1 | 1) {
    setPhotos((currentPhotos) => {
      const currentIndex = currentPhotos.findIndex((photo) => photo.id === photoId);

      return moveArrayItem(currentPhotos, currentIndex, currentIndex + direction);
    });
    setUploadError(null);
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
      let finalImageUrls: string[] = [];

      if (photos.length > 0) {
        setIsUploadingImage(true);
        try {
          for (const photo of photos) {
            if (photo.type === "existing") {
              finalImageUrls.push(photo.url);
              continue;
            }

            const filePath = currentUser.id + "/" + crypto.randomUUID() + "-" + getSafeFileName(photo.file);
            const { error: uploadError } = await supabase.storage
              .from("listing-images")
              .upload(filePath, photo.file, {
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

            finalImageUrls.push(data.publicUrl);
          }
        } finally {
          setIsUploadingImage(false);
        }
      }

      if (finalImageUrls.length === 0) {
        finalImageUrls = [placeholderImages[category]];
      }

      const imageUrl = finalImageUrls[0] ?? placeholderImages[category];
      const payload = {
        user_id: currentUser.id,
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        price: String(formData.get("price") ?? "").trim(),
        category,
        campus: String(formData.get("campus") ?? "").trim(),
        image_url: imageUrl,
        image_urls: finalImageUrls,
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
      <div className="space-y-5 rounded-[20px] border border-campus-border bg-campus-card p-4 shadow-soft sm:p-6">
        <div className="h-44 rounded-[20px] bg-slate-50" />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="h-12 rounded-[14px] bg-slate-50" />
          <div className="h-12 rounded-[14px] bg-slate-50" />
        </div>
        <div className="h-32 rounded-[14px] bg-slate-50" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[20px] border border-campus-border bg-campus-card p-6 shadow-soft">
        <p className="text-sm font-semibold text-campus-coral">Login required</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Sign in to create a listing</h2>
        <p className="mt-3 text-sm leading-6 text-campus-muted">
          DormDrop listings are connected to your account so they can appear on your profile.
        </p>
        <Link
          className="mt-5 inline-flex min-h-12 items-center rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover"
          href="/login"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-5 rounded-[20px] border border-campus-border bg-campus-card p-4 shadow-soft sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="flex min-h-44 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-campus-border bg-campus-paper p-4 text-center transition hover:border-campus-green hover:bg-slate-50 sm:p-6">
        <span className="text-sm font-bold text-campus-ink">Image upload placeholder</span>
        <span className="mt-2 max-w-sm text-sm leading-6 text-campus-muted">
          Upload up to 5 dorm item photos, or leave this empty to use a clean text placeholder.
        </span>
        <button
          className="mt-4 min-h-12 rounded-[14px] bg-campus-card px-5 py-2 text-sm font-bold text-campus-ink shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={photos.length >= 5}
          onClick={() => imageInputRef.current?.click()}
          type="button"
        >
          Choose photos
        </button>
        <span className="mt-3 text-sm font-semibold text-campus-green">
          {photos.length}/5 selected
        </span>
        {photos.length > 0 ? (
          <div className="mt-4 grid w-full max-w-xl grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3">
            {photos.map((photo, index) => {
              const imageUrl = photo.type === "existing" ? photo.url : photo.previewUrl;

              return (
                <div className="relative overflow-hidden rounded-[14px]" key={photo.id}>
                  <img
                    alt={"Selected listing preview " + (index + 1)}
                    className="aspect-[4/3] w-full object-cover"
                    src={imageUrl}
                  />
                  <div className="absolute inset-x-2 top-2 flex flex-wrap justify-end gap-1">
                    {index === 0 ? (
                      <span className="rounded-[14px] bg-campus-green px-2 py-1 text-xs font-bold text-white shadow-sm">
                        Cover
                      </span>
                    ) : null}
                    <button
                      className="min-h-8 rounded-[14px] bg-campus-card/95 px-2.5 py-1 text-xs font-bold text-campus-ink shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                      disabled={index === 0}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleMovePhoto(photo.id, -1);
                      }}
                      type="button"
                    >
                      Left
                    </button>
                    <button
                      className="min-h-8 rounded-[14px] bg-campus-card/95 px-2.5 py-1 text-xs font-bold text-campus-ink shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                      disabled={index === photos.length - 1}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleMovePhoto(photo.id, 1);
                      }}
                      type="button"
                    >
                      Right
                    </button>
                    <button
                      className="min-h-8 rounded-[14px] bg-campus-card/95 px-2.5 py-1 text-xs font-bold text-campus-coral shadow-sm transition hover:bg-campus-coral hover:text-white"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleRemovePhoto(photo.id);
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        {isUploadingImage ? (
          <span className="mt-3 text-sm font-semibold text-campus-green">
            Uploading image...
          </span>
        ) : null}
        <input
          accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          multiple
          name="images"
          onChange={handleImageChange}
          ref={imageInputRef}
          type="file"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold">Listing title</span>
          <input
            className="min-h-12 w-full rounded-[14px] border border-campus-border px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
            name="title"
            placeholder="Mini fridge"
            required
            type="text"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Campus</span>
          <select
            className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-card px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
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
            className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-card px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
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
            className="min-h-12 w-full rounded-[14px] border border-campus-border px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
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
          className="min-h-36 w-full rounded-[14px] border border-campus-border px-4 py-3 text-base outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10 sm:min-h-32 sm:text-sm"
          name="description"
          placeholder="Condition, pickup notes, and anything a student should know."
          required
        />
      </label>

      {error ? (
        <div className="rounded-[14px] bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
          {error}
        </div>
      ) : null}

      {uploadError ? (
        <div className="rounded-[14px] bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
          Image upload error: {uploadError}
        </div>
      ) : null}

      <button
        className="min-h-12 w-full rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Saving listing..." : "Save listing"}
      </button>
    </form>
  );
}
