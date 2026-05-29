"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userName: string;
  userRole: string;
  children?: React.ReactNode;
}

export function Header({ userName, userRole, children }: HeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-surface/95 backdrop-blur-sm px-5 supports-[backdrop-filter]:bg-surface/80">
      <div className="flex items-center gap-4">{children}</div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-[11px] font-medium uppercase tracking-wider text-foreground">
            {userName}
          </p>
        </div>
        <span className="inline-flex items-center rounded-sm border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
          {userRole}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="group h-8 px-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
        </Button>
      </div>
    </header>
  );
}
