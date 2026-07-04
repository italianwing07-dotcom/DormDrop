const categories = [
  { label: "Free", className: "border border-campus-border bg-campus-card text-campus-ink" },
  { label: "For Sale", className: "bg-campus-gold text-campus-ink" },
  { label: "Wanted", className: "border border-campus-green/20 bg-slate-50 text-campus-green" }
];

export function CategoryButtons() {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 sm:pb-1">
      {categories.map((category) => (
        <button
          className={"min-h-12 shrink-0 rounded-[14px] px-5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-11 " + category.className}
          key={category.label}
          type="button"
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
