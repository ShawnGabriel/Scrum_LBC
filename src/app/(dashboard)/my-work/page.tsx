import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyWorkClient } from "./MyWorkClient";

export default async function MyWorkPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string };

  const ideas = await prisma.idea.findMany({
    where: { assignedToId: user.id },
    include: {
      tasks: {
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
        <h1 className="text-xl font-semibold text-gray-900">My Work</h1>
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No idea assigned to you yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Your CTO will assign ideas for you to work on.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">My Work</h1>
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
