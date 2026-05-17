"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { Idea, Task, Submission, User, TaskStatus } from "@/generated/prisma/client";
import { TableGroup } from "./TableGroup";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: { changedAt: Date }[];
};

type IdeaWithRelations = Idea & {
  tasks: TaskWithRelations[];
  assignee: User | null;
};

interface TableViewProps {
  ideas: IdeaWithRelations[];
  currentUserId: string;
  userRole: string;
  onTaskClick: (taskId: string) => void;
}

export function TableView({ ideas, currentUserId, userRole, onTaskClick }: TableViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["board"] });
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-[#676879]">No active ideas yet</p>
        <p className="mt-1 text-xs text-[#C5C7D0]">
          Create an idea to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {ideas.map((idea) => (
        <TableGroup
          key={idea.id}
          idea={idea}
          currentUserId={currentUserId}
          userRole={userRole}
          onTaskClick={onTaskClick}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
