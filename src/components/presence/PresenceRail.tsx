"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
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

function getStatus(lastSeenAt: string | null, nowMs: number): Status {
  if (!lastSeenAt) return "offline";
  const seenMs = new Date(lastSeenAt).getTime();
  const delta = nowMs - seenMs;
  if (delta <= ONLINE_WINDOW_MS) return "online";
  if (delta <= AWAY_WINDOW_MS) return "away";
  return "offline";
}

const STATUS_DOT: Record<Status, string> = {
  online: "bg-status-green",
  away: "bg-status-yellow",
  offline: "bg-label",
};

const STATUS_LABEL: Record<Status, string> = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

interface PresenceRailProps {
  currentUserId: string;
}

export function PresenceRail({ currentUserId }: PresenceRailProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Tick locally so statuses transition without a refetch
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  // Build a flat list ordered: online → away → offline (presence-sorted).
  // Same array for both strip + expanded panel, no resorting flicker.
  const ordered = useMemo(() => {
    const users = data?.users ?? [];
    const nowMs = Date.now();
    void tick;
    const decorated = users.map((u) => ({
      user: u,
      status: getStatus(u.lastSeenAt, nowMs),
    }));
    const rank: Record<Status, number> = { online: 0, away: 1, offline: 2 };
    decorated.sort((a, b) => {
      const r = rank[a.status] - rank[b.status];
      if (r !== 0) return r;
      return a.user.name.localeCompare(b.user.name);
    });
    return decorated;
  }, [data, tick]);

  const onlineCount = ordered.filter((u) => u.status === "online").length;

  function handleEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => setExpanded(true), 120);
  }
  function handleLeave() {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setExpanded(false), 180);
  }

  // Group ordered list back into sections for the expanded panel
  const grouped = useMemo(() => {
    const buckets: Record<Status, PresenceUser[]> = {
      online: [],
      away: [],
      offline: [],
    };
    for (const { user, status } of ordered) buckets[status].push(user);
    return buckets;
  }, [ordered]);

  return (
    <aside
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={cn(
        "fixed inset-y-2 right-2 z-40 hidden flex-col overflow-hidden rounded-2xl border border-border bg-sidebar/90 backdrop-blur-xl transition-all duration-[280ms] ease-out lg:flex",
        expanded
          ? "w-[260px] shadow-[-12px_0_48px_-8px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(99,115,200,0.08)]"
          : "w-[56px]"
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {/* Header — icon-only when collapsed, full label when expanded */}
      <div className="flex h-12 items-center gap-2 border-b border-border/60 px-3.5">
        <div className="relative shrink-0">
          <Users className="h-4 w-4 text-muted-foreground" />
          {onlineCount > 0 && !expanded && (
            <span className="absolute -right-1 -top-1 inline-flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-status-green opacity-50 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-green" />
            </span>
          )}
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 items-baseline gap-1.5 transition-opacity duration-200",
            expanded ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="text-xs font-semibold text-foreground">Team</p>
          <span className="truncate text-[11px] text-label">
            · {onlineCount} online
          </span>
        </div>
      </div>

      {/* Content area — strip vs grouped panel */}
      <div className="flex-1 overflow-y-auto">
        {/* COLLAPSED STRIP — avatars only, top to bottom */}
        {!expanded && (
          <ul className="space-y-1 px-2 py-3">
            {ordered.map(({ user, status }) => (
              <li key={user.id}>
                <Link
                  href={`/contributions/${user.id}`}
                  title={`${user.name} · ${STATUS_LABEL[status]}`}
                  className={cn(
                    "group relative mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ease-out hover:scale-110 active:scale-95",
                    status === "offline" && "opacity-50 hover:opacity-100"
                  )}
                >
                  <Avatar name={user.name} size="sm" />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-sidebar",
                      STATUS_DOT[status]
                    )}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* EXPANDED PANEL — grouped by status with names */}
        {expanded && (
          <div className="px-2 py-3 animate-in fade-in duration-200">
            {(["online", "away", "offline"] as Status[]).map((status) => {
              const users = grouped[status];
              if (
                users.length === 0 &&
                status !== "online" // always show online section even if empty
              )
                return null;
              return (
                <PresenceSection
                  key={status}
                  status={status}
                  users={users}
                  currentUserId={currentUserId}
                />
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

function PresenceSection({
  status,
  users,
  currentUserId,
}: {
  status: Status;
  users: PresenceUser[];
  currentUserId: string;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 flex items-center gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-label">
        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
        {STATUS_LABEL[status]} · {users.length}
      </p>
      {users.length === 0 ? (
        <p className="px-2 text-[11px] text-label">No one is online right now</p>
      ) : (
        <ul className="space-y-0.5">
          {users.map((u) => (
            <li key={u.id}>
              <Link
                href={`/contributions/${u.id}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-150 ease-out hover:bg-sidebar-hover hover:translate-x-0.5",
                  status === "offline" && "opacity-60 hover:opacity-100"
                )}
                title={`@${u.username} · ${u.role}`}
              >
                <span className="relative inline-flex shrink-0">
                  <Avatar name={u.name} size="xs" />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-sidebar",
                      STATUS_DOT[status]
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
