import type { TaskStatus } from "@/generated/prisma/client";

export interface StatusConfig {
  label: string;
  color: string;
  textColor: string;
}

export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  WHITE:     { label: "Not Started",     color: "#C4C4C4", textColor: "#FFFFFF" },
  YELLOW:    { label: "Working on it",   color: "#FDAB3D", textColor: "#FFFFFF" },
  GREEN:     { label: "Pending Review",  color: "#00C875", textColor: "#FFFFFF" },
  ORANGE:    { label: "Stuck",           color: "#E2445C", textColor: "#FFFFFF" },
  COMPLETED: { label: "Done",            color: "#00C875", textColor: "#FFFFFF" },
};

export const STATUS_ORDER: TaskStatus[] = ["WHITE", "YELLOW", "GREEN", "ORANGE", "COMPLETED"];

export function getStatusLabel(status: TaskStatus): string {
  return STATUS_CONFIG[status].label;
}

export function getStatusColor(status: TaskStatus): string {
  return STATUS_CONFIG[status].color;
}

export function getStatusTextColor(status: TaskStatus): string {
  return STATUS_CONFIG[status].textColor;
}
