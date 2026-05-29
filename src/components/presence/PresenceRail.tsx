"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PresenceUser {
  id: string;
  name: string;
  username: string;
  role: string;
  lastSeenAt: string | null;
}

interface PresenceResponse {
  users: PresenceUser[];
  now: string;
}

type Status = "online" | "away" | "offline";

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 min
const AWAY_WINDOW_MS = 15 * 60 * 1000; // 15 min
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 s
const REFETCH_INTERVAL_MS = 30 * 1000;

const STORAGE_KEY = "scrum-lbc-presence-rail-open";

function getStatus(lastSeenAt: string | null, nowMs: number): Status {
  if (!lastSeenAt) return "offline";
  const seenMs = new Date(lastSeenAt).getTime();
  const delta = nowMs - seenMs;
  if (delta <= ONLINE_WINDOW_MS) return "online";
  if (delta <= AWAY_WINDOW_MS) return "away";
  return "offline";
}

interface PresenceRailProps {
  currentUserId: string;
}

export function PresenceRail({ currentUserId }: PresenceRailProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  // Hydrate open state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "false") setIsOpen(false);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, isOpen ? "true" : "false");
  }, [isOpen, mounted]);

  // Heartbeat: ping on mount, on tab visibility focus, and every 30s while visible
  useEffect(() => {
    let cancelled = false;
    async function heartbeat() {
      if (cancelled || document.hidden) return;
      try {
        await fetch("/api/presence", { method: "POST" });
        queryClient.invalidateQueries({ queryKey: ["presence"] });
      } catch {
        // swallow
      }
    }
    heartbeat();
    const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    const onVisibility = () => {
      if (!document.hidden) heartbeat();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [queryClient]);

  const { data } = useQuery<PresenceResponse>({
    queryKey: ["presence"],
    queryFn: async () => {
      const res = await fetch("/api/presence");
      if (!res.ok) throw new Error("Failed to load presence");
      return res.json();
    },
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: 10 * 1000,
  });

  // Tick locally so statuses transition online → away → offline without a refetch
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const grouped = useMemo(() => {
    const users = data?.users ?? [];
    const nowMs = Date.now();
    void tick;
    const buckets: Record<Status, PresenceUser[]> = {
      online: [],
      away: [],
      offline: [],
    };
    for (const u of users) {
      buckets[getStatus(u.lastSeenAt, nowMs)].push(u);
    }
    return buckets;
  }, [data, tick]);

  const onlineCount = grouped.online.length;

  return (
    <>
      {/* Collapsed: small floating chip on the right edge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-r-0 border-border bg-surface/80 backdrop-blur-md px-3 py-2.5 text-xs font-medium text-muted-foreground transition-all duration-150 ease-out hover:bg-surface-hover hover:text-foreground hover:pr-4"
          title="Show team presence"
        >
          <Users className="h-3.5 w-3.5" />
          <span className="flex items-center gap-1.5">
            <span className="relative inline-flex">
              <span className="inline-block h-2 w-2 rounded-full bg-status-green" />
              <span className="absolute inset-0 rounded-full bg-status-green animate-ping opacity-40" />
            </span>
            {onlineCount}
          </span>
        </button>
      )}

      {/* Expanded rail */}
      <aside
        className={cn(
          "fixed inset-y-2 right-2 z-30 hidden w-[220px] flex-col rounded-2xl border border-border bg-sidebar/90 backdrop-blur-xl lg:flex",
          !isOpen && "lg:hidden"
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">Team</p>
            <span className="text-[11px] text-label">· {onlineCount} online</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-hover hover:text-foreground"
            title="Collapse"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <Section
            label="Online"
            color="bg-status-green"
            users={grouped.online}
            currentUserId={currentUserId}
            emptyHint="No one is online right now"
          />
          <Section
            label="Away"
            color="bg-status-yellow"
            users={grouped.away}
            currentUserId={currentUserId}
          />
          <Section
            label="Offline"
            color="bg-label"
            users={grouped.offline}
            currentUserId={currentUserId}
            dim
          />
        </div>
      </aside>
    </>
  );
}

interface SectionProps {
  label: string;
  color: string;
  users: PresenceUser[];
  currentUserId: string;
  emptyHint?: string;
  dim?: boolean;
}

function Section({ label, color, users, currentUserId, emptyHint, dim }: SectionProps) {
  if (users.length === 0 && !emptyHint) return null;
  return (
    <div className="mb-4">
      <p className="mb-1.5 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-label">
        <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
        {label} · {users.length}
      </p>
      {users.length === 0 ? (
        <p className="px-2 text-[11px] text-label">{emptyHint}</p>
      ) : (
        <ul className="space-y-0.5">
          {users.map((u) => (
            <li key={u.id}>
              <Link
                href={`/contributions/${u.id}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-150 ease-out hover:bg-sidebar-hover hover:translate-x-0.5",
                  dim && "opacity-60 hover:opacity-100"
                )}
                title={`@${u.username} · ${u.role}`}
              >
                <span className="relative inline-flex shrink-0">
                  <Avatar name={u.name} size="xs" />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-sidebar",
                      color
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-sidebar-text">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-1 text-[10px] text-label">(you)</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
