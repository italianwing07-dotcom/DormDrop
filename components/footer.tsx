import Link from "next/link";

export function Footer() {
  return (
    // Bottom padding clears the phone tab bar.
    <footer className="mt-16 border-t border-campus-border bg-campus-card pb-16 sm:pb-0">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-campus-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} DormLoot. A marketplace run by students, not by Fordham University.</p>
        <nav aria-label="Legal and safety" className="flex flex-wrap gap-5">
          <Link className="hover:text-campus-ink hover:underline" href="/safety">
            Safety
          </Link>
          <Link className="hover:text-campus-ink hover:underline" href="/terms">
            Terms
          </Link>
          <Link className="hover:text-campus-ink hover:underline" href="/privacy">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
