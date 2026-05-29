"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Lightbulb,
  Home,
  Activity,
  Calendar,
  CheckCircle,
  Plus,
  GitPullRequest,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface SidebarProps {
  userRole: string;
  userName: string;
}

const mainLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/board", label: "Team Board", icon: LayoutGrid },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/standup", label: "Standup", icon: Calendar },
  { href: "/contributions", label: "Contributions", icon: GitPullRequest },
];

const ctoLinks = [
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/review", label: "Review Queue", icon: CheckCircle },
  { href: "/ideas/new", label: "New Idea", icon: Plus },
];

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      <div
        aria-hidden="true"
        onMouseEnter={() => setOpen(true)}
        className="fixed inset-y-0 left-0 z-40 w-2"
      />

      <aside
        onMouseLeave={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-border bg-sidebar transition-all duration-[280ms]",
          open
            ? "translate-x-0 shadow-[8px_0_32px_rgba(0,0,0,0.45)]"
            : "-translate-x-full"
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-foreground">
            S
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Scrum · LBC
            </p>
            <p className="text-[10px] uppercase tracking-wider text-label">Workspace</p>
          </div>
        </div>

        <div className="mx-3 border-t border-border" />

        <nav className="flex-1 space-y-0.5 px-2 pt-3">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-sm px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition-all duration-200 ease-out active:scale-[0.98]",
                  active
                    ? "bg-sidebar-active-bg text-white"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-white hover:translate-x-0.5"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-r-sm bg-primary transition-all duration-300 ease-out",
                    active ? "h-5 opacity-100" : "h-0 opacity-0"
                  )}
                />
                <Icon
                  className={cn(
                    "h-[16px] w-[16px] transition-transform duration-200 ease-out",
                    "group-hover:scale-110"
                  )}
                />
                {link.label}
              </Link>
            );
          })}

          {userRole === "CTO" && (
            <>
              <div className="my-2 mx-1 border-t border-border" />
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-label">
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
                      "group relative flex items-center gap-3 rounded-sm px-3 py-2 text-[11px] font-medium uppercase tracking-wider transition-all duration-200 ease-out active:scale-[0.98]",
                      active
                        ? "bg-sidebar-hover text-foreground"
                        : "text-sidebar-text hover:bg-sidebar-hover hover:text-foreground hover:translate-x-0.5"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-r-sm bg-primary transition-all duration-300 ease-out",
                        active ? "h-5 opacity-100" : "h-0 opacity-0"
                      )}
                    />
                    <Icon
                      className={cn(
                        "h-[16px] w-[16px] transition-transform duration-200 ease-out",
                        "group-hover:scale-110"
                      )}
                    />
                    {link.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="mx-3 border-t border-border" />
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar name={userName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-foreground">{userName}</p>
            <p className="text-[10px] uppercase tracking-wider text-label">{userRole}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
