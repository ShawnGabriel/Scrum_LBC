import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, ArrowLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "@/lib/utils";

export default async function IdeasArchivePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch all completed ideas plus, for each, the latest task statusTransition
  // into COMPLETED — that timestamp doubles as "when this idea was archived."
  const ideas = await prisma.idea.findMany({
    where: { status: "COMPLETED" },
    include: {
      _count: { select: { tasks: true } },
      creator: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      tasks: {
        select: {
          assignee: { select: { id: true, name: true } },
          statusTransitions: {
            where: { toStatus: "COMPLETED" },
            orderBy: { changedAt: "desc" },
            take: 1,
            select: { changedAt: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  function archivedAt(idea: (typeof ideas)[number]): Date | null {
    const latest = idea.tasks
      .flatMap((t) => t.statusTransitions)
      .map((s) => new Date(s.changedAt).getTime())
      .sort((a, b) => b - a)[0];
    return latest ? new Date(latest) : null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/ideas"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-all duration-150 hover:text-primary hover:gap-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to active ideas
        </Link>
        <div className="flex items-center gap-2.5">
          <Archive className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Idea Archive</h1>
          <span className="text-sm text-muted-foreground tabular-nums">
            · {ideas.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Ideas land here automatically once every task is approved.
        </p>
      </div>

      {ideas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur-sm p-12 text-center animate-in fade-in scale-in duration-500">
          <Archive className="mx-auto h-8 w-8 text-muted-foreground/70" />
          <p className="mt-4 text-base text-foreground">Nothing in the archive yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ship an idea end-to-end and it'll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea, i) => {
            const completed = archivedAt(idea);
            const teamNames = Array.from(
              new Set(
                idea.tasks
                  .map((t) => t.assignee?.name)
                  .filter((n): n is string => Boolean(n))
              )
            );
            return (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-surface/80 backdrop-blur-sm px-4 py-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface-hover hover:shadow-[0_8px_24px_-8px_rgba(99,115,200,0.35)] animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                style={{
                  animationDelay: `${80 + i * 40}ms`,
                  animationDuration: "440ms",
                }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-status-completed/15 text-status-completed">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {idea.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {idea._count.tasks} task{idea._count.tasks === 1 ? "" : "s"}
                    {teamNames.length > 0 && ` · ${teamNames.slice(0, 3).join(", ")}`}
                    {teamNames.length > 3 && ` +${teamNames.length - 3}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-label">
                    Archived
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {completed ? formatRelativeTime(completed) : "—"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
