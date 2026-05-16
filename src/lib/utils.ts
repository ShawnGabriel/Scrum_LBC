import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
}

export function getStatusColor(status: string): {
  bg: string;
  border: string;
  text: string;
} {
  switch (status) {
    case "WHITE":
      return { bg: "#F8F9FA", border: "#E2E8F0", text: "#64748B" };
    case "YELLOW":
      return { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" };
    case "GREEN":
      return { bg: "#D1FAE5", border: "#10B981", text: "#065F46" };
    case "ORANGE":
      return { bg: "#FFEDD5", border: "#F97316", text: "#9A3412" };
    case "COMPLETED":
      return { bg: "#CCFBF1", border: "#14B8A6", text: "#134E4A" };
    default:
      return { bg: "#F8F9FA", border: "#E2E8F0", text: "#64748B" };
  }
}
