import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/10 text-primary",
        white:
          "border-status-white/30 bg-status-white/10 text-status-white",
        yellow:
          "border-status-yellow/30 bg-status-yellow/10 text-status-yellow",
        green:
          "border-status-green/30 bg-status-green/10 text-status-green",
        orange:
          "border-status-orange/30 bg-status-orange/10 text-status-orange",
        completed:
          "border-status-completed/30 bg-status-completed/10 text-status-completed",
        outline:
          "border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const dotVariants: Record<string, string> = {
  default: "bg-primary",
  white: "bg-status-white",
  yellow: "bg-status-yellow",
  green: "bg-status-green",
  orange: "bg-status-orange",
  completed: "bg-status-completed",
  outline: "bg-muted-foreground",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

function Badge({ className, variant, showDot, children, ...props }: BadgeProps) {
  const variantKey = (variant ?? "default") as string;
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotVariants[variantKey])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
