"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusToggleProps {
  taskId: string;
  onToggle?: () => void;
}

export function StatusToggle({ taskId, onToggle }: StatusToggleProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "YELLOW" }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      onToggle?.();
    } catch (error) {
      console.error("Status toggle failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="mt-1 gap-1.5 text-xs"
    >
      <Play className="h-3 w-3" />
      {loading ? "Starting..." : "Start Working"}
    </Button>
  );
}
