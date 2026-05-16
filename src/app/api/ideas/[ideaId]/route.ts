import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isCTO } from "@/lib/permissions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ideaId } = await params;

    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        tasks: {
          orderBy: { order: "asc" },
          include: {
            revisionTasks: { orderBy: { order: "asc" } },
            submissions: { orderBy: { createdAt: "desc" } },
            statusTransitions: { orderBy: { changedAt: "desc" } },
          },
        },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json(idea);
  } catch (error) {
    console.error("Failed to fetch idea:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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
    const { title, description, assignedToId, status } = body;

    const existingIdea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!existingIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId;
      // If assigning for the first time, set status to ASSIGNED
      if (!existingIdea.assignedToId && assignedToId) {
        updateData.status = "ASSIGNED";
      }
    }

    const updatedIdea = await prisma.$transaction(async (tx) => {
      const idea = await tx.idea.update({
        where: { id: ideaId },
        data: updateData,
        include: {
          tasks: { orderBy: { order: "asc" } },
          creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      if (assignedToId !== undefined && assignedToId !== existingIdea.assignedToId) {
        await tx.activityLog.create({
          data: {
            userId: session.user!.id,
            ideaId: idea.id,
            action: "IDEA_ASSIGNED",
            details: { assignedToId },
          },
        });
      }

      return idea;
    });

    return NextResponse.json(updatedIdea);
  } catch (error) {
    console.error("Failed to update idea:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
