import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isCTO } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const { revisions } = body;

    if (!revisions || !Array.isArray(revisions) || revisions.length === 0) {
      return NextResponse.json(
        { error: "At least one revision is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { idea: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const fromStatus = task.status;

    const updatedTask = await prisma.$transaction(async (tx) => {
      // Change parent task status to ORANGE
      await tx.task.update({
        where: { id: taskId },
        data: { status: "ORANGE" },
      });

      await tx.statusTransition.create({
        data: {
          taskId,
          fromStatus,
          toStatus: "ORANGE",
        },
      });

      // Create revision subtasks
      for (const rev of revisions as { title: string; revisionNote?: string }[]) {
        await tx.task.create({
          data: {
            title: rev.title,
            revisionNote: rev.revisionNote || null,
            isRevision: true,
            parentTaskId: taskId,
            ideaId: task.ideaId,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: session.user!.id,
          ideaId: task.ideaId,
          action: "REVISION_REQUESTED",
          details: {
            taskTitle: task.title,
            revisionCount: revisions.length,
          },
        },
      });

      // Return parent task with revision tasks
      return tx.task.findUnique({
        where: { id: taskId },
        include: {
          revisionTasks: { orderBy: { createdAt: "asc" } },
          statusTransitions: { orderBy: { changedAt: "desc" } },
        },
      });
    });

    return NextResponse.json(updatedTask, { status: 201 });
  } catch (error) {
    console.error("Failed to create revisions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
