"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Plus, Storefront, User } from "@phosphor-icons/react";
import { cx } from "@/components/ui";
import { InboxNavLink } from "@/components/inbox-nav-link";

const destinations = [
  { href: "/browse", label: "Browse", icon: Storefront },
  { href: "/create", label: "Create", icon: Plus },
  { href: "/profile", label: "Profile", icon: User }
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-1 sm:flex">
      {destinations.map((destination) => (
        <Link
          aria-current={isActive(pathname, destination.href) ? "page" : undefined}
          className={cx(
            "flex min-h-10 items-center rounded-ctl px-3 text-sm font-medium transition",
            isActive(pathname, destination.href)
              ? "bg-campus-soft text-campus-brand"
              : "text-campus-muted hover:bg-campus-surface hover:text-campus-ink"
          )}
          href={destination.href}
          key={destination.href}
        >
          {destination.label}
        </Link>
      ))}
      <InboxNavLink />
    </div>
  );
}

// Phone navigation lives at the bottom, where thumbs are, so the primary
// actions can never be clipped off the edge of a narrow top bar.
export function MobileTabBar() {
  const pathname = usePathname();
  const tabs = [
    { href: "/", label: "Home", icon: House },
    ...destinations
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-campus-border bg-campus-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.href === "/" ? pathname === "/" : isActive(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                  active ? "text-campus-brand" : "text-campus-muted"
                )}
                href={tab.href}
              >
                <Icon size={21} weight={active ? "fill" : "regular"} />
                {tab.label}
              </Link>
            </li>
          );
        })}
        <li>
          <InboxNavLink compact />
        </li>
      </ul>
    </nav>
  );
}
