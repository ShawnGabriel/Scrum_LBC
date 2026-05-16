import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCTO } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { IdeaDetailClient } from "./IdeaDetailClient";

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

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ ideaId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { ideaId } = await params;
  const user = session.user as { id: string; role: string };
  const userIsCTO = isCTO(user.role);

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: {
      creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      tasks: {
        orderBy: { order: "asc" },
        include: {
          submissions: { orderBy: { createdAt: "desc" } },
          revisionTasks: { orderBy: { createdAt: "asc" } },
          statusTransitions: { orderBy: { changedAt: "desc" } },
          parentTask: true,
        },
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          user: true,
        },
      },
    },
  });

  if (!idea) notFound();

  const isOwner = idea.assignedToId === user.id;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">{idea.title}</h1>
          <p className="text-sm text-gray-500">{idea.description}</p>
        </div>
        <Badge variant={statusBadgeVariant(idea.status)}>
          {idea.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div>
          <span className="font-medium text-gray-700">Created by:</span>{" "}
          {idea.creator.name}
        </div>
        <div>
          <span className="font-medium text-gray-700">Assigned to:</span>{" "}
          {idea.assignee?.name ?? "Unassigned"}
        </div>
        <div>
          <span className="font-medium text-gray-700">Created:</span>{" "}
          {formatRelativeTime(new Date(idea.createdAt))}
        </div>
      </div>

      <IdeaDetailClient
        tasks={JSON.parse(JSON.stringify(idea.tasks))}
        isOwner={isOwner}
        isCTO={userIsCTO}
      />

      {/* Activity Log */}
      {idea.activityLogs.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Activity
          </h2>
          <div className="flex flex-col gap-2">
            {idea.activityLogs.map((log) => {
              const details = (log.details ?? {}) as Record<string, unknown>;
              return (
                <div key={log.id} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-gray-700">{log.user.name}</span>
                  <span className="text-gray-500">
                    {log.action.toLowerCase().replace(/_/g, " ")}
                    {details.taskTitle ? ` - ${details.taskTitle}` : ""}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 shrink-0">
                    {formatRelativeTime(new Date(log.createdAt))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
