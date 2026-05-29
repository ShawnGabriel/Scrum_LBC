import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isCTO } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
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

    const { ideaId } = await params;
    const body = await request.json();
    const { title, description, order, assignedToId, dueDate, reviewerIds } =
      body as {
        title?: string;
        description?: string;
        order?: number;
        assignedToId?: string;
        dueDate?: string;
        reviewerIds?: string[];
      };

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          title,
          description: description || null,
          order: order ?? 0,
          ideaId,
          assignedToId: assignedToId || null,
          dueDate: dueDate ? new Date(dueDate) : null,
          reviewerIds: Array.isArray(reviewerIds) ? reviewerIds : [],
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user!.id,
          ideaId,
          action: "TASK_CREATED",
          details: { taskTitle: newTask.title, taskId: newTask.id },
        },
      });

      return newTask;
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
