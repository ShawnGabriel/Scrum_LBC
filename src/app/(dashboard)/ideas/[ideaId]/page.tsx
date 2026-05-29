import { notFound, redirect } from "next/navigation";
import { FileText, Download, ExternalLink } from "lucide-react";
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {idea.title}
          </h1>
          {idea.description && !idea.prdUrl && (
            <p className="text-sm text-muted-foreground">{idea.description}</p>
          )}
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

      {idea.prdUrl && (
        <section className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Product Requirements
              </h2>
              {idea.prdFilename && (
                <span className="text-xs text-muted-foreground">
                  · {idea.prdFilename}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={idea.prdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-150 ease-out hover:bg-surface-hover hover:border-border-strong active:scale-95"
              >
                <ExternalLink className="h-3 w-3" />
                Open
              </a>
              <a
                href={idea.prdUrl}
                download={idea.prdFilename ?? "PRD.pdf"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-150 ease-out hover:bg-surface-hover hover:border-border-strong active:scale-95"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface/60 backdrop-blur-sm">
            <iframe
              src={`${idea.prdUrl}#toolbar=1&view=FitH`}
              title={`PRD for ${idea.title}`}
              className="block h-[640px] w-full"
            />
          </div>
        </section>
      )}

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
