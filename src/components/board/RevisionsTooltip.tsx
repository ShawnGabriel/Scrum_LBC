"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { Task } from "@/generated/prisma/client";
import { getStatusColor, getStatusLabel } from "@/lib/status";

interface RevisionsTooltipProps {
  revisionTasks: Task[];
}

const TOOLTIP_WIDTH = 320;
const VIEWPORT_MARGIN = 8;

export function RevisionsTooltip({ revisionTasks }: RevisionsTooltipProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function place() {
      const node = triggerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const left = Math.min(
        Math.max(VIEWPORT_MARGIN, rect.left),
        window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN
      );
      setCoords({ top: rect.bottom + 6, left });
    }

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  const count = revisionTasks.length;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="shrink-0 cursor-default rounded-lg border border-status-orange/30 bg-status-orange/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-status-orange transition-colors hover:bg-status-orange/20"
      >
        {count} revision{count > 1 ? "s" : ""}
      </span>

      {mounted && coords &&
        createPortal(
          <div
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            className={`fixed z-[100] overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-[0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-150 ease-out ${
              open
                ? "opacity-100 translate-y-0"
                : "pointer-events-none opacity-0 -translate-y-1"
            }`}
            style={{
              top: coords.top,
              left: coords.left,
              width: TOOLTIP_WIDTH,
            }}
          >
            <div className="border-b border-border bg-surface px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-status-orange">
                {count} Revision{count > 1 ? "s" : ""} Requested
              </p>
            </div>
            <ul className="max-h-[280px] divide-y divide-border overflow-y-auto">
              {revisionTasks.map((rt) => (
                <li key={rt.id} className="flex flex-col gap-1 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium leading-tight text-foreground">
                      {rt.title}
                    </p>
                    <span
                      className="shrink-0 rounded-lg px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: getStatusColor(rt.status),
                        color: "#050B1A",
                      }}
                    >
                      {getStatusLabel(rt.status)}
                    </span>
                  </div>
                  {rt.revisionNote && (
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {rt.revisionNote}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
