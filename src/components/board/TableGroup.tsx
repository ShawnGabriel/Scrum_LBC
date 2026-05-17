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

  // Use the "most urgent" non-completed task's color for the group accent
  const urgentTask = idea.tasks.find((t) => t.status !== "COMPLETED") ?? idea.tasks[0];
  const accentColor = urgentTask ? getStatusColor(urgentTask.status) : "#C4C4C4";

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-[#E6E9EF] bg-white shadow-sm">
      {/* Group header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F5F6F8]"
      >
        <div
          className="h-5 w-1 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-[#676879]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[#676879]" />
        )}
        <span className="text-sm font-semibold text-[#323338]">
          {idea.title}
        </span>
        {idea.assignee && (
          <div className="flex items-center gap-1.5">
            <Avatar name={idea.assignee.name} size="xs" />
            <span className="text-xs text-[#676879]">{idea.assignee.name}</span>
          </div>
        )}
        <div className="ml-auto">
          <ProgressBar completed={completed} total={total} />
        </div>
      </button>

      {/* Column headers */}
      {isExpanded && (
        <>
          <div className="flex border-t border-b border-[#E6E9EF] bg-[#F5F6F8]">
            <div className="flex-1 py-1.5 pl-10 pr-3 text-[11px] font-medium uppercase tracking-wider text-[#676879]">
              Task
            </div>
            <div className="w-[140px] border-l border-[#E6E9EF] py-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#676879]">
              Status
            </div>
            <div className="w-[120px] border-l border-[#E6E9EF] py-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#676879]">
              Person
            </div>
            <div className="w-[140px] border-l border-[#E6E9EF] py-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#676879]">
              Last Commit
            </div>
            <div className="w-[100px] border-l border-[#E6E9EF] py-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-[#676879]">
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
