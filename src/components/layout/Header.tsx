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
    <header className="flex h-12 items-center justify-between border-b border-[#E6E9EF] bg-white px-5">
      <div className="flex items-center gap-4">
        {children}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-[#323338]">{userName}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#F5F6F8] px-2.5 py-0.5 text-[11px] font-medium text-[#676879]">
          {userRole}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="h-8 px-2 text-[#676879] hover:text-[#323338]"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
