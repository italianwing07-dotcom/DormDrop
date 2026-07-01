import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { InboxNavLink } from "@/components/inbox-nav-link";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/create", label: "Create" },
  { href: "/profile", label: "Profile" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-campus-border bg-campus-card/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-campus-card/80">
      <nav className="mx-auto flex w-full max-w-6xl flex-col items-stretch gap-3 px-4 py-3 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 lg:px-8">
        <Link className="flex items-center gap-2 self-start sm:self-auto" href="/">
          <span className="flex size-9 items-center justify-center rounded-[14px] bg-gradient-to-br from-campus-green to-campus-dark text-sm font-black text-white shadow-sm">
            D
          </span>
          <span className="text-lg font-black tracking-tight">DormDrop</span>
        </Link>
        <form action="/browse" className="hidden min-w-64 flex-1 items-center gap-2 rounded-[14px] border border-campus-border bg-campus-paper p-1 lg:flex lg:max-w-sm">
          <input
            className="min-h-10 flex-1 bg-transparent px-3 text-sm font-semibold text-campus-ink outline-none placeholder:text-campus-muted"
            name="q"
            placeholder="Search listings"
            type="search"
          />
          <button
            className="min-h-10 rounded-[14px] bg-campus-green px-4 text-sm font-bold text-white shadow-sm transition hover:bg-campus-hover"
            type="submit"
          >
            Search
          </button>
        </form>
        <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:pb-0">
          {links.map((link) => (
            <Link
              className="flex min-h-10 shrink-0 items-center rounded-[14px] px-3 py-2 text-sm font-semibold text-campus-muted transition hover:bg-campus-paper hover:text-campus-ink"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <InboxNavLink />
          <LogoutButton />
        </div>
      </nav>
    </header>
  );
}
