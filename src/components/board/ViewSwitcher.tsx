"use client";

import { LayoutGrid, Kanban, CalendarRange, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/hooks/use-view-preference";

interface ViewSwitcherProps {
  view: ViewType;
  onChange: (view: ViewType) => void;
}

const TABS: { value: ViewType; label: string; Icon: typeof LayoutGrid }[] = [
  { value: "table", label: "Table", Icon: LayoutGrid },
  { value: "kanban", label: "Kanban", Icon: Kanban },
  { value: "roadmap", label: "Roadmap", Icon: CalendarRange },
  { value: "people", label: "People", Icon: Users },
];

export function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  return (
    <div className="-mx-5 -mt-5 border-b border-border bg-surface">
      <div className="flex items-stretch px-5">
        {TABS.map(({ value, label, Icon }, idx) => {
          const active = view === value;
          return (
            <button
              key={value}
              onClick={() => onChange(value)}
              className={cn(
                "relative flex items-center gap-2 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                idx > 0 && "border-l border-border",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-px h-[2px] transition-colors",
                  active ? "bg-primary" : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
