import type { Listing } from "@/lib/listings";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { supabase } from "@/lib/supabase/client";
import type { ListingRow, NewListing } from "@/lib/supabase/types";

const fallbackImage = "/listings/storage-bins.svg";
const validCategories = ["Free", "For Sale", "Wanted"] as const;

export function mapListingRow(row: ListingRow): Listing {
  const type = validCategories.includes(row.category)
    ? row.category
    : "For Sale";

  return {
    id: row.id,
    slug: row.id,
    title: row.title,
    type,
    price: row.price || "$0",
    campus: row.campus,
    description: row.description,
    image: row.image_url || fallbackImage,
    sold: row.sold ?? false,
    createdAt: row.created_at,
    seller: {
      name: "DormDrop Student",
      dorm: row.campus,
      year: "Student",
      email: row.seller_email
    }
  };
}

export async function getListings() {
  if (!supabase) {
    throw new Error("Missing Supabase environment variables.");
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });
    

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapListingRow);
}

export async function getListingsByUser(userId: string) {
  if (!supabase) {
    throw new Error("Missing Supabase environment variables.");
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapListingRow);
}

export async function getListing(id: string) {
  if (!supabase) {
    throw new Error("Missing Supabase environment variables.");
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapListingRow(data);
}

export async function createListing(listing: NewListing) {
  const browserSupabase = getBrowserSupabaseClient();

  const listingToInsert: NewListing = {
    user_id: listing.user_id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    campus: listing.campus,
    image_url: listing.image_url,
    seller_email: listing.seller_email ?? null,
    sold: listing.sold ?? false
  };

  console.log("[DormDrop] createListing insert payload", listingToInsert);

  const {
    data: { session }
  } = await browserSupabase.auth.getSession();

  console.log("[DormDrop] createListing browser session", {
    hasSession: Boolean(session),
    sessionUserId: session?.user.id
  });

  if (!session) {
    throw new Error("No active Supabase browser session found. Please log in again.");
  }

  if (session.user.id !== listingToInsert.user_id) {
    throw new Error("Listing user_id does not match the logged-in Supabase user.");
  }

  const insertPromise = browserSupabase
    .from("listings")
    .insert(listingToInsert)
    .select("id")
    .single();

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    window.setTimeout(() => {
      reject(new Error("Supabase insert timed out after 15 seconds."));
    }, 15000);
  });

  const { error } = await Promise.race([insertPromise, timeoutPromise]);

  if (error) {
    throw new Error(
      JSON.stringify(
        {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        null,
        2
      )
    );
  }

  return;
}
