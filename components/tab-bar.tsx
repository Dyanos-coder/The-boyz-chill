"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Plus, Ticket, User, Users } from "lucide-react";
import type { ReactNode } from "react";

const TABS = [
  { href: "/", label: "Plans", icon: Ticket },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/plans/nouveau", label: "Lance un plan", icon: Plus, fab: true },
  { href: "/groupe", label: "Le groupe", icon: Users },
  { href: "/moi", label: "Moi", icon: User },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/"
      ? pathname === "/" || (pathname.startsWith("/plans/") && pathname !== "/plans/nouveau")
      : pathname.startsWith(href);
}

/** Mobile : barre d'onglets en bas avec le bouton créer au centre. */
export function TabBar() {
  const isActive = useIsActive();

  return (
    <div className="app-tabbar">
      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.map(({ href, label, icon: Icon, fab }) =>
          fab ? (
            <Link key={href} className="tab" href={href} aria-label={label} aria-current={isActive(href) ? "page" : undefined}>
              <span className="tab__fab">
                <Icon className="i" aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <Link key={href} className="tab" href={href} aria-current={isActive(href) ? "page" : undefined}>
              <Icon className="i" aria-hidden="true" />
              {label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}

/** PC : barre latérale fixe. */
export function SideNav({ logo, footer }: { logo: ReactNode; footer: ReactNode }) {
  const isActive = useIsActive();
  const create = TABS.find((t) => t.fab)!;

  return (
    <aside className="app-sidebar">
      <Link href="/" className="link-plain app-sidebar__logo" aria-label="Accueil">
        {logo}
      </Link>
      <Link href={create.href} className="btn btn--accent btn--lg" aria-current={isActive(create.href) ? "page" : undefined}>
        <create.icon className="i" aria-hidden="true" />
        {create.label}
      </Link>
      <nav className="side-nav" aria-label="Navigation principale">
        {TABS.filter((t) => !t.fab).map(({ href, label, icon: Icon }) => (
          <Link key={href} className="side-nav__link" href={href} aria-current={isActive(href) ? "page" : undefined}>
            <Icon className="i" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="app-sidebar__footer">{footer}</div>
    </aside>
  );
}
