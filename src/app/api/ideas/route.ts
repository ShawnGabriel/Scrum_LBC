import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isCTO } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get("assignedTo");

    const where = assignedTo ? { assignedToId: assignedTo } : {};

    const ideas = await prisma.idea.findMany({
      where,
      include: {
        tasks: { orderBy: { order: "asc" } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ideas);
  } catch (error) {
    console.error("Failed to fetch ideas:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role: string }).role;
    if (!isCTO(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, assignedToId, tasks } = body;

    if (!title || !description || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: "title, description, and at least one task are required" },
        { status: 400 }
      );
    }

    const idea = await prisma.$transaction(async (tx) => {
      const newIdea = await tx.idea.create({
        data: {
          title,
          description,
          createdById: session.user!.id,
          assignedToId: assignedToId || null,
          status: assignedToId ? "ASSIGNED" : "DRAFT",
          tasks: {
            create: tasks.map((t: { title: string; description?: string; order?: number }) => ({
              title: t.title,
              description: t.description || null,
              order: t.order ?? 0,
            })),
          },
        },
        include: {
          tasks: { orderBy: { order: "asc" } },
          creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user!.id,
          ideaId: newIdea.id,
          action: "IDEA_CREATED",
          details: { title: newIdea.title },
        },
      });

      if (assignedToId) {
        await tx.activityLog.create({
          data: {
            userId: session.user!.id,
            ideaId: newIdea.id,
            action: "IDEA_ASSIGNED",
            details: { assignedToId },
          },
        });
      }

      return newIdea;
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error("Failed to create idea:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
