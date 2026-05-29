"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ContributionGraph } from "./ContributionGraph";

interface ContributionsUserClientProps {
  userId: string;
  counts: Record<string, number>;
  rangeStartISO: string;
  rangeEndISO: string;
  selectedYear: number | null;
  yearOptions: number[];
}

export function ContributionsUserClient({
  counts,
  rangeStartISO,
  rangeEndISO,
  selectedYear,
  yearOptions,
}: ContributionsUserClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectYear(year: number | null) {
    const sp = new URLSearchParams(searchParams.toString());
    if (year === null) {
      sp.delete("year");
    } else {
      sp.set("year", String(year));
    }
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-elevated px-4 py-2.5">
        <YearButton
          label="Last year"
          active={selectedYear === null}
          onClick={() => selectYear(null)}
        />
        {yearOptions.map((y) => (
          <YearButton
            key={y}
            label={String(y)}
            active={selectedYear === y}
            onClick={() => selectYear(y)}
          />
        ))}
      </div>
      <div className="overflow-x-auto px-4 py-5">
        <ContributionGraph
          counts={counts}
          rangeStartISO={rangeStartISO}
          rangeEndISO={rangeEndISO}
        />
      </div>
    </div>
  );
}

function YearButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors " +
        (active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}
