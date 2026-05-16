"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Task } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";

function statusVariant(status: string) {
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

interface OrangeExpandableProps {
  revisionTasks: Task[];
}

export function OrangeExpandable({ revisionTasks }: OrangeExpandableProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-900 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        {revisionTasks.length} revision{revisionTasks.length !== 1 ? "s" : ""} requested
      </button>

      {expanded && (
        <div className="mt-1.5 flex flex-col gap-1 pl-4 border-l-2 border-orange-200">
          {revisionTasks.map((rt) => (
            <div
              key={rt.id}
              className="flex flex-col gap-0.5 rounded bg-orange-50 px-2 py-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-700 truncate">
                  {rt.title}
                </span>
                <Badge variant={statusVariant(rt.status)} className="text-[10px] px-1.5 py-0">
                  {rt.status}
                </Badge>
              </div>
              {rt.revisionNote && (
                <p className="text-[11px] text-orange-600 italic">
                  {rt.revisionNote}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
