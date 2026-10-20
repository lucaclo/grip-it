"use client";

import { House, Newspaper, Trophy, UserRound } from "lucide-react";
import { BarbellIcon } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/data/store";

const TABS = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/log", label: "Log", Icon: BarbellIcon },
  { href: "/compete", label: "Compete", Icon: Trophy },
  { href: "/feed", label: "Feed", Icon: Newspaper },
  { href: "/me", label: "Me", Icon: UserRound },
];

export function TabBar() {
  const path = usePathname();
  const active = useStore((s) => !!s.draft);
  const activeIndex = TABS.findIndex(({ href }) => path === href || path.startsWith(href + "/"));
  return (
    <nav
      aria-label="Main"
      style={{ viewTransitionName: "tab-bar" }}
      className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
    >
      <ul className="glass relative mx-auto flex h-16 max-w-[460px] rounded-[26px] border border-white/10 px-1 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7),0_0_0_1px_rgb(183_156_255/0.08)]">
        {activeIndex >= 0 && (
          <span
            aria-hidden
            className="absolute top-1.5 bottom-1.5 left-1 rounded-[20px] bg-gradient-to-b from-accent/25 to-accent-2/10 ring-1 ring-accent/40 transition-transform duration-500 ease-[var(--ease-spring)]"
            style={{ width: `calc((100% - 0.5rem) / ${TABS.length})`, transform: `translateX(${activeIndex * 100}%)` }}
          />
        )}
        {TABS.map(({ href, label, Icon }) => {
          const on = path === href || path.startsWith(href + "/");
          return (
            <li key={href} className="relative flex-1">
              <Link
                href={href}
                transitionTypes={[TABS.findIndex((t) => t.href === href) >= activeIndex ? "tab-forward" : "tab-back"]}
                aria-current={on ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${on ? "text-text" : "text-muted"}`}
              >
                <Icon aria-hidden className={`size-6 transition-transform duration-300 ${on ? "-translate-y-0.5 scale-110 text-accent" : ""}`} strokeWidth={on ? 2.4 : 2} />
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
