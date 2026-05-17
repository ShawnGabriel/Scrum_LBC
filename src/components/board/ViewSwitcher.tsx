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
    <div className="flex items-center rounded-sm border border-border bg-surface">
      <button
        onClick={() => onChange("table")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
          view === "table"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Table
      </button>
      <button
        onClick={() => onChange("kanban")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
          view === "kanban"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        )}
      >
        <Kanban className="h-3.5 w-3.5" />
        Kanban
      </button>
    </div>
  );
}
