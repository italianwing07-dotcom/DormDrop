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
    <header className="sticky top-0 z-20 border-b border-campus-ink/10 bg-campus-paper/95 backdrop-blur">
      <nav className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2" href="/">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-campus-green text-sm font-black text-white">
            D
          </span>
          <span className="text-lg font-black tracking-tight">DormDrop</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              className="rounded-full px-3 py-2 text-sm font-semibold text-campus-ink/70 transition hover:bg-white hover:text-campus-ink"
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
