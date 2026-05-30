export type Listing = {
  id: string;
  slug: string;
  title: string;
  type: "Free" | "For Sale" | "Wanted";
  price: string;
  campus: string;
  description: string;
  image: string;
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
    campus: "North Quad",
    description:
      "Compact black mini fridge with a small freezer shelf. Clean, quiet, and ready for pickup before move-out.",
    image: "/listings/mini-fridge.svg",
    sold: false,
    createdAt: "2026-05-29T12:00:00.000Z",
    seller: {
      name: "Maya Chen",
      dorm: "North Quad",
      year: "Sophomore"
    }
  },
  {
    id: "desk-lamp",
    slug: "desk-lamp",
    title: "Desk lamp",
    type: "Free",
    price: "$0",
    campus: "West Hall",
    description:
      "Adjustable LED desk lamp with three brightness settings. Works well for late study sessions.",
    image: "/listings/desk-lamp.svg",
    sold: false,
    createdAt: "2026-05-28T12:00:00.000Z",
    seller: {
      name: "Jordan Ellis",
      dorm: "West Hall",
      year: "Junior"
    }
  },
  {
    id: "textbooks",
    slug: "textbooks",
    title: "Textbooks",
    type: "For Sale",
    price: "$30",
    campus: "Main Library",
    description:
      "Intro economics and biology textbooks from this semester. Light highlighting, no missing pages.",
    image: "/listings/textbooks.svg",
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
    campus: "East Campus",
    description:
      "Looking for stackable bins or under-bed storage before move-in weekend. Flexible on pickup.",
    image: "/listings/storage-bins.svg",
    sold: false,
    createdAt: "2026-05-26T12:00:00.000Z",
    seller: {
      name: "Sam Rivera",
      dorm: "East Campus",
      year: "Senior"
    }
  },
  {
    id: "microwave",
    slug: "microwave",
    title: "Microwave",
    type: "For Sale",
    price: "$40",
    campus: "South Village",
    description:
      "Dorm-size microwave with simple controls. Fits on a small cart or shared suite counter.",
    image: "/listings/microwave.svg",
    sold: false,
    createdAt: "2026-05-24T12:00:00.000Z",
    seller: {
      name: "Nina Brooks",
      dorm: "South Village",
      year: "Senior"
    }
  },
  {
    id: "dorm-chair",
    slug: "dorm-chair",
    title: "Dorm chair",
    type: "Free",
    price: "$0",
    campus: "Baker House",
    description:
      "Lightweight saucer chair for a dorm corner. A little worn, still comfy and easy to carry.",
    image: "/listings/dorm-chair.svg",
    sold: false,
    createdAt: "2026-05-20T12:00:00.000Z",
    seller: {
      name: "Leo Martin",
      dorm: "Baker House",
      year: "Sophomore"
    }
  }
];

export function getListingBySlug(slug: string) {
  return listings.find((listing) => listing.slug === slug);
}
