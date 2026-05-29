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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/70 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">{children}</div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-foreground">{userName}</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium text-primary">
          {userRole}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="group h-9 w-9 px-0 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
        </Button>
      </div>
    </header>
  );
}
