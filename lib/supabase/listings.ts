import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { supabase } from "@/lib/supabase/client";
import { mapListingRow } from "@/lib/supabase/listing-mapper";
import type { NewListing } from "@/lib/supabase/types";

export { mapListingRow } from "@/lib/supabase/listing-mapper";

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
    image_urls: listing.image_urls ?? [listing.image_url],
    seller_email: listing.seller_email ?? null,
    sold: listing.sold ?? false
  };


  const {
    data: { session }
  } = await browserSupabase.auth.getSession();


  if (!session) {
    throw new Error("Please sign in with your school email before posting a listing.");
  }

  if (session.user.id !== listingToInsert.user_id) {
    throw new Error("Please refresh the page and try posting again.");
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
    throw new Error(error.message || "Could not save this listing. Please try again.");
  }

  return;
}
