"use client";

import { Dumbbell, House, Newspaper, Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/data/store";

const TABS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/log", label: "Log", Icon: Dumbbell },
  { href: "/compete", label: "Compete", Icon: Trophy },
  { href: "/feed", label: "Feed", Icon: Newspaper },
  { href: "/me", label: "Me", Icon: UserRound },
];

export function TabBar() {
  const path = usePathname();
  const active = useStore((s) => !!s.draft);
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-safe backdrop-blur">
      <ul className="mx-auto flex h-14 max-w-[480px]">
        {TABS.map(({ href, label, Icon }) => {
          const on = path === href || path.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium ${on ? "text-accent" : "text-muted"}`}
              >
                <Icon aria-hidden className="size-6" strokeWidth={on ? 2.4 : 2} />
                {label}
                {href === "/log" && active && (
                  <span className="absolute top-2 right-[calc(50%-18px)] size-2 rounded-full bg-accent">
                    <span className="sr-only">Workout in progress</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
