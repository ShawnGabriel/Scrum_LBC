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
  assignee: User | null;
};

interface TableGroupProps {
  idea: Idea & { tasks: TaskWithRelations[]; lead: User | null };
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

  // Unique assignees across this idea's tasks (excludes the lead if shown separately).
  const uniqueAssignees = Array.from(
    new Map(
      idea.tasks
        .map((t) => t.assignee)
        .filter((a): a is User => Boolean(a))
        .map((a) => [a.id, a])
    ).values()
  );

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
        {idea.lead && (
          <div className="flex items-center gap-1.5" title={`Lead: ${idea.lead.name}`}>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-label">
              Lead
            </span>
            <Avatar name={idea.lead.name} size="xs" />
          </div>
        )}
        {uniqueAssignees.length > 0 && (
          <div className="flex items-center -space-x-1.5" title="Team">
            {uniqueAssignees.slice(0, 5).map((u) => (
              <span key={u.id} className="ring-1 ring-surface rounded-full">
                <Avatar name={u.name} size="xs" />
              </span>
            ))}
            {uniqueAssignees.length > 5 && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                +{uniqueAssignees.length - 5}
              </span>
            )}
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
              Assignee
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
              assigneeName={task.assignee?.name ?? null}
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
