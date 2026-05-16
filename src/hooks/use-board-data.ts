import { useQuery } from "@tanstack/react-query";
import type { BoardUser } from "@/types";

async function fetchBoardData(): Promise<BoardUser[]> {
  const res = await fetch("/api/board");
  if (!res.ok) {
    throw new Error("Failed to fetch board data");
  }
  return res.json();
}

export function useBoardData() {
  return useQuery<BoardUser[]>({
    queryKey: ["board"],
    queryFn: fetchBoardData,
    refetchInterval: 15000,
  });
}
