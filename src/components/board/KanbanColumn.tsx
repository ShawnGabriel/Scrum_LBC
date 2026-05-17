"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { STATUS_CONFIG } from "@/lib/status";
import type { TaskStatus } from "@/generated/prisma/client";

interface KanbanColumnProps {
  status: TaskStatus;
  children: React.ReactNode;
  itemIds: string[];
  count: number;
}

export function KanbanColumn({ status, children, itemIds, count }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex w-[240px] shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-2 flex items-center gap-2 px-1">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
          {config.label}
        </span>
        <span className="rounded-sm border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {count}
        </span>
      </div>

      {/* Drop area */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-[100px] flex-1 flex-col gap-2 rounded-sm border p-2 transition-colors ${
            isOver
              ? "border-primary bg-primary/5"
              : "border-border bg-surface"
          }`}
        >
          {children}
        </div>
      </SortableContext>
    </div>
  );
}
