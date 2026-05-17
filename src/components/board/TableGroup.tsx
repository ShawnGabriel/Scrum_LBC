"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Idea, Task, Submission, User, TaskStatus } from "@/generated/prisma/client";
import { getStatusColor } from "@/lib/status";
import { ProgressBar } from "./ProgressBar";
import { TableRow } from "./TableRow";
import { Avatar } from "@/components/ui/avatar";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: { changedAt: Date }[];
};

interface TableGroupProps {
  idea: Idea & { tasks: TaskWithRelations[]; assignee: User | null };
  currentUserId: string;
  userRole: string;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  defaultExpanded?: boolean;
}

export function TableGroup({
  idea,
  currentUserId,
  userRole,
  onTaskClick,
  onStatusChange,
  defaultExpanded = true,
}: TableGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const completed = idea.tasks.filter((t) => t.status === "COMPLETED").length;
  const total = idea.tasks.length;

  const urgentTask = idea.tasks.find((t) => t.status !== "COMPLETED") ?? idea.tasks[0];
  const accentColor = urgentTask ? getStatusColor(urgentTask.status) : "#6B7493";

  return (
    <div className="mb-4 overflow-hidden rounded-sm border border-border bg-surface">
      {/* Group header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-hover"
      >
        <div
          className="h-4 w-0.5 rounded-sm"
          style={{ backgroundColor: accentColor }}
        />
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-[12px] font-semibold uppercase tracking-wider text-foreground">
          {idea.title}
        </span>
        {idea.assignee && (
          <div className="flex items-center gap-1.5">
            <Avatar name={idea.assignee.name} size="xs" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {idea.assignee.name}
            </span>
          </div>
        )}
        <div className="ml-auto">
          <ProgressBar completed={completed} total={total} />
        </div>
      </button>

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
            <div className="w-[120px] border-l border-border py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-label">
              Person
            </div>
            <div className="w-[140px] border-l border-border py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-label">
              Last Commit
            </div>
            <div className="w-[100px] border-l border-border py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-label">
              Updated
            </div>
          </div>

          {/* Task rows */}
          {idea.tasks.map((task) => (
            <TableRow
              key={task.id}
              task={task}
              assigneeName={idea.assignee?.name ?? null}
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
