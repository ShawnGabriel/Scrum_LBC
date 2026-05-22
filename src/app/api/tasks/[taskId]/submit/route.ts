import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  parsePrUrl,
  fetchPullRequest,
  PrNotFoundError,
  PrAuthError,
} from "@/lib/github";

export const runtime = "nodejs";

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
    const { prUrl, message } = body as { prUrl?: string; message?: string };

    if (!prUrl || typeof prUrl !== "string") {
      return NextResponse.json(
        { error: "prUrl is required" },
        { status: 400 }
      );
    }

    const parsed = parsePrUrl(prUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub PR URL. Expected https://github.com/{owner}/{repo}/pull/{number}" },
        { status: 400 }
      );
    }

    let pr;
    try {
      pr = await fetchPullRequest(parsed.owner, parsed.repo, parsed.number);
    } catch (err) {
      if (err instanceof PrNotFoundError) {
        return NextResponse.json(
          { error: "PR not found, or the integration token doesn't have access to this repository." },
          { status: 404 }
        );
      }
      if (err instanceof PrAuthError) {
        return NextResponse.json(
          { error: "GitHub integration is not configured correctly. Contact your administrator." },
          { status: 502 }
        );
      }
      console.error("PR fetch failed:", err);
      return NextResponse.json(
        { error: "Could not reach GitHub. Try again in a moment." },
        { status: 502 }
      );
    }

    const prState = pr.state;
    const prMerged = pr.merged;
    if (prState === "closed" && !prMerged) {
      return NextResponse.json(
        { error: "This PR was closed without merging. Open a new PR and try again." },
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

    const userId = session.user.id;
    if (task.assignedToId !== userId) {
      return NextResponse.json(
        { error: "You can only submit work for tasks assigned to you" },
        { status: 403 }
      );
    }

    const duplicate = await prisma.submission.findFirst({
      where: {
        prOwner: parsed.owner,
        prRepo: parsed.repo,
        prNumber: parsed.number,
        task: { ideaId: task.ideaId, status: "GREEN" },
        NOT: { taskId },
      },
      include: { task: { select: { id: true, title: true } } },
    });

    const fromStatus = task.status;
    const goingToCompleted = prState === "closed" && prMerged;

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          taskId,
          userId,
          commitRef: pr.head.sha,
          repoUrl: pr.base.repo.html_url,
          branch: pr.head.ref,
          message: message?.trim() || null,
          prUrl: pr.html_url,
          prOwner: parsed.owner,
          prRepo: parsed.repo,
          prNumber: parsed.number,
          prTitle: pr.title,
          prState,
          prMerged,
          prMergeCommitSha: pr.merge_commit_sha,
          prAuthorLogin: pr.user?.login ?? null,
          lastSyncedAt: new Date(),
        },
      });

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
          details: {
            taskTitle: task.title,
            prUrl: pr.html_url,
            prNumber: parsed.number,
          },
        },
      });

      if (goingToCompleted) {
        await tx.task.update({
          where: { id: taskId },
          data: { status: "COMPLETED" },
        });
        await tx.statusTransition.create({
          data: {
            taskId,
            fromStatus: "GREEN",
            toStatus: "COMPLETED",
          },
        });
        await tx.activityLog.create({
          data: {
            userId,
            ideaId: task.ideaId,
            action: "PR_MERGED",
            details: {
              taskTitle: task.title,
              prUrl: pr.html_url,
              prNumber: parsed.number,
            },
          },
        });
      }

      const allTasks = task.idea.tasks;
      if (goingToCompleted) {
        const allCompleted = allTasks.every((t) =>
          t.id === taskId ? true : t.status === "COMPLETED"
        );
        if (allCompleted) {
          await tx.idea.update({
            where: { id: task.ideaId },
            data: { status: "COMPLETED" },
          });
        }
      } else {
        const otherTasksReady = allTasks
          .filter((t) => t.id !== taskId)
          .every((t) => t.status === "GREEN" || t.status === "COMPLETED");
        if (otherTasksReady) {
          await tx.idea.update({
            where: { id: task.ideaId },
            data: { status: "IN_REVIEW" },
          });
        }
      }

      return submission;
    });

    return NextResponse.json(
      {
        submission: result,
        warning: duplicate
          ? `This PR is already linked to "${duplicate.task.title}" in this idea.`
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to submit task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
