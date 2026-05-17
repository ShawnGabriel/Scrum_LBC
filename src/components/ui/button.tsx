import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#0073EA] text-white hover:bg-[#0060B9] focus-visible:ring-[#0073EA]",
        secondary:
          "bg-[#F5F6F8] text-[#323338] hover:bg-[#E6E9EF] focus-visible:ring-[#0073EA]",
        outline:
          "border border-[#E6E9EF] bg-transparent text-[#323338] hover:bg-[#F5F6F8] focus-visible:ring-[#0073EA]",
        ghost:
          "bg-transparent text-[#323338] hover:bg-[#F5F6F8] focus-visible:ring-[#0073EA]",
        destructive:
          "bg-[#E2445C] text-white hover:bg-[#CE3048] focus-visible:ring-[#E2445C]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
