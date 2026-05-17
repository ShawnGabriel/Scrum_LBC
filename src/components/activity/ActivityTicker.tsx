"use client";

import type { ActivityLog, User } from "@/generated/prisma/client";
import { formatRelativeTime } from "@/lib/utils";
import { Activity } from "lucide-react";

type ActivityWithUser = ActivityLog & {
  user: User;
};

interface ActivityTickerProps {
  activities: ActivityWithUser[];
}

function compactAction(action: string): string {
  switch (action) {
    case "TASK_STARTED":
      return "YELLOW";
    case "TASK_SUBMITTED":
      return "GREEN";
    case "TASK_APPROVED":
      return "COMPLETED";
    case "TASK_REVISION_REQUESTED":
      return "ORANGE";
    case "IDEA_CREATED":
      return "created idea";
    case "IDEA_ASSIGNED":
      return "assigned idea";
    case "TASK_COMPLETED":
      return "COMPLETED";
    default:
      return action.toLowerCase().replace(/_/g, " ");
  }
}

export function ActivityTicker({ activities }: ActivityTickerProps) {
  if (activities.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-t border-border bg-surface-elevated px-4 py-2">
      <Activity className="h-4 w-4 shrink-0 text-label" />
      <div className="flex items-center gap-4 whitespace-nowrap">
        {activities.map((activity) => {
          const details = (activity.details ?? {}) as Record<string, unknown>;
          const taskTitle =
            (details.taskTitle as string) ||
            (details.task as string) ||
            (details.ideaTitle as string) ||
            "";
          const shortTitle =
            taskTitle.length > 25 ? taskTitle.substring(0, 25) + "..." : taskTitle;

          return (
            <span
              key={activity.id}
              className="text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground">
                {activity.user.name}
              </span>
              {" → "}
              <span className="font-semibold">
                {compactAction(activity.action)}
              </span>
              {shortTitle && (
                <>
                  {" on "}
                  <span className="text-muted-foreground">{shortTitle}</span>
                </>
              )}
              {" ("}
              {formatRelativeTime(new Date(activity.createdAt))}
              {")"}
            </span>
          );
        })}
      </div>
    </div>
  );
}
