"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Idea, Task, Submission, User, TaskStatus } from "@/generated/prisma/client";
import { getStatusColor } from "@/lib/status";
import { ProgressBar } from "./ProgressBar";
import { TableRow } from "./TableRow";
import { Avatar } from "@/components/ui/avatar";
import { PersonLink } from "@/components/contributions/PersonLink";

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
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-label">
              Lead
            </span>
            <PersonLink userId={idea.lead.id} title={`View ${idea.lead.name}'s PR contributions`}>
              <AvatarChip name={idea.lead.name} label={`Lead: ${idea.lead.name}`} />
            </PersonLink>
          </div>
        )}
        {uniqueAssignees.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {uniqueAssignees.slice(0, 5).map((u) => (
              <PersonLink key={u.id} userId={u.id} title={`View ${u.name}'s PR contributions`}>
                <AvatarChip
                  name={u.name}
                  label={u.name}
                  className="ring-1 ring-surface hover:z-10"
                />
              </PersonLink>
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
              assigneeId={task.assignee?.id ?? null}
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

interface AvatarChipProps {
  name: string;
  label: string;
  className?: string;
}

function AvatarChip({ name, label, className }: AvatarChipProps) {
  return (
    <span className="group relative inline-flex">
      <Avatar name={name} size="xs" className={className} />
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-sm border border-border bg-surface-elevated px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
