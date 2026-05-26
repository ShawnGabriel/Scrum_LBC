import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import { PRBadge } from "@/components/tasks/PRBadge";
import { ContributionsUserClient } from "@/components/contributions/ContributionsUserClient";
import { formatRelativeTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ year?: string }>;
}

export default async function UserContributionsPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId } = await params;
  const sp = await searchParams;

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const parsedYear = sp.year ? parseInt(sp.year, 10) : NaN;
  const isLastYear = !sp.year || sp.year === "last";
  const selectedYear = !isLastYear && Number.isFinite(parsedYear) ? parsedYear : null;

  let rangeStart: Date;
  let rangeEnd: Date;
  if (selectedYear !== null) {
    rangeStart = new Date(Date.UTC(selectedYear, 0, 1));
    rangeEnd = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999));
  } else {
    rangeEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
    );
    rangeStart = new Date(rangeEnd);
    rangeStart.setUTCFullYear(rangeStart.getUTCFullYear() - 1);
    rangeStart.setUTCDate(rangeStart.getUTCDate() + 1);
    rangeStart.setUTCHours(0, 0, 0, 0);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, role: true },
  });
  if (!user) notFound();

  const submissions = await prisma.submission.findMany({
    where: { userId, createdAt: { gte: rangeStart, lte: rangeEnd } },
    select: {
      id: true,
      createdAt: true,
      prOwner: true,
      prRepo: true,
      prNumber: true,
      prUrl: true,
      prTitle: true,
      prState: true,
      prMerged: true,
      task: { select: { id: true, title: true, idea: { select: { title: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Dedupe to one row per PR, keeping the earliest occurrence.
  const seen = new Map<string, (typeof submissions)[number]>();
  const counts: Record<string, number> = {};
  for (const sub of submissions) {
    const prKey =
      sub.prOwner && sub.prRepo && sub.prNumber != null
        ? `${sub.prOwner}/${sub.prRepo}#${sub.prNumber}`
        : `sub:${sub.id}`;
    if (!seen.has(prKey)) {
      seen.set(prKey, sub);
      const dateKey = sub.createdAt.toISOString().slice(0, 10);
      counts[dateKey] = (counts[dateKey] ?? 0) + 1;
    }
  }
  const deduped = Array.from(seen.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const total = deduped.length;
  const recent = deduped.slice(0, 25);

  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  const rangeLabel = selectedYear !== null ? String(selectedYear) : "the last year";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/contributions"
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          All contributions
        </Link>
      </div>

      {/* Header card */}
      <div className="overflow-hidden rounded-sm border border-border bg-surface">
        <div className="flex items-center gap-4 px-5 py-4">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-label">
              SCRUM · LBC · CONTRIBUTIONS
            </p>
            <h1 className="mt-0.5 text-lg font-semibold text-foreground">{user.name}</h1>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              @{user.username} · {user.role}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-semibold text-foreground tabular-nums leading-none">
              {total}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-label">
              PRs in {rangeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Year selector + heatmap */}
      <ContributionsUserClient
        userId={user.id}
        counts={counts}
        rangeStartISO={rangeStart.toISOString()}
        rangeEndISO={rangeEnd.toISOString()}
        selectedYear={selectedYear}
        yearOptions={yearOptions}
      />

      {/* Recent PRs */}
      <div className="overflow-hidden rounded-sm border border-border bg-surface">
        <div className="border-b border-border bg-surface-elevated px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-label">
            Recent pull requests
          </p>
        </div>
        {recent.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              No pull requests in {rangeLabel}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {sub.prUrl && sub.prNumber != null && (
                      <PRBadge
                        prUrl={sub.prUrl}
                        prNumber={sub.prNumber}
                        prState={sub.prState}
                        prMerged={sub.prMerged}
                      />
                    )}
                    <span className="truncate text-[12px] text-foreground">
                      {sub.prTitle ?? sub.task.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-label">
                    {sub.task.idea.title} · {sub.task.title}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {formatRelativeTime(new Date(sub.createdAt))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
