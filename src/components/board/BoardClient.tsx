"use client";

import { Suspense } from "react";
import type { Idea, Task, Submission, User, TaskStatus } from "@/generated/prisma/client";
import { useViewPreference } from "@/hooks/use-view-preference";
import { useDetailPanel } from "@/hooks/use-detail-panel";
import { ViewSwitcher } from "./ViewSwitcher";
import { TableView } from "./TableView";
import { KanbanView } from "./KanbanView";
import { DetailPanel } from "@/components/panel/DetailPanel";

type TaskWithRelations = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: { changedAt: Date }[];
};

type IdeaWithRelations = Idea & {
  tasks: TaskWithRelations[];
  assignee: User | null;
};

interface BoardClientProps {
  ideas: IdeaWithRelations[];
  currentUserId: string;
  userRole: string;
}

export function BoardClient({ ideas, currentUserId, userRole }: BoardClientProps) {
  const [view, setView] = useViewPreference();
  const { open: openPanel } = useDetailPanel();

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#323338]">Team Board</h1>
            <p className="text-xs text-[#676879]">
              Overview of all tasks and progress
            </p>
          </div>
          <ViewSwitcher view={view} onChange={setView} />
        </div>

        {view === "table" ? (
          <TableView
            ideas={ideas}
            currentUserId={currentUserId}
            userRole={userRole}
            onTaskClick={openPanel}
          />
        ) : (
          <KanbanView
            ideas={ideas}
            currentUserId={currentUserId}
            userRole={userRole}
            onTaskClick={openPanel}
          />
        )}
      </div>

      <Suspense fallback={null}>
        <DetailPanel currentUserId={currentUserId} userRole={userRole} />
      </Suspense>
    </>
  );
}
