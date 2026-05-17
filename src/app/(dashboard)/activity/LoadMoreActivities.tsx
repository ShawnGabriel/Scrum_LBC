"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import type { ActivityLog, User } from "@/generated/prisma/client";

type ActivityWithUser = ActivityLog & { user: User };

interface LoadMoreActivitiesProps {
  initialCursor: string;
}

export function LoadMoreActivities({ initialCursor }: LoadMoreActivitiesProps) {
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/activity?cursor=${cursor}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const items: ActivityWithUser[] = data.activities ?? data;
        setActivities((prev) => [...prev, ...items]);
        if (items.length < 50) {
          setCursor(null);
        } else {
          setCursor(items[items.length - 1].id);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {activities.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <ActivityFeed activities={activities} />
        </div>
      )}

      {cursor && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </>
  );
}
