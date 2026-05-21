"use client";

import { Suspense } from "react";
import type { Idea, Task, Submission, User, TaskStatus } from "@/generated/prisma/client";
import { useViewPreference } from "@/hooks/use-view-preference";
import { useDetailPanel } from "@/hooks/use-detail-panel";
import { ViewSwitcher } from "./ViewSwitcher";
import { TableView } from "./TableView";
import { KanbanView } from "./KanbanView";
import { RoadmapView } from "./RoadmapView";
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
        <ViewSwitcher view={view} onChange={setView} />

        <div>
          <p className="text-[10px] uppercase tracking-wider text-label">
            SCRUM · LBC · BOARD
          </p>
          <h1 className="mt-1 text-lg font-semibold uppercase tracking-wide text-foreground">
            Team Board
          </h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Overview of all tasks and progress
          </p>
        </div>

        {view === "table" && (
          <TableView
            ideas={ideas}
            currentUserId={currentUserId}
            userRole={userRole}
            onTaskClick={openPanel}
          />
        )}
        {view === "kanban" && (
          <KanbanView
            ideas={ideas}
            currentUserId={currentUserId}
            userRole={userRole}
            onTaskClick={openPanel}
          />
        )}
        {view === "roadmap" && (
          <RoadmapView ideas={ideas} onTaskClick={openPanel} />
        )}
      </div>

      <Suspense fallback={null}>
        <DetailPanel currentUserId={currentUserId} userRole={userRole} />
      </Suspense>
    </>
  );
}
