"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  CheckSquare,
  FolderKanban,
  Repeat,
  ScrollText,
  Brain,
  BarChart3,
  Zap,
} from "lucide-react";
import { SignOutButton } from "./sign-out-button";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/todos", label: "Todos", icon: CheckSquare },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/log", label: "Log", icon: ScrollText },
  { href: "/vault", label: "Vault", icon: Brain },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-bg-secondary border-r border-border p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-3 py-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-xp-bar flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-xp-bar">
            PDBclad
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-xp-bar/10 text-xp-bar"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-card"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <SignOutButton />
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary/90 backdrop-blur-xl border-t border-border flex justify-around py-2 px-1">
        {navItems.slice(0, 5).map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors",
                isActive ? "text-xp-bar" : "text-text-muted"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
