import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-surface-elevated/70 px-3.5 py-2 text-sm text-foreground placeholder:text-label transition-all duration-150 ease-out hover:border-border-strong focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-[0_0_0_4px_rgba(99,115,200,0.15)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
