"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ListingImagePlaceholder, isPlaceholderImageUrl } from "@/components/listing-image-placeholder";
import type { Listing } from "@/lib/listings";

export function ListingImageGallery({
  images,
  title,
  category
}: {
  images: string[];
  title: string;
  category?: Listing["type"];
}) {
  const safeImages = images.length > 0 ? images : [""];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const activeImage = safeImages[activeIndex] ?? safeImages[0];
  const hasActiveUploadedImage = !isPlaceholderImageUrl(activeImage);
  const isRemoteActiveImage = activeImage.startsWith("http");
  const hasMultipleImages = safeImages.length > 1;

  function showPreviousImage() {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? safeImages.length - 1 : currentIndex - 1
    );
  }

  function showNextImage() {
    setActiveIndex((currentIndex) =>
      currentIndex === safeImages.length - 1 ? 0 : currentIndex + 1
    );
  }

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        setActiveIndex((currentIndex) =>
          currentIndex === 0 ? safeImages.length - 1 : currentIndex - 1
        );
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        setActiveIndex((currentIndex) =>
          currentIndex === safeImages.length - 1 ? 0 : currentIndex + 1
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultipleImages, isLightboxOpen, safeImages.length]);

  return (
    <>
      <div className="overflow-hidden rounded-[20px] border border-campus-border bg-campus-card shadow-soft">
        <div className="relative aspect-[4/3] bg-campus-paper sm:aspect-[4/3]">
          <button
            aria-label="Open image gallery"
            className="group relative h-full w-full overflow-hidden text-left"
            onClick={() => setIsLightboxOpen(true)}
            type="button"
          >
            {hasActiveUploadedImage ? (
              <Image
                alt={title}
                className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.01]"
                fill
                priority
                unoptimized={isRemoteActiveImage}
                sizes="(min-width: 1024px) 55vw, 100vw"
                src={activeImage}
              />
            ) : (
              <ListingImagePlaceholder category={category} title={title} />
            )}
            <span className="absolute bottom-3 left-3 rounded-[14px] bg-campus-card/95 px-3 py-1 text-xs font-bold text-campus-ink shadow-sm">
              Click to enlarge
            </span>
          </button>

          {hasMultipleImages ? (
            <>
              <button
                aria-label="Previous image"
                className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-[14px] bg-campus-card/95 text-lg font-black text-campus-ink shadow-sm transition hover:bg-slate-50 sm:left-3 sm:size-10"
                onClick={showPreviousImage}
                type="button"
              >
                &lt;
              </button>
              <button
                aria-label="Next image"
                className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-[14px] bg-campus-card/95 text-lg font-black text-campus-ink shadow-sm transition hover:bg-slate-50 sm:right-3 sm:size-10"
                onClick={showNextImage}
                type="button"
              >
                &gt;
              </button>
              <div className="absolute bottom-3 right-3 rounded-[14px] bg-campus-ink/80 px-3 py-1 text-xs font-bold text-white">
                {activeIndex + 1} / {safeImages.length}
              </div>
            </>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="grid grid-cols-5 gap-2 p-2 sm:gap-3 sm:p-4">
            {safeImages.map((image, index) => {
              const isActive = activeIndex === index;
              const hasUploadedThumbnail = !isPlaceholderImageUrl(image);
              const isRemoteThumbnail = image.startsWith("http");

              return (
                <button
                  aria-label={"Show image " + (index + 1)}
                  className={"relative aspect-square overflow-hidden rounded-[14px] border transition " +
                    (isActive
                      ? "border-campus-green ring-2 ring-campus-green/20"
                      : "border-campus-border hover:border-campus-green/40")}
                  key={image + "-" + index}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  {hasUploadedThumbnail ? (
                    <Image
                      alt={title + " thumbnail " + (index + 1)}
                      className="h-full w-full object-cover"
                      fill
                      unoptimized={isRemoteThumbnail}
                      sizes="96px"
                      src={image}
                    />
                  ) : (
                    <ListingImagePlaceholder
                      category={category}
                      className="p-2"
                      title={title}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {isLightboxOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-campus-ink/90 p-2 sm:p-6"
          role="dialog"
        >
          <button
            aria-label="Close gallery"
            className="absolute right-3 top-3 z-10 flex size-12 items-center justify-center rounded-[14px] bg-campus-card text-lg font-black text-campus-ink shadow-soft transition hover:bg-slate-50 sm:right-6 sm:top-6 sm:size-11"
            onClick={() => setIsLightboxOpen(false)}
            type="button"
          >
            X
          </button>

          {hasMultipleImages ? (
            <button
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-[14px] bg-campus-card/95 text-lg font-black text-campus-ink shadow-soft transition hover:bg-slate-50 sm:left-6 sm:size-12"
              onClick={showPreviousImage}
              type="button"
            >
              &lt;
            </button>
          ) : null}

          <div className="relative h-[72svh] w-full max-w-5xl overflow-hidden rounded-[14px] bg-campus-paper shadow-soft sm:h-[82vh] sm:rounded-[20px]">
            {hasActiveUploadedImage ? (
              <Image
                alt={title + " enlarged image"}
                className="h-full w-full object-contain"
                fill
                priority
                unoptimized={isRemoteActiveImage}
                sizes="100vw"
                src={activeImage}
              />
            ) : (
              <ListingImagePlaceholder category={category} title={title} />
            )}
          </div>

          {hasMultipleImages ? (
            <button
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-[14px] bg-campus-card/95 text-lg font-black text-campus-ink shadow-soft transition hover:bg-slate-50 sm:right-6 sm:size-12"
              onClick={showNextImage}
              type="button"
            >
              &gt;
            </button>
          ) : null}

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-[14px] bg-campus-card/95 px-4 py-2 text-xs font-bold text-campus-ink shadow-soft sm:bottom-6">
            <span>{activeIndex + 1} / {safeImages.length}</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
