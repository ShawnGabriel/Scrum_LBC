"use client";

import { useMemo } from "react";

interface ContributionGraphProps {
  counts: Record<string, number>;
  rangeStartISO: string;
  rangeEndISO: string;
}

// 5 levels: 0, 1, 2-3, 4-6, 7+
const LEVEL_COLORS = [
  "#1a2236", // 0 — empty (matches our dark surface, a touch lighter than border)
  "#0e4429", // 1
  "#006d32", // 2
  "#26a641", // 3
  "#39d353", // 4
];

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function intensityLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDaysUTC(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function ContributionGraph({
  counts,
  rangeStartISO,
  rangeEndISO,
}: ContributionGraphProps) {
  const weeks = useMemo(() => {
    const rangeStart = new Date(rangeStartISO);
    const rangeEnd = new Date(rangeEndISO);

    // Snap start back to the most recent Sunday (UTC day 0)
    const gridStart = new Date(rangeStart);
    const startDay = gridStart.getUTCDay();
    gridStart.setUTCDate(gridStart.getUTCDate() - startDay);
    gridStart.setUTCHours(0, 0, 0, 0);

    // Snap end forward to the next Saturday so the last column is complete
    const gridEnd = new Date(rangeEnd);
    const endDay = gridEnd.getUTCDay();
    gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - endDay));
    gridEnd.setUTCHours(0, 0, 0, 0);

    const result: Array<
      Array<{ date: Date; key: string; inRange: boolean; count: number }>
    > = [];
    let cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const week: Array<{
        date: Date;
        key: string;
        inRange: boolean;
        count: number;
      }> = [];
      for (let i = 0; i < 7; i++) {
        const key = toDateKey(cursor);
        const inRange = cursor >= rangeStart && cursor <= rangeEnd;
        week.push({
          date: new Date(cursor),
          key,
          inRange,
          count: inRange ? counts[key] ?? 0 : 0,
        });
        cursor = addDaysUTC(cursor, 1);
      }
      result.push(week);
    }
    return result;
  }, [counts, rangeStartISO, rangeEndISO]);

  // Compute month label positions: the first week whose first in-range day starts a new month
  const monthLabels = useMemo(() => {
    const labels: Array<{ weekIndex: number; monthIndex: number }> = [];
    let lastMonth = -1;
    weeks.forEach((week, idx) => {
      const firstInRange = week.find((c) => c.inRange);
      if (!firstInRange) return;
      const m = firstInRange.date.getUTCMonth();
      if (m !== lastMonth) {
        labels.push({ weekIndex: idx, monthIndex: m });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  const CELL = 11; // px
  const GAP = 3; // px
  const STRIDE = CELL + GAP;
  const LEFT_LABEL_WIDTH = 28; // px
  const TOP_LABEL_HEIGHT = 16; // px
  const gridWidth = weeks.length * STRIDE;
  const gridHeight = 7 * STRIDE;

  return (
    <div className="inline-block">
      <div
        className="relative"
        style={{
          width: LEFT_LABEL_WIDTH + gridWidth,
          height: TOP_LABEL_HEIGHT + gridHeight,
        }}
      >
        {/* Month labels */}
        {monthLabels.map(({ weekIndex, monthIndex }) => (
          <span
            key={`${weekIndex}-${monthIndex}`}
            className="absolute text-[10px] text-muted-foreground"
            style={{
              left: LEFT_LABEL_WIDTH + weekIndex * STRIDE,
              top: 0,
              lineHeight: `${TOP_LABEL_HEIGHT}px`,
            }}
          >
            {MONTH_LABELS[monthIndex]}
          </span>
        ))}

        {/* Day-of-week labels */}
        {DAY_LABELS.map((label, i) =>
          label ? (
            <span
              key={label}
              className="absolute text-[10px] text-muted-foreground"
              style={{
                left: 0,
                top: TOP_LABEL_HEIGHT + i * STRIDE,
                lineHeight: `${CELL}px`,
                width: LEFT_LABEL_WIDTH - 4,
              }}
            >
              {label}
            </span>
          ) : null
        )}

        {/* Cells */}
        {weeks.map((week, wIdx) =>
          week.map((cell, dIdx) => {
            if (!cell.inRange) return null;
            const level = intensityLevel(cell.count);
            const dateStr = cell.date.toUTCString().slice(0, 16);
            const tooltip =
              cell.count === 0
                ? `No contributions on ${dateStr}`
                : `${cell.count} ${cell.count === 1 ? "contribution" : "contributions"} on ${dateStr}`;
            return (
              <div
                key={`${wIdx}-${dIdx}`}
                title={tooltip}
                className="absolute rounded-[2px]"
                style={{
                  left: LEFT_LABEL_WIDTH + wIdx * STRIDE,
                  top: TOP_LABEL_HEIGHT + dIdx * STRIDE,
                  width: CELL,
                  height: CELL,
                  backgroundColor: LEVEL_COLORS[level],
                }}
              />
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1.5 pr-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <span
            key={i}
            className="rounded-[2px]"
            style={{ width: 11, height: 11, backgroundColor: c, display: "inline-block" }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
