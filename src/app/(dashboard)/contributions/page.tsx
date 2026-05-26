import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContributionsClient } from "@/components/contributions/ContributionsClient";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function ContributionsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const now = new Date();
  const currentYear = now.getUTCFullYear();

  const parsedYear = params.year ? parseInt(params.year, 10) : NaN;
  const isLastYear = !params.year || params.year === "last";
  const selectedYear =
    !isLastYear && Number.isFinite(parsedYear) ? parsedYear : null;

  // Compute date range
  let rangeStart: Date;
  let rangeEnd: Date;
  if (selectedYear !== null) {
    rangeStart = new Date(Date.UTC(selectedYear, 0, 1));
    rangeEnd = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999));
  } else {
    // Last 12 months ending today
    rangeEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
    );
    rangeStart = new Date(rangeEnd);
    rangeStart.setUTCFullYear(rangeStart.getUTCFullYear() - 1);
    rangeStart.setUTCDate(rangeStart.getUTCDate() + 1);
    rangeStart.setUTCHours(0, 0, 0, 0);
  }

  const [users, submissions] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true, role: true },
    }),
    prisma.submission.findMany({
      where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
      select: {
        userId: true,
        createdAt: true,
        prOwner: true,
        prRepo: true,
        prNumber: true,
        id: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Dedupe: 1 contribution = 1 PR per user. Earliest submission date wins.
  // Submissions without PR identity fall back to their own id (still count as 1).
  const seen = new Map<string, string>(); // dedupe key -> earliest YYYY-MM-DD
  const countsByUser: Record<string, Record<string, number>> = {};
  const totalByUser: Record<string, number> = {};

  for (const sub of submissions) {
    const prKey =
      sub.prOwner && sub.prRepo && sub.prNumber != null
        ? `${sub.prOwner}/${sub.prRepo}#${sub.prNumber}`
        : `sub:${sub.id}`;
    const dedupeKey = `${sub.userId}|${prKey}`;
    if (seen.has(dedupeKey)) continue;

    const dateKey = sub.createdAt.toISOString().slice(0, 10);
    seen.set(dedupeKey, dateKey);

    if (!countsByUser[sub.userId]) countsByUser[sub.userId] = {};
    countsByUser[sub.userId][dateKey] =
      (countsByUser[sub.userId][dateKey] ?? 0) + 1;
    totalByUser[sub.userId] = (totalByUser[sub.userId] ?? 0) + 1;
  }

  // Year tabs: current year and the 3 previous
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const usersWithData = users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    total: totalByUser[u.id] ?? 0,
    counts: countsByUser[u.id] ?? {},
  }));

  return (
    <ContributionsClient
      users={usersWithData}
      rangeStartISO={rangeStart.toISOString()}
      rangeEndISO={rangeEnd.toISOString()}
      selectedYear={selectedYear}
      yearOptions={yearOptions}
    />
  );
}
