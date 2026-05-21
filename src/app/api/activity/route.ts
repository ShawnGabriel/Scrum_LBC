import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const cursor = searchParams.get("cursor");

    const limit = Math.min(Math.max(parseInt(limitParam || "20", 10), 1), 100);

    const activities = await prisma.activityLog.findMany({
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        idea: { select: { id: true, title: true } },
      },
    });

    let nextCursor: string | null = null;
    if (activities.length > limit) {
      const nextItem = activities.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ activities, nextCursor });
  } catch (error) {
    console.error("Failed to fetch activity feed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
