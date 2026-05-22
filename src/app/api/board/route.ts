import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const associates = await prisma.user.findMany({
      where: { role: "ASSOCIATE" },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(associates);
  } catch (error) {
    console.error("Failed to fetch board data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
