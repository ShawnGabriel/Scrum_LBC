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
        className="inline-flex min-w-[120px] items-center justify-center rounded-sm px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: getStatusColor(status) }}
      >
        {getStatusLabel(status)}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-[160px] overflow-hidden rounded-md border border-[#E6E9EF] bg-white shadow-lg">
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
              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-[#F5F6F8]"
            >
              <span
                className="h-3 w-3 rounded-full"
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
