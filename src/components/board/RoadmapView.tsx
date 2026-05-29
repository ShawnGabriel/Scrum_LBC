"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from "lucide-react";
import type { Idea, Task, Submission, User, TaskStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

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

interface RoadmapViewProps {
  ideas: IdeaWithRelations[];
  userRole: string;
  onTaskClick: (taskId: string) => void;
}

const DAY_WIDTH = 36;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 32;
const STICKY_WIDTH = 320;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const STATUS_BAR_CLASS: Record<TaskStatus, string> = {
  WHITE: "bg-status-white/25 border-status-white text-status-white",
  YELLOW: "bg-status-yellow/25 border-status-yellow text-status-yellow",
  GREEN: "bg-status-green/25 border-status-green text-status-green",
  ORANGE: "bg-status-orange/25 border-status-orange text-status-orange",
  COMPLETED: "bg-status-completed/25 border-status-completed text-status-completed",
};

const STATUS_DOT_CLASS: Record<TaskStatus, string> = {
  WHITE: "bg-status-white",
  YELLOW: "bg-status-yellow",
  GREEN: "bg-status-green",
  ORANGE: "bg-status-orange",
  COMPLETED: "bg-status-completed",
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function taskRange(task: TaskWithRelations): { startMs: number; endMs: number } {
  const startMs = task.startDate
    ? new Date(task.startDate).getTime()
    : new Date(task.createdAt).getTime();
  const endMs = task.dueDate
    ? new Date(task.dueDate).getTime() + MS_PER_DAY - 1 // dueDate is inclusive end of day
    : task.status === "COMPLETED"
      ? new Date(task.updatedAt).getTime()
      : Date.now();
  return { startMs, endMs: Math.max(endMs, startMs + MS_PER_DAY) };
}

type DragState =
  | {
      kind: "move" | "resize";
      taskId: string;
      pointerStartX: number;
      initialStartMs: number;
      initialEndMs: number;
      deltaDays: number;
    }
  | null;

export function RoadmapView({ ideas, userRole, onTaskClick }: RoadmapViewProps) {
  const router = useRouter();
  const isCTO = userRole === "CTO";
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [drag, setDrag] = useState<DragState>(null);
  const dragRef = useRef<DragState>(null);
  dragRef.current = drag;

  const monthStart = anchor;
  const monthEnd = endOfMonth(anchor);
  const dayCount = monthEnd.getDate();
  const today = new Date();

  const monthLabel = anchor.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const rows = useMemo(() => {
    type Row =
      | { kind: "idea"; idea: IdeaWithRelations }
      | { kind: "task"; idea: IdeaWithRelations; task: TaskWithRelations; index: number };
    const result: Row[] = [];
    let n = 0;
    for (const idea of ideas) {
      result.push({ kind: "idea", idea });
      for (const task of idea.tasks) {
        n += 1;
        result.push({ kind: "task", idea, task, index: n });
      }
    }
    return result;
  }, [ideas]);

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.pointerStartX;
      const deltaDays = Math.round(dx / DAY_WIDTH);
      if (deltaDays !== d.deltaDays) {
        setDrag({ ...d, deltaDays });
      }
    }
    async function onUp() {
      const d = dragRef.current;
      setDrag(null);
      if (!d || d.deltaDays === 0) return;
      const dayMs = MS_PER_DAY;
      const newStartMs =
        d.kind === "move" ? d.initialStartMs + d.deltaDays * dayMs : d.initialStartMs;
      const newDueDayMs = startOfDay(d.initialEndMs) + d.deltaDays * dayMs;
      // resize and move both shift the dueDate; move also shifts the startDate.
      const body: Record<string, string | null> = {
        dueDate: new Date(newDueDayMs).toISOString(),
      };
      if (d.kind === "move") {
        body.startDate = new Date(newStartMs).toISOString();
      }
      try {
        await fetch(`/api/tasks/${d.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        router.refresh();
      } catch (err) {
        console.error("Failed to update task schedule:", err);
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, router]);

  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          No active ideas yet
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-label">
          Create an idea to get started
        </p>
      </div>
    );
  }

  const windowStartMs = monthStart.getTime();
  const windowEndMs = monthEnd.getTime() + MS_PER_DAY - 1;

  function computeBar(task: TaskWithRelations) {
    const { startMs, endMs } = taskRange(task);
    let effectiveStart = startMs;
    let effectiveEnd = endMs;
    if (drag && drag.taskId === task.id && drag.deltaDays !== 0) {
      const shift = drag.deltaDays * MS_PER_DAY;
      if (drag.kind === "move") {
        effectiveStart = drag.initialStartMs + shift;
        effectiveEnd = drag.initialEndMs + shift;
      } else {
        effectiveEnd = drag.initialEndMs + shift;
        if (effectiveEnd < effectiveStart + MS_PER_DAY) {
          effectiveEnd = effectiveStart + MS_PER_DAY;
        }
      }
    }

    const entirelyBefore = effectiveEnd < windowStartMs;
    const entirelyAfter = effectiveStart > windowEndMs;

    if (entirelyBefore || entirelyAfter) {
      return { visible: false as const, before: entirelyBefore, after: entirelyAfter };
    }

    const clampedStart = Math.max(effectiveStart, windowStartMs);
    const clampedEnd = Math.min(effectiveEnd, windowEndMs);
    const startDay = Math.floor((clampedStart - windowStartMs) / MS_PER_DAY);
    const endDay = Math.ceil((clampedEnd - windowStartMs) / MS_PER_DAY);
    const widthDays = Math.max(1, endDay - startDay);

    return {
      visible: true as const,
      left: startDay * DAY_WIDTH,
      width: widthDays * DAY_WIDTH,
      overflowLeft: effectiveStart < windowStartMs,
      overflowRight: effectiveEnd > windowEndMs,
    };
  }

  const todayInWindow =
    today.getFullYear() === anchor.getFullYear() &&
    today.getMonth() === anchor.getMonth();
  const todayOffset = todayInWindow
    ? (today.getDate() - 1) * DAY_WIDTH + DAY_WIDTH / 2
    : 0;

  const gridWidth = dayCount * DAY_WIDTH;

  function goPrev() {
    setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
  }
  function goNext() {
    setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
  }
  function goToday() {
    setAnchor(startOfMonth(new Date()));
  }

  function beginDrag(kind: "move" | "resize", task: TaskWithRelations, e: React.PointerEvent) {
    if (!isCTO) return;
    e.preventDefault();
    e.stopPropagation();
    const { startMs, endMs } = taskRange(task);
    setDrag({
      kind,
      taskId: task.id,
      pointerStartX: e.clientX,
      initialStartMs: startMs,
      initialEndMs: endMs,
      deltaDays: 0,
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <p className="text-[11px] uppercase tracking-wider text-foreground">
          {monthLabel}
        </p>
        <div className="flex items-center gap-2">
          {isCTO && (
            <span className="hidden text-[10px] uppercase tracking-wider text-label sm:inline">
              Drag bars to reschedule
            </span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={goToday}
              className="rounded-lg border border-border bg-surface-elevated px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              Today
            </button>
            <button
              onClick={goPrev}
              aria-label="Previous month"
              className="rounded-lg border border-border bg-surface-elevated p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={goNext}
              aria-label="Next month"
              className="rounded-lg border border-border bg-surface-elevated p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: STICKY_WIDTH + gridWidth }}>
          <div
            className="shrink-0 border-r border-border"
            style={{ width: STICKY_WIDTH }}
          >
            <div
              className="border-b border-border bg-surface-elevated"
              style={{ height: HEADER_HEIGHT }}
            />
            {rows.map((row) => {
              if (row.kind === "idea") {
                return (
                  <div
                    key={`idea-${row.idea.id}`}
                    className="flex items-center gap-2 border-b border-border bg-surface-elevated px-3"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-label">
                      {row.idea.title}
                    </p>
                  </div>
                );
              }
              return (
                <button
                  key={`task-${row.task.id}`}
                  onClick={() => onTaskClick(row.task.id)}
                  className="flex w-full items-center gap-2 border-b border-border px-3 text-left transition-colors hover:bg-surface-hover"
                  style={{ height: ROW_HEIGHT }}
                >
                  <span className="w-5 shrink-0 text-[10px] uppercase tracking-wider text-label">
                    {row.index}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      STATUS_DOT_CLASS[row.task.status]
                    )}
                  />
                  <span className="truncate text-[11px] text-foreground">
                    {row.task.title}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative" style={{ width: gridWidth }}>
            <div
              className="flex border-b border-border bg-surface-elevated"
              style={{ height: HEADER_HEIGHT }}
            >
              {Array.from({ length: dayCount }).map((_, idx) => {
                const day = idx + 1;
                const isToday = todayInWindow && today.getDate() === day;
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex shrink-0 items-center justify-center border-r border-border text-[10px] uppercase tracking-wider",
                      isToday
                        ? "font-semibold text-primary"
                        : "text-muted-foreground"
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {todayInWindow && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 w-px bg-primary/60"
                style={{ left: todayOffset, top: HEADER_HEIGHT }}
              >
                <div className="absolute -left-[3px] -top-1 h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
            )}

            {rows.map((row) => {
              if (row.kind === "idea") {
                return (
                  <div
                    key={`grid-idea-${row.idea.id}`}
                    className="flex border-b border-border bg-surface-elevated/40"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {Array.from({ length: dayCount }).map((_, idx) => (
                      <div
                        key={idx}
                        className="shrink-0 border-r border-border/40"
                        style={{ width: DAY_WIDTH }}
                      />
                    ))}
                  </div>
                );
              }

              const bar = computeBar(row.task);
              const isDragging = drag?.taskId === row.task.id;
              return (
                <div
                  key={`grid-task-${row.task.id}`}
                  className="relative flex border-b border-border"
                  style={{ height: ROW_HEIGHT }}
                >
                  {Array.from({ length: dayCount }).map((_, idx) => (
                    <div
                      key={idx}
                      className="shrink-0 border-r border-border/40"
                      style={{ width: DAY_WIDTH }}
                    />
                  ))}

                  {bar.visible ? (
                    <div
                      onPointerDown={(e) => isCTO && beginDrag("move", row.task, e)}
                      onClick={(e) => {
                        if (drag) return;
                        e.preventDefault();
                        onTaskClick(row.task.id);
                      }}
                      className={cn(
                        "absolute top-1/2 flex -translate-y-1/2 select-none items-center gap-1 rounded-lg border px-2 text-[10px] font-medium uppercase tracking-wider transition-shadow hover:brightness-125",
                        STATUS_BAR_CLASS[row.task.status],
                        isCTO ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                        isDragging && "shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
                      )}
                      style={{
                        left: bar.left,
                        width: bar.width,
                        height: 20,
                      }}
                    >
                      {bar.overflowLeft && (
                        <ArrowLeft className="h-2.5 w-2.5 shrink-0" />
                      )}
                      <span className="flex-1 truncate text-left pointer-events-none">
                        {row.task.title}
                      </span>
                      {bar.overflowRight && (
                        <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                      )}
                      {isCTO && (
                        <span
                          onPointerDown={(e) => beginDrag("resize", row.task, e)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Resize"
                          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
                        />
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onTaskClick(row.task.id)}
                      aria-label={`${row.task.title} — outside visible window`}
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground",
                        bar.before ? "left-2" : "right-2"
                      )}
                    >
                      {bar.before ? (
                        <ArrowLeft className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
