import Link from "next/link";

const categories = ["Free", "For Sale", "Wanted"] as const;

export function CategoryButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link
          className="min-h-11 rounded-full border border-campus-border bg-campus-card px-5 py-2.5 text-sm font-medium text-campus-ink transition hover:border-campus-brand/40 hover:bg-campus-soft hover:text-campus-brand"
          href={`/browse?category=${encodeURIComponent(category)}`}
          key={category}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}
