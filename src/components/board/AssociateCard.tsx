"use client";

import type { Task, Submission, StatusTransition, TaskStatus } from "@/generated/prisma/client";
import type { BoardUser } from "@/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { TaskPill } from "./TaskPill";
import { User as UserIcon } from "lucide-react";

interface AssociateCardProps {
  user: BoardUser;
  currentUserId: string;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onSubmit?: (taskId: string) => void;
}

export function AssociateCard({
  user,
  currentUserId,
  onStatusChange,
  onSubmit,
}: AssociateCardProps) {
  const isOwner = user.id === currentUserId;
  const assignedIdea = user.assignedIdeas[0] ?? null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-4 w-4" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{user.name}</h3>
            {isOwner && (
              <span className="text-xs text-primary0 font-medium">You</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {assignedIdea ? (
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {assignedIdea.title}
            </h4>
            <div className="flex flex-col gap-2">
              {assignedIdea.tasks.map((task) => (
                <TaskPill
                  key={task.id}
                  task={
                    task as Task & {
                      submissions: Submission[];
                      revisionTasks: Task[];
                      statusTransitions: StatusTransition[];
                    }
                  }
                  isOwner={isOwner}
                  onStatusChange={onStatusChange}
                  onSubmit={onSubmit}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-label italic">No idea assigned</p>
        )}
      </CardContent>
    </Card>
  );
}
