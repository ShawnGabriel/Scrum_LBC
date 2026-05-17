"use client";

import type { Task, Submission, TaskStatus } from "@/generated/prisma/client";
import { StatusPill } from "./StatusPill";
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

  const canEdit = userRole === "CTO" || true; // employees can change their own tasks

  return (
    <div
      onClick={() => onTaskClick(task.id)}
      className="group flex cursor-pointer items-center border-b border-[#E6E9EF] bg-white transition-colors hover:bg-[#F5F6F8]"
    >
      {/* Task name */}
      <div className="flex min-w-0 flex-1 items-center gap-3 py-2 pl-10 pr-3">
        <span className="truncate text-sm text-[#323338]">
          {task.title}
        </span>
        {task.revisionTasks.length > 0 && (
          <span className="shrink-0 rounded-full bg-[#E2445C]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#E2445C]">
            {task.revisionTasks.length} revision{task.revisionTasks.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Status */}
      <div className="flex w-[140px] shrink-0 items-center justify-center border-l border-[#E6E9EF] py-2">
        <StatusPill
          taskId={task.id}
          status={task.status}
          canEdit={canEdit}
          onStatusChange={onStatusChange}
        />
      </div>

      {/* Assignee */}
      <div className="flex w-[120px] shrink-0 items-center justify-center border-l border-[#E6E9EF] py-2">
        {assigneeName && (
          <Avatar name={assigneeName} size="sm" />
        )}
      </div>

      {/* Last submission */}
      <div className="flex w-[140px] shrink-0 items-center justify-center border-l border-[#E6E9EF] py-2">
        {lastSubmission ? (
          <span className="truncate rounded bg-[#F5F6F8] px-2 py-0.5 font-mono text-[11px] text-[#676879]">
            {lastSubmission.commitRef.slice(0, 8)}
          </span>
        ) : (
          <span className="text-[11px] text-[#C5C7D0]">—</span>
        )}
      </div>

      {/* Time in status */}
      <div className="flex w-[100px] shrink-0 items-center justify-center border-l border-[#E6E9EF] py-2">
        <span className="text-[11px] text-[#676879]">{timeInStatus}</span>
      </div>
    </div>
  );
}
