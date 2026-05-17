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
import { getStatusLabel } from "@/lib/status";
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
    idea: {
      id: string;
      title: string;
      assignee: { id: string; name: string } | null;
      creator: { id: string; name: string };
    };
    submissions: {
      id: string;
      commitRef: string;
      repoUrl: string | null;
      branch: string | null;
      message: string | null;
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
  const isAssignee = task.idea.assignee?.id === currentUserId;

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
      <div className="border-b border-[#E6E9EF] px-5 py-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-[#323338]">{task.title}</h3>
          <StatusPill
            taskId={task.id}
            status={task.status}
            canEdit={isCTO || isAssignee}
            onStatusChange={handleStatusChange}
          />
        </div>

        {task.description && (
          <p className="mb-3 text-sm text-[#676879]">{task.description}</p>
        )}

        {task.isRevision && task.revisionNote && (
          <div className="mb-3 rounded-md bg-[#E2445C]/5 border border-[#E2445C]/20 px-3 py-2">
            <p className="text-xs font-medium text-[#E2445C]">Revision Note</p>
            <p className="mt-0.5 text-sm text-[#323338]">{task.revisionNote}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-20 text-xs text-[#676879]">Idea</span>
            <span className="text-[#323338]">{task.idea.title}</span>
          </div>
          {task.idea.assignee && (
            <div className="flex items-center gap-2">
              <span className="w-20 text-xs text-[#676879]">Assignee</span>
              <div className="flex items-center gap-1.5">
                <Avatar name={task.idea.assignee.name} size="xs" />
                <span className="text-sm text-[#323338]">{task.idea.assignee.name}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-20 text-xs text-[#676879]">Created</span>
            <span className="text-sm text-[#323338]">{formatRelativeTime(new Date(task.createdAt))}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-b border-[#E6E9EF] px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {task.status === "WHITE" && isAssignee && (
            <Button size="sm" onClick={handleStartWork}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Start Working
            </Button>
          )}
          {task.status === "YELLOW" && isAssignee && (
            <Button size="sm" onClick={() => setSubmitOpen(true)}>
              <GitCommit className="mr-1.5 h-3.5 w-3.5" />
              Submit Work
            </Button>
          )}
          {task.status === "GREEN" && isCTO && (
            <>
              <Button size="sm" onClick={handleApprove} disabled={loading}>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                {loading ? "Approving..." : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRevisionOpen(true)}
              >
                <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                Request Revisions
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Submissions */}
      {task.submissions.length > 0 && (
        <div className="border-b border-[#E6E9EF] px-5 py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#676879]">
            Submissions
          </h4>
          <div className="space-y-3">
            {task.submissions.map((sub) => (
              <div key={sub.id} className="flex items-start gap-3">
                <GitCommit className="mt-0.5 h-4 w-4 shrink-0 text-[#00C875]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-[#F5F6F8] px-1.5 py-0.5 text-xs text-[#323338]">
                      {sub.commitRef.slice(0, 8)}
                    </code>
                    {sub.branch && (
                      <span className="text-xs text-[#676879]">{sub.branch}</span>
                    )}
                  </div>
                  {sub.message && (
                    <p className="mt-0.5 text-xs text-[#676879]">{sub.message}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-[#C5C7D0]">
                    by {sub.user.name} {formatRelativeTime(new Date(sub.createdAt))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revision tasks */}
      {task.revisionTasks.length > 0 && (
        <div className="border-b border-[#E6E9EF] px-5 py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#676879]">
            Revisions
          </h4>
          <div className="space-y-2">
            {task.revisionTasks.map((rev) => (
              <div
                key={rev.id}
                className="flex items-start gap-2 rounded-md border border-[#E6E9EF] px-3 py-2"
              >
                <div
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: rev.status === "COMPLETED" ? "#00C875" : "#E2445C" }}
                />
                <div>
                  <p className="text-sm text-[#323338]">{rev.title}</p>
                  {rev.revisionNote && (
                    <p className="mt-0.5 text-xs text-[#676879]">{rev.revisionNote}</p>
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
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#676879]">
            Activity
          </h4>
          <div className="space-y-3">
            {task.activities.map((act) => (
              <div key={act.id} className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C5C7D0]" />
                <div>
                  <p className="text-xs text-[#323338]">
                    <span className="font-medium">{act.user.name}</span>{" "}
                    {act.action.toLowerCase().replace(/_/g, " ")}
                  </p>
                  <p className="text-[11px] text-[#C5C7D0]">
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
