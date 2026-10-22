"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Plus, Ticket, User, Users } from "lucide-react";

const TABS = [
  { href: "/", label: "Plans", icon: Ticket },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/plans/nouveau", label: "Lance un plan", icon: Plus, fab: true },
  { href: "/groupe", label: "Le groupe", icon: Users },
  { href: "/moi", label: "Moi", icon: User },
];

export function TabBar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || (pathname.startsWith("/plans/") && pathname !== "/plans/nouveau") : pathname.startsWith(href);

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
