import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

function taskStatusVariant(status: string) {
  switch (status) {
    case "WHITE":
      return "white" as const;
    case "YELLOW":
      return "yellow" as const;
    case "GREEN":
      return "green" as const;
    case "ORANGE":
      return "orange" as const;
    case "COMPLETED":
      return "completed" as const;
    default:
      return "default" as const;
  }
}

export default async function StandupPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      assignedIdeas: {
        include: {
          tasks: {
            include: {
              statusTransitions: {
                where: { changedAt: { gte: yesterday } },
                orderBy: { changedAt: "desc" },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Daily Standup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Activity since {yesterday.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </p>
      </div>

      <div className="space-y-4">
        {employees.map((employee) => {
          const allTasks = employee.assignedIdeas.flatMap((idea) => idea.tasks);
          const changedTasks = allTasks.filter(
            (task) => task.statusTransitions.length > 0
          );
          const yellowTasks = allTasks.filter((task) => task.status === "YELLOW");
          const orangeTasks = allTasks.filter((task) => task.status === "ORANGE");

          const hasActivity =
            changedTasks.length > 0 || yellowTasks.length > 0 || orangeTasks.length > 0;

          return (
            <div
              key={employee.id}
              className="rounded-lg border border-border bg-surface p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                {employee.avatarUrl ? (
                  <img
                    src={employee.avatarUrl}
                    alt={employee.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-foreground">{employee.name}</span>
              </div>

              {!hasActivity ? (
                <p className="text-sm text-label italic">No changes</p>
              ) : (
                <div className="space-y-3">
                  {/* Status changes since yesterday */}
                  {changedTasks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                        Recent Changes
                      </p>
                      <div className="space-y-1.5">
                        {changedTasks.map((task) =>
                          task.statusTransitions.map((transition) => (
                            <div
                              key={transition.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="text-foreground truncate">
                                {task.title}
                              </span>
                              <Badge variant={taskStatusVariant(transition.fromStatus)} className="text-[10px] px-1.5 py-0">
                                {transition.fromStatus}
                              </Badge>
                              <span className="text-label text-xs">-&gt;</span>
                              <Badge variant={taskStatusVariant(transition.toStatus)} className="text-[10px] px-1.5 py-0">
                                {transition.toStatus}
                              </Badge>
                              <span className="ml-auto text-xs text-label shrink-0">
                                {formatRelativeTime(new Date(transition.changedAt))}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Currently in progress */}
                  {yellowTasks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                        In Progress
                      </p>
                      <div className="space-y-1">
                        {yellowTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                            <Badge variant="yellow" className="text-[10px] px-1.5 py-0">
                              YELLOW
                            </Badge>
                            <span className="text-foreground truncate">{task.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blocked on revisions */}
                  {orangeTasks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                        Needs Revisions
                      </p>
                      <div className="space-y-1">
                        {orangeTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                            <Badge variant="orange" className="text-[10px] px-1.5 py-0">
                              ORANGE
                            </Badge>
                            <span className="text-foreground truncate">{task.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
