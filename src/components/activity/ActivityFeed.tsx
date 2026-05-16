"use client";

import type { ActivityLog, User } from "@/generated/prisma/client";
import { formatRelativeTime } from "@/lib/utils";
import { User as UserIcon } from "lucide-react";

type ActivityWithUser = ActivityLog & {
  user: User;
};

interface ActivityFeedProps {
  activities: ActivityWithUser[];
}

function describeAction(action: string, details: Record<string, unknown>): string {
  const taskTitle = (details.taskTitle as string) || (details.task as string) || "a task";
  const ideaTitle = (details.ideaTitle as string) || (details.idea as string) || "";

  switch (action) {
    case "TASK_STARTED":
      return `started working on ${taskTitle}`;
    case "TASK_SUBMITTED":
      return `submitted work for ${taskTitle}`;
    case "TASK_APPROVED":
      return `approved ${taskTitle}`;
    case "TASK_REVISION_REQUESTED":
      return `requested revisions on ${taskTitle}`;
    case "IDEA_CREATED":
      return `created idea "${ideaTitle}"`;
    case "IDEA_ASSIGNED":
      return `assigned idea "${ideaTitle}"`;
    case "TASK_COMPLETED":
      return `completed ${taskTitle}`;
    default:
      return action.toLowerCase().replace(/_/g, " ");
  }
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic py-4 text-center">
        No recent activity
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {activities.map((activity) => {
        const details = (activity.details ?? {}) as Record<string, unknown>;
        return (
          <div key={activity.id} className="flex items-start gap-3">
            {activity.user.avatarUrl ? (
              <img
                src={activity.user.avatarUrl}
                alt={activity.user.name}
                className="h-7 w-7 rounded-full object-cover mt-0.5"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 mt-0.5">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-900">
                  {activity.user.name}
                </span>{" "}
                {describeAction(activity.action, details)}
              </p>
              <span className="text-xs text-gray-400">
                {formatRelativeTime(new Date(activity.createdAt))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
