"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, UserCircle2 } from "lucide-react";
import type { Task, Submission, User, TaskStatus } from "@/generated/prisma/client";
import { getStatusColor } from "@/lib/status";
import { ProgressBar } from "./ProgressBar";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "./StatusPill";
import { RevisionsTooltip } from "./RevisionsTooltip";
import { PersonLink } from "@/components/contributions/PersonLink";
import { formatRelativeTime } from "@/lib/utils";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: { changedAt: Date }[];
};

type TaskWithIdea = TaskWithRelations & { ideaTitle: string; ideaId: string };

interface PeopleGroupProps {
  user: User | null;
  tasks: TaskWithIdea[];
  currentUserId: string;
  userRole: string;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  defaultExpanded?: boolean;
}

export function PeopleGroup({
  user,
  tasks,
  currentUserId,
  userRole,
  onTaskClick,
  onStatusChange,
  defaultExpanded = true,
}: PeopleGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const total = tasks.length;

  const urgentTask = tasks.find((t) => t.status !== "COMPLETED") ?? tasks[0];
  const accentColor = urgentTask ? getStatusColor(urgentTask.status) : "#6B7493";

  const isMe = user?.id === currentUserId;
  const displayName = user?.name ?? "Unassigned";

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-border bg-surface">
      {/* Group header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-hover"
      >
        <div
          className="h-4 w-0.5 rounded-lg"
          style={{ backgroundColor: accentColor }}
        />
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {user ? (
          <PersonLink userId={user.id} title={`View ${user.name}'s PR contributions`}>
            <Avatar name={user.name} size="sm" />
            <span className="ml-2 text-[12px] font-semibold uppercase tracking-wider text-foreground hover:text-primary">
              {displayName}
            </span>
          </PersonLink>
        ) : (
          <>
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-foreground">
              {displayName}
            </span>
          </>
        )}
        {isMe && (
          <span className="rounded-lg border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
            You
          </span>
        )}
        <span className="text-[10px] uppercase tracking-wider text-label">
          {total} {total === 1 ? "task" : "tasks"}
        </span>
        <div className="ml-auto">
          <ProgressBar completed={completed} total={total} />
        </div>
      </div>

      {/* Column headers */}
      {isExpanded && (
        <>
          <div className="flex border-t border-b border-border bg-surface-elevated">
            <div className="flex-1 py-1.5 pl-10 pr-3 text-[10px] font-medium uppercase tracking-wider text-label">
              Task
            </div>
            <div className="w-[140px] border-l border-border py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-label">
              Status
            </div>
            <div className="w-[160px] border-l border-border py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-label">
              Idea
            </div>
            <div className="w-[140px] border-l border-border py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-label">
              Last Commit
            </div>
            <div className="w-[100px] border-l border-border py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-label">
              Updated
            </div>
          </div>

          {/* Task rows */}
          {tasks.map((task) => (
            <PersonTaskRow
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              userRole={userRole}
              onTaskClick={onTaskClick}
              onStatusChange={onStatusChange}
            />
          ))}
        </>
      )}
    </div>
  );
}

interface PersonTaskRowProps {
  task: TaskWithIdea;
  currentUserId: string;
  userRole: string;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

function PersonTaskRow({
  task,
  currentUserId,
  userRole,
  onTaskClick,
  onStatusChange,
}: PersonTaskRowProps) {
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
        <span className="truncate text-[12px] text-foreground">{task.title}</span>
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

      {/* Idea */}
      <div className="flex w-[160px] shrink-0 items-center justify-center border-l border-border py-2 px-2">
        <span className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
          {task.ideaTitle}
        </span>
      </div>

      {/* Last submission */}
      <div className="flex w-[140px] shrink-0 items-center justify-center border-l border-border py-2">
        {lastSubmission ? (
          <span className="truncate rounded-lg border border-border bg-surface-elevated px-2 py-0.5 font-mono text-[10px] text-primary">
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
