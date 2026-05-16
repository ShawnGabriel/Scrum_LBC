import { useQuery } from "@tanstack/react-query";
import type { ActivityLog, User } from "@/generated/prisma/client";

type ActivityWithUser = ActivityLog & { user: User };

async function fetchActivity(): Promise<ActivityWithUser[]> {
  const res = await fetch("/api/activity?limit=10");
  if (!res.ok) {
    throw new Error("Failed to fetch activity");
  }
  const data = await res.json();
  return data.activities ?? data;
}

export function useActivity() {
  return useQuery<ActivityWithUser[]>({
    queryKey: ["activity"],
    queryFn: fetchActivity,
    refetchInterval: 15000,
  });
}
