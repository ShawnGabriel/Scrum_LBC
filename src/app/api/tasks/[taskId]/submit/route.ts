import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
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
    const { commitRef, repoUrl, branch, message } = body;

    if (!commitRef) {
      return NextResponse.json({ error: "commitRef is required" }, { status: 400 });
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

    const userId = session.user.id;

    // Verify the task belongs to the user's assigned idea
    if (task.idea.assignedToId !== userId) {
      return NextResponse.json(
        { error: "You can only submit work for tasks assigned to you" },
        { status: 403 }
      );
    }

    const fromStatus = task.status;

    const submission = await prisma.$transaction(async (tx) => {
      const newSubmission = await tx.submission.create({
        data: {
          taskId,
          userId,
          commitRef,
          repoUrl: repoUrl || null,
          branch: branch || null,
          message: message || null,
        },
      });

      // Change task status to GREEN
      await tx.task.update({
        where: { id: taskId },
        data: { status: "GREEN" },
      });

      await tx.statusTransition.create({
        data: {
          taskId,
          fromStatus,
          toStatus: "GREEN",
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          ideaId: task.ideaId,
          action: "SUBMISSION",
          details: { commitRef, taskTitle: task.title },
        },
      });

      // Check if all tasks in the idea are GREEN or COMPLETED
      const allTasks = task.idea.tasks;
      const otherTasksReady = allTasks
        .filter((t) => t.id !== taskId)
        .every((t) => t.status === "GREEN" || t.status === "COMPLETED");

      if (otherTasksReady) {
        await tx.idea.update({
          where: { id: task.ideaId },
          data: { status: "IN_REVIEW" },
        });
      }

      return newSubmission;
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Failed to submit task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
