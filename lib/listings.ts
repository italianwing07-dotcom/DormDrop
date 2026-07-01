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

export const listings: Listing[] = [
  {
    id: "mini-fridge",
    slug: "mini-fridge",
    title: "Mini fridge",
    type: "For Sale",
    price: "$55",
    campus: "Fordham",
    description:
      "Compact black mini fridge with a small freezer shelf. Clean, quiet, and ready for pickup before move-out.",
    image: "",
    images: [],
    sold: false,
    createdAt: "2026-05-29T12:00:00.000Z",
    seller: {
      name: "Maya Chen",
      dorm: "Fordham",
      year: "Sophomore"
    }
  },
  {
    id: "desk-lamp",
    slug: "desk-lamp",
    title: "Desk lamp",
    type: "Free",
    price: "$0",
    campus: "NYU",
    description:
      "Adjustable LED desk lamp with three brightness settings. Works well for late study sessions.",
    image: "",
    images: [],
    sold: false,
    createdAt: "2026-05-28T12:00:00.000Z",
    seller: {
      name: "Jordan Ellis",
      dorm: "NYU",
      year: "Junior"
    }
  },
  {
    id: "textbooks",
    slug: "textbooks",
    title: "Textbooks",
    type: "For Sale",
    price: "$30",
    campus: "Columbia",
    description:
      "Intro economics and biology textbooks from this semester. Light highlighting, no missing pages.",
    image: "",
    images: [],
    sold: false,
    createdAt: "2026-05-27T12:00:00.000Z",
    seller: {
      name: "Ari Patel",
      dorm: "Honors House",
      year: "Freshman"
    }
  },
  {
    id: "storage-bins",
    slug: "storage-bins",
    title: "Storage bins",
    type: "Wanted",
    price: "Any",
    campus: "St. John's",
    description:
      "Looking for stackable bins or under-bed storage before move-in weekend. Flexible on pickup.",
    image: "",
    images: [],
    sold: false,
    createdAt: "2026-05-26T12:00:00.000Z",
    seller: {
      name: "Sam Rivera",
      dorm: "St. John's",
      year: "Senior"
    }
  },
  {
    id: "microwave",
    slug: "microwave",
    title: "Microwave",
    type: "For Sale",
    price: "$40",
    campus: "Boston College",
    description:
      "Dorm-size microwave with simple controls. Fits on a small cart or shared suite counter.",
    image: "",
    images: [],
    sold: false,
    createdAt: "2026-05-24T12:00:00.000Z",
    seller: {
      name: "Nina Brooks",
      dorm: "Boston College",
      year: "Senior"
    }
  },
  {
    id: "dorm-chair",
    slug: "dorm-chair",
    title: "Dorm chair",
    type: "Free",
    price: "$0",
    campus: "Other",
    description:
      "Lightweight saucer chair for a dorm corner. A little worn, still comfy and easy to carry.",
    image: "",
    images: [],
    sold: false,
    createdAt: "2026-05-20T12:00:00.000Z",
    seller: {
      name: "Leo Martin",
      dorm: "Other",
      year: "Sophomore"
    }
  }
];

export function getListingBySlug(slug: string) {
  return listings.find((listing) => listing.slug === slug);
}
