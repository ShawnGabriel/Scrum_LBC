"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Idea, Task, Submission, StatusTransition, TaskStatus } from "@/generated/prisma/client";
import { TaskPill } from "@/components/board/TaskPill";
import { SubmitWorkDialog } from "@/components/tasks/SubmitWorkDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCommit } from "lucide-react";

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

interface MyWorkClientProps {
  idea: IdeaWithTasks;
  userId: string;
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "DRAFT":
      return "white" as const;
    case "ASSIGNED":
      return "yellow" as const;
    case "IN_PROGRESS":
      return "yellow" as const;
    case "IN_REVIEW":
      return "green" as const;
    case "COMPLETED":
      return "completed" as const;
    default:
      return "default" as const;
  }
}

export function MyWorkClient({ idea, userId }: MyWorkClientProps) {
  const router = useRouter();
  const [submitDialogTaskId, setSubmitDialogTaskId] = useState<string | null>(null);

  function handleStatusChange() {
    router.refresh();
  }

  function handleSubmitted() {
    setSubmitDialogTaskId(null);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{idea.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{idea.description}</p>
        </div>
        <Badge variant={statusBadgeVariant(idea.status)}>
          {idea.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="space-y-3">
        {idea.tasks.map((task) => (
          <div key={task.id} className="space-y-2">
            <TaskPill
              task={task}
              isOwner={true}
              onStatusChange={handleStatusChange}
              onSubmit={() => setSubmitDialogTaskId(task.id)}
            />

            {task.status === "YELLOW" && (
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
    </div>
  );
}
