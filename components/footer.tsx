import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-campus-border bg-campus-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-campus-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} DormDrop. A student marketplace.</p>
        <nav aria-label="Legal and safety" className="flex flex-wrap gap-4">
          <Link href="/safety">Safety</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
