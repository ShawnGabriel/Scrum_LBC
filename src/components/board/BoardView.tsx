"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { BoardUser } from "@/types";
import type { TaskStatus } from "@/generated/prisma/client";
import { EmployeeCard } from "./EmployeeCard";

interface BoardViewProps {
  users: BoardUser[];
  currentUserId: string;
}

export function BoardView({ users, currentUserId }: BoardViewProps) {
  const router = useRouter();

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to update task status:", error);
      }
    },
    [router]
  );

  const handleSubmit = useCallback(
    (taskId: string) => {
      // This would typically open the SubmitWorkDialog
      // For now, it triggers a refresh after submission
      router.refresh();
    },
    [router]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <EmployeeCard
          key={user.id}
          user={user}
          currentUserId={currentUserId}
          onStatusChange={handleStatusChange}
          onSubmit={handleSubmit}
        />
      ))}
    </div>
  );
}
