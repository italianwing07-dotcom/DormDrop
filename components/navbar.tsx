import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { LogoutButton } from "@/components/logout-button";
import { DesktopNavLinks, MobileTabBar } from "@/components/nav-links";

export function Navbar() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-campus-border bg-campus-card/90 backdrop-blur supports-[backdrop-filter]:bg-campus-card/75">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link className="flex shrink-0 items-center gap-2" href="/">
            <span className="flex size-8 items-center justify-center rounded-ctl bg-campus-brand text-sm font-bold text-white">
              D
            </span>
            <span className="text-lg font-semibold tracking-tight">DormLoot</span>
          </Link>

          <form action="/browse" className="relative ml-auto hidden max-w-xs flex-1 items-center lg:flex">
            <MagnifyingGlass
              aria-hidden
              className="pointer-events-none absolute left-3 text-campus-subtle"
              size={17}
            />
            <input
              aria-label="Search listings"
              className="min-h-10 w-full rounded-ctl border border-campus-border bg-campus-surface pl-9 pr-3 text-sm outline-none transition placeholder:text-campus-subtle focus:border-campus-brand focus:bg-campus-card focus:shadow-focus"
              name="q"
              placeholder="Search listings"
              type="search"
            />
          </form>

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <DesktopNavLinks />
            <LogoutButton />
          </div>
        </nav>
      </header>
      <MobileTabBar />
    </>
  );
}
