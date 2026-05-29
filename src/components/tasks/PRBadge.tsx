"use client";

import { GitPullRequest, GitMerge, GitPullRequestClosed } from "lucide-react";

interface PRBadgeProps {
  prUrl: string;
  prNumber: number;
  prState: string | null;
  prMerged: boolean;
}

export function PRBadge({ prUrl, prNumber, prState, prMerged }: PRBadgeProps) {
  const merged = prMerged;
  const closedUnmerged = prState === "closed" && !merged;

  const Icon = merged
    ? GitMerge
    : closedUnmerged
      ? GitPullRequestClosed
      : GitPullRequest;

  const label = merged ? "merged" : closedUnmerged ? "closed" : "open";

  const colorClass = merged
    ? "border-primary/40 bg-primary/10 text-primary"
    : closedUnmerged
      ? "border-status-orange/40 bg-status-orange/10 text-status-orange"
      : "border-status-green/40 bg-status-green/10 text-status-green";

  return (
    <a
      href={prUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-opacity hover:opacity-80 ${colorClass}`}
      title={`PR #${prNumber} · ${label}`}
    >
      <Icon className="h-3 w-3" />
      PR #{prNumber}
      <span className="text-[9px] opacity-70">· {label}</span>
    </a>
  );
}
