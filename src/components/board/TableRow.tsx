"use client";

import type { Task, Submission, TaskStatus } from "@/generated/prisma/client";
import { StatusPill } from "./StatusPill";
import { RevisionsTooltip } from "./RevisionsTooltip";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

interface TableRowProps {
  task: Task & { submissions: Submission[]; revisionTasks: Task[]; statusTransitions: { changedAt: Date }[] };
  assigneeName: string | null;
  currentUserId: string;
  userRole: string;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

export function TableRow({
  task,
  assigneeName,
  currentUserId,
  userRole,
  onTaskClick,
  onStatusChange,
}: TableRowProps) {
  const lastSubmission = task.submissions[0];
  const lastTransition = task.statusTransitions[0];
  const timeInStatus = lastTransition
    ? formatRelativeTime(new Date(lastTransition.changedAt))
    : formatRelativeTime(new Date(task.createdAt));

  const canEdit = userRole === "CTO" || true;

  return (
    <div
      onClick={() => onTaskClick(task.id)}
      className="group flex cursor-pointer items-center border-b border-border bg-surface transition-colors hover:bg-surface-hover"
    >
      {/* Task name */}
      <div className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-10 pr-3">
        <span className="truncate text-[12px] text-foreground">
          {task.title}
        </span>
        {task.revisionTasks.length > 0 && (
          <RevisionsTooltip revisionTasks={task.revisionTasks} />
        )}
      </div>

      {/* Status */}
      <div className="flex w-[140px] shrink-0 items-center justify-center border-l border-border py-2">
        <StatusPill
          taskId={task.id}
          status={task.status}
          canEdit={canEdit}
          userRole={userRole}
          onStatusChange={onStatusChange}
        />
      </div>

      {/* Assignee */}
      <div className="flex w-[120px] shrink-0 items-center justify-center border-l border-border py-2">
        {assigneeName && <Avatar name={assigneeName} size="sm" />}
      </div>

      {/* Last submission */}
      <div className="flex w-[140px] shrink-0 items-center justify-center border-l border-border py-2">
        {lastSubmission ? (
          <span className="truncate rounded-sm border border-border bg-surface-elevated px-2 py-0.5 font-mono text-[10px] text-primary">
            {lastSubmission.commitRef.slice(0, 8)}
          </span>
        ) : (
          <span className="text-[10px] text-label">—</span>
        )}
      </div>

      {/* Time in status */}
      <div className="flex w-[100px] shrink-0 items-center justify-center border-l border-border py-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {timeInStatus}
        </span>
      </div>
    </div>
  );
}
