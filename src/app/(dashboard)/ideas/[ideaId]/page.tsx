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
      creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
      lead: { select: { id: true, name: true, username: true, avatarUrl: true } },
      tasks: {
        orderBy: { order: "asc" },
        include: {
          assignee: { select: { id: true, name: true, username: true, avatarUrl: true } },
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

  const associates = await prisma.user.findMany({
    where: { role: "ASSOCIATE" },
    select: { id: true, name: true, username: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">{idea.title}</h1>
          <p className="text-sm text-muted-foreground">{idea.description}</p>
        </div>
        <Badge variant={statusBadgeVariant(idea.status)}>
          {idea.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">Created by:</span>{" "}
          {idea.creator.name}
        </div>
        <div>
          <span className="font-medium text-foreground">Lead:</span>{" "}
          {idea.lead?.name ?? "—"}
        </div>
        <div>
          <span className="font-medium text-foreground">Created:</span>{" "}
          {formatRelativeTime(new Date(idea.createdAt))}
        </div>
      </div>

      <IdeaDetailClient
        tasks={JSON.parse(JSON.stringify(idea.tasks))}
        currentUserId={user.id}
        isCTO={userIsCTO}
        associates={associates}
      />

      {/* Activity Log */}
      {idea.activityLogs.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Activity
          </h2>
          <div className="flex flex-col gap-2">
            {idea.activityLogs.map((log) => {
              const details = (log.details ?? {}) as Record<string, unknown>;
              return (
                <div key={log.id} className="flex items-start gap-2 text-sm">
                  <span className="font-medium text-foreground">{log.user.name}</span>
                  <span className="text-muted-foreground">
                    {log.action.toLowerCase().replace(/_/g, " ")}
                    {details.taskTitle ? ` - ${details.taskTitle}` : ""}
                  </span>
                  <span className="ml-auto text-xs text-label shrink-0">
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
