"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, GitCommit } from "lucide-react";
import type { Task, Submission } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RevisionForm } from "@/components/tasks/RevisionForm";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/utils";

type ReviewTask = Task & {
  assignee: { id: string; name: string; username: string; avatarUrl: string | null } | null;
  idea: { id: string; title: string };
  submissions: Submission[];
};

interface ReviewQueueProps {
  tasks: ReviewTask[];
}

export function ReviewQueue({ tasks }: ReviewQueueProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [revisionTaskId, setRevisionTaskId] = useState<string | null>(null);

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
      toast("Task approved!", "success");
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

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const latestSubmission = task.submissions[task.submissions.length - 1];
        const oldestSubmission = task.submissions[0];

        return (
          <div
            key={task.id}
            className="rounded-lg border border-border bg-surface p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Idea: {task.idea.title}
                </p>
              </div>
              <Badge variant="green">GREEN</Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {task.assignee && (
                <div className="flex items-center gap-1.5">
                  {task.assignee.avatarUrl ? (
                    <img
                      src={task.assignee.avatarUrl}
                      alt={task.assignee.name}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                      {task.assignee.name.charAt(0)}
                    </div>
                  )}
                  <span>{task.assignee.name}</span>
                </div>
              )}

              {latestSubmission && (
                <div className="flex items-center gap-1">
                  <GitCommit className="h-3 w-3" />
                  <code className="rounded bg-surface-elevated px-1 py-0.5 font-mono">
                    {latestSubmission.commitRef.substring(0, 8)}
                  </code>
                </div>
              )}

              {oldestSubmission && (
                <span>
                  Waiting {formatRelativeTime(new Date(oldestSubmission.createdAt))}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApprove(task.id)}
                disabled={approvingId === task.id}
                className="gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <Check className="h-3 w-3" />
                {approvingId === task.id ? "Approving..." : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRevisionTaskId(task.id)}
                className="gap-1.5 text-xs text-orange-700 border-orange-300 hover:bg-orange-50"
              >
                <RotateCcw className="h-3 w-3" />
                Request Revisions
              </Button>
            </div>
          </div>
        );
      })}

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
