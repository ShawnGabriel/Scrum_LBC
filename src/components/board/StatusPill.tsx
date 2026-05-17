"use client";

import { useState, useRef, useEffect } from "react";
import { STATUS_CONFIG, STATUS_ORDER, getStatusLabel, getStatusColor } from "@/lib/status";
import type { TaskStatus } from "@/generated/prisma/client";

interface StatusPillProps {
  taskId: string;
  status: TaskStatus;
  canEdit: boolean;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export function StatusPill({ taskId, status, canEdit, onStatusChange }: StatusPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (canEdit) setIsOpen(!isOpen);
        }}
        className="inline-flex min-w-[120px] items-center justify-center rounded-sm px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition-opacity hover:opacity-90"
        style={{
          backgroundColor: getStatusColor(status),
          color: "#050B1A",
        }}
      >
        {getStatusLabel(status)}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[180px] overflow-hidden rounded-sm border border-border bg-surface-elevated shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                if (s !== status) {
                  onStatusChange?.(taskId, s);
                }
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-wider text-foreground hover:bg-surface-hover"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_CONFIG[s].color }}
              />
              <span className={s === status ? "font-semibold" : ""}>
                {STATUS_CONFIG[s].label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
