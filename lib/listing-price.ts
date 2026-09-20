import type { ListingCategory } from "@/lib/supabase/types";

// Supabase projects may store prices as text or numeric. Send a canonical
// decimal string accepted by both, while allowing familiar dollar inputs.
export function normalizeListingPrice(value: FormDataEntryValue | null, category: ListingCategory) {
  if (category === "Free") return "0.00";
  const input = String(value ?? "").trim().replace(/^\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(input)) {
    throw new Error("Enter a price of zero or more, such as 10 or $10.50 (up to two decimal places).");
  }
  const amount = Number(input.replace(/,/g, ""));
  if (!Number.isFinite(amount) || !Number.isSafeInteger(Math.round(amount * 100))) {
    throw new Error("Please enter a smaller price.");
  }
  return amount.toFixed(2);
}
