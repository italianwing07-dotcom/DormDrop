"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isPlaceholderImageUrl } from "@/components/listing-image-placeholder";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { getCampusSelectOptions, getCampusSelectValue } from "@/lib/campuses";
import type { ListingCategory, ListingRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

const categoryOptions: ListingCategory[] = ["Free", "For Sale", "Wanted"];
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

function getInitialImageUrls(listing: ListingRow) {
  if (listing.image_urls && listing.image_urls.length > 0) {
    return listing.image_urls.filter((imageUrl) => imageUrl.trim().length > 0 && !isPlaceholderImageUrl(imageUrl));
  }

  return listing.image_url && !isPlaceholderImageUrl(listing.image_url) ? [listing.image_url] : [];
}

function getStoragePathFromPublicUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    const marker = "/storage/v1/object/public/listing-images/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
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

function makeExistingPhoto(url: string): PhotoItem {
  return {
    id: "existing-" + crypto.randomUUID(),
    type: "existing",
    url
  };
}

function makeNewPhoto(file: File): PhotoItem {
  return {
    id: "new-" + crypto.randomUUID(),
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

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = params.id;
  const [user, setUser] = useState<User | null>(null);
  const [listing, setListing] = useState<ListingRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [removedExistingUrls, setRemovedExistingUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
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

        const initialImageUrls = data ? getInitialImageUrls(data) : [];

        setListing(data);
        setPhotos(initialImageUrls.map(makeExistingPhoto));
        setRemovedExistingUrls([]);
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

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setError(null);

    if (hasUnsupportedHeicFile(files)) {
      event.target.value = "";
      setError(unsupportedHeicMessage);
      return;
    }

    const unsupportedFile = files.find((file) => !isSupportedImageFile(file));

    if (unsupportedFile) {
      event.target.value = "";
      setError("Please upload JPG, PNG, WEBP, or GIF images only.");
      return;
    }

    setPhotos((currentPhotos) => {
      const availableSlots = Math.max(0, 5 - currentPhotos.length);

      if (availableSlots === 0) {
        setError("You can upload up to 5 photos. Remove a photo before adding another.");
        return currentPhotos;
      }

      const filesToAdd = files.slice(0, availableSlots);

      if (filesToAdd.length < files.length) {
        setError("You can upload up to 5 photos. Only the first available slots were added.");
      }

      return [...currentPhotos, ...filesToAdd.map(makeNewPhoto)];
    });
    event.target.value = "";
  }

  function handleRemovePhoto(photoId: string) {
    setPhotos((currentPhotos) => {
      const photoToRemove = currentPhotos.find((photo) => photo.id === photoId);

      if (photoToRemove?.type === "existing") {
        setRemovedExistingUrls((currentUrls) =>
          currentUrls.includes(photoToRemove.url)
            ? currentUrls
            : [...currentUrls, photoToRemove.url]
        );
      }

      if (photoToRemove) {
        revokePhotoPreview(photoToRemove);
      }

      return currentPhotos.filter((photo) => photo.id !== photoId);
    });
    setError(null);
  }

  function handleMovePhoto(photoId: string, direction: -1 | 1) {
    setPhotos((currentPhotos) => {
      const currentIndex = currentPhotos.findIndex((photo) => photo.id === photoId);

      return moveArrayItem(currentPhotos, currentIndex, currentIndex + direction);
    });
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !listing) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const category = formData.get("category") as ListingCategory;

    setError(null);
    setIsSaving(true);

    try {
      const supabase = getBrowserSupabaseClient();
      let finalImageUrls: string[] = [];

      if (photos.length > 0) {
        setIsUploadingImage(true);

        try {
          for (const photo of photos) {
            if (photo.type === "existing") {
              finalImageUrls.push(photo.url);
              continue;
            }

            if (!isSupportedImageFile(photo.file)) {
              throw new Error("Please upload JPG, PNG, WEBP, or GIF images only.");
            }

            const filePath = user.id + "/" + crypto.randomUUID() + "-" + getSafeFileName(photo.file);
            const { error: uploadError } = await supabase.storage
              .from("listing-images")
              .upload(filePath, photo.file, {
                cacheControl: "3600",
                upsert: false
              });

            if (uploadError) {
              throw uploadError;
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
        title: String(formData.get("title") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        price: String(formData.get("price") ?? "").trim(),
        category,
        campus: String(formData.get("campus") ?? "").trim(),
        image_url: imageUrl,
        image_urls: finalImageUrls,
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

      const keptExistingUrls = new Set(
        photos
          .filter((photo): photo is Extract<PhotoItem, { type: "existing" }> => photo.type === "existing")
          .map((photo) => photo.url)
      );
      const storagePathsToRemove = removedExistingUrls
        .filter((imageUrl) => !keptExistingUrls.has(imageUrl))
        .map(getStoragePathFromPublicUrl)
        .filter((storagePath): storagePath is string => Boolean(storagePath));

      if (storagePathsToRemove.length > 0) {
        const { error: removeStorageError } = await supabase.storage
          .from("listing-images")
          .remove(storagePathsToRemove);

        if (removeStorageError) {
          console.error("[DormDrop images] Could not remove old storage images", removeStorageError);
        }
      }

      router.push("/listings/" + listing.id);
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
        <div className="space-y-5 rounded-[20px] border border-campus-border bg-campus-card p-4 shadow-soft sm:p-6">
          <div className="h-8 w-48 rounded-[14px] bg-slate-50" />
          <div className="h-44 rounded-[20px] bg-slate-50" />
          <div className="h-12 rounded-[14px] bg-slate-50" />
          <div className="h-32 rounded-[14px] bg-slate-50" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[20px] border border-campus-border bg-campus-card p-6 shadow-soft">
          <p className="text-sm font-semibold text-campus-coral">Login required</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Sign in to edit this listing</h1>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover"
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
        <section className="rounded-[20px] border border-campus-border bg-campus-card p-6 shadow-soft">
          <p className="text-sm font-semibold text-campus-coral">Listing unavailable</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">You cannot edit this listing</h1>
          <p className="mt-3 text-sm leading-6 text-campus-muted">
            {error ?? "Only the owner can access this edit page."}
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover"
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
          <p className="text-sm leading-6 text-campus-muted">
            Changes will be saved to your DormDrop listing.
          </p>
        </div>

        <form
          className="space-y-5 rounded-[20px] border border-campus-border bg-campus-card p-4 shadow-soft sm:p-6"
          onSubmit={handleSubmit}
        >
          <div className="flex min-h-44 flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-campus-border bg-campus-paper p-4 text-center transition hover:border-campus-green hover:bg-slate-50 sm:p-6">
            <span className="text-sm font-bold text-campus-ink">Listing image</span>
            <span className="mt-2 max-w-sm text-sm leading-6 text-campus-muted">
              Upload up to 5 new photos, or keep the current images.
            </span>
            <button
              className="mt-4 min-h-12 rounded-[14px] bg-campus-card px-5 py-2 text-sm font-bold text-campus-ink shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={photos.length >= 5}
              onClick={() => imageInputRef.current?.click()}
              type="button"
            >
              Choose photos
            </button>
            {photos.length > 0 ? (
              <div className="mt-4 grid w-full max-w-xl grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:grid-cols-3">
                {photos.map((photo, index) => {
                  const imageUrl = photo.type === "existing" ? photo.url : photo.previewUrl;

                  return (
                    <div className="relative overflow-hidden rounded-[14px]" key={photo.id}>
                      <img
                        alt={"Listing image " + (index + 1)}
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
            <span className="mt-3 text-sm font-semibold text-campus-green">
              You can upload up to 5 photos. {photos.length}/5 selected.
            </span>
            {photos.some((photo) => photo.type === "new") ? (
              <span className="text-sm font-semibold text-campus-green">
                New selected:{" "}
                {photos
                  .filter((photo): photo is Extract<PhotoItem, { type: "new" }> => photo.type === "new")
                  .map((photo) => photo.file.name)
                  .join(", ")}
              </span>
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
                defaultValue={listing.title}
                name="title"
                required
                type="text"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Campus</span>
              <select
                className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-card px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
                defaultValue={getCampusSelectValue(listing.campus)}
                name="campus"
                required
              >
                {getCampusSelectOptions().map((campus) => (
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
                className="min-h-12 w-full rounded-[14px] border border-campus-border px-4 outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
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
              className="min-h-36 w-full rounded-[14px] border border-campus-border px-4 py-3 text-base outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10 sm:min-h-32 sm:text-sm"
              defaultValue={listing.description}
              name="description"
              required
            />
          </label>

          {error ? (
            <div className="rounded-[14px] bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="min-h-12 rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Saving changes..." : "Save changes"}
            </button>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-campus-paper px-6 text-sm font-semibold text-campus-ink transition hover:bg-slate-50"
              href={"/listings/" + listing.id}
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
