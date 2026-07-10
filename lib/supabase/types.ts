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
  image_urls: string[] | null;
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
  image_urls?: string[] | null;
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


export type ConversationRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
  last_message_at: string;
  created_at: string;
};

export type NewConversation = {
  id?: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_last_read_at?: string | null;
  seller_last_read_at?: string | null;
  last_message_at?: string;
  created_at?: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export type NewMessage = {
  id?: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at?: string;
};

export type ReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "resolved";
  created_at: string;
};

export type NewReport = Omit<ReportRow, "id" | "status" | "created_at"> & {
  id?: string;
  status?: ReportRow["status"];
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
      conversations: {
        Row: ConversationRow;
        Insert: NewConversation;
        Update: Partial<NewConversation>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: NewMessage;
        Update: Partial<NewMessage>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: NewReport;
        Update: Partial<NewReport>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
