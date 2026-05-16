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
    <div className="flex items-center gap-2 overflow-x-auto border-t border-gray-200 bg-gray-50 px-4 py-2">
      <Activity className="h-4 w-4 shrink-0 text-gray-400" />
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
              className="text-xs text-gray-500"
            >
              <span className="font-medium text-gray-700">
                {activity.user.name}
              </span>
              {" → "}
              <span className="font-semibold">
                {compactAction(activity.action)}
              </span>
              {shortTitle && (
                <>
                  {" on "}
                  <span className="text-gray-600">{shortTitle}</span>
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
