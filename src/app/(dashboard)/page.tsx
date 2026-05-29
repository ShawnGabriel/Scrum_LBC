import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCTO } from "@/lib/permissions";
import { HomeClient } from "@/components/home/HomeClient";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; name?: string | null; role: string };

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
    orderBy: { updatedAt: "desc" },
  });

  // For CTOs: fetch tasks waiting on this CTO's review.
  // Task is "for me" if reviewerIds includes my id, OR if reviewerIds is empty
  // (legacy/default = any CTO can review).
  let reviewTasks: unknown[] = [];
  if (isCTO(user.role)) {
    const tasks = await prisma.task.findMany({
      where: {
        status: "GREEN",
        OR: [{ reviewerIds: { has: user.id } }, { reviewerIds: { isEmpty: true } }],
      },
      include: {
        assignee: { select: { id: true, name: true, username: true, avatarUrl: true } },
        idea: { select: { id: true, title: true } },
        submissions: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "asc" },
    });
    reviewTasks = JSON.parse(JSON.stringify(tasks));
  }

  return (
    <HomeClient
      userName={user.name ?? "there"}
      userId={user.id}
      userRole={user.role}
      ideas={JSON.parse(JSON.stringify(ideas))}
      reviewTasks={reviewTasks as never}
    />
  );
}
