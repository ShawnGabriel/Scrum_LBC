"use client";

import { useState, useCallback, useEffect } from "react";

export type ViewType = "table" | "kanban";

const STORAGE_KEY = "scrum-lbc-view";

export function useViewPreference(): [ViewType, (v: ViewType) => void] {
  const [view, setViewState] = useState<ViewType>("table");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "kanban" || stored === "table") {
      setViewState(stored);
    }
  }, []);

  const setView = useCallback((v: ViewType) => {
    setViewState(v);
    localStorage.setItem(STORAGE_KEY, v);
  }, []);

  return [view, setView];
}
