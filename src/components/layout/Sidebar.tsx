"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Lightbulb,
  User,
  Activity,
  Calendar,
  CheckCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface SidebarProps {
  userRole: string;
  userName: string;
}

const mainLinks = [
  { href: "/", label: "Team Board", icon: LayoutGrid },
  { href: "/my-work", label: "My Work", icon: User },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/standup", label: "Standup", icon: Calendar },
];

const ctoLinks = [
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/review", label: "Review Queue", icon: CheckCircle },
  { href: "/ideas/new", label: "New Idea", icon: Plus },
];

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col bg-[#292F4C]">
      {/* Workspace header */}
      <div className="flex items-center gap-2 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0073EA] text-sm font-bold text-white">
          S
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Scrum LBC</p>
          <p className="text-[11px] text-[#C5C7D0]">Workspace</p>
        </div>
      </div>

      <div className="mx-3 border-t border-white/10" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 pt-3">
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
                  ? "border-l-[3px] border-l-[#0073EA] bg-[#363D59] text-white"
                  : "border-l-[3px] border-l-transparent text-[#C5C7D0] hover:bg-[#363D59] hover:text-white"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {link.label}
            </Link>
          );
        })}

        {userRole === "CTO" && (
          <>
            <div className="my-2 mx-1 border-t border-white/10" />
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#676879]">
              Management
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
                      ? "border-l-[3px] border-l-[#0073EA] bg-[#363D59] text-white"
                      : "border-l-[3px] border-l-transparent text-[#C5C7D0] hover:bg-[#363D59] hover:text-white"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {link.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info at bottom */}
      <div className="mx-3 border-t border-white/10" />
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name={userName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          <p className="text-[11px] text-[#C5C7D0]">{userRole}</p>
        </div>
      </div>
    </aside>
  );
}
