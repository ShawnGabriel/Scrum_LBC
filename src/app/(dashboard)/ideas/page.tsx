import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCTO } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

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

export default async function IdeasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string };

  const ideas = await prisma.idea.findMany({
    include: {
      _count: { select: { tasks: true } },
      creator: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Ideas</h1>
        {isCTO(user.role) && (
          <Link href="/ideas/new">
            <Button>Create Idea</Button>
          </Link>
        )}
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">No ideas yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Assigned To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tasks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ideas.map((idea) => (
                <tr key={idea.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/ideas/${idea.id}`}
                      className="text-sm font-medium text-primary hover:text-primary"
                    >
                      {idea.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadgeVariant(idea.status)}>
                      {idea.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {idea.assignee?.name ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {idea._count.tasks}
                  </td>
                  <td className="px-4 py-3 text-sm text-label">
                    {formatRelativeTime(new Date(idea.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
