"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Idea, Task, Submission, User, TaskStatus } from "@/generated/prisma/client";
import { STATUS_ORDER } from "@/lib/status";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: { changedAt: Date }[];
};

type IdeaWithRelations = Idea & {
  tasks: TaskWithRelations[];
  assignee: User | null;
};

interface FlatTask {
  id: string;
  title: string;
  status: TaskStatus;
  ideaTitle: string;
  assigneeName: string | null;
  submissionCount: number;
}

interface KanbanViewProps {
  ideas: IdeaWithRelations[];
  currentUserId: string;
  userRole: string;
  onTaskClick: (taskId: string) => void;
}

export function KanbanView({ ideas, currentUserId, userRole, onTaskClick }: KanbanViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Flatten all tasks from all ideas
  const allTasks: FlatTask[] = useMemo(() => {
    return ideas.flatMap((idea) =>
      idea.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        ideaTitle: idea.title,
        assigneeName: idea.assignee?.name ?? null,
        submissionCount: task.submissions.length,
      }))
    );
  }, [ideas]);

  const [tasks, setTasks] = useState(allTasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update tasks when ideas change
  useMemo(() => {
    setTasks(allTasks);
  }, [allTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Group tasks by status
  const grouped = useMemo(() => {
    const map: Record<string, FlatTask[]> = {};
    for (const s of STATUS_ORDER) map[s] = [];
    for (const t of tasks) {
      if (map[t.status]) map[t.status].push(t);
    }
    return map;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine target status: over could be a column ID (status) or another card
    let newStatus: TaskStatus;
    if (STATUS_ORDER.includes(overId as TaskStatus)) {
      newStatus = overId as TaskStatus;
    } else {
      // Dropped on another card — use that card's status
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      newStatus = overTask.status;
    }

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    // Optimistic update
    const originalTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Rollback on failure
        setTasks(originalTasks);
      } else {
        queryClient.invalidateQueries({ queryKey: ["board"] });
        router.refresh();
      }
    } catch {
      setTasks(originalTasks);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => {
          const columnTasks = grouped[status] || [];
          return (
            <KanbanColumn
              key={status}
              status={status as TaskStatus}
              itemIds={columnTasks.map((t) => t.id)}
              count={columnTasks.length}
            >
              {columnTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  ideaTitle={task.ideaTitle}
                  assigneeName={task.assigneeName}
                  submissionCount={task.submissionCount}
                  status={task.status}
                  onClick={() => onTaskClick(task.id)}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[220px] rounded-md border border-[#E6E9EF] bg-white p-3 shadow-lg">
            <p className="text-sm font-medium text-[#323338]">{activeTask.title}</p>
            <p className="mt-1 text-xs text-[#676879]">{activeTask.ideaTitle}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
