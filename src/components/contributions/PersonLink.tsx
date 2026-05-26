"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PersonLinkProps {
  userId: string | null | undefined;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function PersonLink({ userId, children, className, title }: PersonLinkProps) {
  if (!userId) return <>{children}</>;
  return (
    <Link
      href={`/contributions/${userId}`}
      onClick={(e) => e.stopPropagation()}
      title={title ?? "View PR contributions"}
      className={cn("inline-flex items-center hover:opacity-80 transition-opacity", className)}
    >
      {children}
    </Link>
  );
}
