import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BoardView } from "@/components/board/BoardView";
import { ActivityTicker } from "@/components/activity/ActivityTicker";
import type { BoardUser } from "@/types";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentUserId = (session.user as { id: string }).id;

  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      assignedIdeas: {
        where: {
          status: { in: ["ASSIGNED", "IN_PROGRESS", "IN_REVIEW"] },
        },
        take: 1,
        orderBy: { updatedAt: "desc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              revisionTasks: {
                orderBy: { order: "asc" },
              },
              submissions: {
                orderBy: { createdAt: "desc" },
              },
              statusTransitions: {
                orderBy: { changedAt: "desc" },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const activities = await prisma.activityLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Team Board</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of all employee tasks and progress
        </p>
      </div>

      <BoardView
        users={users as unknown as BoardUser[]}
        currentUserId={currentUserId}
      />

      <ActivityTicker activities={activities} />
    </div>
  );
}
