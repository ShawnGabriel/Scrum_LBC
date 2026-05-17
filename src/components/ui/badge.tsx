import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0073EA]/10 text-[#0073EA]",
        white:
          "border-transparent bg-[#C4C4C4] text-white",
        yellow:
          "border-transparent bg-[#FDAB3D] text-white",
        green:
          "border-transparent bg-[#00C875] text-white",
        orange:
          "border-transparent bg-[#E2445C] text-white",
        completed:
          "border-transparent bg-[#00C875] text-white",
        outline:
          "border-[#E6E9EF] bg-transparent text-[#676879]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
