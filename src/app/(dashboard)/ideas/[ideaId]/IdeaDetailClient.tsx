"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Task, Submission, StatusTransition, TaskStatus, User } from "@/generated/prisma/client";
import { TaskPill } from "@/components/board/TaskPill";
import { SubmitWorkDialog } from "@/components/tasks/SubmitWorkDialog";
import { RevisionForm } from "@/components/tasks/RevisionForm";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PersonLink } from "@/components/contributions/PersonLink";
import { useToast } from "@/components/ui/toast";
import { Check, RotateCcw, GitCommit } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: StatusTransition[];
  parentTask: Task | null;
  assignee: User | null;
};

interface IdeaDetailClientProps {
  tasks: TaskWithRelations[];
  currentUserId: string;
  isCTO: boolean;
  associates: { id: string; name: string; username: string }[];
}

export function IdeaDetailClient({
  tasks,
  currentUserId,
  isCTO,
  associates,
}: IdeaDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitDialogTaskId, setSubmitDialogTaskId] = useState<string | null>(null);
  const [revisionDialogTaskId, setRevisionDialogTaskId] = useState<string | null>(null);
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);

  async function handleApprove(taskId: string) {
    setApprovingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/approve`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }
      toast("Task approved!", "success");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to approve task", "error");
    } finally {
      setApprovingTaskId(null);
    }
  }

  async function handleReassign(taskId: string, newAssigneeId: string) {
    setReassigningTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: newAssigneeId || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reassign");
      }
      toast("Task reassigned", "success");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Failed to reassign", "error");
    } finally {
      setReassigningTaskId(null);
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
        {tasks.map((task) => {
          const isMine = task.assignedToId === currentUserId;
          return (
            <div key={task.id} className="space-y-2">
              <TaskPill
                task={task}
                isOwner={isMine}
                onStatusChange={handleStatusChange}
                onSubmit={() => setSubmitDialogTaskId(task.id)}
              />

              <div className="ml-4 flex items-center gap-2 text-xs text-muted-foreground">
                {task.assignee ? (
                  <PersonLink
                    userId={task.assignee.id}
                    title={`View ${task.assignee.name}'s PR contributions`}
                    className="gap-1.5"
                  >
                    <Avatar name={task.assignee.name} size="xs" />
                    <span className="text-foreground">{task.assignee.name}</span>
                  </PersonLink>
                ) : (
                  <span className="text-label">Unassigned</span>
                )}
                {isCTO && (
                  <select
                    value={task.assignedToId ?? ""}
                    disabled={reassigningTaskId === task.id}
                    onChange={(e) => handleReassign(task.id, e.target.value)}
                    className="ml-2 h-7 rounded-lg border border-border bg-surface px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Unassign</option>
                    {associates.map((a) => (
                      <option key={a.id} value={a.id}>
                        Assign to {a.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

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

              {/* YELLOW tasks - assigned associate can submit */}
              {isMine && task.status === "YELLOW" && (
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
                <div className="ml-4 rounded-xl border border-border bg-surface-elevated p-3 space-y-2">
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
          );
        })}
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
