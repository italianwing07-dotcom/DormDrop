export type ListingCategory = "Free" | "For Sale" | "Wanted";

export type ListingRow = {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  price: string;
  category: ListingCategory;
  campus: string;
  image_url: string;
  seller_email: string | null;
  sold: boolean;
  created_at: string;
};

export type NewListing = {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  price: string;
  category: ListingCategory;
  campus: string;
  image_url: string;
  seller_email?: string | null;
  sold?: boolean;
  created_at?: string;
};

export type SavedListingRow = {
  user_id: string;
  listing_id: string;
  created_at: string;
};

export type NewSavedListing = {
  user_id: string;
  listing_id: string;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      listings: {
        Row: ListingRow;
        Insert: NewListing;
        Update: Partial<NewListing>;
        Relationships: [];
      };
      saved_listings: {
        Row: SavedListingRow;
        Insert: NewSavedListing;
        Update: Partial<NewSavedListing>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
