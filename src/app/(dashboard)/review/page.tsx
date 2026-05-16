import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCTO } from "@/lib/permissions";
import { ReviewQueue } from "./ReviewQueue";

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string };
  if (!isCTO(user.role)) redirect("/");

  const tasks = await prisma.task.findMany({
    where: { status: "GREEN" },
    include: {
      idea: {
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      submissions: { orderBy: { createdAt: "asc" } },
    },
    orderBy: {
      submissions: { _count: "asc" },
    },
  });

  // Sort by oldest submission first (longest-waiting)
  const sorted = [...tasks].sort((a, b) => {
    const aOldest = a.submissions[0]?.createdAt
      ? new Date(a.submissions[0].createdAt).getTime()
      : Infinity;
    const bOldest = b.submissions[0]?.createdAt
      ? new Date(b.submissions[0].createdAt).getTime()
      : Infinity;
    return aOldest - bOldest;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Review Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          {sorted.length} task{sorted.length !== 1 ? "s" : ""} awaiting review
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No tasks to review right now.</p>
        </div>
      ) : (
        <ReviewQueue tasks={JSON.parse(JSON.stringify(sorted))} />
      )}
    </div>
  );
}
