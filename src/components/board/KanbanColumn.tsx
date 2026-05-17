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
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <span className="text-sm font-semibold text-[#323338]">
          {config.label}
        </span>
        <span className="rounded-full bg-[#F5F6F8] px-1.5 py-0.5 text-[11px] font-medium text-[#676879]">
          {count}
        </span>
      </div>

      {/* Drop area */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-[100px] flex-1 flex-col gap-2 rounded-lg border-2 border-dashed p-2 transition-colors ${
            isOver
              ? "border-[#0073EA] bg-[#0073EA]/5"
              : "border-transparent bg-[#F5F6F8]"
          }`}
        >
          {children}
        </div>
      </SortableContext>
    </div>
  );
}
