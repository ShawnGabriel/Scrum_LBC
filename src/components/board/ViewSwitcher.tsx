"use client";

import { LayoutGrid, Kanban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/hooks/use-view-preference";

interface ViewSwitcherProps {
  view: ViewType;
  onChange: (view: ViewType) => void;
}

export function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center rounded-md border border-[#E6E9EF] bg-white">
      <button
        onClick={() => onChange("table")}
        className={cn(
          "flex items-center gap-1.5 rounded-l-md px-3 py-1.5 text-xs font-medium transition-colors",
          view === "table"
            ? "bg-[#0073EA] text-white"
            : "text-[#676879] hover:bg-[#F5F6F8]"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Table
      </button>
      <button
        onClick={() => onChange("kanban")}
        className={cn(
          "flex items-center gap-1.5 rounded-r-md px-3 py-1.5 text-xs font-medium transition-colors",
          view === "kanban"
            ? "bg-[#0073EA] text-white"
            : "text-[#676879] hover:bg-[#F5F6F8]"
        )}
      >
        <Kanban className="h-3.5 w-3.5" />
        Kanban
      </button>
    </div>
  );
}
