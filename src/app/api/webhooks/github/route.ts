import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/github";
import type { TaskStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PullRequestPayload = {
  action: string;
  pull_request: {
    number: number;
    state: "open" | "closed";
    merged: boolean;
    merge_commit_sha: string | null;
    title: string;
    html_url: string;
    head: { ref: string; sha: string };
    user: { login: string } | null;
  };
  repository: {
    name: string;
    owner: { login: string };
    html_url: string;
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  if (!verifyWebhookSignature(rawBody, signatureHeader)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  if (event === "ping") {
    return NextResponse.json({ ok: true });
  }
  if (event !== "pull_request") {
    return NextResponse.json({ ok: true, ignored: event });
  }

  let payload: PullRequestPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("invalid json", { status: 400 });
  }

  const pr = payload.pull_request;
  const owner = payload.repository.owner.login.toLowerCase();
  const repo = payload.repository.name.toLowerCase();
  const number = pr.number;

  const submissions = await prisma.submission.findMany({
    where: { prOwner: owner, prRepo: repo, prNumber: number },
    include: {
      task: { include: { idea: { include: { tasks: true } } } },
    },
  });

  if (submissions.length === 0) {
    return NextResponse.json({ ok: true, matched: 0 });
  }

  for (const sub of submissions) {
    try {
      await handlePrEvent(payload, sub);
    } catch (err) {
      console.error(
        `Failed to process PR event for submission ${sub.id}:`,
        err
      );
    }
  }

  return NextResponse.json({ ok: true, matched: submissions.length });
}

type SubmissionWithTask = Awaited<
  ReturnType<typeof prisma.submission.findMany>
>[number] & {
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    ideaId: string;
    idea: {
      id: string;
      tasks: { id: string; status: TaskStatus }[];
    };
  };
};

async function handlePrEvent(
  payload: PullRequestPayload,
  sub: SubmissionWithTask
) {
  const pr = payload.pull_request;
  const action = payload.action;

  const refreshActions = ["opened", "reopened", "synchronize", "edited"];

  if (refreshActions.includes(action)) {
    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        commitRef: pr.head.sha,
        prTitle: pr.title,
        prState: pr.state,
        prMerged: pr.merged,
        prMergeCommitSha: pr.merge_commit_sha,
        prAuthorLogin: pr.user?.login ?? sub.prAuthorLogin,
        lastSyncedAt: new Date(),
      },
    });
    return;
  }

  if (action === "closed") {
    if (pr.merged) {
      await handleMerged(payload, sub);
    } else {
      await handleClosedUnmerged(payload, sub);
    }
  }
}

async function handleMerged(
  payload: PullRequestPayload,
  sub: SubmissionWithTask
) {
  const pr = payload.pull_request;
  const task = sub.task;

  if (task.status !== "GREEN") {
    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        prState: pr.state,
        prMerged: true,
        prMergeCommitSha: pr.merge_commit_sha,
        lastSyncedAt: new Date(),
      },
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: sub.id },
      data: {
        prState: pr.state,
        prMerged: true,
        prMergeCommitSha: pr.merge_commit_sha,
        lastSyncedAt: new Date(),
      },
    });

    await tx.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED" },
    });

    await tx.statusTransition.create({
      data: {
        taskId: task.id,
        fromStatus: "GREEN",
        toStatus: "COMPLETED",
      },
    });

    await tx.activityLog.create({
      data: {
        userId: sub.userId,
        ideaId: task.ideaId,
        action: "PR_MERGED",
        details: {
          taskTitle: task.title,
          prUrl: pr.html_url,
          prNumber: pr.number,
        },
      },
    });

    const sibling = task.idea.tasks;
    const allCompleted = sibling.every((t) =>
      t.id === task.id ? true : t.status === "COMPLETED"
    );
    if (allCompleted) {
      await tx.idea.update({
        where: { id: task.ideaId },
        data: { status: "COMPLETED" },
      });
    }
  });
}

async function handleClosedUnmerged(
  payload: PullRequestPayload,
  sub: SubmissionWithTask
) {
  const pr = payload.pull_request;
  const task = sub.task;

  if (task.status !== "GREEN") {
    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        prState: pr.state,
        prMerged: false,
        lastSyncedAt: new Date(),
      },
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: sub.id },
      data: {
        prState: pr.state,
        prMerged: false,
        lastSyncedAt: new Date(),
      },
    });

    await tx.task.update({
      where: { id: task.id },
      data: { status: "YELLOW" },
    });

    await tx.statusTransition.create({
      data: {
        taskId: task.id,
        fromStatus: "GREEN",
        toStatus: "YELLOW",
      },
    });

    await tx.activityLog.create({
      data: {
        userId: sub.userId,
        ideaId: task.ideaId,
        action: "PR_CLOSED_UNMERGED",
        details: {
          taskTitle: task.title,
          prUrl: pr.html_url,
          prNumber: pr.number,
        },
      },
    });
  });
}
