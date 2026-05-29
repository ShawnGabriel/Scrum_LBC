import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctos = await prisma.user.findMany({
      where: { role: "CTO" },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(ctos);
  } catch (error) {
    console.error("Failed to fetch CTOs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
