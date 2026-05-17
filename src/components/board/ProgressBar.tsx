interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E6E9EF]">
        <div
          className="h-full rounded-full bg-[#00C875] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-[#676879]">
        {completed}/{total}
      </span>
    </div>
  );
}
