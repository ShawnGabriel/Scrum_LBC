"use client";

import { useState } from "react";
import { Check, GitCommit } from "lucide-react";
import type { Task, Submission, StatusTransition, TaskStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatRelativeTime } from "@/lib/utils";
import { OrangeExpandable } from "./OrangeExpandable";
import { StatusToggle } from "@/components/tasks/StatusToggle";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: StatusTransition[];
};

interface TaskPillProps {
  task: TaskWithRelations;
  isOwner: boolean;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onSubmit?: (taskId: string) => void;
}

function getTimeInStatus(statusTransitions: StatusTransition[]): string | null {
  if (statusTransitions.length === 0) return null;
  const sorted = [...statusTransitions].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );
  return formatRelativeTime(new Date(sorted[0].changedAt));
}

function statusVariant(status: string) {
  switch (status) {
    case "WHITE":
      return "white" as const;
    case "YELLOW":
      return "yellow" as const;
    case "GREEN":
      return "green" as const;
    case "ORANGE":
      return "orange" as const;
    case "COMPLETED":
      return "completed" as const;
    default:
      return "default" as const;
  }
}

export function TaskPill({ task, isOwner, onStatusChange, onSubmit }: TaskPillProps) {
  const colors = getStatusColor(task.status);
  const timeInStatus = getTimeInStatus(task.statusTransitions);
  const latestSubmission =
    task.submissions.length > 0
      ? task.submissions.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;

  return (
    <div
      className="group/pill flex flex-col gap-2 rounded-xl border bg-surface/80 backdrop-blur-sm px-3.5 py-2.5 transition-all duration-200 ease-out hover:bg-surface-hover hover:border-border-strong"
      style={{ borderLeftWidth: "4px", borderLeftColor: colors.border }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground truncate">
          {task.title}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {timeInStatus && (
            <span className="text-xs text-label">{timeInStatus}</span>
          )}
          <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
        </div>
      </div>

      {/* WHITE status: show Start Working button if owner */}
      {task.status === "WHITE" && isOwner && (
        <StatusToggle
          taskId={task.id}
          onToggle={() => onStatusChange?.(task.id, "YELLOW" as TaskStatus)}
        />
      )}

      {/* GREEN status: show commit ref */}
      {task.status === "GREEN" && latestSubmission && (
        <div className="flex items-center gap-1.5 text-xs text-status-green">
          <GitCommit className="h-3.5 w-3.5" />
          <code className="rounded-xl bg-status-green/15 px-1.5 py-0.5 font-mono text-[11px]">
            {latestSubmission.commitRef.substring(0, 8)}
          </code>
        </div>
      )}

      {/* ORANGE status: show revision tasks */}
      {task.status === "ORANGE" && task.revisionTasks.length > 0 && (
        <OrangeExpandable revisionTasks={task.revisionTasks} />
      )}

      {/* COMPLETED status: checkmark */}
      {task.status === "COMPLETED" && (
        <div className="flex items-center gap-1.5 text-xs text-status-completed">
          <Check className="h-3.5 w-3.5" />
          <span>Completed</span>
        </div>
      )}
    </div>
  );
}
