import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { isCTO } from "@/lib/permissions";

// Client-upload pattern: the browser uploads directly to Vercel Blob using a
// short-lived signed token issued by this route. Auth is enforced in
// onBeforeGenerateToken — only CTOs can upload PRDs.
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session?.user) throw new Error("Unauthorized");
        const role = (session.user as { role: string }).role;
        if (!isCTO(role)) throw new Error("Only CTOs can upload PRDs");

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 15 * 1024 * 1024, // 15 MB cap
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async () => {
        // Hook reserved for future audit logging. The DB write of prdUrl
        // happens when the idea is created via /api/ideas.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("PRD upload failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
