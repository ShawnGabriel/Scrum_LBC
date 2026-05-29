"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ContributionGraph } from "./ContributionGraph";

interface UserData {
  id: string;
  name: string;
  username: string;
  role: string;
  total: number;
  counts: Record<string, number>;
}

interface ContributionsClientProps {
  users: UserData[];
  rangeStartISO: string;
  rangeEndISO: string;
  selectedYear: number | null;
  yearOptions: number[];
}

export function ContributionsClient({
  users,
  rangeStartISO,
  rangeEndISO,
  selectedYear,
  yearOptions,
}: ContributionsClientProps) {
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

  const rangeLabel =
    selectedYear !== null ? String(selectedYear) : "the last year";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-label">
          SCRUM · LBC · CONTRIBUTIONS
        </p>
        <h1 className="mt-1 text-lg font-semibold uppercase tracking-wide text-foreground">
          Contributions
        </h1>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          One contribution = one pull request · Showing {rangeLabel}
        </p>
      </div>

      {/* Year selector */}
      <div className="flex flex-wrap items-center gap-2">
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

      {/* Per-user heatmaps */}
      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              No users found
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <Link
                href={`/contributions/${user.id}`}
                className="flex items-center gap-3 border-b border-border bg-surface-elevated px-4 py-3 transition-colors hover:bg-surface-hover"
              >
                <Avatar name={user.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold uppercase tracking-wider text-foreground">
                    {user.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-label">
                    @{user.username} · {user.role}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[18px] font-semibold text-foreground tabular-nums">
                    {user.total}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-label">
                    Pull requests
                  </p>
                </div>
              </Link>

              <div className="overflow-x-auto px-4 py-4">
                <ContributionGraph
                  counts={user.counts}
                  rangeStartISO={rangeStartISO}
                  rangeEndISO={rangeEndISO}
                />
              </div>
            </div>
          ))
        )}
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
