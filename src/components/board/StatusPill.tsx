"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { STATUS_CONFIG, STATUS_ORDER, getStatusLabel, getStatusColor } from "@/lib/status";
import type { TaskStatus } from "@/generated/prisma/client";

interface StatusPillProps {
  taskId: string;
  status: TaskStatus;
  canEdit: boolean;
  userRole?: string;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const ASSOCIATE_STATUSES: TaskStatus[] = ["WHITE", "YELLOW"];
const DROPDOWN_WIDTH = 180;
const ITEM_HEIGHT = 32;
const VIEWPORT_MARGIN = 8;

export function StatusPill({
  taskId,
  status,
  canEdit,
  userRole,
  onStatusChange,
}: StatusPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableStatuses =
    userRole === "CTO" ? STATUS_ORDER : ASSOCIATE_STATUSES;
  const dropdownHeight = availableStatuses.length * ITEM_HEIGHT + 4;

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    function place() {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < dropdownHeight + VIEWPORT_MARGIN && rect.top > spaceBelow;
      const top = openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4;
      const left = Math.min(
        Math.max(VIEWPORT_MARGIN, rect.left),
        window.innerWidth - DROPDOWN_WIDTH - VIEWPORT_MARGIN
      );
      setCoords({ top, left });
    }

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen, dropdownHeight]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
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

      {mounted && isOpen && coords &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[100] overflow-hidden rounded-sm border border-border bg-surface-elevated shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
            style={{
              top: coords.top,
              left: coords.left,
              width: DROPDOWN_WIDTH,
            }}
          >
            {availableStatuses.map((s) => (
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
          </div>,
          document.body
        )}
    </>
  );
}
