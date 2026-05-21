import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        idea: {
          include: {
            assignee: { select: { id: true, name: true, username: true } },
            creator: { select: { id: true, name: true, username: true } },
          },
        },
        submissions: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        statusTransitions: {
          orderBy: { changedAt: "desc" },
        },
        revisionTasks: {
          orderBy: { order: "asc" },
        },
        parentTask: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get recent activity for this task's idea
    const activities = await prisma.activityLog.findMany({
      where: { ideaId: task.ideaId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ...task, activities });
  } catch (error) {
    console.error("Failed to fetch task detail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
