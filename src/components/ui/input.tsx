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
          "flex h-9 w-full rounded-sm border border-border bg-surface-elevated px-3 py-2 text-[12px] text-foreground placeholder:text-label transition-all duration-150 ease-out hover:border-border-strong focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:shadow-[0_0_0_3px_rgba(123,184,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50",
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
