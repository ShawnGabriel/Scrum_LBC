"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Idea,
  Task,
  Submission,
  StatusTransition,
} from "@/generated/prisma/client";
import { TaskPill } from "@/components/board/TaskPill";
import { SubmitWorkDialog } from "@/components/tasks/SubmitWorkDialog";
import { RevisionForm } from "@/components/tasks/RevisionForm";
import { PRBadge } from "@/components/tasks/PRBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/utils";
import {
  CircleDot,
  Eye,
  AlertTriangle,
  CheckCircle2,
  GitCommit,
  ArrowRight,
  Sparkles,
  Calendar,
  Check,
  RotateCcw,
  Inbox,
} from "lucide-react";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: StatusTransition[];
  parentTask: Task | null;
};

type IdeaWithTasks = Idea & {
  tasks: TaskWithRelations[];
  creator: { id: string; name: string };
};

type ReviewTask = Task & {
  assignee: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  idea: { id: string; title: string };
  submissions: Submission[];
};

interface HomeClientProps {
  userName: string;
  userId: string;
  userRole: string;
  ideas: IdeaWithTasks[];
  reviewTasks?: ReviewTask[];
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Burning the midnight oil";
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function completedAt(task: TaskWithRelations): Date | null {
  if (task.status !== "COMPLETED") return null;
  const last = [...task.statusTransitions]
    .filter((t) => t.toStatus === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    )[0];
  return last ? new Date(last.changedAt) : null;
}

export function HomeClient({
  userName,
  userRole,
  ideas,
  reviewTasks = [],
}: HomeClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitDialogTaskId, setSubmitDialogTaskId] = useState<string | null>(
    null
  );
  const [revisionTaskId, setRevisionTaskId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const isCto = userRole === "CTO";
  const hasReviews = isCto && reviewTasks.length > 0;

  const { active, review, upNext, needsFixes, completed, all, today } =
    useMemo(() => {
      const tasks = ideas.flatMap((idea) =>
        idea.tasks.map((task) => ({ task, idea }))
      );

      // "Today" = anything that should reasonably show up on today's plate:
      //   - actively in progress (YELLOW) or needs fixes (ORANGE)
      //   - due today
      //   - or completed today
      const todayTasks = tasks.filter(({ task }) => {
        if (task.status === "YELLOW" || task.status === "ORANGE") return true;
        if (isToday(task.dueDate)) return true;
        if (task.status === "COMPLETED" && isToday(completedAt(task)))
          return true;
        return false;
      });

      return {
        all: tasks,
        active: tasks.filter((t) => t.task.status === "YELLOW"),
        review: tasks.filter((t) => t.task.status === "GREEN"),
        upNext: tasks.filter((t) => t.task.status === "WHITE"),
        needsFixes: tasks.filter((t) => t.task.status === "ORANGE"),
        completed: tasks.filter((t) => t.task.status === "COMPLETED"),
        today: todayTasks,
      };
    }, [ideas]);

  function handleStatusChange() {
    router.refresh();
  }

  function handleSubmitted() {
    setSubmitDialogTaskId(null);
    router.refresh();
  }

  const firstName = userName.split(" ")[0];

  // For CTOs, reviews count as "today's work".
  const todayTotal = today.length + reviewTasks.length;
  const todayDone = today.filter(
    (t) => t.task.status === "COMPLETED" || t.task.status === "GREEN"
  ).length;

  async function handleApprove(taskId: string) {
    setApprovingId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }
      toast("Task approved.", "success");
      router.refresh();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to approve task",
        "error"
      );
    } finally {
      setApprovingId(null);
    }
  }

  function handleRevisionsCreated() {
    setRevisionTaskId(null);
    router.refresh();
  }

  if (all.length === 0 && !hasReviews) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Greeting userName={firstName} taskCount={0} reviewCount={0} />
        <div className="rounded-lg border border-border bg-surface p-12 text-center animate-in fade-in scale-in duration-500">
          <Sparkles className="mx-auto h-8 w-8 text-primary/70 pulse-soft" />
          <p className="mt-4 text-base text-foreground">All clear.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You have no tasks assigned right now. Your CTO will assign work soon.
          </p>
          <Link
            href="/board"
            className="mt-6 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary transition-all duration-200 hover:text-primary-hover hover:gap-2.5 active:scale-95"
          >
            See team board <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  const sections: Array<{
    key: string;
    label: string;
    description: string;
    icon: typeof CircleDot;
    accent: string;
    items: typeof all;
  }> = [
    {
      key: "needs-fixes",
      label: "Needs fixes",
      description: "Revisions requested by CTO",
      icon: AlertTriangle,
      accent: "text-status-orange",
      items: needsFixes,
    },
    {
      key: "active",
      label: "In progress",
      description: "Your active focus",
      icon: CircleDot,
      accent: "text-status-yellow",
      items: active,
    },
    {
      key: "review",
      label: "In review",
      description: "Waiting on CTO sign-off",
      icon: Eye,
      accent: "text-status-green",
      items: review,
    },
    {
      key: "up-next",
      label: "Up next",
      description: "Ready when you are",
      icon: ArrowRight,
      accent: "text-status-white",
      items: upNext,
    },
    {
      key: "completed",
      label: "Recently completed",
      description: "Shipped",
      icon: CheckCircle2,
      accent: "text-status-completed",
      items: completed.slice(0, 3),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Greeting
          userName={firstName}
          taskCount={
            active.length +
            needsFixes.length +
            (isCto ? reviewTasks.length : 0)
          }
          reviewCount={isCto ? reviewTasks.length : 0}
        />
      </div>

      <DailyProgress
        done={todayDone}
        total={todayTotal}
        active={active.length}
        needsFixes={needsFixes.length}
        review={review.length}
        reviewQueue={isCto ? reviewTasks.length : 0}
      />

      {hasReviews && (
        <ReviewSection
          tasks={reviewTasks}
          approvingId={approvingId}
          onApprove={handleApprove}
          onRequestRevisions={(id) => setRevisionTaskId(id)}
        />
      )}

      {all.length > 0 && (
        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
          style={{ animationDelay: "180ms" }}
        >
          <StatStrip
            active={active.length}
            review={review.length}
            upNext={upNext.length}
            needsFixes={needsFixes.length}
          />
        </div>
      )}

      <div className="space-y-8">
        {sections
          .filter((section) => section.items.length > 0)
          .map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <section
                key={section.key}
                className="space-y-3 animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                style={{
                  animationDelay: `${260 + sectionIndex * 90}ms`,
                  animationDuration: "520ms",
                }}
              >
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${section.accent}`} />
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {section.label}
                    </h2>
                    <span className="text-[11px] text-label tabular-nums">
                      {section.items.length}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-label">
                    {section.description}
                  </p>
                </div>

                <div className="space-y-2">
                  {section.items.map(({ task, idea }, i) => (
                    <div
                      key={task.id}
                      className="group rounded-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                      style={{
                        animationDelay: `${320 + sectionIndex * 90 + i * 50}ms`,
                        animationDuration: "440ms",
                      }}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2 px-1">
                        <Link
                          href={`/ideas/${idea.id}`}
                          className="truncate text-[10px] uppercase tracking-wider text-label transition-colors duration-150 hover:text-primary"
                        >
                          {idea.title}
                        </Link>
                      </div>
                      <TaskPill
                        task={task}
                        isOwner
                        onStatusChange={handleStatusChange}
                        onSubmit={() => setSubmitDialogTaskId(task.id)}
                      />
                      {task.status === "YELLOW" && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSubmitDialogTaskId(task.id)}
                            className="gap-1.5 text-xs"
                          >
                            <GitCommit className="h-3 w-3" />
                            Submit work
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
      </div>

      <div
        className="border-t border-border pt-6 animate-in fade-in fill-mode-both"
        style={{ animationDelay: "500ms", animationDuration: "500ms" }}
      >
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground transition-all duration-200 hover:text-primary hover:gap-2.5"
        >
          See the whole team board <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {submitDialogTaskId && (
        <SubmitWorkDialog
          taskId={submitDialogTaskId}
          open={!!submitDialogTaskId}
          onOpenChange={(open) => !open && setSubmitDialogTaskId(null)}
          onSubmitted={handleSubmitted}
        />
      )}

      {revisionTaskId && (
        <RevisionForm
          taskId={revisionTaskId}
          open={!!revisionTaskId}
          onOpenChange={(open) => !open && setRevisionTaskId(null)}
          onCreated={handleRevisionsCreated}
        />
      )}
    </div>
  );
}

function Greeting({
  userName,
  taskCount,
  reviewCount,
}: {
  userName: string;
  taskCount: number;
  reviewCount: number;
}) {
  let message: string;
  if (taskCount === 0) {
    message = "Nothing urgent on your plate.";
  } else if (reviewCount > 0 && reviewCount === taskCount) {
    message =
      reviewCount === 1
        ? "1 submission waiting on your review."
        : `${reviewCount} submissions waiting on your review.`;
  } else if (reviewCount > 0) {
    message = `${taskCount} on your plate — ${reviewCount} waiting on review.`;
  } else if (taskCount === 1) {
    message = "You have 1 task that needs your attention.";
  } else {
    message = `You have ${taskCount} tasks that need your attention.`;
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-label">
        {todayLabel()}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {greeting()}, {userName}.
      </h1>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function DailyProgress({
  done,
  total,
  active,
  needsFixes,
  review,
  reviewQueue,
}: {
  done: number;
  total: number;
  active: number;
  needsFixes: number;
  review: number;
  reviewQueue: number;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const remaining = Math.max(total - done, 0);

  // SVG ring math
  const size = 88;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  const status =
    total === 0
      ? "Nothing scheduled today."
      : percent === 100
        ? "Day cleared. Take a breath."
        : percent >= 75
          ? "Almost there."
          : percent >= 40
            ? "Halfway through. Keep going."
            : remaining === 1
              ? "1 task left for today."
              : `${remaining} tasks left for today.`;

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-surface p-5 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      style={{ animationDelay: "80ms" }}
    >
      {/* Subtle gradient wash to lift the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 12% 0%, rgba(123,184,255,0.10), transparent 50%)",
        }}
      />

      <div className="relative flex items-center gap-5">
        {/* Circular progress ring */}
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            style={{ filter: "drop-shadow(0 0 8px rgba(123,184,255,0.15))" }}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-border-strong)"
              strokeWidth={stroke}
              opacity={0.5}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={
                {
                  transition:
                    "stroke-dashoffset 1100ms cubic-bezier(0.16, 1, 0.3, 1)",
                  // Re-animate from 0 on mount
                  ["--ring-circumference" as string]: circumference,
                  ["--ring-offset" as string]: offset,
                  animation:
                    "ring-fill 1100ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both",
                } as React.CSSProperties
              }
            />
            <defs>
              <linearGradient
                id="progressGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#7BB8FF" />
                <stop offset="100%" stopColor="#A8C8FF" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in fill-mode-both"
            style={{ animationDelay: "500ms", animationDuration: "500ms" }}
          >
            <span className="text-lg font-semibold tabular-nums text-foreground leading-none">
              {percent}
              <span className="text-[10px] text-muted-foreground ml-px">%</span>
            </span>
            <span className="mt-0.5 text-[9px] uppercase tracking-wider text-label">
              today
            </span>
          </div>
        </div>

        {/* Right: copy + horizontal bar + breakdown */}
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="h-3 w-3 text-label shrink-0" />
              <p className="truncate text-[10px] uppercase tracking-wider text-label">
                Today&rsquo;s focus
              </p>
            </div>
            <p
              className="text-[11px] tabular-nums text-muted-foreground animate-in fade-in fill-mode-both"
              style={{ animationDelay: "350ms" }}
            >
              <span className="font-semibold text-foreground">{done}</span>
              <span className="text-label"> / {total} done</span>
            </p>
          </div>

          <p className="text-sm text-foreground">{status}</p>

          {/* Horizontal progress bar — animated fill */}
          <div
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-border/60"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="absolute inset-y-0 left-0 origin-left rounded-full progress-grow"
              style={{
                width: `${percent}%`,
                background:
                  "linear-gradient(90deg, #7BB8FF 0%, #A8C8FF 100%)",
                boxShadow: "0 0 12px rgba(123,184,255,0.45)",
              }}
            />
          </div>

          {/* Small breakdown of what's outstanding */}
          {total > 0 && (
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-label animate-in fade-in fill-mode-both"
              style={{ animationDelay: "550ms" }}
            >
              {reviewQueue > 0 && (
                <span className="inline-flex items-center gap-1 text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {reviewQueue} to review
                </span>
              )}
              {active > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-yellow" />
                  {active} in progress
                </span>
              )}
              {review > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-green" />
                  {review} in review
                </span>
              )}
              {needsFixes > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-orange" />
                  {needsFixes} needs fixes
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  tasks,
  approvingId,
  onApprove,
  onRequestRevisions,
}: {
  tasks: ReviewTask[];
  approvingId: string | null;
  onApprove: (taskId: string) => void;
  onRequestRevisions: (taskId: string) => void;
}) {
  return (
    <section
      className="space-y-3 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
      style={{ animationDelay: "140ms", animationDuration: "520ms" }}
    >
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
            To review
          </h2>
          <span className="text-[11px] text-label tabular-nums">
            {tasks.length}
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-label">
          Submissions from your associates
        </p>
      </div>

      <div className="space-y-2">
        {tasks.map((task, i) => {
          const latest = task.submissions[0];
          const oldest = task.submissions[task.submissions.length - 1];
          const isApproving = approvingId === task.id;

          return (
            <div
              key={task.id}
              className="group relative rounded-md border border-border bg-surface p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-hover animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: "var(--color-primary)",
                animationDelay: `${200 + i * 50}ms`,
                animationDuration: "440ms",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/ideas/${task.idea.id}`}
                    className="block truncate text-[10px] uppercase tracking-wider text-label transition-colors hover:text-primary"
                  >
                    {task.idea.title}
                  </Link>
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                </div>
                {oldest && (
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-label tabular-nums">
                    {formatRelativeTime(new Date(oldest.createdAt))}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {task.assignee && (
                  <span className="inline-flex items-center gap-1.5">
                    {task.assignee.avatarUrl ? (
                      <img
                        src={task.assignee.avatarUrl}
                        alt={task.assignee.name}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-medium text-primary">
                        {task.assignee.name.charAt(0)}
                      </span>
                    )}
                    <span>{task.assignee.name}</span>
                  </span>
                )}
                {latest?.prUrl && latest.prNumber != null && (
                  <PRBadge
                    prUrl={latest.prUrl}
                    prNumber={latest.prNumber}
                    prState={latest.prState}
                    prMerged={latest.prMerged}
                  />
                )}
                {latest && (
                  <span className="inline-flex items-center gap-1">
                    <GitCommit className="h-3 w-3" />
                    <code className="rounded bg-surface-elevated px-1 py-0.5 font-mono text-[10px]">
                      {latest.commitRef.substring(0, 8)}
                    </code>
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRequestRevisions(task.id)}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  Request revisions
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApprove(task.id)}
                  disabled={isApproving}
                  className="gap-1.5 text-xs"
                >
                  <Check className="h-3 w-3" />
                  {isApproving ? "Approving…" : "Approve"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatStrip({
  active,
  review,
  upNext,
  needsFixes,
}: {
  active: number;
  review: number;
  upNext: number;
  needsFixes: number;
}) {
  const stats = [
    { label: "In progress", value: active, color: "text-status-yellow" },
    { label: "In review", value: review, color: "text-status-green" },
    { label: "Up next", value: upNext, color: "text-status-white" },
    { label: "Needs fixes", value: needsFixes, color: "text-status-orange" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="bg-surface px-4 py-3 transition-all duration-200 ease-out hover:bg-surface-hover hover:-translate-y-px animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
          style={{ animationDelay: `${200 + i * 60}ms`, animationDuration: "440ms" }}
        >
          <p className="text-[10px] uppercase tracking-wider text-label">
            {stat.label}
          </p>
          <p className={`mt-1 text-xl font-semibold tabular-nums ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
