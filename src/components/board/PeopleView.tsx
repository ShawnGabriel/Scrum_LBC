"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { Idea, Task, Submission, User, TaskStatus } from "@/generated/prisma/client";
import { PeopleGroup } from "./PeopleGroup";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: { changedAt: Date }[];
  assignee: User | null;
};

type IdeaWithRelations = Idea & {
  tasks: TaskWithRelations[];
  lead: User | null;
};

export type TaskWithIdea = TaskWithRelations & { ideaTitle: string; ideaId: string };

interface PeopleViewProps {
  ideas: IdeaWithRelations[];
  currentUserId: string;
  userRole: string;
  onTaskClick: (taskId: string) => void;
}

const UNASSIGNED_KEY = "__unassigned__";

export function PeopleView({ ideas, currentUserId, userRole, onTaskClick }: PeopleViewProps) {
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

  const groups = useMemo(() => {
    const map = new Map<string, { user: User | null; tasks: TaskWithIdea[] }>();
    for (const idea of ideas) {
      for (const task of idea.tasks) {
        const key = task.assignee?.id ?? UNASSIGNED_KEY;
        if (!map.has(key)) {
          map.set(key, { user: task.assignee, tasks: [] });
        }
        map.get(key)!.tasks.push({
          ...task,
          ideaTitle: idea.title,
          ideaId: idea.id,
        });
      }
    }

    return Array.from(map.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => {
        if (a.key === UNASSIGNED_KEY) return 1;
        if (b.key === UNASSIGNED_KEY) return -1;
        return (a.user?.name ?? "").localeCompare(b.user?.name ?? "");
      });
  }, [ideas]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          No active tasks yet
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-label">
          Create an idea to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {groups.map((group) => (
        <PeopleGroup
          key={group.key}
          user={group.user}
          tasks={group.tasks}
          currentUserId={currentUserId}
          userRole={userRole}
          onTaskClick={onTaskClick}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
