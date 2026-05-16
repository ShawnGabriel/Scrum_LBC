import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { LoadMoreActivities } from "./LoadMoreActivities";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activities = await prisma.activityLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  const cursor =
    activities.length === 50
      ? activities[activities.length - 1].id
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Activity Feed</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <ActivityFeed activities={JSON.parse(JSON.stringify(activities))} />
      </div>

      {cursor && (
        <LoadMoreActivities initialCursor={cursor} />
      )}
    </div>
  );
}
