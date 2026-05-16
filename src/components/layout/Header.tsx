"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  userName: string;
  userRole: string;
}

export function Header({ title, userName, userRole }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={userName} size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-gray-500 hover:text-gray-700"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
