"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { GitCommit, Clock, AlertCircle, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/board/StatusPill";
import { SubmitWorkDialog } from "@/components/tasks/SubmitWorkDialog";
import { RevisionForm } from "@/components/tasks/RevisionForm";
import { PRBadge } from "@/components/tasks/PRBadge";
import { formatRelativeTime } from "@/lib/utils";
import type { TaskStatus } from "@/generated/prisma/client";

interface DetailPanelContentProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    isRevision: boolean;
    revisionNote: string | null;
    createdAt: string;
    assignedToId: string | null;
    assignee: { id: string; name: string; username: string } | null;
    idea: {
      id: string;
      title: string;
      lead: { id: string; name: string } | null;
      creator: { id: string; name: string };
    };
    submissions: {
      id: string;
      commitRef: string;
      repoUrl: string | null;
      branch: string | null;
      message: string | null;
      prUrl: string | null;
      prNumber: number | null;
      prState: string | null;
      prMerged: boolean;
      createdAt: string;
      user: { id: string; name: string };
    }[];
    statusTransitions: {
      id: string;
      fromStatus: TaskStatus;
      toStatus: TaskStatus;
      changedAt: string;
    }[];
    revisionTasks: {
      id: string;
      title: string;
      status: TaskStatus;
      revisionNote: string | null;
    }[];
    activities: {
      id: string;
      action: string;
      details: Record<string, string>;
      createdAt: string;
      user: { id: string; name: string };
    }[];
  };
  currentUserId: string;
  userRole: string;
  onClose: () => void;
}

export function DetailPanelContent({
  task,
  currentUserId,
  userRole,
  onClose,
}: DetailPanelContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCTO = userRole === "CTO";
  const isAssignee = task.assignedToId === currentUserId;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["task-detail", task.id] });
    queryClient.invalidateQueries({ queryKey: ["board"] });
    router.refresh();
  }

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) refresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        refresh();
        onClose();
      }
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartWork() {
    await handleStatusChange(task.id, "YELLOW" as TaskStatus);
  }

  return (
    <div className="flex flex-col">
      {/* Task info */}
      <div className="border-b border-border px-5 py-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide text-foreground">
            {task.title}
          </h3>
          <StatusPill
            taskId={task.id}
            status={task.status}
            canEdit={isCTO || isAssignee}
            userRole={userRole}
            onStatusChange={handleStatusChange}
          />
        </div>

        {task.description && (
          <p className="mb-3 text-[12px] text-muted-foreground">{task.description}</p>
        )}

        {task.isRevision && task.revisionNote && (
          <div className="mb-3 rounded-sm border border-status-orange/30 bg-status-orange/10 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-status-orange">
              Revision Note
            </p>
            <p className="mt-0.5 text-[12px] text-foreground">{task.revisionNote}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-20 text-[10px] uppercase tracking-wider text-label">Idea</span>
            <span className="text-[11px] uppercase tracking-wider text-foreground">
              {task.idea.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-[10px] uppercase tracking-wider text-label">Assignee</span>
            {task.assignee ? (
              <div className="flex items-center gap-1.5">
                <Avatar name={task.assignee.name} size="xs" />
                <span className="text-[11px] uppercase tracking-wider text-foreground">
                  {task.assignee.name}
                </span>
              </div>
            ) : (
              <span className="text-[11px] uppercase tracking-wider text-label">
                Unassigned
              </span>
            )}
          </div>
          {task.idea.lead && (
            <div className="flex items-center gap-2">
              <span className="w-20 text-[10px] uppercase tracking-wider text-label">Lead</span>
              <div className="flex items-center gap-1.5">
                <Avatar name={task.idea.lead.name} size="xs" />
                <span className="text-[11px] uppercase tracking-wider text-foreground">
                  {task.idea.lead.name}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-20 text-[10px] uppercase tracking-wider text-label">Created</span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {formatRelativeTime(new Date(task.createdAt))}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-b border-border px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {task.status === "WHITE" && isAssignee && (
            <Button size="sm" onClick={handleStartWork}>
              <Play className="mr-1.5 h-3 w-3" />
              Start Working
            </Button>
          )}
          {task.status === "YELLOW" && isAssignee && (
            <Button size="sm" onClick={() => setSubmitOpen(true)}>
              <GitCommit className="mr-1.5 h-3 w-3" />
              Submit Work
            </Button>
          )}
          {task.status === "GREEN" && isCTO && (
            <>
              <Button size="sm" onClick={handleApprove} disabled={loading}>
                <CheckCircle2 className="mr-1.5 h-3 w-3" />
                {loading ? "Approving..." : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRevisionOpen(true)}
              >
                <AlertCircle className="mr-1.5 h-3 w-3" />
                Request Revisions
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Submissions */}
      {task.submissions.length > 0 && (
        <div className="border-b border-border px-5 py-4">
          <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-label">
            Submissions
          </h4>
          <div className="space-y-3">
            {task.submissions.map((sub) => (
              <div key={sub.id} className="flex items-start gap-3">
                <GitCommit className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-green" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {sub.prUrl && sub.prNumber != null && (
                      <PRBadge
                        prUrl={sub.prUrl}
                        prNumber={sub.prNumber}
                        prState={sub.prState}
                        prMerged={sub.prMerged}
                      />
                    )}
                    <code className="rounded-sm border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] text-primary">
                      {sub.commitRef.slice(0, 8)}
                    </code>
                    {sub.branch && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {sub.branch}
                      </span>
                    )}
                  </div>
                  {sub.message && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{sub.message}</p>
                  )}
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-label">
                    by {sub.user.name} · {formatRelativeTime(new Date(sub.createdAt))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revision tasks */}
      {task.revisionTasks.length > 0 && (
        <div className="border-b border-border px-5 py-4">
          <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-label">
            Revisions
          </h4>
          <div className="space-y-2">
            {task.revisionTasks.map((rev) => (
              <div
                key={rev.id}
                className="flex items-start gap-2 rounded-sm border border-border bg-surface-elevated px-3 py-2"
              >
                <div
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: rev.status === "COMPLETED" ? "#52D499" : "#E66478",
                  }}
                />
                <div>
                  <p className="text-[11px] text-foreground">{rev.title}</p>
                  {rev.revisionNote && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {rev.revisionNote}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity */}
      {task.activities.length > 0 && (
        <div className="px-5 py-4">
          <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-label">
            Activity
          </h4>
          <div className="space-y-3">
            {task.activities.map((act) => (
              <div key={act.id} className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3 w-3 shrink-0 text-label" />
                <div>
                  <p className="text-[11px] text-foreground">
                    <span className="font-medium">{act.user.name}</span>{" "}
                    <span className="text-muted-foreground">
                      {act.action.toLowerCase().replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-label">
                    {formatRelativeTime(new Date(act.createdAt))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SubmitWorkDialog
        taskId={task.id}
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onSubmitted={refresh}
      />
      <RevisionForm
        taskId={task.id}
        open={revisionOpen}
        onOpenChange={setRevisionOpen}
        onCreated={refresh}
      />
    </div>
  );
}
