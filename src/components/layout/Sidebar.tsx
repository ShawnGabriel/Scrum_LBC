"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  User,
  Activity,
  Calendar,
  ClipboardCheck,
  Plus,
  Kanban,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole: string;
}

const mainLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/my-work", label: "My Work", icon: User },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/standup", label: "Standup", icon: Calendar },
];

const ctoLinks = [
  { href: "/review", label: "Review Queue", icon: ClipboardCheck },
  { href: "/ideas/new", label: "Create Idea", icon: Plus },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-[#1E293B] text-white">
      <div className="flex items-center gap-2 px-6 py-5">
        <Kanban className="h-6 w-6 text-indigo-400" />
        <span className="text-lg font-bold tracking-tight">Scrum LBC</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}

        {userRole === "CTO" && (
          <>
            <div className="my-3 border-t border-white/10" />
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              CTO
            </p>
            {ctoLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
