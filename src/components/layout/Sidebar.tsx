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
          "fixed inset-y-2 left-2 z-50 flex w-[240px] flex-col rounded-2xl border border-border bg-sidebar/90 backdrop-blur-xl transition-all duration-[320ms]",
          open
            ? "translate-x-0 shadow-[12px_0_48px_-8px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(149,128,255,0.08)]"
            : "-translate-x-[calc(100%+12px)]"
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground bg-[linear-gradient(135deg,_#7B68EE_0%,_#9580FF_100%)] shadow-[0_4px_14px_-2px_rgba(123,104,238,0.5)]">
            S
            <span className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,_rgba(255,255,255,0.25),_transparent_50%)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              Scrum · LBC
            </p>
            <p className="text-[11px] text-label">Workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 pt-2">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98]",
                  active
                    ? "bg-sidebar-active-bg text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-sidebar-text hover:bg-sidebar-hover hover:text-white hover:translate-x-0.5"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary transition-all duration-300 ease-out",
                    active ? "h-6 opacity-100 shadow-[0_0_12px_rgba(149,128,255,0.7)]" : "h-0 opacity-0"
                  )}
                />
                <Icon
                  className={cn(
                    "h-[17px] w-[17px] transition-transform duration-200 ease-out",
                    "group-hover:scale-110",
                    active && "text-primary"
                  )}
                />
                {link.label}
              </Link>
            );
          })}

          {userRole === "CTO" && (
            <>
              <div className="my-3 mx-2 border-t border-border/60" />
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-label">
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
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98]",
                      active
                        ? "bg-sidebar-hover text-foreground"
                        : "text-sidebar-text hover:bg-sidebar-hover hover:text-foreground hover:translate-x-0.5"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary transition-all duration-300 ease-out",
                        active ? "h-6 opacity-100 shadow-[0_0_12px_rgba(149,128,255,0.7)]" : "h-0 opacity-0"
                      )}
                    />
                    <Icon
                      className={cn(
                        "h-[17px] w-[17px] transition-transform duration-200 ease-out",
                        "group-hover:scale-110",
                        active && "text-primary"
                      )}
                    />
                    {link.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="m-2 flex items-center gap-3 rounded-xl bg-sidebar-hover/50 px-3 py-2.5">
          <Avatar name={userName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            <p className="text-[11px] text-label">{userRole}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
