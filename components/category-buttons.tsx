const categories = [
  { label: "Free", className: "bg-campus-green text-white" },
  { label: "For Sale", className: "bg-campus-gold text-campus-ink" },
  { label: "Wanted", className: "bg-campus-coral text-white" }
];

export function CategoryButtons() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => (
        <button
          className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-bold shadow-sm transition hover:scale-[1.02] ${category.className}`}
          key={category.label}
          type="button"
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
