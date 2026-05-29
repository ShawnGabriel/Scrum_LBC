interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-lg bg-border">
        <div
          className="h-full bg-status-green transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {completed}/{total}
      </span>
    </div>
  );
}
