"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, GitCommit } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PersonLink } from "@/components/contributions/PersonLink";
import type { TaskStatus } from "@/generated/prisma/client";

interface KanbanCardProps {
  id: string;
  title: string;
  ideaTitle: string;
  assigneeId: string | null;
  assigneeName: string | null;
  submissionCount: number;
  status: TaskStatus;
  onClick: () => void;
}

export function KanbanCard({
  id,
  title,
  ideaTitle,
  assigneeId,
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
      className={`group rounded-lg border border-border bg-surface-elevated p-3 transition-colors hover:border-border-strong hover:bg-surface-hover ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-label opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
          <p className="text-[12px] font-medium leading-tight text-foreground">
            {title}
          </p>
          <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-label">
            {ideaTitle}
          </p>

          <div className="mt-2 flex items-center justify-between">
            {assigneeName ? (
              <PersonLink userId={assigneeId} title={`View ${assigneeName}'s PR contributions`}>
                <Avatar name={assigneeName} size="xs" />
              </PersonLink>
            ) : (
              <span />
            )}
            {submissionCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
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
