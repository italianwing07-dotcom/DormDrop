import { getCampusDisplayName } from "@/lib/campuses";
import type { Listing } from "@/lib/listings";
import type { ListingRow } from "@/lib/supabase/types";

const fallbackImage = "";
const validCategories = ["Free", "For Sale", "Wanted"] as const;

function normalizeImageUrls(imageUrls: unknown, fallbackUrl: string) {
  if (Array.isArray(imageUrls)) {
    const validUrls = imageUrls.filter(
      (imageUrl): imageUrl is string =>
        typeof imageUrl === "string" && imageUrl.trim().length > 0
    );

    if (validUrls.length > 0) {
      return validUrls;
    }
  }

  if (typeof imageUrls === "string" && imageUrls.trim().length > 0) {
    try {
      const parsedImageUrls = JSON.parse(imageUrls) as unknown;

      if (Array.isArray(parsedImageUrls)) {
        const validUrls = parsedImageUrls.filter(
          (imageUrl): imageUrl is string =>
            typeof imageUrl === "string" && imageUrl.trim().length > 0
        );

        if (validUrls.length > 0) {
          return validUrls;
        }
      }
    } catch {
      return [imageUrls];
    }
  }

  return [fallbackUrl || fallbackImage];
}

function formatListingPrice(
  price: string | number | null | undefined,
  category: Listing["type"]
) {
  const trimmedPrice = String(price ?? "").trim();

  if (category === "Free") {
    return "Free";
  }

  if (!trimmedPrice) {
    return "$0";
  }

  if (trimmedPrice.toLowerCase() === "free") {
    return "Free";
  }

  if (trimmedPrice.startsWith("$")) {
    return trimmedPrice;
  }

  const normalizedNumber = trimmedPrice.replace(/,/g, "");

  if (/^\d+(\.\d{1,2})?$/.test(normalizedNumber)) {
    return `$${normalizedNumber.replace(/\.00$/, "")}`;
  }

  return trimmedPrice;
}

export function mapListingRow(row: ListingRow): Listing {
  const type = validCategories.includes(row.category)
    ? row.category
    : "For Sale";
  const images = normalizeImageUrls(row.image_urls, row.image_url || fallbackImage);

  return {
    id: row.id,
    slug: row.id,
    ownerId: row.user_id,
    title: row.title,
    type,
    price: formatListingPrice(row.price, type),
    campus: getCampusDisplayName(row.campus),
    description: row.description,
    image: images[0] ?? fallbackImage,
    images,
    image_url: row.image_url,
    image_urls: Array.isArray(row.image_urls) ? row.image_urls : null,
    sold: row.sold ?? false,
    createdAt: row.created_at,
    seller: {
      name: "DormDrop Student",
      dorm: getCampusDisplayName(row.campus),
      year: "Student",
      email: row.seller_email
    }
  };
}
