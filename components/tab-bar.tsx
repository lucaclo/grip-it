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
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
      <ul className="glass mx-auto flex h-16 max-w-[460px] rounded-[26px] border border-white/10 px-1 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7),0_0_0_1px_rgb(183_156_255/0.08)]">
        {TABS.map(({ href, label, Icon }) => {
          const on = path === href || path.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${on ? "text-text" : "text-muted"}`}
              >
                {on && <span aria-hidden className="absolute inset-x-1.5 inset-y-1.5 -z-10 rounded-[20px] bg-gradient-to-b from-accent/25 to-accent-2/10 ring-1 ring-accent/40" />}
                <Icon aria-hidden className={`size-6 ${on ? "text-accent" : ""}`} strokeWidth={on ? 2.4 : 2} />
                {label}
                {href === "/log" && active && (
                  <span className="absolute top-2 right-[calc(50%-18px)] size-2 rounded-full bg-volt shadow-glow-volt">
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
