import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BoardClient } from "@/components/board/BoardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { id: string; role: string };

  const ideas = await prisma.idea.findMany({
    where: {
      status: { in: ["ASSIGNED", "IN_PROGRESS", "IN_REVIEW"] },
    },
    include: {
      assignee: true,
      tasks: {
        orderBy: { order: "asc" },
        include: {
          revisionTasks: { orderBy: { order: "asc" } },
          submissions: { orderBy: { createdAt: "desc" } },
          statusTransitions: { orderBy: { changedAt: "desc" } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <BoardClient
      ideas={JSON.parse(JSON.stringify(ideas))}
      currentUserId={user.id}
      userRole={user.role}
    />
  );
}
