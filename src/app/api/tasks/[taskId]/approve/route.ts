import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isCTO } from "@/lib/permissions";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!isCTO(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        idea: { include: { tasks: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "GREEN") {
      return NextResponse.json(
        { error: "Only tasks with GREEN status can be approved" },
        { status: 400 }
      );
    }

    const fromStatus = task.status;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: { status: "COMPLETED" },
      });

      await tx.statusTransition.create({
        data: {
          taskId,
          fromStatus,
          toStatus: "COMPLETED",
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user!.id,
          ideaId: task.ideaId,
          action: "TASK_APPROVED",
          details: { taskTitle: task.title },
        },
      });

      // Check if all tasks in the idea are COMPLETED
      const allCompleted = task.idea.tasks
        .filter((t) => t.id !== taskId)
        .every((t) => t.status === "COMPLETED");

      if (allCompleted) {
        await tx.idea.update({
          where: { id: task.ideaId },
          data: { status: "COMPLETED" },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Failed to approve task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
