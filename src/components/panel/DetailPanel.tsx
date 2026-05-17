"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDetailPanel } from "@/hooks/use-detail-panel";
import { DetailPanelContent } from "./DetailPanelContent";

interface DetailPanelProps {
  currentUserId: string;
  userRole: string;
}

export function DetailPanel({ currentUserId, userRole }: DetailPanelProps) {
  const { taskId, isOpen, close } = useDetailPanel();

  const { data: task, isLoading } = useQuery({
    queryKey: ["task-detail", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/detail`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
    enabled: !!taskId,
  });

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 transition-opacity"
        onClick={close}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-[#E6E9EF] bg-white shadow-xl transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6E9EF] px-5 py-3">
          <h2 className="text-sm font-semibold text-[#323338]">Task Details</h2>
          <button
            onClick={close}
            className="rounded-md p-1 text-[#676879] hover:bg-[#F5F6F8] hover:text-[#323338]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0073EA] border-t-transparent" />
            </div>
          ) : task ? (
            <DetailPanelContent
              task={task}
              currentUserId={currentUserId}
              userRole={userRole}
              onClose={close}
            />
          ) : (
            <div className="flex items-center justify-center py-20 text-sm text-[#676879]">
              Task not found
            </div>
          )}
        </div>
      </div>
    </>
  );
}
