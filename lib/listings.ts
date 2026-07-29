export type Listing = {
  id: string;
  slug: string;
  ownerId?: string | null;
  title: string;
  type: "Free" | "For Sale" | "Wanted";
  price: string;
  campus: string;
  description: string;
  image: string;
  images: string[];
  image_url?: string | null;
  image_urls?: string[] | null;
  sold: boolean;
  createdAt: string;
  seller: {
    name: string;
    dorm: string;
    year: string;
    email?: string | null;
  };
};
