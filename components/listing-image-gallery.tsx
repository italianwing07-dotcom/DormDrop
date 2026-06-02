"use client";

import Image from "next/image";
import { useState } from "react";

export function ListingImageGallery({
  images,
  title
}: {
  images: string[];
  title: string;
}) {
  const safeImages = images.length > 0 ? images : ["/listings/storage-bins.svg"];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = safeImages[activeIndex] ?? safeImages[0];
  const isRemoteActiveImage = activeImage.startsWith("http");

  return (
    <div className="overflow-hidden rounded-3xl border border-campus-ink/10 bg-white shadow-soft">
      <div className="relative aspect-[4/3] bg-campus-mint">
        <Image
          alt={title}
          className="h-full w-full object-cover"
          fill
          priority
          unoptimized={isRemoteActiveImage}
          sizes="(min-width: 1024px) 55vw, 100vw"
          src={activeImage}
        />
        {safeImages.length > 1 ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-campus-ink/80 px-3 py-1 text-xs font-bold text-white">
            {activeIndex + 1} / {safeImages.length}
          </div>
        ) : null}
      </div>
      {safeImages.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 p-3">
          {safeImages.map((image, index) => {
            const isActive = activeIndex === index;
            const isRemoteThumbnail = image.startsWith("http");

            return (
              <button
                aria-label={`Show image ${index + 1}`}
                className={`relative aspect-square overflow-hidden rounded-2xl border transition ${
                  isActive
                    ? "border-campus-green ring-2 ring-campus-green/20"
                    : "border-campus-ink/10 hover:border-campus-green/40"
                }`}
                key={`${image}-${index}`}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                <Image
                  alt={`${title} thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                  fill
                  unoptimized={isRemoteThumbnail}
                  sizes="96px"
                  src={image}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
