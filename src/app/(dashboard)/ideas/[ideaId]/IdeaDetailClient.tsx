"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Task, Submission, StatusTransition, TaskStatus } from "@/generated/prisma/client";
import { TaskPill } from "@/components/board/TaskPill";
import { SubmitWorkDialog } from "@/components/tasks/SubmitWorkDialog";
import { RevisionForm } from "@/components/tasks/RevisionForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Check, RotateCcw, GitCommit } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: StatusTransition[];
  parentTask: Task | null;
};

interface IdeaDetailClientProps {
  tasks: TaskWithRelations[];
  isOwner: boolean;
  isCTO: boolean;
}

export function IdeaDetailClient({ tasks, isOwner, isCTO }: IdeaDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitDialogTaskId, setSubmitDialogTaskId] = useState<string | null>(null);
  const [revisionDialogTaskId, setRevisionDialogTaskId] = useState<string | null>(null);
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);

  async function handleApprove(taskId: string) {
    setApprovingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }
      toast("Task approved!", "success");
      router.refresh();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to approve task",
        "error"
      );
    } finally {
      setApprovingTaskId(null);
    }
  }

  function handleStatusChange() {
    router.refresh();
  }

  function handleSubmitted() {
    setSubmitDialogTaskId(null);
    router.refresh();
  }

  function handleRevisionsCreated() {
    setRevisionDialogTaskId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
        Tasks
      </h2>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="space-y-2">
            <TaskPill
              task={task}
              isOwner={isOwner}
              onStatusChange={handleStatusChange}
              onSubmit={() => setSubmitDialogTaskId(task.id)}
            />

            {/* CTO actions for GREEN tasks */}
            {isCTO && task.status === "GREEN" && (
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApprove(task.id)}
                  disabled={approvingTaskId === task.id}
                  className="gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <Check className="h-3 w-3" />
                  {approvingTaskId === task.id ? "Approving..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevisionDialogTaskId(task.id)}
                  className="gap-1.5 text-xs text-orange-700 border-orange-300 hover:bg-orange-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  Request Revisions
                </Button>
              </div>
            )}

            {/* YELLOW tasks - employee can submit */}
            {isOwner && task.status === "YELLOW" && (
              <div className="ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSubmitDialogTaskId(task.id)}
                  className="gap-1.5 text-xs"
                >
                  <GitCommit className="h-3 w-3" />
                  Submit Work
                </Button>
              </div>
            )}

            {/* Submission history */}
            {task.submissions.length > 0 && (
              <div className="ml-4 rounded-md border border-border bg-surface-elevated p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Submissions
                </p>
                {task.submissions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <code className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono">
                      {sub.commitRef.substring(0, 8)}
                    </code>
                    {sub.message && <span className="truncate">{sub.message}</span>}
                    <span className="ml-auto text-label shrink-0">
                      {formatRelativeTime(new Date(sub.createdAt))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {submitDialogTaskId && (
        <SubmitWorkDialog
          taskId={submitDialogTaskId}
          open={!!submitDialogTaskId}
          onOpenChange={(open) => !open && setSubmitDialogTaskId(null)}
          onSubmitted={handleSubmitted}
        />
      )}

      {revisionDialogTaskId && (
        <RevisionForm
          taskId={revisionDialogTaskId}
          open={!!revisionDialogTaskId}
          onOpenChange={(open) => !open && setRevisionDialogTaskId(null)}
          onCreated={handleRevisionsCreated}
        />
      )}
    </div>
  );
}
