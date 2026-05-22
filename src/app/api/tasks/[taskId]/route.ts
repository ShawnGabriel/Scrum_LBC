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
    const { status, assignedToId, startDate, dueDate } = body as {
      status?: TaskStatus;
      assignedToId?: string | null;
      startDate?: string | null;
      dueDate?: string | null;
    };

    if (
      status === undefined &&
      assignedToId === undefined &&
      startDate === undefined &&
      dueDate === undefined
    ) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
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

    // assignedToId, startDate, and dueDate can only be changed by CTOs
    const ctoOnly =
      assignedToId !== undefined || startDate !== undefined || dueDate !== undefined;
    if (ctoOnly && !isCTO(userRole)) {
      return NextResponse.json(
        { error: "Only CTOs can change assignment or schedule" },
        { status: 403 }
      );
    }

    if (status !== undefined && !isCTO(userRole)) {
      if (task.assignedToId !== userId) {
        return NextResponse.json(
          { error: "You can only update tasks assigned to you" },
          { status: 403 }
        );
      }
      const allowed: TaskStatus[] = ["WHITE", "YELLOW"];
      if (!allowed.includes(task.status) || !allowed.includes(status as TaskStatus)) {
        return NextResponse.json(
          { error: "Associates can only toggle between Not Started and Working on it" },
          { status: 403 }
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (assignedToId !== undefined) updates.assignedToId = assignedToId || null;
    if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: updates,
      });

      if (status !== undefined && status !== task.status) {
        await tx.statusTransition.create({
          data: {
            taskId,
            fromStatus: task.status,
            toStatus: status as TaskStatus,
          },
        });

        await tx.activityLog.create({
          data: {
            userId,
            ideaId: task.ideaId,
            action: "STATUS_CHANGE",
            details: {
              from: task.status,
              to: status,
              taskTitle: task.title,
            },
          },
        });

        // If any task in the idea goes YELLOW and idea is DRAFT, move idea to IN_PROGRESS
        if (status === "YELLOW" && task.idea.status === "DRAFT") {
          await tx.idea.update({
            where: { id: task.ideaId },
            data: { status: "IN_PROGRESS" },
          });
        }
      }

      if (assignedToId !== undefined && assignedToId !== task.assignedToId) {
        await tx.activityLog.create({
          data: {
            userId,
            ideaId: task.ideaId,
            action: "TASK_REASSIGNED",
            details: {
              taskTitle: task.title,
              from: task.assignedToId,
              to: assignedToId || null,
            },
          },
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
