"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, GitCommit } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { TaskStatus } from "@/generated/prisma/client";

interface KanbanCardProps {
  id: string;
  title: string;
  ideaTitle: string;
  assigneeName: string | null;
  submissionCount: number;
  status: TaskStatus;
  onClick: () => void;
}

export function KanbanCard({
  id,
  title,
  ideaTitle,
  assigneeName,
  submissionCount,
  onClick,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-md border border-[#E6E9EF] bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-[#C5C7D0] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
          <p className="text-sm font-medium text-[#323338] leading-tight">
            {title}
          </p>
          <p className="mt-1 truncate text-xs text-[#676879]">{ideaTitle}</p>

          <div className="mt-2 flex items-center justify-between">
            {assigneeName ? (
              <Avatar name={assigneeName} size="xs" />
            ) : (
              <span />
            )}
            {submissionCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-[#676879]">
                <GitCommit className="h-3 w-3" />
                {submissionCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
