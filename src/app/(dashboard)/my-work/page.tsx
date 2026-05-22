import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyWorkClient } from "./MyWorkClient";

export default async function MyWorkPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string };

  const ideas = await prisma.idea.findMany({
    where: { tasks: { some: { assignedToId: user.id } } },
    include: {
      tasks: {
        where: { assignedToId: user.id },
        orderBy: { order: "asc" },
        include: {
          submissions: { orderBy: { createdAt: "desc" } },
          revisionTasks: { orderBy: { createdAt: "asc" } },
          statusTransitions: { orderBy: { changedAt: "desc" } },
          parentTask: true,
        },
      },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (ideas.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">My Work</h1>
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground">No tasks assigned to you yet.</p>
          <p className="mt-1 text-sm text-label">
            Your CTO will assign tasks for you to work on.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">My Work</h1>
      {ideas.map((idea) => (
        <MyWorkClient
          key={idea.id}
          idea={JSON.parse(JSON.stringify(idea))}
          userId={user.id}
        />
      ))}
    </div>
  );
}
