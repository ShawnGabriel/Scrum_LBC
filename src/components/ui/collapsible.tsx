"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function Collapsible({
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const toggle = React.useCallback(() => {
    const next = !isOpen;
    setInternalOpen(next);
    onOpenChange?.(next);
  }, [isOpen, onOpenChange]);

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div className={cn(className)}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

const CollapsibleContext = React.createContext<{
  isOpen: boolean;
  toggle: () => void;
}>({
  isOpen: false,
  toggle: () => {},
});

function useCollapsible() {
  return React.useContext(CollapsibleContext);
}

interface CollapsibleTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function CollapsibleTrigger({
  className,
  children,
  ...props
}: CollapsibleTriggerProps) {
  const { toggle } = useCollapsible();
  return (
    <button
      type="button"
      className={cn(className)}
      onClick={toggle}
      {...props}
    >
      {children}
    </button>
  );
}

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function CollapsibleContent({
  className,
  children,
  ...props
}: CollapsibleContentProps) {
  const { isOpen } = useCollapsible();

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
