import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-100 text-indigo-800",
        white:
          "bg-[#F8F9FA] text-[#64748B] border-[#E2E8F0]",
        yellow:
          "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]",
        green:
          "bg-[#D1FAE5] text-[#065F46] border-[#10B981]",
        orange:
          "bg-[#FFEDD5] text-[#9A3412] border-[#F97316]",
        completed:
          "bg-[#CCFBF1] text-[#134E4A] border-[#14B8A6]",
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
