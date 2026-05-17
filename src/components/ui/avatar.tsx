import * as React from "react";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-[#5B7CC4]",
  "bg-[#7BB8A8]",
  "bg-[#B89A5C]",
  "bg-[#C46B7C]",
  "bg-[#6BA8C4]",
  "bg-[#9B8FBF]",
  "bg-[#C48F6B]",
  "bg-[#5C9B95]",
  "bg-[#B8829B]",
  "bg-[#5C7DA8]",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

function Avatar({ name, size = "md", className }: AvatarProps) {
  const colorClass = getColorFromName(name);
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-foreground",
        colorClass,
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
}

export { Avatar };
