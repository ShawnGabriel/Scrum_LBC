import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium tracking-normal transition-all duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "text-primary-foreground shadow-[0_4px_14px_-2px_rgba(80,96,181,0.5)] hover:shadow-[0_6px_20px_-2px_rgba(99,115,200,0.65)] hover:brightness-110 focus-visible:ring-primary " +
          "bg-[linear-gradient(135deg,_#5060B5_0%,_#6373C8_100%)] hover:bg-[linear-gradient(135deg,_#8772F3_0%,_#A28FFF_100%)]",
        secondary:
          "bg-surface-hover text-foreground border border-border hover:bg-surface-elevated hover:border-border-strong focus-visible:ring-primary",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface-hover hover:border-border-strong focus-visible:ring-primary",
        ghost:
          "bg-transparent text-foreground hover:bg-surface-hover focus-visible:ring-primary",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110 hover:shadow-[0_4px_14px_-2px_rgba(240,71,71,0.5)] focus-visible:ring-destructive",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4",
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
