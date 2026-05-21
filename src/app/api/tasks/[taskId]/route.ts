import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isCTO } from "@/lib/permissions";
import { TaskStatus } from "@/generated/prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        idea: { include: { tasks: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const userRole = (session.user as { role: string }).role;
    const userId = session.user.id;

    // Check ownership: task must belong to user's assigned idea, or user is CTO
    if (!isCTO(userRole)) {
      if (task.idea.assignedToId !== userId) {
        return NextResponse.json(
          { error: "You can only update tasks assigned to you" },
          { status: 403 }
        );
      }
      // Associates can only toggle between WHITE and YELLOW
      const allowed: TaskStatus[] = ["WHITE", "YELLOW"];
      if (!allowed.includes(task.status) || !allowed.includes(status as TaskStatus)) {
        return NextResponse.json(
          { error: "Associates can only toggle between Not Started and Working on it" },
          { status: 403 }
        );
      }
    }

    const fromStatus = task.status;
    const toStatus = status as TaskStatus;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: { status: toStatus },
      });

      await tx.statusTransition.create({
        data: {
          taskId,
          fromStatus,
          toStatus,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          ideaId: task.ideaId,
          action: "STATUS_CHANGE",
          details: { from: fromStatus, to: toStatus, taskTitle: task.title },
        },
      });

      // If first task goes YELLOW and idea is ASSIGNED, move idea to IN_PROGRESS
      if (toStatus === "YELLOW" && task.idea.status === "ASSIGNED") {
        await tx.idea.update({
          where: { id: task.ideaId },
          data: { status: "IN_PROGRESS" },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
